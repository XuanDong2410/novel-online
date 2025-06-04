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

router.delete('/:appealId', deleteAppealById);
router.get('/stats', getAppealStats);

router.patch("/:appealId/approve", approveAppeal);
router.patch("/:appealId/reject", rejectAppeal);


export default router;