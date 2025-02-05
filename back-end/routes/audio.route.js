import express from 'express'
import {
    createAudio,
    getListAudioLanguage
} from '../controllers/audio.controller.js'
const router = express.Router();

router.post('/create', createAudio)
// router.get("/", getAudio)
router.get('/language', getListAudioLanguage)

export default router;