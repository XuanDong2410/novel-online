import mongoose from 'mongoose';
import Appeal from '../../models/appeal.model.js';
import User from '../../models/user.model.js';
import Novel from '../../models/novel.model.js';
import Chapter from '../../models/chapter.model.js';
import { mongooseSchemaToValidatorRules, validateInputWithSchema } from '../../utils/validator.js';
import { MODERATION_ACTIONS } from '../../utils/moderation/constants/action.js';
import { moderationActionHandler } from '../../utils/moderation/moderationActionHandler.js';

// Convert Mongoose schema to validation rules for Appeal
const appealSchemaRules = mongooseSchemaToValidatorRules(Appeal.schema);
appealSchemaRules.responseMessage.crossValidate = (data) => {
  if (!data.responseMessage) return true;
  return data.responseMessage.length <= 2000 ? true : 'Response message must not exceed 2000 characters';
};

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
 * Validates appeal existence and status
 * @param {Object} appeal - Appeal document
 * @param {string[]} allowedStatuses - Allowed status values
 * @returns {Object} - { valid: boolean, message: string }
 */
function validateAppeal(appeal, allowedStatuses = []) {
  if (!appeal) {
    return { valid: false, message: 'Kháng cáo không tồn tại' };
  }
  if (allowedStatuses.length && !allowedStatuses.includes(appeal.status)) {
    return { valid: false, message: `Kháng cáo không ở trạng thái cho phép: ${allowedStatuses.join(', ')}` };
  }
  return { valid: true, message: '' };
}

/**
 * Retrieves all appeals
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with all appeals
 */
export const getAllAppeals = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const appeals = await Appeal.find({})
      .populate('userId', 'username')
      .populate('novelId', 'title')
      .populate('chapterId', 'title')
      .populate('handledBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách kháng cáo thành công',
      data: appeals,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi server khi lấy danh sách kháng cáo', res, 500);
  }
};

/**
 * Retrieves a specific appeal by ID
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.appealId - Appeal ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with appeal details
 */
export const getAppealById = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const appealId = await validateId(req.params.appealId, res);
    if (!appealId) return;

    const appeal = await Appeal.findById(appealId)
      .populate('userId', 'username')
      .populate('novelId', 'title')
      .populate('chapterId', 'title')
      .populate('handledBy', 'username')
      .lean();
    const appealCheck = validateAppeal(appeal);
    if (!appealCheck.valid) {
      return sendErrorResponse(null, appealCheck.message, res, 404);
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy kháng cáo thành công',
      data: appeal,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi server khi xem chi tiết kháng cáo', res, 500);
  }
};

/**
 * Approves an appeal
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.appealId - Appeal ID
 * @param {Object} req.body - Request body with responseMessage
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming approval
 */
export const approveAppeal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Validate admin permissions
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const appealId = await validateId(req.params.appealId, res);
    if (!appealId) return;

    const { responseMessage } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { responseMessage },
      {},
      { responseMessage: appealSchemaRules.responseMessage }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Fetch and validate appeal
    const appeal = await Appeal.findById(appealId).session(session);
    const appealCheck = validateAppeal(appeal, ['pending']);
    if (!appealCheck.valid) {
      return sendErrorResponse(null, appealCheck.message, res, 400);
    }

    // Update appeal status
    const updateData = {
      status: 'approved',
      responseMessage: responseMessage?.trim(),
      handledBy: req.user._id,
      handledAt: new Date(),
      updatedAt: new Date(),
    };

    await Appeal.findByIdAndUpdate(appealId, { $set: updateData }, { session });

    // Update related novel or chapter based on actionType
    if (appeal.novelId && ['reject', 'warning', 'flag', 'hide'].includes(appeal.actionType)) {
      const novelUpdate = {
        ...(appeal.actionType === 'reject' && { statusPublish: 'approved' }),
        ...(appeal.actionType === 'hide' && { isPublished: true }),
        updatedAt: new Date(),
      };
      await Novel.findByIdAndUpdate(appeal.novelId, { $set: novelUpdate }, { session });
    }
    if (appeal.chapterId && ['reject', 'warning', 'flag', 'hide'].includes(appeal.actionType)) {
      const chapterUpdate = {
        ...(appeal.actionType === 'reject' && { status: 'approved' }),
        ...(appeal.actionType === 'hide' && { isPublished: true }),
        updatedAt: new Date(),
      };
      await Chapter.findByIdAndUpdate(appeal.chapterId, { $set: chapterUpdate }, { session });
    }

    // Log moderation action
    const logData = {
      action: MODERATION_ACTIONS.approve,
      novelId: appeal.novelId,
      chapterId: appeal.chapterId,
      appealId: appeal._id,
      moderatorId: req.user._id,
      recipientId: appeal.userId,
      message: `Kháng cáo cho hành động ${appeal.actionType} đã được phê duyệt bởi ${req.user.username}`,
      logNote: `Phê duyệt kháng cáo ${appeal._id}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Kháng cáo đã được phê duyệt',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi phê duyệt kháng cáo', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Rejects an appeal
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.appealId - Appeal ID
 * @param {Object} req.body - Request body with responseMessage
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming rejection
 */
export const rejectAppeal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Validate admin permissions
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const appealId = await validateId(req.params.appealId, res);
    if (!appealId) return;

    const { responseMessage } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { responseMessage },
      {},
      { responseMessage: appealSchemaRules.responseMessage }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Fetch and validate appeal
    const appeal = await Appeal.findById(appealId).session(session);
    const appealCheck = validateAppeal(appeal, ['pending']);
    if (!appealCheck.valid) {
      return sendErrorResponse(null, appealCheck.message, res, 400);
    }

    // Update appeal status
    const updateData = {
      status: 'rejected',
      responseMessage: responseMessage?.trim(),
      handledBy: req.user._id,
      handledAt: new Date(),
      updatedAt: new Date(),
    };

    await Appeal.findByIdAndUpdate(appealId, { $set: updateData }, { session });

    // Log moderation action
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
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Kháng cáo đã bị từ chối',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi từ chối kháng cáo', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Deletes an appeal
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.appealId - Appeal ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteAppealById = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Validate admin permissions
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const appealId = await validateId(req.params.appealId, res);
    if (!appealId) return;

    // Fetch and validate appeal
    const appeal = await Appeal.findById(appealId).session(session);
    const appealCheck = validateAppeal(appeal);
    if (!appealCheck.valid) {
      return sendErrorResponse(null, appealCheck.message, res, 404);
    }

    // Update appeal status to deleted
    await Appeal.findByIdAndUpdate(
      appealId,
      { $set: { status: 'deleted', updatedAt: new Date() } },
      { session }
    );

    // Log moderation action
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
/**
 * Retrieves statistics for appeals
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with appeal statistics
 */
export const getAppealStats = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionCheck = validateAdminPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    // Aggregate statistics
    const stats = await Appeal.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id',
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
      message: 'Lấy thống kê kháng cáo thành công',
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy thống kê kháng cáo', res, 500);
  }
};