import express from "express";
import { addOrUpdateRate, getRatesByNovel, deleteRate } from "../../controllers/user/rate.user.controller.js";
import { protectRoute } from "../../middleware/protectRoute.js";

const router = express.Router();

router.post("/:novelId", protectRoute, addOrUpdateRate);                // POST /api/v1/user/rate
router.get("/:novelId", getRatesByNovel);              // GET  /api/v1/user/rate/:novelId
router.delete("/:novelId", protectRoute, deleteRate);   // DELETE /api/v1/user/rate/:novelId

export default router;
