import express from 'express';
import { protectRoute } from '../../middleware/protectRoute.js';
import {
  getMyProfile,
  updateProfile,
  changePassword,
  getFavoriteNovels
} from '../../controllers/user/profile.controller.js';

const router = express.Router();

router.use(protectRoute);

router.get('/', getMyProfile);
router.put('/', updateProfile);
router.put('/changePassword', changePassword);

router.get("/favorites", protectRoute, getFavoriteNovels);
// router.get("/:novelId/favoriteUsers", protectRoute, getUsersWhoFavoriteNovel);

export default router;
