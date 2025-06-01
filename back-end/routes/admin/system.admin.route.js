import express from 'express';
import {
  // Notification & info
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  listAnnouncements,

  // Tag & category
  createTag,
  updateTag,
  deleteTag,
  listTags,

  createCategory,
  updateCategory,
  deleteCategory,
  listCategories,

  // Thống kê tổng quan
  getSystemStatistics,

  // Các nghiệp vụ khác
  performSystemAction,
} from '../../controllers/admin/system.admin.controller.js';

const router = express.Router();

// Thông báo, nội quy, thông tin chung
router.post('/announcements', createAnnouncement);
router.patch('/announcements/:id', updateAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);
router.get('/announcements', listAnnouncements);

// Tag
router.post('/tags', createTag);
router.patch('/tags/:id', updateTag);
router.delete('/tags/:id', deleteTag);
router.get('/tags', listTags);

// Category
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);
router.get('/categories', listCategories);

// Thống kê hệ thống
router.get('/statistics', getSystemStatistics);

// Các nghiệp vụ khác, ví dụ reset cache, tái tạo chỉ mục, v.v...
router.post('/actions', performSystemAction);

export default router;
