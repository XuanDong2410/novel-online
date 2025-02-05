import express from 'express';
import { 
    createChapter, 
    updateChapter, 
    getAllChaptersByNovel, 
    getChapterByNovel, 
    deleteChapter, 
    getChapterById
} from '../../controllers/novel/chapter.controller.js';
const router = express.Router();

router.get('/:chapterId', getChapterById);

router.post('/create', createChapter);
router.put('/update/:chapter', updateChapter);
router.get('/:novel', getAllChaptersByNovel);
router.get('/:novel/chapters/:chapter', getChapterByNovel);
router.delete('/:chapter', deleteChapter);
export default router;