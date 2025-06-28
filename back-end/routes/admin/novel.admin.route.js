// routes/admin/novel.admin.route.js
import express from 'express';
import {
    getAllNovelsForAdmin,
    updateNovelStatusByAdmin
    // ... các hàm admin khác
} from '../../controllers/admin/novel.admin.controller.js';

const router = express.Router();

router.get("/all", getAllNovelsForAdmin);
router.patch("/:id/status", updateNovelStatusByAdmin); 

export default router;