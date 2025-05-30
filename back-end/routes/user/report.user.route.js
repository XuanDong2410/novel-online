import express from "express";
import { protectRoute } from '../../middleware/protectRoute.js';
import {
    getMyReports,
    createReport,
    deleteUnreadReport,
    deleteHandledReports
 } from "../../controllers/user/report.user.controller.js";

const router = express.Router();

router.get("/", protectRoute, getMyReports);
router.post("/", protectRoute, createReport);

// Chỉ moderator hoặc admin mới được xóa report
router.delete("/:reportId", protectRoute, deleteUnreadReport);
router.delete("/handle/:reportId", protectRoute, deleteHandledReports);

export default router;
