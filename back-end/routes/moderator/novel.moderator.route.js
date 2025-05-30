import express from 'express';
import { isModerator } from '../../middleware/isAdmin.js';
import { protectRoute } from '../../middleware/protectRoute.js';
import { moderateNovel } from '../../controllers/moderator/novel.moderator.controller.js';

const router = express.Router();

router.use(protectRoute, isModerator);
router.post('/:id/moderate', moderateNovel);
// router.get('/stats', getSystemStats);

export default router;
