import mongoose from "mongoose";
import Rate from "../../models/rate.model.js";
import Novel from "../../models/novel.model.js";
// import User from "../../models/user.model.js";
import Notification from "../../models/notification.model.js";
import { sendErrorResponse } from "../../utils/sendErrorResponse.js";
import { validateInputWithSchema, mongooseSchemaToValidatorRules } from "../../utils/validator/inputValidator.js";
import { parsePagination, parseSort } from "../../utils/moderation/helper/pagination.js";
// Validation rules for Rate
const rateSchemaRules = mongooseSchemaToValidatorRules(Rate.schema);

/**
 * Updates novel rates based on rating action
 * @async
 * @param {string} novelId - Novel ID
 * @param {number} rateDifference - Difference in rating value
 * @param {boolean} isUpdate - Whether it's an update or new rating
 * @param {Object} novel - Novel document
 * @param {Object} session - MongoDB transaction session
 * @returns {Promise<void>}
 */
async function updateNovelRates(novelId, rateDifference, isUpdate, novel, session) {
  const count = isUpdate ? novel.rates.count : novel.rates.count + 1;
  const total = isUpdate ? novel.rates.total + rateDifference : novel.rates.total + rateDifference;
  const averageRating = count > 0 ? parseFloat((total / count).toFixed(1)) : 0;

  const updateData = {
    $inc: { "rates.total": rateDifference, "rates.count": isUpdate ? 0 : 1 },
    $set: { "rates.averageRating": averageRating },
  };

  await Novel.findByIdAndUpdate(novelId, updateData, { session });
}

/**
 * Creates or updates a rating for a novel
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.novelId - Novel ID
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response
 */
export const createOrUpdateRate = async (req, res) => {
  let session;
  try {
    const novelId = req.params.novelId;
    if (!mongoose.Types.ObjectId.isValid(novelId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }
    const { rate, text } = req.body;
    const userId = req.user._id;
    // Validate input
    const validationResult = validateInputWithSchema(
      { rate, text },
      {},
      { rate: rateSchemaRules.rate, text: rateSchemaRules.text }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const novel = await Novel.findById(novelId).session(session).lean();
    if (!novel) {
      await session.abortTransaction();
      return sendErrorResponse(null, "Truyện không tồn tại", res, 404);
    }
    // Check if novel is approved and not hidden
    if (novel.statusPublish !== "approved" || novel.isHidden) {
      await session.abortTransaction();
      return sendErrorResponse(null, "Truyện không được phép đánh giá", res, 403);
    }
    const existingRate = await Rate.findOne({ novel: novelId, user: userId }).session(session);

    let rateDifference = rate;
    if (existingRate) {
      // Giới hạn chỉnh sửa: không cho sửa trong vòng 1 giờ
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (new Date(existingRate.updatedAt) > oneHourAgo) {
        await session.abortTransaction();
        return sendErrorResponse(null, "Chỉ có thể cập nhật đánh giá sau 1 giờ", res, 429);
      }
      // Calculate difference for updating total
      rateDifference = rate - existingRate.rate;
      // Cập nhật đánh giá
      // Update rating
      await Rate.findByIdAndUpdate(
        existingRate._id,
        { rate, text, updatedAt: new Date() },
        { session }
      );

    } else {
      // Thêm đánh giá mới
      await Rate.create([{ novel: novelId, user: userId, rate, text }], { session });
    }

    // Update novel.rates
    await updateNovelRates(novelId, rateDifference, existingRate !== null, novel, session);

    // Thông báo cho người đăng truyện (nếu không phải tự đánh giá truyện mình)
    if (novel.createdBy.toString() !== userId.toString()) {
      await Notification.create(
        [{
          from: userId,
          to: novel.createdBy,
          type: "rate",
          message: `${req.user.username} đã đánh giá ${rate} điểm truyện "${novel.title}" của bạn.`,
          read: false
        }],
        { session }
      );
    }
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: existingRate ? "Đánh giá đã được cập nhật" : "Đánh giá thành công"
    });

  } catch (error) {
    console.error(`Rate error for novel ${req.params.novelId}:`, error.stack);
    if (session) await session.abortTransaction();
    return sendErrorResponse(error, "Lỗi khi đánh giá truyện", res, 500);
  } finally {
    if (session) session.endSession();
  }
};

/**
 * Retrieves ratings for a novel
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.novelId - Novel ID
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with ratings
 */
export const getRatesByNovel = async (req, res) => {
  try {
    const novelId = req.params.novelId;
    if (!mongoose.Types.ObjectId.isValid(novelId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }
    const novel = await Novel.findById(novelId).select("statusPublish isHidden").lean();
    if (!novel || novel.statusPublish !== "approved" || novel.isHidden) {
      return sendErrorResponse(null, "Truyện không tồn tại hoặc không được phép xem", res, 404);
    }
// Parse pagination
    const pagination = parsePagination(req.query);
    if (!pagination.valid) {
      return sendErrorResponse(null, pagination.message, res, 400);
    }
    const { page, limit, skip } = pagination;

    // Parse sort
    const allowedSortFields = ["createdAt", "rate", "updatedAt"];
    const sort = parseSort(req.query, "createdAt", allowedSortFields);

    // Query ratings with pagination and sorting
    const [rates, totalDocs] = await Promise.all([
      Rate.find({ novel: novelId })
        .populate("user", "username image")
        .select("user rate text createdAt updatedAt")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Rate.countDocuments({ novel: novelId }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalDocs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách đánh giá thành công",
      data: {
        rates,
        pagination: {
          page,
          limit,
          totalDocs,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error(`Get rates error for novel ${req.params.novelId}:`, error.stack);
    return sendErrorResponse(error, "Lỗi khi lấy danh sách đánh giá", res, 500);
  }
};

/** 
 * Deletes a rating for a novel
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.novelId - Novel ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteRate = async (req, res) => {

  try {
    const novelId = req.params.novelId;
    if (!mongoose.Types.ObjectId.isValid(novelId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }
    const userId = req.user._id;

    const novel = await Novel.findById(novelId).session(session).lean();
    if (!novel || novel.statusPublish !== "approved" || novel.isHidden) {
      return sendErrorResponse(null, "Truyện không tồn tại hoặc không được phép thao tác", res, 404);
    }

    const deleted = await Rate.findOneAndDelete(
      { novel: novelId, user: userId },
      { session }
    );
    if (!deleted) {
      return sendErrorResponse(null, "Đánh giá không tồn tại", res, 404);
    }

    // Cập nhật lại điểm trung bình
    // Update novel.rates
    const updateData = {
      $inc: { "rates.total": -deleted.rate, "rates.count": -1 },
      $set: {
        "rates.averageRating": parseFloat(
          novel.rates.count - 1 > 0
            ? ((novel.rates.total - deleted.rate) / (novel.rates.count - 1)).toFixed(1)
            : 0
        ),
      },
    };

    await Novel.findByIdAndUpdate(novelId, updateData, { session });

    return res.status(200).json({
      success: true,
      message: "Đánh giá đã được xóa"
    });

  } catch (error) {
    console.error(`Delete rate error for novel ${req.params.novelId}:`, error.stack);
    return sendErrorResponse(error, "Lỗi khi xóa đánh giá", res, 500);
  } finally {
    if (session) session.endSession();
  }
};