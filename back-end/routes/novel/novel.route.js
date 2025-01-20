import express from 'express';
import { 
    createNovel, 
    getAllNovels, 
    updateNovel, 
    getNovelById, 
    deleteNovel 
} from '../../controllers/novel/novel.controller.js';

const router = express.Router();

router.post("/create", createNovel);
router.get("/", getAllNovels);
//router.get("/search", searchNovels);
router.get("/:id", getNovelById);
router.put("/:id", updateNovel);
router.delete("/:id", deleteNovel);

export default router