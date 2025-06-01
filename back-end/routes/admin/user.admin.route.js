import express from 'express';

// Ví dụ: import các controller admin
import { 
    getAllUsers,
    getUserById,
    getUserActivityLogsById,
    updateUserRoleById,
    toggleUserStatus,
    toggleBanUser,
    deleteUserById,
    getUserStatisticsById
 } from '../../controllers/admin/user.admin.controller.js';

const router = express.Router();


router.get('/', getAllUsers);
router.get('/:id', getUserById);

router.get('/:id/activity-logs', getUserActivityLogsById);
router.get('/:id/statistics', getUserStatisticsById);

// API cập nhật vai trò người dùng
router.put('/:id/role', updateUserRoleById);

// API bật / tắt hoạt động người dùng
router.patch('/:id/active', toggleUserStatus);
router.patch('/:id/ban', toggleBanUser);
// API xóa người dùng
router.delete('/:id', deleteUserById);

export default router;
