/**
 * Controller for handling novel moderation-related operations
 * @module NovelModeratorController
 */

/**
 * Get a list of pending novels awaiting moderation
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.page - Page number for pagination
 * @param {number} req.query.limit - Number of items per page
 * @param {string} req.query.sortBy - Field to sort by
 * @param {string} req.query.sortOrder - Sort direction ('asc' or 'desc')
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with novels list, total count, page, and limit
 */


/**
 * Get specific chapter details for moderation
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.chapterId - Chapter ID
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with chapter details
 */

/**
 * Approve a novel and all its chapters
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming approval
 */

/**
 * Reject a novel and its chapters
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.note - Rejection reason
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming rejection
 */

/**
 * Hide a novel from public view
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.note - Reason for hiding
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming novel is hidden
 */

/**
 * Unhide a previously hidden novel
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.note - Reason for unhiding
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming novel is unhidden
 */
import Novel from "../../models/novel.model.js";
import Chapter from "../../models/chapter.model.js";

import { moderationActionHandler } from "../../utils/moderation/moderationActionHandler.js";
import { MODERATION_ACTIONS } from "../../utils/moderation/constants/action.js";
import {
  validateNovel,
  validateNote,
  validateModerationInput,
  validateId,
} from "../../utils/moderation/helper/validation.js";
import {
  parsePagination,
  parseSort,
} from "../../utils/moderation/helper/pagination.js";
import { withTransaction } from "../../utils/moderation/helper/withTransaction.js";
import { errorHandler } from "../../utils/errorHandler.js";

/**
 * Lấy danh sách các tiểu thuyết đang chờ duyệt
 * @param {Object} req - Request object chứa query params (page, limit, sort, direction)
 * @param {Object} res - Response object
 * @returns {Object} JSON chứa danh sách tiểu thuyết, tổng số lượng, trang và giới hạn
 */

export const getPendingNovels = async (req, res) => {
  try {
    const { limit, page, skip } = parsePagination(req.query);
    const { sortBy, sortOrder } = parseSort(req.query);
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
    const validSortFields = ["createdAt", "title", "author"];
    if (!validSortFields.includes(sortBy)) {
      return errorHandler(null, "Trường sắp xếp không hợp lệ", res, 400);
    }
    const novels = await Novel.find({ statusPublish: "pending" })
      .populate("createdBy", "username email")
      .select(
        "title author statusPublish createdBy createdAt violation.aiFlag violation.details"
      )
      .skip(skip)
      .limit(limit)
      .sort(sortOptions)
      .lean();
    const totalCount = await Novel.countDocuments({ statusPublish: "pending" });

    res.status(200).json({
      success: true,
      data: novels,
      totalCount,
      page,
      limit,
    });
  } catch (error) {
    const message = "Lỗi khi lấy danh sách truyện chờ duyệt";
    return errorHandler(error, message, res, 500);
  }
};

/**
 * Get a list of published novels with new pending chapters
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.page - Page number for pagination
 * @param {number} req.query.limit - Number of items per page
 * @param {string} req.query.sortBy - Field to sort by
 * @param {string} req.query.sortOrder - Sort direction ('asc' or 'desc')
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with novels list, total count, page, and limit
 */
export const getPublishedNovelsWithPendingChapters = async (req, res) => {
  try {
    const { limit, page, skip } = parsePagination(req.query);
    if (!limit.valid) {
      return errorHandler(null, limit.message, res, 400);
    }
    const { sortBy, sortOrder } = parseSort(req.query);
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
    const validSortFields = ["createdAt", "title", "author"];
    if (!validSortFields.includes(sortBy)) {
      return errorHandler(null, "Trường sắp xếp không hợp lệ", res, 400);
    }

    const novels = await Novel.find({ statusPublish: "approved" })
      .populate("createdBy", "username email")
      .select("title author createdBy createdAt")
      .lean();

    const novelIds = novels.map((novel) => novel._id);
    const novelsWithPendingChapters = await Chapter.aggregate([
      { $match: { novelId: { $in: novelIds }, status: "pending" } },
      {
        $group: {
          _id: "$novelId",
          pendingChapters: { $push: { _id: "$_id", chapterNumber: "$chapterNumber", title: "$title" } },
        },
      },
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limit.limit },
      {
        $lookup: {
          from: "novels",
          localField: "_id",
          foreignField: "_id",
          as: "novel",
        },
      },
      { $unwind: "$novel" },
      {
        $project: {
          _id: "$novel._id",
          title: "$novel.title",
          author: "$novel.author",
          createdBy: "$novel.createdBy",
          pendingChapters: 1,
        },
      },
    ]);

    const totalCount = await Chapter.distinct("novelId", {
      novelId: { $in: novelIds },
      status: "pending",
    }).then((ids) => ids.length);

    res.status(200).json({
      success: true,
      data: novelsWithPendingChapters,
      totalCount,
      page: limit.page,
      limit: limit.limit,
    });
  } catch (error) {
    const message = "Lỗi khi lấy danh sách truyện có chương mới";
    return errorHandler(error, message, res, 500);
  }
};
/**
 * Lấy danh sách các chương của tiểu thuyết đang chờ duyệt
 * @param {Object} req - Request object chứa query params
 * @param {Object} res - Response object
 * @returns {Object} JSON chứa danh sách chương của tiểu thuyết, thông tin truyện
 */

// GET /api/moderation/novels/:id
export const getNovelWithChapters = async (req, res) => {
  try {
    await validateId(req.params.id);
    const novel = await Novel.findById(req.params.id)
      .populate("createdBy", "username email")
      .populate("attributes")
      .lean();

    const novelCheck = validateNovel(novel, null);
    if (!novelCheck.valid)
      return errorHandler(null, novelCheck.message, res, 400);
    const { chapterPage, chapterLimit } = parsePagination(req.query);

    const chapters = await Chapter.find({ novelId: novel._id })
      .sort("chapterNumber")
      .skip((chapterPage - 1) * chapterLimit)
      .limit(parseInt(chapterLimit))
      .lean();
    res.status(200).json({ success: true, data: { novel, chapters } });
  } catch (error) {
    const message = "Lỗi khi lấy chi tiết truyện";
    return errorHandler(error, message, res, 500);
  }
};

// POST /api/moderation/novels/:id/approve
export const approveNovelAndChapters = async (req, res) => {
  try {
    await validateId(req.params.id);
    const novel = await Novel.findById(req.params.id);
    return await withTransaction(async (session) => {
      const novelCheck = validateNovel(novel);
      if (!novelCheck.valid)
        return errorHandler(null, novelCheck.message, res, 400);
      const chapters = await Chapter.countDocuments({
        novelId: novel._id,
        status: { $in: ["rejected", "warning", "editing"] },
      });
      if (chapters > 0) {
        const message =
          "Không thể duyệt vì có chương bị từ chối, cảnh báo hoặc yêu cầu chỉnh sửa";
        return errorHandler(null, message, res, 400);
      }
      if (novel.statusPublish !== "pending") {
        return errorHandler(
          null,
          "Truyện không ở trạng thái chờ duyệt",
          res,
          400
        );
      }
      novel.statusPublish = "approved";
      novel.publishDate = new Date();
      await novel.save({ session });

      await Chapter.updateMany(
        { novelId: novel._id },
        { status: "approved", isPublished: true },
        { session }
      );
      if (!req.user?._id) {
        return errorHandler(
          null,
          "Không tìm thấy thông tin người dùng",
          res,
          401
        );
      }
      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.approve,
        novelId: novel._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Truyện ${novel.title} của bạn đã được phê duyệt`,
        logNote: "Phê duyệt truyện và các chương liên quan",
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res
        .status(200)
        .json({ success: true, message: "Truyện đã được phê duyệt" });
    });
  } catch (error) {
    const message = "Lỗi khi phê duyệt truyện";
    return errorHandler(error, message, res, 500);
  }
};

// POST /api/moderation/novels/:id/reject
export const rejectNovel = async (req, res) => {
  try {
    await validateId(req.params.id);
    const { note } = req.body;
    if (!req.body.note) {
      return errorHandler(null, "Ghi chú là bắt buộc", res, 400);
    }
    const novel = await Novel.findById(req.params.id);

    return await withTransaction(async (session) => {
      const noteCheck = validateNote(note);
      const novelCheck = validateNovel(novel, session);
      validateModerationInput(noteCheck, novelCheck, res);

      novel.statusPublish = "rejected";
      await novel.save({ session });
      await Chapter.updateMany(
        { novelId: novel._id },
        { status: "rejected" },
        { session }
      );
      if (!req.user?._id) {
        return errorHandler(
          null,
          "Không tìm thấy thông tin người dùng",
          res,
          401
        );
      }
      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.reject,
        novelId: novel._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Truyện ${novel.title} của bạn đã bị từ chối vì: ${note}`,
        logNote: "Từ chối truyện và các chương liên quan",
        details: { reason: note },
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res
        .status(200)
        .json({ success: true, message: "Truyện đã được từ chối" });
    });
  } catch (error) {
    const message = "Lỗi khi từ chối truyện";
    return errorHandler(error, message, res, 500);
  }
};

// POST /api/moderation/novels/:id/hide
export const hideNovel = async (req, res) => {
  try {
    await validateId(req.params.id);
    const { note } = req.body;
    if (!req.body.note) {
      return errorHandler(null, "Ghi chú là bắt buộc", res, 400);
    }
    const novel = await Novel.findById(req.params.id);
    return await withTransaction(async (session) => {
      if (!novel) {
        const message = "Không tìm thấy truyện";
        return errorHandler(null, message, res, 404);
      }
      const noteCheck = validateNote(note);
      if (!noteCheck) return errorHandler(error, noteCheck.message, res, 400);
      if (novel.statusPublish === "rejected") {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Không thể ẩn truyện đã bị từ chối",
        });
      }
      if (novel.isHidden) {
        await session.abortTransaction();
        const message = "Truyện đã bị ẩn";
        return errorHandler(error, message, res, 400);
      }

      novel.isHidden = true;
      await novel.save({ session });
      if (!req.user?._id) {
        return errorHandler(
          null,
          "Không tìm thấy thông tin người dùng",
          res,
          401
        );
      }
      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.hide,
        novelId: novel._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Truyện ${novel.title} đã bị ẩn vì: ${note}`,
        logNote: "Ẩn truyện",
        details: { reason: note },
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      return res
        .status(200)
        .json({ success: true, message: "Truyện đã bị ẩn" });
    });
  } catch (error) {
    const message = "Lỗi khi ẩn truyện";
    return errorHandler(error, message, res, 500);
  }
};
// POST /api/moderation/novels/:id/un-hide
export const unHideNovel = async (req, res) => {
  try {
    await validateId(req.params.id);
    const { note } = req.body;
    if (!req.body.note) {
      return errorHandler(null, "Ghi chú là bắt buộc", res, 400);
    }
    const novel = await Novel.findById(req.params.id);
    if (!novel) {
      const message = "Không tìm thấy truyện";
      return errorHandler(null, message, res, 404);
    }

    return await withTransaction(async (session) => {
      const noteCheck = validateNote(note);
      if (!noteCheck)
        return res
          .status(400)
          .json({ success: false, message: noteCheck.message });
      if (!novel.isHidden) {
        await session.abortTransaction();
        const message = "Truyện không bị ẩn";
        return errorHandler(null, message, res, 400);
      }

      novel.isHidden = false;
      await novel.save({ session });
      if (!req.user?._id) {
        return errorHandler(
          null,
          "Không tìm thấy thông tin người dùng",
          res,
          401
        );
      }
      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.unHide,
        novelId: novel._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Truyện ${novel.title} đã bị hiển thị vì: ${note}`,
        logNote: "Hiển thị truyện",
        details: { reason: note },
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      return res
        .status(200)
        .json({ success: true, message: "Truyện đã hiển thị" });
    });
  } catch (error) {
    const message = "Lỗi khi hiển thị truyện";
    return errorHandler(error, message, res, 500);
  }
};
/**
 * View a novel for editing (only if in editable state)
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with novel details
 */
export const viewNovelForEdit = async (req, res) => {
  try {
    const novelId = await validateId(req.params.id, res);
    if (!novelId) return;

    const novel = await Novel.findById(novelId)
      .populate("createdBy", "username email")
      .lean();

    const novelCheck = validateNovel(novel, null);
    if (!novelCheck.valid) {
      return errorHandler(null, novelCheck.message, res, 400);
    }
    if (!["pending", "editing", "draft"].includes(novel.statusPublish)) {
      return errorHandler(null, "Truyện không ở trạng thái cho phép chỉnh sửa", res, 400);
    }
    if (novel.createdBy.toString() !== req.user._id.toString() && !["moderator", "admin"].includes(req.user.role)) {
      return errorHandler(null, "Không có quyền xem truyện để chỉnh sửa", res, 403);
    }

    res.status(200).json({ success: true, data: novel });
  } catch (error) {
    const message = "Lỗi khi xem thông tin truyện";
    return errorHandler(error, message, res, 500);
  }
};

export const getApprovedNovelsHaSPendingChapters = async (req, res) => {
  //TODO: get approved novels has pending chapters
}
export const toggleHideNovel = async (req, res) => {
  //TODO: merge func hide and unhide
}