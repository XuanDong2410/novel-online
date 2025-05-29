import express from "express";
import { protectRoute } from '../../middleware/protectRoute.js';
import {
  toggleFavoriteNovel,
  getUsersWhoFavoriteNovel
} from "../../controllers/user/novel.user.controller.js";


const router = express.Router();

router.use(protectRoute);
router.put("/favorite/:novelId", protectRoute, toggleFavoriteNovel);
router.get("/:novelId/favoriteUsers", protectRoute, getUsersWhoFavoriteNovel);

export default router;