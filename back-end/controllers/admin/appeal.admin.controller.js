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
  validateId,
} from "../../utils/moderation/helper/validation.js";

import { withTransaction } from "../../utils/moderation/helper/withTransaction.js";
import { sendErrorResponse } from "../../utils/sendErrorResponse.js";
import Joi from "joi";
import cron from "node-cron";

// Các hàm hiện có (được lược bớt để tập trung vào hàm mới) ...

/**
 * Resolve an appeal by approving or rejecting it
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.appealId - Appeal ID
 * @param {Object} req.body - Request body
 * @param {string} req.body.decision - Decision ('approve' or 'reject')
 * @param {string} [req.body.note] - Optional note for the decision
 * @param {Object} req.user - Authenticated user object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming appeal resolution
 */
export const resolveAppeal = async (req, res) => {
  try {
    const appealId = await validateId(req.params.appealId, res);
    if (!appealId) return;

    const { decision, note } = req.body;

    const schema = Joi.object({
      decision: Joi.string().valid("approve", "reject").required().messages({
        "any.required": "Quyết định là bắt buộc",
        "any.only": "Quyết định phải là 'approve' hoặc 'reject'",
      }),
      note: Joi.string().max(2000).optional().messages({
        "string.max": "Ghi chú không được vượt quá 2000 ký tự",
      }),
    });
    const { error } = schema.validate({ decision, note });
    if (error) return sendErrorResponse(null, error.details[0].message, res, 400);

    if (!["admin", "moderator"].includes(req.user.role)) {
      return sendErrorResponse(null, "Không có quyền xử lý kháng cáo", res, 403);
    }

    return await withTransaction(async (session) => {
      const appeal = await Appeal.findById(appealId);
      if (!appeal) return sendErrorResponse(null, "Không tìm thấy kháng cáo", res, 404);
      if (appeal.status !== "pending") {
        return sendErrorResponse(null, "Kháng cáo đã được xử lý", res, 400);
      }

      appeal.status = decision;
      await appeal.save({ session });

      let novel, chapter;
      if (decision === "approve") {
        if (appeal.novelId) {
          novel = await Novel.findById(appeal.novelId);
          if (!novel) return sendErrorResponse(null, "Không tìm thấy truyện", res, 404);
          if (appeal.actionType === "hide") {
            novel.isHidden = false;
            novel.statusPublish = "approved";
            await novel.save({ session });
          } else if (appeal.actionType === "reject") {
            novel.statusPublish = "editing";
            await novel.save({ session });
          }
        }
        if (appeal.chapterId) {
          chapter = await Chapter.findById(appeal.chapterId);
          if (!chapter) return sendErrorResponse(null, "Không tìm thấy chương", res, 404);
          if (["warning", "flag"].includes(appeal.actionType)) {
            chapter.status = "editing";
            chapter.violation = { count: (chapter.violation?.count || 1) - 1 };
            await chapter.save({ session });
          } else if (appeal.actionType === "reject") {
            chapter.status = "editing";
            await chapter.save({ session });
          }
        }
      }

      const result = await moderationActionHandler({
        action: MODERATION_ACTIONS.notice,
        novelId: appeal.novelId,
        chapterId: appeal.chapterId,
        moderatorId: req.user._id,
        recipientId: appeal.userId,
        message: `Kháng cáo của bạn cho hành động ${appeal.actionType} đã được ${
          decision === "approve" ? "phê duyệt" : "từ chối"
        }: ${note || "Không có ghi chú"}`,
        logNote: `${
          decision === "approve" ? "Phê duyệt" : "Từ chối"
        } kháng cáo ${appeal._id} bởi ${req.user.username}`,
        details: { decision, note },
      });

      if (!result.success) throw new Error(result.message);

      await session.commitTransaction();
      res.status(200).json({
        success: true,
        message: `Kháng cáo đã được ${decision === "approve" ? "phê duyệt" : "từ chối"}`,
      });
    });
  } catch (error) {
    const message = "Lỗi khi xử lý kháng cáo";
    return sendErrorResponse(error, message, res, 500);
  }
};

/**
 * Get statistics about appeals
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with appeal statistics
 */
export const getAppealStats = async (req, res) => {
  try {
    if (!["admin", "moderator"].includes(req.user.role)) {
      return sendErrorResponse(null, "Không có quyền xem thống kê kháng cáo", res, 403);
    }

    const stats = await Appeal.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { status: 1 },
      },
    ]);

    const userStats = await Appeal.aggregate([
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          username: "$user.username",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: stats,
        byUser: userStats,
      },
    });
  } catch (error) {
    const message = "Lỗi khi lấy thống kê kháng cáo";
    return sendErrorResponse(error, message, res, 500);
  }
};

/**
 * Modified submitAppeal to limit the number of appeals
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
    }).or("novelId", "chapterId");

    const { error } = schema.validate({ novelId, chapterId, actionType, reason });
    if (error) {
      return sendErrorResponse(null, error.details[0].message, res, 400);
    }

    const appealCount = await Appeal.countDocuments({
      userId: req.user._id,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // 7 ngày
    });
    if (appealCount >= 5) {
      return sendErrorResponse(
        null,
        "Bạn đã vượt quá giới hạn 5 kháng cáo trong tuần",
        res,
        429
      );
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
 * Automatically handle expired appeals (cron job)
 * @async
 * @description Runs daily to reject or delete appeals older than 30 days
 */
export const handleExpiredAppeals = () => {
  cron.schedule("0 0 * * *", async () => {
    // Chạy lúc 00:00 hàng ngày
    try {
      await withTransaction(async (session) => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const expiredAppeals = await Appeal.find({
          status: "pending",
          createdAt: { $lte: thirtyDaysAgo },
        });

        for (const appeal of expiredAppeals) {
          appeal.status = "rejected";
          await appeal.save({ session });

          const result = await moderationActionHandler({
            action: MODERATION_ACTIONS.notice,
            novelId: appeal.novelId,
            chapterId: appeal.chapterId,
            moderatorId: await getSystemUserId(),
            recipientId: appeal.userId,
            message: `Kháng cáo của bạn cho hành động ${appeal.actionType} đã bị từ chối do quá hạn 30 ngày`,
            logNote: `Tự động từ chối kháng cáo ${appeal._id} do hết hạn`,
            details: { reason: "Hết hạn xử lý" },
          });

          if (!result.success) throw new Error(result.message);
        }

        await session.commitTransaction();
        console.log(`Processed ${expiredAppeals.length} expired appeals`);
      });
    } catch (error) {
      console.error("Error handling expired appeals:", error);
    }
  });
};
export const getAllAppeals = async (req, res) => {
  //TODO: get all appeals
}
export const getAppealById = async (req, res) => {
  //TODO: get appeal by id
}
export const approveAppeal = async (req, res) => {
  //TODO: approve appeals
}
export const rejectAppeal = async (req, res) => {
  //TODO: reject appeals
}
export const deleteAppealById = async (req, res) => {
  //TODO: deleted appeal by id
}

// Khởi chạy cron job
handleExpiredAppeals();