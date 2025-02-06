import express from 'express'
import {
    createAudio,
    getListAudioLanguage,
    deleteAllAudios
} from '../controllers/audio.controller.js'
const router = express.Router();

router.post('/create', createAudio)
// router.get("/", getAudio)
router.get('/language', getListAudioLanguage)
router.delete('/all', deleteAllAudios)
export default router;