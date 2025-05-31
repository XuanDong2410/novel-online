import express from 'express';
import { isModerator } from '../../middleware/isAdmin.js';
import { protectRoute } from '../../middleware/protectRoute.js';
import { 
    getPendingNovels,
    getNovelWithChapters,
    getChapterDetails,
    approveNovelAndChapters,
    requestChapterEdit,
    warnChapterViolation,
} from '../../controllers/moderator/novel.moderator.controller.js';

const router = express.Router();

router.use(protectRoute, isModerator);
router.get('/', getPendingNovels);
router.get('/:id', getNovelWithChapters);
router.get('/:id/chapters/:chapterId', getChapterDetails);
router.post('/:id/approve', approveNovelAndChapters);
router.post('/:id/chapters/:chapterId/edit', requestChapterEdit);
router.post('/:id/chapters/:chapterId/warn', warnChapterViolation);
// router.post('/:id/chapters/:chapterId/flag', flagChapter);

export default router;
