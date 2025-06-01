import express from "express";
import {
    getMyReports,
    createReport,
    deleteReport
 } from "../../controllers/user/report.user.controller.js";

const router = express.Router();

router.get("/", getMyReports);
router.post("/", createReport);
router.delete("/:reportId", deleteReport);

export default router;
