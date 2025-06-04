import mongoose from 'mongoose';
import Appeal from '../../models/appeal.model.js';
import User from '../../models/user.model.js';
import Novel from '../../models/novel.model.js';
import Chapter from '../../models/chapter.model.js';
import { validateInputWithSchema, mongooseSchemaToValidatorRules } from '../../utils/validator/inputValidator.js';
import { MODERATION_ACTIONS } from '../../utils/moderation/constants/action.js';
import { moderationActionHandler } from '../../utils/moderation/moderationActionHandler.js';
import { sendErrorResponse } from '../../utils/sendErrorResponse.js';
import { validateAppeal } from '../../utils/validator/ownValidator.js';
// Convert Mongoose schema to validation rules for Appeal
const appealSchemaRules = mongooseSchemaToValidatorRules(Appeal.schema);
appealSchemaRules.crossValidate = async (data) => {
  const [novel, chapter, user] = await Promise.all([
    data.novelId ? Novel.findById(data.novelId).lean() : null,
    data.chapterId ? Chapter.findById(data.chapterId).lean() : null,
    data.userId ? User.findById(data.userId).lean() : null,
  ]);
  if (data.novelId && !novel) return 'Truyện không tồn tại';
  if (data.chapterId && !chapter) return 'Chương không tồn tại';
  if (data.userId && !user) return 'Người dùng không tồn tại';
  return true;
};


/**
 * Retrieves all appeals created by the authenticated user
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with appeals
 */
export const viewAllAppeals = async (req, res) => {
  try {
    const appeals = await Appeal.find({ userId: req.user._id, status: { $ne: "deleted" } })
      .populate("novelId", "title")
      .populate("chapterId", "chapterNumber title")
      .populate("handledBy", "username")
      .select("novelId chapterId actionType reason status responseMessage handledAt createdAt updatedAt")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách kháng cáo thành công",
      data: appeals,
    });
  } catch (error) {
    console.error("Error fetching appeals:", error.stack);
    return sendErrorResponse(error, "Lỗi khi lấy danh sách kháng cáo", res, 500);
  }
};

/**
 * Retrieves a specific appeal by ID
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Appeal ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with appeal details
 */
export const viewAppeal = async (req, res) => {
  try {
    const appealId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(appealId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }
    const appeal = await Appeal.findById(appealId)
      .populate("novelId", "title")
      .populate("chapterId", "chapterNumber title")
      .populate("handledBy", "username")
      .select("novelId chapterId actionType reason status responseMessage handledAt createdAt updatedAt")
      .lean();
      
    const appealCheck = validateAppeal(appeal, req.user, []);
    if (!appealCheck.valid) {
      return sendErrorResponse(null, appealCheck.message, res, 404);
    }

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết kháng cáo thành công",
      data: appeal,
    });
  } catch (error) {
    console.error("Error fetching appeal:", error.stack);
    return sendErrorResponse(error, "Lỗi khi xem chi tiết kháng cáo", res, 500);
  }
};

/**
 * Creates a new appeal
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created appeal
 */
export const createAppeal = async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (error) {
    console.error("Error starting session:", error.stack);
    return sendErrorResponse(error, "Lỗi khi khởi tạo session", res, 500);
  }
  try {
    const { novelId, chapterId, actionType, reason } = req.body;
    const userId = req.user._id;

    // Validate input
    const validationResult = validateInputWithSchema(
      { userId, novelId, chapterId, actionType, reason },
      {},
      {
        userId: appealSchemaRules.userId,
        novelId: appealSchemaRules.novelId,
        chapterId: appealSchemaRules.chapterId,
        actionType: appealSchemaRules.actionType,
        reason: appealSchemaRules.reason,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Ensure either novelId or chapterId is provided
    if (!novelId && !chapterId) {
      return sendErrorResponse(null, 'Phải cung cấp novelId hoặc chapterId', res, 400);
    }
    // Validate ownership
    if (novelId) {
      const novel = await Novel.findById(novelId).lean();
      if (!novel || novel.createdBy.toString() !== userId.toString()) {
        return sendErrorResponse(null, "Truyện không tồn tại hoặc bạn không có quyền", res, 400);
      }
    }
    if (chapterId) {
      const chapter = await Chapter.findById(chapterId).lean();
      const novel = chapter ? await Novel.findById(chapter.novelId).lean() : null;
      if (!chapter || !novel || novel.createdBy.toString() !== userId.toString()) {
        return sendErrorResponse(null, "Chương không tồn tại hoặc bạn không có quyền", res, 400);
      }
    }
    // Check appeal limit
    const appealCount = await Appeal.countDocuments({
      userId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });
    if (appealCount >= 5) {
      return sendErrorResponse(null, "Vượt quá giới hạn 5 kháng cáo trong tuần", res, 429);
    }

    // Find admin to notify
    const admin = await User.findOne({ role: "admin" }).lean();
    if (!admin) {
      return sendErrorResponse(null, "Không tìm thấy quản trị viên", res, 500);
    }
    // Create new appeal
    const newAppeal = new Appeal({
      userId,
      novelId,
      chapterId,
      actionType: actionType.toLowerCase(),
      reason: reason.trim(),
      status: "pending",
      handledBy: admin._id,
    });

    await newAppeal.save({ session });

    // Log moderation action
    const logData = {
      action: MODERATION_ACTIONS.userAppeal,
      novelId,
      chapterId,
      moderatorId: req.user._id,
      recipientId: admin._id,
      message: `Người dùng ${req.user.username} đã gửi kháng cáo cho hành động ${actionType}: ${reason}`,
      logNote: `Tạo kháng cáo cho việc ${actionType} ${novelId ? 'truyện' : 'chương'} `,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: 'Kháng cáo đã được tạo thành công',
      data: newAppeal,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi server khi tạo kháng cáo', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Updates an appeal
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Appeal ID
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */
export const updateAppeal = async (req, res) => {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (error) {
    console.error("Error starting session:", error.stack);
    return sendErrorResponse(error, "Lỗi khi khởi tạo session", res, 500);
  }

  try {
    const appealId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(appealId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }
    const { reason } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { reason },
      {},
      { reason: appealSchemaRules.reason }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Fetch and validate appeal
    const appeal = await Appeal.findById(appealId).session(session);
    const appealCheck = validateAppeal(appeal, req.user, ['pending']);
    if (!appealCheck.valid) {
      return sendErrorResponse(null, appealCheck.message, res, 400);
    }

    // Check if novel/chapter still exists
    if (appeal.novelId) {
      const novel = await Novel.findById(appeal.novelId).session(session);
      if (!novel) return sendErrorResponse(null, "Truyện không tồn tại", res, 404);
    }
    if (appeal.chapterId) {
      const chapter = await Chapter.findById(appeal.chapterId).session(session);
      if (!chapter) return sendErrorResponse(null, "Chương không tồn tại", res, 404);
    }
    // Update appeal
    const updateData = {
      reason: reason.trim(),
      updatedAt: new Date(),
    };

    await Appeal.findByIdAndUpdate(appealId, { $set: updateData }, { session });

    // Log moderation action
    const logData = {
      action: MODERATION_ACTIONS.userNotice,
      novelId: appeal.novelId,
      chapterId: appeal.chapterId,
      moderatorId: req.user._id,
      recipientId: appeal.handledBy,
      message: `Kháng cáo cho hành động ${appeal.actionType} đã được cập nhật bởi ${req.user.username}`,
      logNote: `Cập nhật kháng cáo ${appeal._id}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Kháng cáo đã được cập nhật',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi cập nhật kháng cáo', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Deletes an appeal
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Appeal ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteAppeal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const appealId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(appealId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }

    // Fetch and validate appeal
    const appeal = await Appeal.findById(appealId).session(session);
    const appealCheck = validateAppeal(appeal, req.user, ['pending', 'rejected']);
    if (!appealCheck.valid) {
      return sendErrorResponse(null, appealCheck.message, res, 400);
    }
    if (appeal.novelId) {
      const novel = await Novel.findById(appeal.novelId).session(session);
      if (!novel) return sendErrorResponse(null, "Truyện không tồn tại", res, 404);
    }
    // Update status to deleted
    await Appeal.findByIdAndUpdate(
      appealId,
      { $set: { status: 'deleted', updatedAt: new Date() } },
      { session }
    );

    // Log moderation action
    const logData = {
      action: MODERATION_ACTIONS.notice,
      novelId: appeal.novelId,
      chapterId: appeal.chapterId,
      appealId: appeal._id,
      moderatorId: req.user._id,
      recipientId: appeal.handledBy,
      message: `Kháng cáo cho hành động ${appeal.actionType} đã bị xóa bởi ${req.user.username}`,
      logNote: `Xóa kháng cáo ${appeal._id}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Kháng cáo đã bị xóa',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi xóa kháng cáo', res, 500);
  } finally {
    session.endSession();
  }
};