import express from "express";
import {
  getPendingReports,
  getHandledReports,
  getReportById,
  handleReport,
  getReportStats
} from "../../controllers/moderator/report.moderator.controller.js";

const router = express.Router();

// Mod lấy danh sách report
router.get("/", getPendingReports); 
router.get("/handled", getHandledReports); // Mod lấy danh sách report đã xử lý
router.get("/:reportId", getReportById);  // Mod xem chi tiết
router.patch("/:reportId/handle", handleReport); // Mod xử lý
router.get('/stats', getReportStats);

export default router;
