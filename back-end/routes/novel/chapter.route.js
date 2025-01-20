import express from 'express';
import { createChapter, getAllChaptersByNovel, getChapterByNovel, deleteChapter } from '../../controllers/novel/chapter.controller.js';
const router = express.Router();

router.post('/create', createChapter);
router.get('/:novel', getAllChaptersByNovel);
router.get('/:novel/chapters/:chapter', getChapterByNovel);
router.delete('/:chapter', deleteChapter);
export default router;