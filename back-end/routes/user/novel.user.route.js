import express from "express";
import { 
    createNovel,
    viewMyNovels,
    viewMyNovelById,
    updateNovel,
    updateNovelCover,
    deleteNovel, 
    requestPublish,
    requestEdit,
    cancelRequest,
    retractNovel,
    getNovelStats,
} from "../../controllers/user/novel.user.controller.js";

const router = express.Router();

router.post("/", createNovel);

router.get('/', viewMyNovels);
router.get('/:id', viewMyNovelById);

router.patch('/:id', updateNovel);
router.patch('/:id/cover', updateNovelCover);

router.delete('/:id', deleteNovel);

router.post("/:id/request-publish", requestPublish);
router.post("/:id/request-edit", requestEdit); 
router.patch("/:id/cancel-request", cancelRequest);
router.patch("/:id/resubmit", resubmitNovel);
router.patch("/:id/retract", retractNovel);

router.get('/:id/stats', getNovelStats);

export default router;