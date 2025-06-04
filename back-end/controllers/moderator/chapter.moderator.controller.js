/**
 * Controller for handling chapter moderation-related operations
 * @module ChapterModeratorController
 */

import User from "../../models/user.model.js";
import Chapter from "../../models/chapter.model.js";
import Novel from "../../models/novel.model.js";
import Report from "../../models/report.model.js";
import { moderationActionHandler } from "../../utils/moderation/moderationActionHandler.js";
import { MODERATION_ACTIONS } from "../../utils/moderation/constants/action.js";
import { validate, validateDocument, validateId } from "../../utils/validator/unifiedValidator.js";
import { withTransaction } from "../../utils/moderation/helper/withTransaction.js";
import { sendErrorResponse } from "../../utils/sendErrorResponse.js";

// Helper to update related reports
const updateRelatedReports = async (targetType, targetId, status, note, session) => {
  await Report.updateMany(
    { targetType, targetId, status: "pending" },
    { $set: { status, note, handledAt: new Date() } },
    { session }
  );
};

// Helper to sync novel status
const syncNovelStatus = async (novelId, session) => {
  const chapters = await Chapter.find({ novelId }).select("status").session(session);
  const allApproved = chapters.every((ch) => ch.status === "approved");
  const novel = await Novel.findById(novelId).session(session);
  novel.statusPublish = allApproved ? "approved" : "editing";
  await novel.save({ session });
};

// Helper to increment violation count
const incrementViolation = async (chapter, user, session) => {
  chapter.violation.count = (chapter.violation.count || 0) + 1;
  user.violation.count = (user.violation.count || 0) + 1;
  await chapter.save({ session });
  await user.save({ session });
};

// Middleware to check Content-Type
const checkContentType = (req, res, next) => {
  if (!req.is("application/json")) {
    return sendErrorResponse(null, "Content-Type phải là application/json", res, 400);
  }
  next();
};

/**
 * Get chapter details for moderation
 * @async
 */
export const getChapterDetails = async (req, res) => {
  try {
    const chapterId = validateId(req.params.chapterId, res);
    if (!chapterId) return;

    const [chapter, novel] = await Promise.all([
      Chapter.findById(chapterId).lean(),
      Novel.findById(chapter?.novelId)
        .select("title author createdBy")
        .populate("createdBy", "username email")
        .lean(),
    ]);

    const chapterCheck = await validateDocument("Chapter", chapter);
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 404);
    }
    const novelCheck = await validateDocument("Novel", novel);
    if (!novelCheck.valid) {
      return sendErrorResponse(null, novelCheck.message, res, 400);
    }

    res.status(200).json({ success: true, data: { chapter, novel } });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi lấy chi tiết chương", res, 500);
  }
};

/**
 * Approve a single chapter
 * @async
 */
export const approveChapter = async (req, res) => {
  try {
    const chapterId = validateId(req.params.chapterId, res);
    if (!chapterId) return;

    return await withTransaction(async (session) => {
      const [chapter, novel] = await Promise.all([
        Chapter.findById(chapterId).session(session),
        Novel.findById(chapter?.novelId).session(session),
      ]);

      const chapterCheck = await validateDocument("Chapter", chapter, {
        session,
        allowedStatuses: ["pending"],
      });
      if (!chapterCheck.valid) {
        return sendErrorResponse(null, chapterCheck.message, res, 400);
      }
      const novelCheck = await validateDocument("Novel", novel, {
        session,
        allowedStatuses: ["approved"],
      });
      if (!novelCheck.valid) {
        return sendErrorResponse(null, novelCheck.message, res, 400);
      }

      chapter.status = "approved";
      chapter.isPublished = true;
      chapter.publishDate = new Date();
      await chapter.save({ session });

      await updateRelatedReports("Chapter", chapter._id, "reviewed", "Chương đã được phê duyệt", session);

      await syncNovelStatus(novel._id, session);

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
    return sendErrorResponse(error, "Lỗi khi phê duyệt chương", res, 500);
  }
};

/**
 * Reject a single chapter
 * @async
 */
export const rejectChapter = async (req, res) => {
  try {
    const chapterId = validateId(req.params.chapterId, res);
    if (!chapterId) return;

    return await withTransaction(async (session) => {
      const [chapter, novel] = await Promise.all([
        Chapter.findById(chapterId).session(session),
        Novel.findById(chapter?.novelId).session(session),
      ]);

      const chapterCheck = await validateDocument("Chapter", chapter, {
        session,
        allowedStatuses: ["pending"],
      });
      if (!chapterCheck.valid) {
        return sendErrorResponse(null, chapterCheck.message, res, 400);
      }
      const novelCheck = await validateDocument("Novel", novel, { session });
      if (!novelCheck.valid) {
        return sendErrorResponse(null, novelCheck.message, res, 400);
      }

      chapter.status = "rejected";
      await chapter.save({ session });

      await updateRelatedReports("Chapter", chapter._id, "reviewed", `Chương bị từ chối: ${req.body.note}`, session);

      await syncNovelStatus(novel._id, session);

      if (!req.user?._id) {
        return sendErrorResponse(null, "Không tìm thấy thông tin người dùng", res, 401);
      }

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.reject,
        novelId: novel._id,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Chương ${chapter.chapterNumber}.${chapter.title} bị từ chối: ${req.body.note}`,
        logNote: `Từ chối chương ${chapter.chapterNumber} của truyện ${novel.title}`,
        details: { reason: req.body.note },
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Chương đã bị từ chối" });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi từ chối chương", res, 500);
  }
};

/**
 * Request edits for a specific chapter
 * @async
 */
export const requestEditChapter = async (req, res) => {
  try {
    const chapterId = validateId(req.params.chapterId, res);
    if (!chapterId) return;

    return await withTransaction(async (session) => {
      const [chapter, novel] = await Promise.all([
        Chapter.findById(chapterId).session(session),
        Novel.findById(chapter?.novelId).session(session),
      ]);

      const chapterCheck = await validateDocument("Chapter", chapter, { session });
      if (!chapterCheck.valid) {
        return sendErrorResponse(null, chapterCheck.message, res, 400);
      }
      const novelCheck = await validateDocument("Novel", novel, { session });
      if (!novelCheck.valid) {
        return sendErrorResponse(null, novelCheck.message, res, 400);
      }

      chapter.status = "editing";
      await chapter.save({ session });

      await syncNovelStatus(novel._id, session);

      if (!req.user?._id) {
        return sendErrorResponse(null, "Không tìm thấy thông tin người dùng", res, 401);
      }

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.requestEdit,
        novelId: novel._id,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Chương ${chapter.chapterNumber}.${chapter.title} cần chỉnh sửa: ${req.body.note}`,
        logNote: `Yêu cầu chỉnh sửa chương ${chapter.chapterNumber} của truyện ${novel.title}`,
        details: { reason: req.body.note },
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Đã gửi yêu cầu chỉnh sửa chương" });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi yêu cầu chỉnh sửa chương", res, 500);
  }
};

/**
 * Issue a warning for a chapter
 * @async
 */
export const warnChapter = async (req, res) => {
  try {
    const chapterId = validateId(req.params.chapterId, res);
    if (!chapterId) return;

    return await withTransaction(async (session) => {
      const [chapter, novel] = await Promise.all([
        Chapter.findById(chapterId).session(session),
        Novel.findById(chapter?.novelId).session(session),
      ]);

      const chapterCheck = await validateDocument("Chapter", chapter, { session });
      if (!chapterCheck.valid) {
        return sendErrorResponse(null, chapterCheck.message, res, 400);
      }
      const novelCheck = await validateDocument("Novel", novel, { session });
      if (!novelCheck.valid) {
        return sendErrorResponse(null, novelCheck.message, res, 400);
      }

      chapter.status = "warning";
      await chapter.save({ session });

      await syncNovelStatus(novel._id, session);

      if (!req.user?._id) {
        return sendErrorResponse(null, "Không tìm thấy thông tin người dùng", res, 401);
      }

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.warning,
        novelId: novel._id,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Chương ${chapter.chapterNumber}.${chapter.title} bị cảnh cáo: ${req.body.note}`,
        logNote: `Cảnh cáo chương ${chapter.chapterNumber} của truyện ${novel.title}`,
        details: { reason: req.body.note },
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Đã cảnh cáo chương" });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi cảnh cáo chương", res, 500);
  }
};

/**
 * Flag a chapter for violation
 * @async
 */
export const flagChapter = async (req, res) => {
  try {
    const chapterId = validateId(req.params.chapterId, res);
    if (!chapterId) return;

    return await withTransaction(async (session) => {
      const [chapter, novel, user] = await Promise.all([
        Chapter.findById(chapterId).session(session),
        Novel.findById(chapter?.novelId).session(session),
        User.findById(novel?.createdBy).session(session),
      ]);

      const chapterCheck = await validateDocument("Chapter", chapter, { session });
      if (!chapterCheck.valid) {
        return sendErrorResponse(null, chapterCheck.message, res, 400);
      }
      const novelCheck = await validateDocument("Novel", novel, { session });
      if (!novelCheck.valid) {
        return sendErrorResponse(null, novelCheck.message, res, 400);
      }
      if (!user) {
        return sendErrorResponse(null, "Không tìm thấy tác giả", res, 404);
      }

      chapter.violation.aiFlag = true;
      chapter.violation.userReports = (chapter.violation.userReports || 0) + 1;
      await chapter.save({ session });

      if (!req.user?._id) {
        return sendErrorResponse(null, "Không tìm thấy thông tin người dùng", res, 401);
      }

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.flag,
        novelId: novel._id,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: novel.createdBy,
        message: `Chương ${chapter.chapterNumber}.${chapter.title} bị gắn cờ: ${req.body.note}`,
        logNote: `Gắn cờ chương ${chapter.chapterNumber} của truyện ${novel.title}`,
        details: { reason: req.body.note },
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Chương đã bị gắn cờ" });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi gắn cờ chương", res, 500);
  }
};

/**
 * Warn and increment violation count for a chapter
 * @async
 */
export const warnChapterViolation = async (req, res) => {
  try {
    const chapterId = validateId(req.params.chapterId, res);
    if (!chapterId) return;

    return await withTransaction(async (session) => {
      const [chapter, novel, user] = await Promise.all([
        Chapter.findById(chapterId).session(session),
        Novel.findById(chapter?.novelId).session(session),
        User.findById(novel?.createdBy).session(session),
      ]);

      const chapterCheck = await validateDocument("Chapter", chapter, { session });
      if (!chapterCheck.valid) {
        return sendErrorResponse(null, chapterCheck.message, res, 400);
      }
      const novelCheck = await validateDocument("Novel", novel, { session });
      if (!novelCheck.valid) {
        return sendErrorResponse(null, novelCheck.message, res, 400);
      }
      if (!user) {
        return sendErrorResponse(null, "Không tìm thấy tác giả", res, 404);
      }

      chapter.status = "warning";
      await incrementViolation(chapter, user, session);

      await syncNovelStatus(novel._id, session);

      if (!req.user?._id) {
        return sendErrorResponse(null, "Không tìm thấy thông tin người dùng", res, 401);
      }

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.flag,
        novelId: novel._id,
        chapterId: chapter._id,
        moderatorId: req.user._id,
        recipientId: user._id,
        message: `Chương ${chapter.chapterNumber}.${chapter.title} bị cảnh báo do vi phạm: ${req.body.note}`,
        logNote: `Cảnh báo và gắn cờ vi phạm chương ${chapter.chapterNumber}/${novel.title}`,
        details: { reason: req.body.note },
      });

      if (!result.success) throw new Error(result.message);

      // Giả định handleViolationThreshold tồn tại
      const thresholdResult = await handleViolationThreshold(user._id, { session });
      if (!thresholdResult.success) {
        return sendErrorResponse(null, thresholdResult.message, res, 500);
      }

      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Đã cảnh cáo và gắn cờ chương vi phạm" });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi cảnh cáo và gắn cờ vi phạm chương", res, 500);
  }
};

/**
 * View a chapter for editing
 * @async
 */
export const viewChapterForEdit = async (req, res) => {
  try {
    const chapterId = validateId(req.params.chapterId, res);
    if (!chapterId) return;

    const [chapter, novel] = await Promise.all([
      Chapter.findById(chapterId).lean(),
      Novel.findById(chapter?.novelId).lean(),
    ]);

    const chapterCheck = await validateDocument("Chapter", chapter, {
      allowedStatuses: ["pending", "editing", "draft"],
    });
    if (!chapterCheck.valid) {
      return sendErrorResponse(null, chapterCheck.message, res, 400);
    }
    const novelCheck = await validateDocument("Novel", novel);
    if (!novelCheck.valid) {
      return sendErrorResponse(null, novelCheck.message, res, 404);
    }

    if (
      novel.createdBy?.toString() !== req.user._id?.toString() &&
      !["moderator", "admin"].includes(req.user.role)
    ) {
      return sendErrorResponse(null, "Không có quyền xem chương để chỉnh sửa", res, 403);
    }

    res.status(200).json({ success: true, data: chapter });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi xem thông tin chương", res, 500);
  }
};
