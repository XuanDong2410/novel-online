import express from 'express';
import {
    approveChapter,
    rejectChapter,
    warnChapter,
    requestEditChapter,
    warnChapterViolation,
    flagChapter
} from '../../controllers/moderator/chapter.moderator.controller.js';

const router = express.Router();

router.patch('/:chapterId/approve', approveChapter);
router.patch('/:chapterId/reject', rejectChapter);
router.patch('/:chapterId/edit', requestEditChapter);
router.patch('/:chapterId/warning', warnChapter);
router.post('/:chapterId/warnViolation', warnChapterViolation);
router.post('/:chapterId/flag', flagChapter);

export default router;
