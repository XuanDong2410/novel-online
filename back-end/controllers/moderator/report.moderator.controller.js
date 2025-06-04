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
    required: true,
  },
  note: {
    type: "string",
    maxlength: 1000,
    required: false,
  },
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
        allowedStatuses: ["pending"],
      });
      if (!reportCheck.valid) {
        return sendErrorResponse(null, reportCheck.message, res, 400);
      }

      const updateData = {
        status: req.body.status,
        moderator: req.user._id,
        handledAt: new Date(),
        note: req.body.note?.trim(),
        updatedAt: new Date(),
      };

      await Report.findByIdAndUpdate(reportId, { $set: updateData }, { session });

      if (updateData.status === "reviewed") {
        if (report.targetType === "Novel") {
          await Novel.findByIdAndUpdate(
            report.targetId,
            {
              $set: {
                "violation.modConfirmed": true,
                "violation.count": { $inc: 1 },
                isPublished: false,
                statusPublish: "rejected",
                updatedAt: new Date(),
              },
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
                updatedAt: new Date(),
              },
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
        action: updateData.status === "reviewed" ? MODERATION_ACTIONS.review : MODERATION_ACTIONS.reject,
        novelId:
          report.targetType === "Novel"
            ? report.targetId
            : report.targetType === "Chapter"
            ? (await Chapter.findById(report.targetId).session(session)).novelId
            : null,
        chapterId: report.targetType === "Chapter" ? report.targetId : null,
        moderatorId: req.user._id,
        recipientId: report.reporter,
        message: `Báo cáo cho ${report.targetType} đã được ${updateData.status === "reviewed" ? "xác nhận" : "từ chối"} bởi ${req.user.username}`,
        logNote: `${updateData.status === "reviewed" ? "Xác nhận" : "Từ chối"} báo cáo ${reportId}`,
      };
      const moderationResult = await moderationActionHandler(logData);

      if (!moderationResult.success) throw new Error(moderationResult.message);

      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: `Báo cáo đã được ${updateData.status === "reviewed" ? "xác nhận" : "từ chối"}`,
        data: updateData,
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
