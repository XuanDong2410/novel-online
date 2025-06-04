/**
 * Controller for handling user report operations
 * @module ReportController
 */

import mongoose from "mongoose";
import Report from "../../models/report.model.js";
import User from "../../models/user.model.js";
import Novel from "../../models/novel.model.js";
import Rate from "../../models/rate.model.js";
import { sendErrorResponse } from "../../utils/sendErrorResponse.js";
import { validateInputWithSchema, mongooseSchemaToValidatorRules } from "../../utils/validator/inputValidator.js";
import { parsePagination, parseSort } from "../../utils/moderation/helper/pagination.js";
import { MODERATION_ACTIONS } from "../../utils/moderation/constants/action.js";
import { moderationActionHandler } from "../../utils/moderation/moderationActionHandler.js";
import Chapter from "../../models/chapter.model.js";

// Validation rules for Report
const reportSchemaRules = mongooseSchemaToValidatorRules(Report.schema);

/**
 * Handles target-specific logic for reports
 * @param {string} targetType - Type of target (Rate, Novel, Chapter)
 * @param {string} targetId - ID of target
 * @param {string} userId - ID of user performing action
 * @param {Object} session - MongoDB transaction session
 * @param {string} action - Action to perform (validate, addReport, removeReport)
 * @param {string} [reportId] - ID of report (for addReport, removeReport)
 * @returns {Promise<Object|void>} Target info or void
 * @throws {Error} If validation fails
 */
async function handleTarget(targetType, targetId, userId, session, action, reportId = null) {
  const targetConfig = {
    Rate: {
      model: Rate,
      select: "user novel",
      ownerField: "user",
      novelField: "novel",
    },
    Novel: {
      model: Novel,
      select: "createdBy",
      ownerField: "createdBy",
      novelField: "_id",
    },
    Chapter: {
      model: Chapter,
      select: "novelId",
      ownerField: null,
      novelField: "novelId",
    },
  };

  const config = targetConfig[targetType];
  if (!config) {
    throw new Error("Loại đối tượng không hợp lệ");
  }
  if (!config.model) {
    throw new Error(`${targetType} chưa được hỗ trợ`);
  }

  if (action === "validate") {
    const target = await config.model.findById(targetId).select(config.select).lean();
    if (!target) {
      throw new Error(`${targetType} không tồn tại`);
    }

    const novelId = target[config.novelField];
    const novel = await Novel.findById(novelId).select("createdBy title").lean();
    if (!novel) {
      throw new Error("Truyện không tồn tại");
    }
    // Ngăn tự báo cáo
    if (config.ownerField) {
      if (target[config.ownerField].toString() === userId.toString()) {
        throw new Error(`Không thể báo cáo ${targetType.toLowerCase()} của chính bạn`);
      }
    } else {
      // Đối với Chapter, kiểm tra createdBy của Novel
      if (novel.createdBy.toString() === userId.toString()) {
        throw new Error(`Không thể báo cáo chương của truyện do chính bạn tạo`);
      }
    }
    const recipientId = novel.createdBy;

    return { target, novelId, recipientId, novelTitle: novel.title };
  } else if (action === "addReport") {
    await config.model.findByIdAndUpdate(
      targetId,
      { $push: { reports: reportId } },
      { session }
    );
  } else if (action === "removeReport") {
    await config.model.findByIdAndUpdate(
      targetId,
      { $pull: { reports: reportId } },
      { session }
    );
  }
}

/**
 * Creates a report for a target (Rate, Novel, Chapter)
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body (targetType, targetId, reason)
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response
 */
export const createReport = async (req, res) => {
  let session;
  try {
    // Validate Content-Type
    if (!req.is("application/json")) {
      return sendErrorResponse(null, "Content-Type phải là application/json", res, 400);
    }

    const reporterId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(reporterId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }

    const { targetType, targetId, reason } = req.body;
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return sendErrorResponse(null, 'Target ID không hợp lệ', res, 400);
    }

    // Validate input
    const validationResult = validateInputWithSchema(
      { targetType, targetId, reason },
      {},
      {
        targetType: reportSchemaRules.targetType,
        targetId: { type: "string", required: true },
        reason: reportSchemaRules.reason,
      },
    );
    if (!validationResult.isValid) {
      return sendErrorResponse(null, JSON.stringify(validationResult.errors), res, 400);
    }
    // Check report limit
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentReportsCount = await Report.countDocuments({
      reporter: reporterId,
      createdAt: { $gte: oneHourAgo },
    });
    if (recentReportsCount >= 50) {
      return res.status(429).json({
        success: false,
        message: "Bạn chỉ có thể gửi tối đa 50 báo cáo mỗi giờ",
      });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    // Validate target
    let targetInfo;
    try {
      targetInfo = await handleTarget(targetType, targetId, reporterId, session, "validate");
    } catch (error) {
      await session.abortTransaction();
      return sendErrorResponse(error, error.message, res, 400);
    }

    const { novelId, recipientId, novelTitle } = targetInfo;
    // Create report
    const newReport = await Report.create(
      [{
        reporter: reporterId,
        targetType: targetType,
        targetId,
        reason,
        status: "pending",
      }],
      { session }
    );
    // Update reports
    await handleTarget(targetType, targetId, reporterId, session, "addReport", newReport[0]._id);
    await User.findByIdAndUpdate(
      reporterId,
      { $push: { reportsMade: newReport[0]._id } },
      { session }
    );
    // Log moderation action
    const logData = {
      action: MODERATION_ACTIONS.userNotice,
      novelId,
      moderatorId: reporterId,
      recipientId,
      message: `Người dùng ${req.user.username} đã báo cáo truyện ${novelTitle}`,
      logNote: `Báo cáo với lý do: ${reason}`,
      details: `${targetType}, ${targetId}, ${reason}`,
    };
    const moderationResult = await moderationActionHandler(logData, session);
    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }
    await session.commitTransaction();
    return res.status(201).json({
      success: true,
      message: "Báo cáo đã được gửi",
      data: newReport[0],
    });
  } catch (err) {
    console.error(`Create report error for ${targetType} ${targetId}:`, err.stack);
    if (session) await session.abortTransaction();
    return sendErrorResponse(err, "Lỗi khi gửi báo cáo", res, 500);
  } finally {
    if (session) session.endSession();
  }
};

/**
 * Retrieves reports made by the current user
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters (page, limit, sort, direction)
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Response object
 * @returns {Promise<Object>} JSON response with paginated reports
 */
export const getMyReports = async (req, res) => {
  try {
    const userId = req.user._id;

    // Parse pagination
    const pagination = parsePagination(req.query);
    if (!pagination.valid) {
      return sendErrorResponse(null, pagination.message, res, 400);
    }
    const { page, limit, skip } = pagination;

    // Parse sort
    const allowedSortFields = ["createdAt", "updatedAt", "targetType"];
    const sort = parseSort(req.query, "createdAt", allowedSortFields);

    // Query reports
    const [reports, totalDocs] = await Promise.all([
      Report.find({ reporter: userId })
        .populate({
          path: "targetId"
        })
        .select("targetType targetId reason createdAt updatedAt")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Report.countDocuments({ reporter: userId }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalDocs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách báo cáo thành công",
      data: {
        reports,
        pagination: {
          page,
          limit,
          totalDocs,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
      },
    });
  } catch (err) {
    console.error(`Get my reports error for user ${req.user._id}:`, err.stack);
    return sendErrorResponse(err, "Lỗi khi lấy danh sách báo cáo", res, 500);
  }
};

/**
 * Deletes a pending report made by the current user
 * @async
 * @param {Object} req - Express request object
 * @param {string} req.params.reportId - Report ID
 * @param {Object} req.user - Authenticated user
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} JSON response
 */
export const deleteReport = async (req, res) => {
  let session;
  try {
    const reportId = req.params.reportId;
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return sendErrorResponse(null, 'ID không hợp lệ', res, 400);
    }
    session = await mongoose.startSession();
    session.startTransaction();

    // Find and verify report
    const report = await Report.findOne({
      _id: reportId,
      reporter: userId,
      status: "pending",
    }).session(session);
    if (!report) {
      await session.abortTransaction();
      return sendErrorResponse(null, "Báo cáo không tồn tại hoặc đã được xử lý", res, 404);
    }

    // Remove report from target and user
    await handleTarget(report.targetType, report.targetId, userId, session, "removeReport", report._id);
    await User.findByIdAndUpdate(
      userId,
      { $pull: { reportsMade: report._id } },
      { session }
    );

    // Delete report
    await Report.deleteOne({ _id: reportId }, { session });

    // Log moderation action
    const novelId = report.targetType === "Novel"
      ? report.targetId : report.targetType === "Chapter" ?
        (await Chapter.findById(report.targetId).select("novelId")).novelId :
        (await Rate.findById(report.targetId).select("novel")).novel;
    const novel = await Novel.findById(novelId).select("title createdBy").lean();
    const logData = {
      action: MODERATION_ACTIONS.userNotice,
      novelId,
      moderatorId: userId,
      recipientId: novel.createdBy,
      message: `Người dùng ${req.user.username} đã xóa báo cáo ${report.targetType.toLowerCase()} cho truyện ${novel.title}`,
      logNote: "Xóa báo cáo chưa xử lý",
      details: { targetType: report.targetType, targetId: report.targetId },
    };
    const moderationResult = await moderationActionHandler(logData, session);
    if (!moderationResult.success) {
      throw new Error(moderationResult.message);
    }

    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Báo cáo đã được xóa",
    });
  } catch (err) {
    console.error(`Delete pending report error for report ${req.params.reportId}:`, err.stack);
    if (session) await session.abortTransaction();
    return sendErrorResponse(err, "Lỗi khi xóa báo cáo", res, 500);
  } finally {
    if (session) session.endSession();
  }
};