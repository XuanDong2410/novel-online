import express from 'express';
import {
  getMyProfile,
  updateProfile,
  updateAvatar,
  changePassword,
} from '../../controllers/user/profile.controller.js';

const router = express.Router();


router.get('/', getMyProfile);
router.patch('/', updateProfile);
router.put('/upload-avatar', updateAvatar);
router.put('/change-password', changePassword);

export default router;
