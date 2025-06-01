import express from 'express';
import { 
    getPendingNovels,
    getNovelWithChapters,
    approveNovelAndChapters,
    rejectNovel,
    toggleHideNovel
} from '../../controllers/moderator/novel.moderator.controller.js';

const router = express.Router();

router.get('/', getPendingNovels);
router.get('/:id', getNovelWithChapters);
router.post('/:id/approve', approveNovelAndChapters);
router.post('/:id/reject', rejectNovel);
router.patch('/:id/hide-toggle', toggleHideNovel);


export default router;
