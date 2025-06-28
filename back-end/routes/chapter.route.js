import express from 'express';
import { 
    updateChapter, 
    getChaptersByNovel,
    getChapterById,
    createDefaultAudio,
    createCustomAudio,
    previewAudioChapter,
    getVoices
} from '../controllers/chapter.controller.js';

const router = express.Router();

router.get('/voices', getVoices);
router.get('/:novel/chapters', getChaptersByNovel);
router.get('/:chapterId', getChapterById);
router.patch('/:chapterId', updateChapter);
router.post('/:chapterId/default', createDefaultAudio);
router.post('/:chapterId/custom', createCustomAudio);
router.post('/preview', previewAudioChapter);

export default router;