/**
 * Controller for handling appeal-related operations
 * @module AppealAdminController
 */

import Appeal from "../../models/appeal.model.js";
import Novel from "../../models/novel.model.js";
import Chapter from "../../models/chapter.model.js";
import { validateDocument, validateId } from "../../utils/validator/unifiedValidator.js";
import { MODERATION_ACTIONS } from "../../utils/moderation/constants/action.js";
import { moderationActionHandler } from "../../utils/moderation/moderationActionHandler.js";
import { withTransaction } from "../../utils/moderation/helper/withTransaction.js";
import { sendErrorResponse } from "../../utils/sendErrorResponse.js";

// Validation schema for appeal response
const appealResponseSchema = {
  responseMessage: {
    type: "string",
    maxlength: 2000,
    required: false,
  },
};

/**
 * Validates admin/moderator permissions
 * @param {Object} user - Authenticated user
 * @returns {Object} - { valid: boolean, message: string }
 */
function validateAdminPermissions(user) {
  if (!["moderator", "admin"].includes(user.role)) {
    return { valid: false, message: "Không có quyền thực hiện hành động này" };
  }
  return { valid: true, message: "" };
}

/**
 * Retrieves all appeals
 * @async
 */
export const getAllAppeals = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const appeals = await Appeal.find({})
      .populate("userId", "username")
      .populate("novelId", "title")
      .populate("chapterId", "title")
      .populate("handledBy", "username")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách kháng cáo thành công",
      data: appeals,
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi server khi lấy danh sách kháng cáo", res, 500);
  }
};

/**
 * Retrieves a specific appeal by ID
 * @async
 */
export const getAppealById = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const appealId = validateId(req.params.appealId, res);
    if (!appealId) return;

    const appeal = await Appeal.findById(appealId)
      .populate("userId", "username")
      .populate("novelId", "title")
      .populate("chapterId", "title")
      .populate("handledBy", "username")
      .lean();

    const appealCheck = await validateDocument("Appeal", appeal);
    if (!appealCheck.valid) {
      return sendErrorResponse(null, appealCheck.message, res, 404);
    }

    return res.status(200).json({
      success: true,
      message: "Lấy kháng cáo thành công",
      data: appeal,
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi server khi xem chi tiết kháng cáo", res, 500);
  }
};

/**
 * Approves an appeal
 * @async
 */
export const approveAppeal = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const appealId = validateId(req.params.appealId, res);
    if (!appealId) return;
    const { note } = req.body;
    return await withTransaction(async (session) => {
      const appeal = await Appeal.findById(appealId).session(session);
      const appealCheck = await validateDocument("Appeal", appeal, {
        session,
        allowedStatuses: ["pending"],
      });
      if (!appealCheck.valid) {
        return sendErrorResponse(null, appealCheck.message, res, 400);
      }

      const updateData = {
        status: "approved",
        responseMessage: req.body.responseMessage?.trim(),
        handledBy: req.user._id,
        handledAt: new Date(),
        updatedAt: new Date(),
      };

      await Appeal.findByIdAndUpdate(appealId, { $set: updateData }, { session });

      if (appeal.novelId && ["reject", "warning", "flag", "hide"].includes(appeal.actionType)) {
        const novelUpdate = {
          ...(appeal.actionType === "reject" && { statusPublish: "approved" }),
          ...(appeal.actionType === "hide" && { isPublished: true }),
          updatedAt: new Date(),
        };
        await Novel.findByIdAndUpdate(appeal.novelId, { $set: novelUpdate }, { session });
      }
      if (appeal.chapterId && ["reject", "warning", "flag", "hide"].includes(appeal.actionType)) {
        const chapterUpdate = {
          ...(appeal.actionType === "reject" && { status: "approved" }),
          ...(appeal.actionType === "hide" && { isPublished: true }),
          updatedAt: new Date(),
        };
        await Chapter.findByIdAndUpdate(appeal.chapterId, { $set: chapterUpdate }, { session });
      }

      const logData = {
        action: MODERATION_ACTIONS.approve,
        novelId: appeal.novelId,
        chapterId: appeal.chapterId,
        appealId: appeal._id,
        moderatorId: req.user._id,
        recipientId: appeal.userId,
        message: `Kháng cáo cho hành động ${appeal.actionType} đã được phê duyệt bởi ${req.user.username}. ${note}`,
        logNote: `Phê duyệt kháng cáo ${appeal._id}: ${note}`,
      };
      const moderationResult = await moderationActionHandler(logData);

      if (!moderationResult.success) throw new Error(moderationResult.message);

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: "Kháng cáo đã được phê duyệt",
        data: updateData,
      });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi phê duyệt kháng cáo", res, 500);
  }
};

/**
 * Rejects an appeal
 * @async
 */
export const rejectAppeal = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const appealId = validateId(req.params.appealId, res);
    if (!appealId) return;

    return await withTransaction(async (session) => {
      const appeal = await Appeal.findById(appealId).session(session);
      const appealCheck = await validateDocument("Appeal", appeal, {
        session,
        allowedStatuses: ["pending"],
      });
      if (!appealCheck.valid) {
        return sendErrorResponse(null, appealCheck.message, res, 400);
      }

      const updateData = {
        status: "rejected",
        responseMessage: req.body.responseMessage?.trim(),
        handledBy: req.user._id,
        handledAt: new Date(),
        updatedAt: new Date(),
      };

      await Appeal.findByIdAndUpdate(appealId, { $set: updateData }, { session });

      const logData = {
        action: MODERATION_ACTIONS.reject,
        novelId: appeal.novelId,
        chapterId: appeal.chapterId,
        appealId: appeal._id,
        moderatorId: req.user._id,
        recipientId: appeal.userId,
        message: `Kháng cáo cho hành động ${appeal.actionType} đã bị từ chối bởi ${req.user.username}`,
        logNote: `Từ chối kháng cáo ${appeal._id}`,
      };
      const moderationResult = await moderationActionHandler(logData);

      if (!moderationResult.success) throw new Error(moderationResult.message);

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: "Kháng cáo đã bị từ chối",
        data: updateData,
      });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi từ chối kháng cáo", res, 500);
  }
};

/**
 * Deletes an appeal
 * @async
 */
export const deleteAppealById = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const appealId = validateId(req.params.appealId, res);
    if (!appealId) return;

    return await withTransaction(async (session) => {
      const appeal = await Appeal.findById(appealId).session(session);
      const appealCheck = await validateDocument("Appeal", appeal, { session });
      if (!appealCheck.valid) {
        return sendErrorResponse(null, appealCheck.message, res, 404);
      }

      await Appeal.findByIdAndUpdate(
        appealId,
        { $set: { status: "deleted", updatedAt: new Date() } },
        { session }
      );

      const logData = {
        action: MODERATION_ACTIONS.delete,
        novelId: appeal.novelId,
        chapterId: appeal.chapterId,
        appealId: appeal._id,
        moderatorId: req.user._id,
        recipientId: appeal.userId,
        message: `Kháng cáo cho hành động ${appeal.actionType} đã bị xóa bởi ${req.user.username}`,
        logNote: `Xóa kháng cáo ${appeal._id}`,
      };
      const moderationResult = await moderationActionHandler(logData);

      if (!moderationResult.success) throw new Error(moderationResult.message);

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: "Kháng cáo đã bị xóa",
      });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi xóa kháng cáo", res, 500);
  }
};

/**
 * Retrieves statistics for appeals
 * @async
 */
export const getAppealStats = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
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
    ]);

    const total = stats.reduce((acc, curr) => acc + curr.count, 0);
    const result = {
      total,
      byStatus: stats,
    };

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê kháng cáo thành công",
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi lấy thống kê kháng cáo", res, 500);
  }
};

