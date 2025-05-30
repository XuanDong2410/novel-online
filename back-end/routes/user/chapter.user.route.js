import express from "express";
import { createChapter } from "../../controllers/user/chapter.user.controller.js";
import { protectRoute } from "../../middleware/protectRoute.js";

const router = express.Router();

router.post("/create", protectRoute, createChapter);

export default router;