import express from 'express';
import { 
    getAllNovels, 
    getNovelById, 
    searchNovels
} from '../controllers/novel.controller.js';

const router = express.Router();

router.get("/", getAllNovels);
router.get("/:id", getNovelById);
router.get("/search", searchNovels);

export default router