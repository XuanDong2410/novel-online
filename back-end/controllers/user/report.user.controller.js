import Report from "../../models/report.model.js";
import User from "../../models/user.model.js";
import Novel from "../../models/novel.model.js";
export const createReport = async (req, res) => {
  try {
    const reporterId = req.user._id;
    const { targetType, targetId, reason, description } = req.body;

    // Kiểm tra targetType hợp lệ
    if (!["Rate", "Novel", "Chapter"].includes(targetType)) {
      return res.status(400).json({ message: "Invalid targetType" });
    }

    // Giới hạn số báo cáo tối đa 3 trong 1 giờ cho user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentReportsCount = await Report.countDocuments({
      reporter: reporterId,
      createdAt: { $gte: oneHourAgo }
    });

    if (recentReportsCount >= 3) {
      return res.status(429).json({ message: "You can only send up to 3 reports per hour." });
    }

    // Tạo báo cáo mới
    const newReport = await Report.create({
      reporter: reporterId,
      targetType,
      targetId,
      reason,
      description,
      status: "pending",
      read: false
    });
    // Cập nhật user reportsMade
    await User.findByIdAndUpdate(reporterId, { $push: { reportsMade: newReport._id } });

    // Nếu targetType là Novel thì cập nhật vào novel.reports
    if (targetType === "Novel") {
      await Novel.findByIdAndUpdate(targetId, { $push: { reports: newReport._id } });
    }

    return res.status(201).json({ success: true, message: "Report submitted", report: newReport });

  } catch (err) {
    console.error("Create report error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Lấy danh sách báo cáo của user hiện tại
export const getMyReports = async (req, res) => {
  try {
    const userId = req.user._id;

    // Nếu muốn hỗ trợ phân trang, có thể lấy page & limit từ query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalReports = await Report.countDocuments({ reporter: userId });
    const reports = await Report.find({ reporter: userId })
      .populate("targetId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      totalReports,
      page,
      totalPages: Math.ceil(totalReports / limit),
      reports,
    });
  } catch (error) {
    console.error("Get my reports error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteUnreadReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user._id;

    // Tìm report theo id và chưa được đọc (read: false)
    const report = await Report.findOne({ _id: reportId, read: false });

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found or already processed" });
    }

    await report.deleteOne();

    return res.json({ success: true, message: "Report deleted successfully" });

  } catch (err) {
    console.error("Delete unread report error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
// Xoá các report đã xử lý (status: reviewed hoặc rejected)
export const deleteHandledReports = async (req, res) => {
  try {
    const result = await Report.deleteMany({
      status: { $in: ["reviewed", "rejected"] }
    });

    return res.json({ 
      success: true, 
      message: `${result.deletedCount} handled reports have been deleted.` 
    });
  } catch (error) {
    console.error("Delete handled reports error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};