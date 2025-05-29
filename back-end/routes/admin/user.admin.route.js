import express from 'express';
import { isAdmin } from '../../middleware/isAdmin.js';
import { protectRoute } from '../../middleware/protectRoute.js';

// Ví dụ: import các controller admin
import { 
    getAllUsers,
    getUserById,
    updateUserRoleById,
    toggleUserStatus,
    deleteUserById,
    getUserStatisticsById
 } from '../../controllers/admin/user.admin.controller.js';

const router = express.Router();

router.use(protectRoute, isAdmin);

router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);

router.get('/users/:id/statistics', getUserStatisticsById);

// API cập nhật vai trò người dùng
router.put('/users/:id/role', updateUserRoleById);

// API bật / tắt hoạt động người dùng
router.patch('/users/:id/active', toggleUserStatus);

// API xóa người dùng
router.delete('/users/:id', deleteUserById);

export default router;
