import express from 'express';
import { 
    getChapterDetails,
    approveChapter,
    rejectChapter,
    warnChapter,
    requestEditChapter,
    warnChapterViolation,
    flagChapter
} from '../../controllers/moderator/chapter.moderator.controller.js';

const router = express.Router();

router.get('/:chapterId', getChapterDetails);
router.patch('/:chapterId/approve', approveChapter);
router.patch('/:chapterId/reject', rejectChapter);
router.patch('/:chapterId/edit', requestEditChapter);
router.patch('/:chapterId/warning', warnChapter);
router.post('/:chapterId/warnViolation', warnChapterViolation);
router.post('/:chapterId/flag', flagChapter);

export default router;
