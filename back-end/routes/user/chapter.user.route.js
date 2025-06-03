import express from "express";
import { 
    createChapter,
    viewMyChapters,
    viewMyChapterById,
    updateChapter,
    updateChapterMedia,
    deleteChapter, 
    requestPublish,
    cancelRequest,
    resubmitChapter,
    hideChapter,
    unhideChapter,
    getChapterStats
} from "../../controllers/user/chapter.user.controller.js";

const router = express.Router();

// CRUD Operations
router.post("/:novelId", createChapter);

router.get('/:novelId', viewMyChapters);
router.get('/chapter/:chapterId', viewMyChapterById);

router.patch('/chapter/:chapterId', updateChapter);
router.patch('/chapter/:chapterId/update-media', updateChapterMedia);
router.delete('/chapter/:chapterId', deleteChapter);

// Publishing Workflow
router.post("/chapter/:chapterId/request-publish", requestPublish);
router.patch("/chapter/:chapterId/cancel-request", cancelRequest);
router.patch("/chapter/:chapterId/resubmit", resubmitChapter);

// Visibility Control
router.patch("/chapter/:chapterId/hide", hideChapter);
router.patch('/chapter/:chapterId/unhide', unhideChapter);

// Statistics
router.get('/chapter/:chapterId/stats', getChapterStats);

export default router;