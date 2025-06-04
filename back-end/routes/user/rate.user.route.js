import express from "express";
import { 
    createOrUpdateRate, 
    deleteRate, 
    getRatesByNovel
} from "../../controllers/user/rate.user.controller.js";

const router = express.Router();

router.get('/:novelId', getRatesByNovel);
router.post('/:novelId', createOrUpdateRate);
router.delete("/:novelId", deleteRate);   

export default router;
