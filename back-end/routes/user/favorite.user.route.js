import express from "express";
import {
  toggleFavoriteNovel,
  viewFavoriteNovels
} from "../../controllers/user/favorite.user.controller.js";


const router = express.Router();

router.put("/:novelId", toggleFavoriteNovel);
router.get("/", viewFavoriteNovels);

export default router;