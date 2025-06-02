
/**
 * Request edits for a specific chapter
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.chapterId - Chapter ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.note - Edit request details
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming edit request
 */

/**
 * Issue a warning for a chapter
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.chapterId - Chapter ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.note - Warning reason
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming warning
 */

/**
 * Flag a chapter for violation
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.chapterId - Chapter ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.note - Violation details
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming violation flag
 */
import User from "../../models/user.model.js";
import Chapter from "../../models/chapter.model.js";
import Novel from "../../models/novel.model.js";
import { moderationActionHandler } from "../../utils/moderation/moderationActionHandler.js";
import { MODERATION_ACTIONS } from "../../utils/moderation/constants/action.js";
import {
  validateNovel,
  validateNote,
  validateModerationInput,
  validateId,
} from "../../utils/moderation/helper/validation.js";

import { withTransaction } from "../../utils/moderation/helper/withTransaction.js";
import { sendErrorResponse } from "../../utils/sendErrorResponse.js";

/**
 * Get novel details with its chapters for moderation
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Novel ID
 * @param {Object} req.query - Query parameters for chapter pagination
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with novel and chapters data
 */

export const getChapterDetails = async (req, res) => {
  try {
    await validateId(req.params.chapterId);
    const chapter = await Chapter.findById(req.params.chapterId).lean();

    if (!chapter) {
      const message = "Không tìm thấy chương";
      return sendErrorResponse(null, message, res, 404);
    }
    const novel = await Novel.findById(chapter.novelId).lean();
    const novelCheck = validateNovel(novel, null);
    if (!novelCheck.valid)
      return sendErrorResponse(null, novelCheck.message, res, 400);

    return res.status(200).json({ success: true, data: chapter });
  } catch (error) {
    const message = "Lỗi khi lấy chi tiết chương";
    return sendErrorResponse(error, message, res, 500);
  }
};
/**
 * Approve a single chapter of a published novel
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.chapterId - Chapter ID
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming chapter approval
 */
export const approveChapter = async (req, res) => {
  try {
    const chapterId = await validateId(req.params.chapterId, res);
    if (!chapterId) return;

    return await withTransaction(async (session) => {
      const chapter = await Chapter.findById(chapterId);
      if (!chapter) {
        return sendErrorResponse(null, "Không tìm thấy chương", res, 404);
      }
      if (!chapter.novelId) {
        return sendErrorResponse(null, "Không tìm thấy novelId của chương", res, 400);
      }
      const novel = await Novel.findById(chapter.novelId);
      const novelCheck = validateNovel(novel, session);
      if (!novelCheck.valid) {
        return sendErrorResponse(null, novelCheck.message, res, 400);
      }
      if (chapter.status !== "pending") {
        return sendErrorResponse(null, "Chương không ở trạng thái chờ duyệt", res, 400);
      }
      if (novel.statusPublish !== "approved") {
        return sendErrorResponse(null, "Truyện chưa được xuất bản", res, 400);
      }

      chapter.status = "approved";
      chapter.isPublished = true;
      chapter.publishDate = new Date();
      await chapter.save({ session });

      if (!req.user?._id) {
        return sendErrorResponse(null, "Không tìm thấy thông tin người dùng", res, 401);
      }
      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.approve,
        novelId: novel._id,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Chương ${chapter.chapterNumber}.${chapter.title} của truyện ${novel.title} đã được phê duyệt`,
        logNote: `Phê duyệt chương ${chapter.chapterNumber} của truyện ${novel.title}`,
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Chương đã được phê duyệt" });
    });
  } catch (error) {
    const message = "Lỗi khi phê duyệt chương";
    return sendErrorResponse(error, message, res, 500);
  }
};
export const rejectChapter = async (req, res) => {
  //TODO: need complete
}
// POST /api/moderation/chapters/:chapterId/request-edit
export const requestEditChapter = async (req, res) => {
  try {
    await validateId(req.params.chapterId);
    const { note } = req.body;
    if (!req.body.note) {
      return sendErrorResponse(null, "Ghi chú là bắt buộc", res, 400);
    }
    const chapter = await Chapter.findById(req.params.chapterId);
    if (!chapter)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chương",
      });
    const novel = await Novel.findById(chapter.novelId);
    return await withTransaction(async (session) => {
      const noteCheck = validateNote(note);
      const novelCheck = validateNovel(novel, session);
      validateModerationInput(noteCheck, novelCheck, res);

      novel.statusPublish = "editing";
      chapter.status = "editing";
      await novel.save({ session });
      await chapter.save({ session });
      if (!req.user?._id) {
        return sendErrorResponse(
          null,
          "Không tìm thấy thông tin người dùng",
          res,
          401
        );
      }
      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.requestEdit,
        novelId: novel._id,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Chương ${chapter.chapterNumber}.${chapter.title} của truyện ${novel.title} cần chỉnh sửa: ${note}`,
        logNote: `Yêu cầu chỉnh sửa chương ${chapter.chapterNumber}.${chapter.title} của truyện ${novel.title} bởi ${req.user.username}`,
        details: { reason: note },
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res
        .status(200)
        .json({ success: true, message: "Đã gửi yêu cầu chỉnh sửa chương" });
    });
  } catch (error) {
    const message = "Lỗi khi yêu cầu chỉnh sửa chương";
    return sendErrorResponse(error, message, res, 500);
  }
};
// POST /api/moderation/chapters/:chapterId/warning
export const warnChapter = async (req, res) => {
  try {
    await validateId(req.params.chapterId);
    const { note } = req.body;
    if (!req.body.note) {
      return sendErrorResponse(null, "Ghi chú là bắt buộc", res, 400);
    }
    const chapter = await Chapter.findById(req.params.chapterId);
    if (!chapter?.novelId) {
      return sendErrorResponse(null, "Không tìm thấy novelId của chương", res, 400);
    }
    const novel = await Novel.findById(chapter.novelId);
    return await withTransaction(async (session) => {
      const noteCheck = validateNote(note);
      const novelCheck = validateNovel(novel, session);
      validateModerationInput(noteCheck, novelCheck, res);

      chapter.status = "warning";
      novel.statusPublish = "editing";
      await chapter.save({ session });
      await novel.save({ session });
      if (!req.user?._id) {
        return sendErrorResponse(
          null,
          "Không tìm thấy thông tin người dùng",
          res,
          401
        );
      }

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.warning,
        novelId: novel._id,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Chương ${chapter.chapterNumber} bị cảnh cáo: ${note}`,
        logNote: `Cảnh cáo chương bởi ${req.user.username}`,
        details: { reason: note },
      });

      if (!result.success) throw new Error(result.message);
      await session.commitTransaction();
      return res
        .status(200)
        .json({ success: true, message: "Đã cảnh cáo chương" });
    });
  } catch (error) {
    const message = "Lỗi khi cảnh cáo chương";
    return sendErrorResponse(error, message, res, 500);
  }
};

// POST /api/moderation/chapters/:chapterId/warn
export const warnChapterViolation = async (req, res) => {
  try {
    await validateId(req.params.chapterId);
    const { note } = req.body;
    if (!req.body.note) {
      return sendErrorResponse(null, "Ghi chú là bắt buộc", res, 400);
    }
    const chapter = await Chapter.findById(req.params.chapterId);
    if (!chapter) {
      const message = "Không tìm thấy chương";
      return sendErrorResponse(null, message, res, 404);
    }
    return await withTransaction(async (session) => {
      chapter.status = "warning";
      if (!chapter.violation) {
        chapter.violation = { count: 0 };
      }
      chapter.violation.count = (chapter.violation.count || 0) + 1;
      await chapter.save({ session });

      if (!chapter?.novelId) {
        return sendErrorResponse(
          null,
          "Không tìm thấy novelId của chương",
          res,
          400
        );
      }
      const novel = await Novel.findById(chapter.novelId);
      novel.statusPublish = "warning";
      await novel.save({ session });
      if (!novel?.createdBy) {
        return sendErrorResponse(
          null,
          "Không tìm thấy tác giả của truyện",
          res,
          400
        );
      }
      const author = await User.findById(novel.createdBy);
      if (!author.author) {
        author.author = { violation: { count: 0 } };
      }
      author.violation.count = (author.violation.count || 0) + 1;

      const noteCheck = validateNote(note);
      const novelCheck = validateNovel(novel, session);
      validateModerationInput(noteCheck, novelCheck, res);

      if (!author) {
        await session.abortTransaction();
        const message = "Không tìm thấy tác giả";
        return sendErrorResponse(null, message, res, 404);
      }
      if (!req.user?._id) {
        return sendErrorResponse(
          null,
          "Không tìm thấy thông tin người dùng",
          res,
          401
        );
      }
      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.flag,
        novelId: chapter.novelId,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Chương "${chapter.title}" bị cảnh báo do vi phạm: ${note}`,
        logNote: "Nội dung chương bị gắn cờ vi phạm",
        details: { reason: note },
      });

      if (!result.success) throw new Error(result.message);

      const thresholdResult = await handleViolationThreshold(author._id);
      if (!thresholdResult.success) {
        const message = "Không thể gắn cờ vi phạm" + thresholdResult.message;
        return sendErrorResponse(null, message, res, 500);
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: "Đã cảnh cáo và gắn cờ chương vi phạm",
      });
    });
  } catch (error) {
    const message = "Lỗi khi cảnh cáo và gắn cờ chương vi phạm";
    return sendErrorResponse(error, message, res, 500);
  }
};
/**
 * View a chapter for editing (only if in editable state)
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.chapterId - Chapter ID
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with chapter details
 */
export const viewChapterForEdit = async (req, res) => {
  try {
    const chapterId = await validateId(req.params.chapterId, res);
    if (!chapterId) return;

    const chapter = await Chapter.findById(chapterId).lean();
    if (!chapter) {
      return sendErrorResponse(null, "Không tìm thấy chương", res, 404);
    }
    if (!["pending", "editing", "draft"].includes(chapter.status)) {
      return sendErrorResponse(null, "Chương không ở trạng thái cho phép chỉnh sửa", res, 400);
    }

    const novel = await Novel.findById(chapter.novelId).lean();
    if (!novel) {
      return sendErrorResponse(null, "Không tìm thấy truyện", res, 404);
    }
    if (novel.createdBy.toString() !== req.user._id.toString() && !["moderator", "admin"].includes(req.user.role)) {
      return sendErrorResponse(null, "Không có quyền xem chương để chỉnh sửa", res, 403);
    }

    res.status(200).json({ success: true, data: chapter });
  } catch (error) {
    const message = "Lỗi khi xem thông tin chương";
    return sendErrorResponse(error, message, res, 500);
  }
};

export const flagChapter = async (req, res) => {
  //TODO: func to flag chapter
}