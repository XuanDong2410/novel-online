import express from 'express';
import { isAdmin } from '../../middleware/isAdmin.js';
import { protectRoute } from '../../middleware/protectRoute.js';

// Ví dụ: import các controller admin
import { getAllUsers } from '../../controllers/admin/admin.controller.js';

const router = express.Router();

router.use(protectRoute, isAdmin);

router.get('/users', getAllUsers);
// router.get('/stats', getSystemStats);

export default router;
