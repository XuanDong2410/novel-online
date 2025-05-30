
import Report from "../../models/report.model.js";
import Notification from "../../models/notification.model.js";
// GET /api/v1/report
// Lấy danh sách report đang chờ xử lý (status = "pending")
export const getPendingReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: "pending" })
      .populate("reporter", "username")
      .populate("moderator", "username")
      .sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    console.error("Get pending reports error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Lấy danh sách report đã xử lý (status = "reviewed" hoặc "rejected")
export const getHandledReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: { $in: ["reviewed", "rejected"] } })
      .populate("reporter", "username")
      .populate("moderator", "username")
      .sort({ handledAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    console.error("Get handled reports error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/v1/report/:reportId
export const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    if (!reportId) {
      return res.status(400).json({ message: "Report ID is required" });
    }

    const report = await Report.findById(reportId)
      .populate("reporter", "username")
      .populate("moderator", "username")
      .populate("targetId");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.json({ success: true, report });
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/v1/report/:reportId/handle
export const handleReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, note } = req.body; // status: reviewed | rejected
    const moderatorId = req.user._id;

    if (!["reviewed", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    report.status = status;
    report.note = note;
    report.moderator = moderatorId;
    report.handledAt = new Date();

    await report.save();

    if (status === "reviewed") {
      if (report.targetType === "novel") {
        await Novel.findByIdAndUpdate(report.targetId, { isHidden: true });
      }
      if (report.targetType === "rate") {
        await Rate.findByIdAndDelete(report.targetId);
      }
    }

    // Tạo notification
    await Notification.create({
      from: moderatorId,
      to: report.reporter,
      type: "report",
      message: `Báo cáo của bạn đã được xử lý với trạng thái: ${status.toUpperCase()}. Ghi chú: ${note || "Không có"}.`
    });


    res.json({ success: true, message: "Report handled", report });
  } catch (error) {
    console.error("Handle report error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};