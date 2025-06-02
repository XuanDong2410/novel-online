/**
 * Controller for handling novel moderation-related operations
 * @module NovelModeratorController
 */

import Novel from "../../models/novel.model.js";
import Chapter from "../../models/chapter.model.js";
import User from "../../models/user.model.js";
import Appeal from "../../models/appeal.model.js";
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
import { sendErrorResponse } from "../../utils/sendErrorResponse.js";
import Joi from "joi";

// Các hàm hiện có (được lược bớt để tập trung vào hàm mới) ...
export const createAppeal = async (req, res) => { };
export const viewAllAppeals = async (req, res) => { };
export const viewAppeal = async (req, res) => { };
export const updateAppeal = async (req, res) => { };
/**
 * Delete a processed appeal
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.appealId - Appeal ID
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteAppeal = async (req, res) => {
  try {
    const appealId = await validateId(req.params.appealId, res);
    if (!appealId) return;

    if (!["admin", "moderator"].includes(req.user.role)) {
      return sendErrorResponse(null, "Không có quyền xóa kháng cáo", res, 403);
    }

    return await withTransaction(async (session) => {
      const appeal = await Appeal.findById(appealId);
      if (!appeal) {
        return sendErrorResponse(null, "Không tìm thấy kháng cáo", res);
      }
      if (appeal.status === "pending") {
        return sendErrorResponse(null, "Không thể xóa kháng cáo đang chờ xử lý", res, 400);
      }

      appeal.status = "deleted";
      await appeal.save({ session });

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.notice,
        novelId: appeal.novelId,
        chapterId: appeal.chapterId,
        moderatorId: req.user._id,
        recipientId: appeal.userId,
        message: `Kháng cáo của bạn cho hành động ${appeal.actionType} đã bị xóa`,
        logNote: `Xóa kháng cáo ${appeal._id} bởi ${req.user.username}`,
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Kháng cáo đã bị xóa" });
    });
  } catch (error) {
    const message = "Lỗi khi xóa kháng cáo";
    return sendErrorResponse(error, message, res, 500);
  }
};
/**
 * Submit an appeal for a moderation action
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.novelId - Novel ID (optional if chapterId is provided)
 * @param {string} req.body.chapterId - Chapter ID (optional if novelId is provided)
 * @param {string} req.body.actionType - Type of action being appealed (reject, warning, flag, hide)
 * @param {string} req.body.reason - Reason for the appeal
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming appeal submission
 */
export const submitAppeal = async (req, res) => {
  try {
    const { novelId, chapterId, actionType, reason } = req.body;

    const schema = Joi.object({
      novelId: Joi.string().optional(),
      chapterId: Joi.string().optional(),
      actionType: Joi.string()
        .valid("reject", "warning", "flag", "hide")
        .required()
        .messages({
          "any.required": "Loại hành động là bắt buộc",
          "any.only": "Loại hành động không hợp lệ",
        }),
      reason: Joi.string().max(2000).required().messages({
        "string.max": "Lý do không được vượt quá 2000 ký tự",
        "any.required": "Lý do là bắt buộc",
      }),
    }).or("novelId", "chapterId"); // Yêu cầu ít nhất một trong novelId hoặc chapterId

    const { error } = schema.validate({ novelId, chapterId, actionType, reason });
    if (error) {
      return sendErrorResponse(null, error.details[0].message, res, 400);
    }

    return await withTransaction(async (session) => {
      let novel, chapter;
      if (novelId) {
        const validatedNovelId = await validateId(novelId, res);
        if (!validatedNovelId) return;
        novel = await Novel.findById(novelId);
        if (!novel) {
          return sendErrorResponse(null, "Không tìm thấy truyện", res, 404);
        }
        if (novel.createdBy.toString() !== req.user._id.toString()) {
          return sendErrorResponse(null, "Không có quyền kháng cáo cho truyện này", res, 403);
        }
      }
      if (chapterId) {
        const validatedChapterId = await validateId(chapterId, res);
        if (!validatedChapterId) return;
        chapter = await Chapter.findById(chapterId);
        if (!chapter) {
          return sendErrorResponse(null, "Không tìm thấy chương", res, 404);
        }
        const chapterNovel = await Novel.findById(chapter.novelId);
        if (!chapterNovel) {
          return sendErrorResponse(null, "Không tìm thấy truyện của chương", res, 404);
        }
        if (chapterNovel.createdBy.toString() !== req.user._id.toString()) {
          return sendErrorResponse(null, "Không có quyền kháng cáo cho chương này", res, 403);
        }
      }

      const appeal = await Appeal.create(
        [
          {
            userId: req.user._id,
            novelId: novel?._id,
            chapterId: chapter?._id,
            actionType,
            reason,
            status: "pending",
          },
        ],
        { session }
      );

      const recipient = await User.findOne({ role: "admin" });
      if (!recipient) {
        return sendErrorResponse(null, "Không tìm thấy quản trị viên", res, 500);
      }

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.appeal,
        novelId: novel?._id,
        chapterId: chapter?._id,
        moderatorId: req.user._id,
        recipientId: recipient._id,
        message: `Người dùng ${req.user.username} đã gửi kháng cáo cho hành động ${actionType}: ${reason}`,
        logNote: `Kháng cáo ${actionType} bởi ${req.user.username}`,
        details: { appealId: appeal[0]._id, reason },
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res.status(200).json({ success: true, message: "Kháng cáo đã được gửi" });
    });
  } catch (error) {
    const message = "Lỗi khi gửi kháng cáo";
    return sendErrorResponse(error, message, res, 500);
  }
};

/**
 * Get a list of appeals
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.page - Page number for pagination
 * @param {number} req.query.limit - Number of items per page
 * @param {string} req.query.sortBy - Field to sort by
 * @param {string} req.query.sortOrder - Sort direction ('asc' or 'desc')
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with appeals list, total count, page, and limit
 */
export const getAppeals = async (req, res) => {
  try {
    const { limit, page, skip } = parsePagination(req.query);
    if (!limit.valid) {
      return sendErrorResponse(null, limit.message, res, 400);
    }
    const { sortBy, sortOrder } = parseSort(req.query);
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
    const validSortFields = ["createdAt", "status", "userId"];
    if (!validSortFields.includes(sortBy)) {
      return sendErrorResponse(null, "Trường sắp xếp không hợp lệ", res, 400);
    }

    if (!["admin", "moderator"].includes(req.user.role)) {
      return sendErrorResponse(null, "Không có quyền xem danh sách kháng cáo", res, 403);
    }

    const appeals = await Appeal.find({})
      .populate("userId", "username email")
      .populate("novelId", "title")
      .populate("chapterId", "chapterNumber title")
      .select("userId novelId chapterId actionType status createdAt")
      .skip(skip)
      .limit(limit.limit)
      .sort(sortOptions)
      .lean();

    const totalCount = await Appeal.countDocuments({});

    res.status(200).json({
      success: true,
      data: appeals,
      totalCount,
      page: limit.page,
      limit: limit.limit,
    });
  } catch (error) {
    const message = "Lỗi khi lấy danh sách kháng cáo";
    return sendErrorResponse(error, message, res, 500);
  }
};

/**
 * Get details of a specific appeal
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.appealId - Appeal ID
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with appeal details
 */
export const getAppealDetails = async (req, res) => {
  try {
    const appealId = await validateId(req.params.appealId, res);
    if (!appealId) return;

    if (!["admin", "moderator"].includes(req.user.role)) {
      return sendErrorResponse(null, "Không có quyền xem chi tiết kháng cáo", res, 403);
    }

    const appeal = await Appeal.findById(appealId)
      .populate("userId", "username email")
      .populate("novelId", "title")
      .populate("chapterId", "chapterNumber title")
      .lean();

    if (!appeal) {
      return sendErrorResponse(null, "Không tìm thấy kháng cáo", res, 404);
    }

    res.status(200).json({ success: true, data: appeal });
  } catch (error) {
    const message = "Lỗi khi lấy chi tiết kháng cáo";
    return sendErrorResponse(error, message, res, 500);
  }
};
