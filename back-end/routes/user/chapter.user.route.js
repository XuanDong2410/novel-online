import express from "express";
import { 
    createChapter,
    viewMyChapters,
    viewMyChapterById,
    updateChapter,
    updateChapterMedia,
    deleteChapter, 
    requestPublish,
    cancelRequestPublish,
    resubmitChapter,
    hideChapter,
    unhideChapter,
    getChapterStats
} from "../../controllers/user/chapter.user.controller.js";

const router = express.Router();

// CRUD Operations
router.post("/", createChapter);

router.get('/', viewMyChapters);
router.get('/:id', viewMyChapterById);

router.patch('/:id', updateChapter);
router.patch('/:id/update-media', updateChapterMedia);
router.delete('/:id', deleteChapter);

// Publishing Workflow
router.post("/:id/request-publish", requestPublish);
router.patch("/:id/cancel-request", cancelRequestPublish);
router.patch("/:id/resubmit", resubmitChapter);

// Visibility Control
router.patch("/:id/hide", hideChapter);
router.patch('/:id/unhide', unhideChapter);

// Statistics
router.get('/:id/stats', getChapterStats);

export default router;