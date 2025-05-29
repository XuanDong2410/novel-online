import express from 'express';
import { isModerator } from '../../middleware/isAdmin.js';
import { protectRoute } from '../../middleware/protectRoute.js';

// Ví dụ: import các controller admin
// import { getAllUsers, getSystemStats } from '../../controllers/admin.controller.js';

const router = express.Router();

router.use(protectRoute, isModerator);

// router.get('/users', getAllUsers);
// router.get('/stats', getSystemStats);

export default router;
