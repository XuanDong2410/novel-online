/**
 * Controller for handling report moderation-related operations
 * @module ReportModeratorController
 */

import mongoose from "mongoose";
import Report from "../../models/report.model.js";
import User from "../../models/user.model.js";
import Novel from "../../models/novel.model.js";
import Chapter from "../../models/chapter.model.js";
import Rate from "../../models/rate.model.js";
import { validate, validateDocument, validateId } from "../../utils/validator/unifiedValidator.js";
import { MODERATION_ACTIONS } from "../../utils/moderation/constants/action.js";
import { moderationActionHandler } from "../../utils/moderation/moderationActionHandler.js";

// Validation schema for report handling

const reportHandleSchema = {
  status: {
    type: "string",
    enum: ["reviewed", "rejected"],
    required: true
  },
  note: {
    type: "string",
    maxlength: 1000,
    required: false
  },
  action: {
    type: "string",
    enum: ["approve", "reject", "flag", "hide", "warning"],
    required: false
  },
  severity: {
    type: "string",
    enum: ["low", "medium", "high", "critical"],
    required: false
  }
};
/**
 * Validates moderator/admin permissions
 * @param {Object} user - Authenticated user
 * @returns {Object} - { valid: boolean, message: string }
 */
function validateModeratorPermissions(user) {
  if (!["moderator", "admin"].includes(user.role)) {
    return { valid: false, message: "Không có quyền thực hiện hành động này" };
  }
  return { valid: true, message: "" };
}

/**
 * Retrieves all pending reports
 * @async
 */
export const getPendingReports = async (req, res) => {
  try {
    const permissionCheck = validateModeratorPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const reports = await Report.find({ status: "pending" })
      .populate("reporter", "username")
      .populate("moderator", "username")
      .populate({
        path: "targetId",
        select: "title",
        match: { targetType: { $in: ["Novel", "Chapter"] } },
      })
      .populate({
        path: "targetId",
        select: "rating",
        match: { targetType: "Rate" },
      })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách báo cáo đang chờ duyệt thành công",
      data: reports,
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi server khi lấy danh sách báo cáo", res, 500);
  }
};

/**
 * Retrieves all handled reports
 * @async
 */
export const getHandledReports = async (req, res) => {
  try {
    const permissionCheck = validateModeratorPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const reports = await Report.find({ status: { $in: ["reviewed", "rejected"] } })
      .populate("reporter", "username")
      .populate("moderator", "username")
      .populate({
        path: "targetId",
        select: "title",
        match: { targetType: { $in: ["Novel", "Chapter"] } },
      })
      .populate({
        path: "targetId",
        select: "rating",
        match: { targetType: "Rate" },
      })
      .sort({ handledAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách báo cáo đã xử lý thành công",
      data: reports,
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi server khi lấy danh sách báo cáo đã xử lý", res, 500);
  }
};

/**
 * Retrieves a specific report by ID
 * @async
 */
export const getReportById = async (req, res) => {
  try {
    const permissionCheck = validateModeratorPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const reportId = validateId(req.params.reportId, res);
    if (!reportId) return;

    const report = await Report.findById(reportId)
      .populate("reporter", "username")
      .populate("moderator", "username")
      .populate({
        path: "targetId",
        select: "title",
        match: { targetType: { $in: ["Novel", "Chapter"] } },
      })
      .populate({
        path: "targetId",
        select: "rating",
        match: { targetType: "Rate" },
      })
      .lean();

    const reportCheck = await validateDocument("Report", report);
    if (!reportCheck.valid) {
      return sendErrorResponse(null, reportCheck.message, res, 404);
    }

    return res.status(200).json({
      success: true,
      message: "Lấy báo cáo thành công",
      data: report,
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi server khi xem chi tiết báo cáo", res, 500);
  }
};

/**
 * Handles a report (review or reject)
 * @async
 */


export const handleReport = async (req, res) => {
  try {
    const permissionCheck = validateModeratorPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const reportId = validateId(req.params.reportId, res);
    if (!reportId) return;

    return await withTransaction(async (session) => {
      const report = await Report.findById(reportId).session(session);
      const reportCheck = await validateDocument("Report", report, {
        session,
        allowedStatuses: ["pending"]
      });
      if (!reportCheck.valid) {
        return sendErrorResponse(null, reportCheck.message, res, 400);
      }

      const { status, note, action, severity } = req.body;
      const updateData = {
        status,
        moderator: req.user._id,
        handledAt: new Date(),
        note: note?.trim(),
        updatedAt: new Date()
      };

      await Report.findByIdAndUpdate(reportId, { $set: updateData }, { session });

      if (status === "reviewed") {
        if (report.targetType === "Novel") {
          const update = {
            "violation.modConfirmed": true,
            "violation.count": { $inc: 1 },
            updatedAt: new Date()
          };
          if (action === "hide") update.isPublished = false;
          if (action === "reject") update.statusPublish = "rejected";
          if (action === "warning") update["violation.details"] = { severity, note };
          await Novel.findByIdAndUpdate(report.targetId, { $set: update }, { session });
        } else if (report.targetType === "Chapter") {
          const update = {
            "violation.modConfirmed": true,
            "violation.count": { $inc: 1 },
            updatedAt: new Date()
          };
          if (action === "hide") update.isPublished = false;
          if (action === "reject") update.status = "rejected";
          if (action === "warning") update["violation.details"] = { severity, note };
          await Chapter.findByIdAndUpdate(report.targetId, { $set: update }, { session });
        } else if (report.targetType === "Rate") {
          const update = { updatedAt: new Date() };
          if (action === "hide") update.isHidden = true;
          if (action === "warning") update["violation.details"] = { severity, note };
          await Rate.findByIdAndUpdate(report.targetId, { $set: update }, { session });
        }
      }

      const logData = {
        action: action || (status === "reviewed" ? MODERATION_ACTIONS.review : MODERATION_ACTIONS.reject),
        novelId: report.targetType === "Novel"
          ? report.targetId
          : report.targetType === "Chapter"
            ? (await Chapter.findById(report.targetId).session(session)).novelId
            : null,
        chapterId: report.targetType === "Chapter" ? report.targetId : null,
        moderatorId: req.user._id,
        recipientId: report.reporter,
        message: `Báo cáo cho ${report.targetType} đã được ${status === "reviewed" ? "xác nhận" : "từ chối"} bởi ${req.user.username}`,
        logNote: `${status === "reviewed" ? "Xác nhận" : "Từ chối"} báo cáo ${reportId}`,
        details: { action, severity }
      };
      const moderationResult = await moderationActionHandler(logData);
      if (!moderationResult.success) throw new Error(moderationResult.message);

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: `Báo cáo đã được ${status === "reviewed" ? "xác nhận" : "từ chối"}`,
        data: updateData
      });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi xử lý báo cáo", res, 500);
  }
};
/**
 * Retrieves statistics for reports
 * @async
 */
export const getReportStats = async (req, res) => {
  try {
    const permissionCheck = validateModeratorPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const stats = await Report.aggregate([
      {
        $group: {
          _id: { status: "$status", targetType: "$targetType" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id.status",
          targetType: "$_id.targetType",
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
      message: "Lấy thống kê báo cáo thành công",
      data: result,
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi lấy thống kê báo cáo", res, 500);
  }
};

// Router configuration

export const bulkHandleReports = async (req, res) => {
  try {
    const permissionCheck = validateModeratorPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const { reportIds, action, severity, note } = req.body;
    const validationResult = validate(bulkHandleSchema, req.body);
    if (!validationResult.valid) {
      return sendErrorResponse(null, validationResult.message, res, 400);
    }

    return await withTransaction(async (session) => {
      const reports = await Report.find({
        _id: { $in: reportIds },
        status: "pending"
      }).session(session);

      if (reports.length !== reportIds.length) {
        return sendErrorResponse(null, "Một số báo cáo không tồn tại hoặc đã được xử lý", res, 400);
      }

      const status = action === "approve_all" ? "reviewed" : "rejected";
      const updateData = {
        status,
        moderator: req.user._id,
        handledAt: new Date(),
        note: note?.trim(),
        updatedAt: new Date()
      };

      await Report.updateMany(
        { _id: { $in: reportIds } },
        { $set: updateData },
        { session }
      );

      for (const report of reports) {
        if (status === "reviewed") {
          if (report.targetType === "Novel") {
            await Novel.findByIdAndUpdate(
              report.targetId,
              {
                $set: {
                  "violation.modConfirmed": true,
                  "violation.count": { $inc: 1 },
                  isPublished: false,
                  statusPublish: "rejected",
                  updatedAt: new Date()
                }
              },
              { session }
            );
          } else if (report.targetType === "Chapter") {
            await Chapter.findByIdAndUpdate(
              report.targetId,
              {
                $set: {
                  "violation.modConfirmed": true,
                  "violation.count": { $inc: 1 },
                  isPublished: false,
                  status: "rejected",
                  updatedAt: new Date()
                }
              },
              { session }
            );
          } else if (report.targetType === "Rate") {
            await Rate.findByIdAndUpdate(
              report.targetId,
              { $set: { isHidden: true, updatedAt: new Date() } },
              { session }
            );
          }
        }

        const logData = {
          action: status === "reviewed" ? MODERATION_ACTIONS.review : MODERATION_ACTIONS.reject,
          novelId: report.targetType === "Novel"
            ? report.targetId
            : report.targetType === "Chapter"
              ? (await Chapter.findById(report.targetId).session(session)).novelId
              : null,
          chapterId: report.targetType === "Chapter" ? report.targetId : null,
          moderatorId: req.user._id,
          recipientId: report.reporter,
          message: `Báo cáo cho ${report.targetType} đã được ${status === "reviewed" ? "xác nhận" : "từ chối"} bởi ${req.user.username}`,
          logNote: `${status === "reviewed" ? "Xác nhận" : "Từ chối"} báo cáo ${report._id}`,
          details: { severity }
        };
        const moderationResult = await moderationActionHandler(logData);
        if (!moderationResult.success) throw new Error(moderationResult.message);
      }

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: `Đã xử lý ${reportIds.length} báo cáo`,
        data: { updatedCount: reportIds.length }
      });
    });
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi xử lý hàng loạt báo cáo", res, 500);
  }
};
import { Parser } from 'json2csv';

const exportReportsSchema = {
  status: {
    type: "string",
    enum: ["all", "pending", "reviewed", "rejected"],
    required: false
  },
  type: {
    type: "string",
    enum: ["all", "Rate", "Novel", "Chapter"],
    required: false
  },
  format: {
    type: "string",
    enum: ["csv", "json"],
    required: false,
    default: "csv"
  }
};

export const exportReports = async (req, res) => {
  try {
    const permissionCheck = validateModeratorPermissions(req.user);
    if (!permissionCheck.valid) {
      return sendErrorResponse(null, permissionCheck.message, res, 403);
    }

    const { status, type, format } = req.query;
    const validationResult = validate(exportReportsSchema, { status, type, format });
    if (!validationResult.valid) {
      return sendErrorResponse(null, validationResult.message, res, 400);
    }

    const query = {};
    if (status !== "all") query.status = status;
    if (type !== "all") query.targetType = type;

    const reports = await Report.find(query)
      .populate("reporter", "username email")
      .populate("moderator", "username")
      .populate({
        path: "targetId",
        select: "title",
        match: { targetType: { $in: ["Novel", "Chapter"] } }
      })
      .populate({
        path: "targetId",
        select: "rating",
        match: { targetType: "Rate" }
      })
      .lean();

    if (format === "json") {
      return res.status(200).json({
        success: true,
        message: "Xuất báo cáo thành công",
        data: reports
      });
    } else {
      const fields = [
        { label: 'Report ID', value: '_id' },
        { label: 'Reporter', value: 'reporter.username' },
        { label: 'Reporter Email', value: 'reporter.email' },
        { label: 'Target Type', value: 'targetType' },
        { label: 'Target Title', value: 'targetId.title' },
        { label: 'Target Rating', value: 'targetId.rating' },
        { label: 'Reason', value: 'reason' },
        { label: 'Status', value: 'status' },
        { label: 'Moderator', value: 'moderator.username' },
        { label: 'Handled At', value: 'handledAt' },
        { label: 'Note', value: 'note' },
        { label: 'Created At', value: 'createdAt' }
      ];
      const parser = new Parser({ fields });
      const csv = parser.parse(reports);
      res.header('Content-Type', 'text/csv');
      res.attachment('reports.csv');
      return res.send(csv);
    }
  } catch (error) {
    return sendErrorResponse(error, "Lỗi khi xuất báo cáo", res, 500);
  }
};