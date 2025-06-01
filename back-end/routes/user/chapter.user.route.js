import express from "express";
import { 
    createChapter,
    viewMyChapters,
    viewMyChapterById,
    updateChapter,
    deleteChapter, 
    requestPublish,
    cancelRequestPublish,
    resubmitChapter,
    hideChapter,
} from "../../controllers/user/chapter.user.controller.js";

const router = express.Router();

router.post("/", createChapter);

router.get('/', viewMyChapters);
router.get('/:id', viewMyChapterById);

router.patch('/:id', updateChapter);

router.delete('/:id', deleteChapter);

router.post("/:id/request-publish", requestPublish);
router.patch("/:id/cancel-request", cancelRequestPublish);
router.patch("/:id/resubmit", resubmitChapter);

router.patch("/:id/hide", hideChapter);

export default router;