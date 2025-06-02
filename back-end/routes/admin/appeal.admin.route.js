import express from 'express';
import {
  getAllAppeals,
  getAppealById,
  approveAppeal,
  rejectAppeal,
  deleteAppealById,
  getAppealStats
} from "../../controllers/admin/appeal.admin.controller.js"
const router = express.Router();

router.get('/', getAllAppeals);
router.get('/:appealId', getAppealById);

router.patch('/:appealId/approve', approveAppeal);
router.patch('/:appealId/reject', rejectAppeal);

router.delete('/:appealId', deleteAppealById);
router.get('/stats', getAppealStats);
export default router;
