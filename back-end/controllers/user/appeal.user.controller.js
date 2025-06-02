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
appealSchemaRules.novelId.crossValidate = async (data) => {
  if (!data.novelId) return true;
  const novel = await Novel.findById(data.novelId).lean();
  return novel ? true : 'Novel does not exist';
};
appealSchemaRules.chapterId.crossValidate = async (data) => {
  if (!data.chapterId) return true;
  const chapter = await Chapter.findById(data.chapterId).lean();
  return chapter ? true : 'Chapter does not exist';
};
appealSchemaRules.userId.crossValidate = async (data) => {
  if (!data.userId) return true;
  const user = await User.findById(data.userId).lean();
  return user ? true : 'User does not exist';
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
 * Validates appeal existence and permissions
 * @param {Object} appeal - Appeal document
 * @param {Object} user - Authenticated user
 * @param {string[]} allowedStatuses - Allowed status values
 * @returns {Object} - { valid: boolean, message: string }
 */
function validateAppeal(appeal, user, allowedStatuses = []) {
  if (!appeal) {
    return { valid: false, message: 'Kháng cáo không tồn tại' };
  }
  if (allowedStatuses.length && !allowedStatuses.includes(appeal.status)) {
    return { valid: false, message: `Kháng cáo không ở trạng thái cho phép: ${allowedStatuses.join(', ')}` };
  }
  if (appeal.userId.toString() !== user._id.toString() && !['moderator', 'admin'].includes(user.role)) {
    return { valid: false, message: 'Không có quyền thực hiện hành động này' };
  }
  return { valid: true, message: '' };
}

/**
 * Retrieves all appeals created by the authenticated user
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with appeals
 */
export const viewAllAppeals = async (req, res) => {
  try {
    const appeals = await Appeal.find({ userId: req.user._id })
      .populate('novelId', 'title')
      .populate('chapterId', 'title')
      .populate('handledBy', 'username')
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
 * @param {string} req.params.id - Appeal ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with appeal details
 */
export const viewAppeal = async (req, res) => {
  try {
    const appealId = await validateId(req.params.id, res);
    if (!appealId) return;

    const appeal = await Appeal.findById(appealId)
      .populate('novelId', 'title')
      .populate('chapterId', 'title')
      .populate('handledBy', 'username')
      .lean();
    const appealCheck = validateAppeal(appeal, req.user);
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
 * Creates a new appeal
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with created appeal
 */
export const createAppeal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { novelId, chapterId, actionType, reason } = req.body;
    const userId = req.user._id;

    // Validate input
    const validationResult = validateInputWithSchema(
      { userId, novelId, chapterId, actionType, reason },
      {},
      {
        userId: appealSchemaRules.userId,
        novelId: appealSchemaRules.novelId,
        chapterId: appealSchemaRules.chapterId,
        actionType: appealSchemaRules.actionType,
        reason: appealSchemaRules.reason,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Ensure either novelId or chapterId is provided
    if (!novelId && !chapterId) {
      return sendErrorResponse(null, 'Phải cung cấp novelId hoặc chapterId', res, 400);
    }

    // Validate ownership for novelId or chapterId
    if (novelId) {
      const novel = await Novel.findById(novelId).lean();
      if (!novel || novel.createdBy.toString() !== userId.toString()) {
        return sendErrorResponse(null, 'Truyện không tồn tại hoặc bạn không có quyền', res, 400);
      }
    }
    if (chapterId) {
      const chapter = await Chapter.findById(chapterId).lean();
      const novel = chapter ? await Novel.findById(chapter.novelId).lean() : null;
      if (!chapter || !novel || novel.createdBy.toString() !== userId.toString()) {
        return sendErrorResponse(null, 'Chương không tồn tại hoặc bạn không có quyền', res, 400);
      }
    }

    // Create new appeal
    const newAppeal = new Appeal({
      userId,
      novelId,
      chapterId,
      actionType,
      reason: reason.trim(),
      status: 'pending',
    });

    await newAppeal.save({ session });

    // Log moderation action
    const logData = {
      action: MODERATION_ACTIONS.notice,
      novelId,
      chapterId,
      appealId: newAppeal._id,
      moderatorId: req.user._id,
      recipientId: userId,
      message: `Kháng cáo mới đã được tạo bởi ${req.user.username} cho hành động ${actionType}`,
      logNote: `Tạo kháng cáo cho ${novelId ? 'truyện' : 'chương'} ${actionType}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: 'Kháng cáo đã được tạo thành công',
      data: newAppeal,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi server khi tạo kháng cáo', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Updates an appeal
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Appeal ID
 * @param {Object} req.body - Request body
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming update
 */
export const updateAppeal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const appealId = await validateId(req.params.id, res);
    if (!appealId) return;

    const { reason } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { reason },
      {},
      { reason: appealSchemaRules.reason }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Fetch and validate appeal
    const appeal = await Appeal.findById(appealId).session(session);
    const appealCheck = validateAppeal(appeal, req.user, ['pending']);
    if (!appealCheck.valid) {
      return sendErrorResponse(null, appealCheck.message, res, 400);
    }

    // Update appeal
    const updateData = {
      reason: reason.trim(),
      updatedAt: new Date(),
    };

    await Appeal.findByIdAndUpdate(appealId, { $set: updateData }, { session });

    // Log moderation action
    const logData = {
      action: MODERATION_ACTIONS.notice,
      novelId: appeal.novelId,
      chapterId: appeal.chapterId,
      appealId: appeal._id,
      moderatorId: req.user._id,
      recipientId: appeal.userId,
      message: `Kháng cáo cho hành động ${appeal.actionType} đã được cập nhật bởi ${req.user.username}`,
      logNote: `Cập nhật kháng cáo ${appeal._id}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: 'Kháng cáo đã được cập nhật',
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi cập nhật kháng cáo', res, 500);
  } finally {
    session.endSession();
  }
};

/**
 * Deletes an appeal
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.id - Appeal ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming deletion
 */
export const deleteAppeal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const appealId = await validateId(req.params.id, res);
    if (!appealId) return;

    // Fetch and validate appeal
    const appeal = await Appeal.findById(appealId).session(session);
    const appealCheck = validateAppeal(appeal, req.user, ['pending', 'rejected']);
    if (!appealCheck.valid) {
      return sendErrorResponse(null, appealCheck.message, res, 400);
    }

    // Update status to deleted
    await Appeal.findByIdAndUpdate(
      appealId,
      { $set: { status: 'deleted', updatedAt: new Date() } },
      { session }
    );

    // Log moderation action
    const logData = {
      action: MODERATION_ACTIONS.notice,
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