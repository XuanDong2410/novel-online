/**
 * Controller for handling moderation log-related operations
 * @module LogAdminController
 */
import mongoose from "mongoose";
import ModerationLog from "../../models/log.model.js";
import { validateId } from "../../utils/validator/unifiedValidator.js";
import { MODERATION_ACTIONS } from "../../utils/moderation/constants/action.js";
import { moderationActionHandler } from "../../utils/moderation/moderationActionHandler.js";
import { withTransaction } from "../../utils/moderation/helper/withTransaction.js";
import { sendErrorResponse } from "../../utils/sendErrorResponse.js";
import { startOfDay, endOfDay } from 'date-fns'; // Sử dụng date-fns để xử lý ngày
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

    if (!log) {
      return sendErrorResponse(null, "Nhật ký kiểm duyệt không tồn tại", res, 404);
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

      await ModerationLog.findByIdAndDelete(logId, { session });

      if (!log.isSystemAction) {
        const logData = {
          action: MODERATION_ACTIONS.notice,
          novelId: log.novelId,
          chapterId: log.chapterId,
          moderatorId: req.user._id,
          recipientId: log.moderator,
          message: `Nhật ký kiểm duyệt cho hành động ${log.action} đã bị xóa bởi ${req.user.username}`,
          logNote: `Xóa nhật ký kiểm duyệt ${logId}`,
        };
        const moderationResult = await moderationActionHandler(logData);

        if (!moderationResult.success) throw new Error(moderationResult.message);
      }
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
      
      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: `Đã xóa ${result.deletedCount} nhật ký kiểm duyệt`,
        data: { deletedCount: result.deletedCount},
      });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi xóa tất cả nhật ký kiểm duyệt", res, 500);
  }
};

/**
 * Retrieves statistics for moderation logs
 * @async
 */ // Đường dẫn tới model

export const getModerationLogStats = async (req, res) => {
  try {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    
    const [actionStats, moderatorStats, totalLogs, todayLogs] = await Promise.all([
      ModerationLog.aggregate([
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
      ]),

      ModerationLog.aggregate([
        {
          $match: {
            isSystemAction: false,
            moderator: { $ne: null, $type: "objectId" },
          },
        },
        {
          $group: {
            _id: "$moderator",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: mongoose.model('User').collection.name, // Đảm bảo tên collection đúng
            localField: '_id',
            foreignField: '_id',
            as: 'moderator',
          },
        },
        {
          $unwind: {
            path: '$moderator',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            'moderator._id': { $exists: true },
          },
        },
        {
          $project: {
            moderator: {
              _id: '$moderator._id',
              username: '$moderator.username',
            },
            count: 1,
            _id: 0,
          },
        },
        {
          $sort: { count: -1 },
        },
        {
          $limit: 5,
        },
      ]),

      ModerationLog.countDocuments({}),
      ModerationLog.countDocuments({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),
    ]);

    const systemActions = actionStats.reduce((acc, curr) => acc + curr.systemActions, 0);
    const manualActions = actionStats.reduce((acc, curr) => acc + curr.manualActions, 0);

    const actionBreakdown = actionStats.reduce((acc, curr) => {
      acc[curr.action] = curr.count;
      return acc;
    }, {});

    const result = {
      totalLogs,
      todayLogs,
      systemActions,
      manualActions,
      actionBreakdown,
      moderatorStats: moderatorStats.filter(stat => stat.moderator),
    };

    return res.status(200).json({
      success: true,
      message: "Lấy thống kê nhật ký kiểm duyệt thành công",
      data: result,
    });
  } catch (error) {
    console.error('Error in getModerationLogStats:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thống kê nhật ký kiểm duyệt",
      error: error.message,
    });
  }
};