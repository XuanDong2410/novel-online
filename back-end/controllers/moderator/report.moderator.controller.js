import mongoose from 'mongoose';
import Report from '../../models/report.model.js';
import User from '../../models/user.model.js';
import Novel from '../../models/novel.model.js';
import Chapter from '../../models/chapter.model.js';
import Rate from '../../models/rate.model.js'; // Giả định có model Rate
import { validateInputWithSchema } from '../../utils/validator/inputValidator.js';
import { MODERATION_ACTIONS } from '../../utils/moderation/constants/action.js';
import { moderationActionHandler } from '../../utils/moderation/moderationActionHandler.js';

// Validation rules for Report schema
const reportSchemaRules = {
  note: {
    type: 'string',
    maxlength: 1000,
    required: false,
  },
  status: {
    type: 'string',
    enum: ['reviewed', 'rejected'],
    required: true,
  },
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
 * Validates moderator/admin permissions
 * @param {Object} user - Authenticated user
 * @returns {Object} - { valid: boolean, message: string }
 */
function validateModeratorPermissions(user) {
  if (!['moderator', 'admin'].includes(user.role)) {
    return { valid: false, message: 'Không có quyền thực hiện hành động này' };
  }
  return { valid: true, message: '' };
}

/**
 * Validates report existence and status
 * @param {Object} report - Report document
 * @param {string[]} allowedStatuses - Allowed status values
 * @returns {Object} - { valid: boolean, message: string }
 */
function validateReport(report, allowedStatuses = []) {
  if (!report) {
    return { valid: false, message: 'Báo cáo không tồn tại' };
  }
  if (allowedStatuses.length && !allowedStatuses.includes(report.status)) {
    return { valid: false, message: `Báo cáo không ở trạng thái cho phép: ${allowedStatuses.join(', ')}` };
  }
  return { valid: true, message: '' };
}

/**
 * Retrieves all pending reports
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with pending reports
 */
export const getPendingReports = async (req, res) => {
  try {
    // Validate moderator permissions
    const permissionCheck = validateModeratorPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const reports = await Report.find({ status: 'pending' })
      .populate('reporter', 'username')
      .populate('moderator', 'username')
      .populate({
        path: 'targetId',
        select: 'title', // Chỉ lấy title cho Novel/Chapter
        match: { targetType: { $in: ['Novel', 'Chapter'] } },
      })
      .populate({
        path: 'targetId',
        select: 'rating', // Giả định Rate có trường rating
        match: { targetType: 'Rate' },
      })
      .sort({ createdAt: 0 })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách báo cáo đang chờ duyệt thành công',
      data: reports,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi server khi lấy danh sách báo cáo', res, 500);
  }
};

/**
 * Retrieves all handled reports
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with handled reports
 */
export const getHandledReports = async (req, res) => {
  try {
    // Validate moderator permissions
    const permissionCheck = validateModeratorPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, 'Không có quyền thực hiện hành động này', res, 403);
    }

    const reports = await Report.find({ status: { $in: ['reviewed', 'rejected'] } })
      .populate('reporter', 'username')
      .populate('moderator', 'username')
      .populate({
        path: 'targetId',
        select: 'title',
        match: { targetType: { $in: ['Novel', 'Chapter'] } },
      })
      .populate({
        path: 'targetId',
        select: 'rating',
        match: { targetType: 'Rate' },
      })
      .sort({ handledAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách báo cáo đã xử lý thành công',
      data: reports,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi server khi lấy danh sách báo cáo đã xử lý', res, 500);
  }
};

/**
 * Retrieves a specific report by ID
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.reportId - Report ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with report details
 */
export const getReportById = async (req, res) => {
  try {
    // Validate moderator permissions
    const permissionCheck = validateModeratorPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const reportId = await validateId(req.params.reportId, res);
    if (!reportId) return;

    const report = await Report.findById(reportId)
      .populate('reporter', 'username')
      .populate('moderator', 'username')
      .populate({
        path: 'targetId',
        select: 'title',
        match: { targetType: { $in: ['Novel', 'Chapter'] } },
      })
      .populate({
        path: 'targetId',
        select: 'rating',
        match: { targetType: 'Rate' },
      })
      .lean();
    const reportCheck = validateReport(report);
    if (!reportCheck.valid) {
      return sendErrorResponse(null, reportCheck.message, res, 404);
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy báo cáo thành công',
      data: report,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi server khi xem chi tiết báo cáo', res, 500);
  }
};

/**
 * Handles a report (review or reject)
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.reportId - Report ID
 * @param {Object} req.body - Request body with status and note
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response confirming handling
 */
export const handleReport = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Validate moderator permissions
    const permissionCheck = validateModeratorPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const reportId = await validateId(req.params.reportId, res);
    if (!reportId) return;

    const { status, note } = req.body;

    // Validate input
    const validationResult = validateInputWithSchema(
      { status, note },
      {},
      {
        status: reportSchemaRules.status,
        note: reportSchemaRules.note,
      }
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }

    // Fetch and validate report
    const report = await Report.findById(reportId).session(session);
    const reportCheck = validateReport(report, ['pending']);
    if (!reportCheck.valid) {
      return sendErrorResponse(null, reportCheck.message, res, 400);
    }

    // Update report
    const updateData = {
      status,
      moderator: req.user._id,
      handledAt: new Date(),
      note: note?.trim(),
      updatedAt: new Date(),
    };

    await Report.findByIdAndUpdate(reportId, { $set: updateData }, { session });

    // Update target based on status
    if (status === 'reviewed') {
      if (report.targetType === 'Novel') {
        await Novel.findByIdAndUpdate(
          report.targetId,
          { 
            $set: { 
              'violation.modConfirmed': true,
              'violation.count': { $inc: 1 },
              isPublished: false,
              statusPublish: 'rejected',
              updatedAt: new Date()
            }
          },
          { session }
        );
      } else if (report.targetType === 'Chapter') {
        await Chapter.findByIdAndUpdate(
          report.targetId,
          { 
            $set: { 
              'violation.modConfirmed': true,
              'violation.count': { $inc: 1 },
              isPublished: false,
              status: 'rejected',
              updatedAt: new Date()
            }
          },
          { session }
        );
      } else if (report.targetType === 'Rate') {
        await Rate.findByIdAndUpdate(
          report.targetId,
          { $set: { isHidden: true, updatedAt: new Date() } }, // Giả định Rate có trường isHidden
          { session }
        );
      }
    }

    // Log moderation action
    const logData = {
      action: status === 'reviewed' ? MODERATION_ACTIONS.review : MODERATION_ACTIONS.reject,
      novelId: report.targetType === 'Novel' ? report.targetId : report.targetType === 'Chapter' ? (await Chapter.findById(report.targetId).lean()).novelId : null,
      chapterId: report.targetType === 'Chapter' ? report.targetId : null,
      moderatorId: req.user._id,
      recipientId: report.reporter,
      message: `Báo cáo cho ${report.targetType} đã được ${status === 'reviewed' ? 'xác nhận' : 'từ chối'} bởi ${req.user.username}`,
      logNote: `${status === 'reviewed' ? 'Xác nhận' : 'Từ chối'} báo cáo ${reportId}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);

    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: `Báo cáo đã được ${status === 'reviewed' ? 'xác nhận' : 'từ chối'}`,
      data: updateData,
    });
  } catch (error) {
    await session.abortTransaction();
    return sendErrorResponse(error, 'Lỗi khi xử lý báo cáo', res, 500);
  } finally {
    session.endSession();
  }
};
/**
 * Retrieves statistics for reports
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response with report statistics
 */
export const getReportStats = async (req, res) => {
  try {
    // Validate moderator permissions
    const permissionCheck = validateModeratorPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    // Aggregate statistics
    const stats = await Report.aggregate([
      {
        $group: {
          _id: { status: '$status', targetType: '$targetType' },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: '$_id.status',
          targetType: '$_id.targetType',
          count: 1,
          _id: 0,
        },
      },
    ]);

    const total = stats.reduce((acc, curr) => acc + curr.count, 0);
    const result = {
      total,
      byStatusAndType: stats,
    };

    return res.status(200).json({
      success: true,
      message: 'Lấy thống kê báo cáo thành công',
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(error, 'Lỗi khi lấy thống kê báo cáo', res, 500);
  }
};