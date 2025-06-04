/**
 * Controller for handling moderation log-related operations
 * @module LogAdminController
 */

import mongoose from "mongoose";
import ModerationLog from "../../models/log.model.js";
import { validateDocument, validateId } from "../../utils/validator/unifiedValidator.js";
import { MODERATION_ACTIONS } from "../../utils/moderation/constants/action.js";
import { moderationActionHandler } from "../../utils/moderation/moderationActionHandler.js";
import { withTransaction } from "../../utils/moderation/helper/withTransaction.js";
import { sendErrorResponse } from "../../utils/sendErrorResponse.js";

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
 * Retrieves all moderation logs
 * @async
 */
export const getAllModerationLogs = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const logs = await ModerationLog.find({})
      .populate("novelId", "title")
      .populate("chapterId", "title")
      .populate("moderator", "username")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách nhật ký kiểm duyệt thành công",
      data: logs,
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi server khi lấy danh sách nhật ký kiểm duyệt", res, 500);
  }
};

/**
 * Retrieves a specific moderation log by ID
 * @async
 */
export const getModerationLogById = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const logId = validateId(req.params.logId, res);
    if (!logId) return;

    const log = await ModerationLog.findById(logId)
      .populate("novelId", "title")
      .populate("chapterId", "title")
      .populate("moderator", "username")
      .lean();

    const logCheck = await validateDocument("ModerationLog", log);
    if (!logCheck.valid) {
      return sendErrorResponse(null, logCheck.message, res, 404);
    }

    return res.status(200).json({
      success: true,
      message: "Lấy nhật ký kiểm duyệt thành công",
      data: log,
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi server khi xem chi tiết nhật ký kiểm duyệt", res, 500);
  }
};

/**
 * Deletes a specific moderation log by ID
 * @async
 */
export const deleteModerationLogById = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const logId = validateId(req.params.logId, res);
    if (!logId) return;

    return await withTransaction(async (session) => {
      const log = await ModerationLog.findById(logId).session(session);
      const logCheck = await validateDocument("ModerationLog", log, { session });
      if (!logCheck.valid) {
        return sendErrorResponse(null, logCheck.message, res, 404);
      }

      await ModerationLog.findByIdAndDelete(logId, { session });

      const logData = {
        action: MODERATION_ACTIONS.delete,
        novelId: log.novelId,
        chapterId: log.chapterId,
        moderatorId: req.user._id,
        recipientId: log.moderator,
        message: `Nhật ký kiểm duyệt cho hành động ${log.action} đã bị xóa bởi ${req.user.username}`,
        logNote: `Xóa nhật ký kiểm duyệt ${logId}`,
      };
      const moderationResult = await moderationActionHandler(logData);

      if (!moderationResult.success) throw new Error(moderationResult.message);

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: "Nhật ký kiểm duyệt đã bị xóa",
      });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi xóa nhật ký kiểm duyệt", res, 500);
  }
};

/**
 * Deletes all moderation logs
 * @async
 */
export const deleteAllModerationLogs = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    return await withTransaction(async (session) => {
      const result = await ModerationLog.deleteMany({}, { session });

      const logData = {
        action: MODERATION_ACTIONS.delete,
        moderatorId: req.user._id,
        message: `Tất cả nhật ký kiểm duyệt đã bị xóa bởi ${req.user.username}`,
        logNote: `Xóa toàn bộ nhật ký kiểm duyệt (${result.deletedCount} bản ghi)`,
      };
      const moderationResult = await moderationActionHandler(logData);

      if (!moderationResult.success) throw new Error(moderationResult.message);

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: `Đã xóa ${result.deletedCount} nhật ký kiểm duyệt`,
        data: { deletedCount: result.deletedCount },
      });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi xóa tất cả nhật ký kiểm duyệt", res, 500);
  }
};

/**
 * Retrieves statistics for moderation logs
 * @async
 */
export const getModerationLogStats = async (req, res) => {
  try {
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const stats = await ModerationLog.aggregate([
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
          systemActions: { $sum: { $cond: ["$isSystemAction", 1, 0] } },
          manualActions: { $sum: { $cond: ["$isSystemAction", 0, 1] } },
        },
      },
      {
        $project: {
          action: "$_id",
          count: 1,
          systemActions: 1,
          manualActions: 1,
          _id: 0,
        },
      },
    ]);

    const total = stats.reduce((acc, curr) => acc + curr.count, 0);
    const result = {
      total,
      byAction: stats,
    };

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê nhật ký kiểm duyệt thành công",
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi lấy thống kê nhật ký kiểm duyệt", res, 500);
  }
};

