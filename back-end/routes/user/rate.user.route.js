import express from "express";
import { 
    createOrUpdateRate, 
    deleteRate 
} from "../../controllers/user/rate.user.controller.js";

const router = express.Router();

router.post('/:novelId', createOrUpdateRate);
router.delete("/:novelId", deleteRate);   

export default router;
