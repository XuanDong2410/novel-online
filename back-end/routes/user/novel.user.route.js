import express from "express";
import { createNovel, requestPublish } from "../../controllers/user/novel.user.controller.js";
import { protectRoute } from "../../middleware/protectRoute.js";

const router = express.Router();

router.post("/create", protectRoute, createNovel);
router.post("/request-publish", protectRoute, requestPublish);
export default router;