import mongoose from 'mongoose';
import ModerationLog from '../../models/log.model.js';
import { validateInputWithSchema, mongooseSchemaToValidatorRules } from '../../utils/validator/inputValidator.js';
import { MODERATION_ACTIONS } from '../../utils/moderation/constants/action.js';
import { moderationActionHandler } from '../../utils/moderation/moderationActionHandler.js';

/**
 * Sends standardized error response
 * @param {Error|null} error - Error object, if any
 * @param {string} message - Error message
 * @param {Object} res - Express response object
 * @param {number} status - HTTP status code
 */
function sendErrorResponse(error, message, res, status) {
  return res.status(status).json({
    success: false,
    message,
    error: error ? error.message : undefined,
  });
}

/**
 * Validates ObjectId and returns it if valid
 * @param {string} id - ObjectId to validate
 * @param {Object} res - Express response object
 * @returns {string|null} Valid ObjectId or null if invalid
 */
async function validateId(id, res) {
  const validationResult = validateInputWithSchema({ id }, {}, { id: { type: 'objectid', required: true } });
  if (!validationResult.isValid) {
    sendErrorResponse(null, validationResult.errors.id[0], res, 400);
    return null;
  }
  return id;
}

/**
 * Validates admin/moderator permissions
 * @param {Object} user - Authenticated user
 * @returns {Object} - { valid: boolean, message: string }
 */
function validateAdminPermissions(user) {
  if (!['moderator', 'admin'].includes(user.role)) {
    return { valid: false, message: 'Không có quyền thực hiện hành động này' };
  }
  return { valid: true, message: '' };
}

/**
 * Validates moderation log existence
 * @param {Object} log - ModerationLog document
 * @returns {Object} - { valid: boolean, message: string }
 */
function validateModerationLog(log) {
  if (!log) {
    return { valid: false, message: 'Nhật ký kiểm duyệt không tồn tại' };
  }
  return { valid: true, message: '' };
}

/**
 * Retrieves all moderation logs
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with all moderation logs
 */
export const getAllModerationLogs = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const logs = await ModerationLog.find({})
      .populate('novelId', 'title')
      .populate('chapterId', 'title')
      .populate('moderator', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách nhật ký kiểm duyệt thành công',
      data: logs,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi server khi lấy danh sách nhật ký kiểm duyệt', res, 500);
  }
};

/**
 * Retrieves a specific moderation log by ID
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.logId - ModerationLog ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with moderation log details
 */
export const getModerationLogById = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const logId = await validateId(req.params.logId, res);
    if (!logId) return;

    const log = await ModerationLog.findById(logId)
      .populate('novelId', 'title')
      .populate('chapterId', 'title')
      .populate('moderator', 'username')
      .lean();
    const logCheck = validateModerationLog(log);
    if (!logCheck.valid) {
      return sendErrorResponse(null, logCheck.message, res, 404);
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy nhật ký kiểm duyệt thành công',
      data: log,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi server khi xem chi tiết nhật ký kiểm duyệt', res, 500);
  }
};

/**
 * Deletes a specific moderation log by ID
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.logId - ModerationLog ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteModerationLogById = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Validate admin permissions
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const logId = await validateId(req.params.logId, res);
    if (!logId) return;

    // Fetch and validate log
    const log = await ModerationLog.findById(logId).session(session);
    const logCheck = validateModerationLog(log);
    if (!logCheck.valid) {
      return sendErrorResponse(null, logCheck.message, res, 404);
    }

    // Delete log
    await ModerationLog.findByIdAndDelete(logId, { session });

    // Log moderation action (optional, as this is an admin action on logs)
    const logData = {
      action: MODERATION_ACTIONS.delete,
      novelId: log.novelId,
      chapterId: log.chapterId,
      moderatorId: req.user._id,
      recipientId: log.moderator,
      message: `Nhật ký kiểm duyệt cho hành động ${log.action} đã bị xóa bởi ${req.user.username}`,
      logNote: `Xóa nhật ký kiểm duyệt ${logId}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Nhật ký kiểm duyệt đã bị xóa',
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi xóa nhật ký kiểm duyệt', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Deletes all moderation logs
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteAllModerationLogs = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Validate admin permissions
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    // Delete all logs
    const result = await ModerationLog.deleteMany({}, { session });

    // Log moderation action (optional, as this is a bulk admin action)
    const logData = {
      action: MODERATION_ACTIONS.delete,
      moderatorId: req.user._id,
      message: `Tất cả nhật ký kiểm duyệt đã bị xóa bởi ${req.user.username}`,
      logNote: `Xóa toàn bộ nhật ký kiểm duyệt (${result.deletedCount} bản ghi)`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: `Đã xóa ${result.deletedCount} nhật ký kiểm duyệt`,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi xóa tất cả nhật ký kiểm duyệt', res, 500);
  } finally {
    session.endSession();
  }
};
/**
 * Retrieves statistics for moderation logs
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with moderation log statistics
 */
export const getModerationLogStats = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    // Aggregate statistics
    const stats = await ModerationLog.aggregate([
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          systemActions: { $sum: { $cond: ['$isSystemAction', 1, 0] } },
          manualActions: { $sum: { $cond: ['$isSystemAction', 0, 1] } },
        },
      },
      {
        $project: {
          action: '$_id',
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
      message: 'Lấy thống kê nhật ký kiểm duyệt thành công',
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy thống kê nhật ký kiểm duyệt', res, 500);
  }
};