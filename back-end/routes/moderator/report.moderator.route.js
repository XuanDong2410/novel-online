import express from "express";
import {
  getPendingReports,
  getHandledReports,
  getReportById,
  handleReport
} from "../../controllers/moderator/report.moderator.controller.js";
import { isModerator } from '../../middleware/isAdmin.js';
import { protectRoute } from '../../middleware/protectRoute.js';

const router = express.Router();

// Mod lấy danh sách report
router.get("/", protectRoute, isModerator, getPendingReports); 
router.get("/handled", protectRoute, isModerator, getHandledReports); // Mod lấy danh sách report đã xử lý
router.get("/:reportId", protectRoute, isModerator, getReportById);  // Mod xem chi tiết
router.patch("/:reportId/handle", protectRoute, isModerator, handleReport); // Mod xử lý

export default router;
