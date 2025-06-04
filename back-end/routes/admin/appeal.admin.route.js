import express from 'express';
import {
  getAllAppeals,
  getAppealById,
  approveAppeal,
  rejectAppeal,
  deleteAppealById,
  getAppealStats
} from "../../controllers/admin/appeal.admin.controller.js"
import { validate } from "../../utils/validator/unifiedValidator.js";
const router = express.Router();

router.get('/', getAllAppeals);
router.get('/:appealId', getAppealById);

// router.patch('/:appealId/approve', approveAppeal);
// router.patch('/:appealId/reject', rejectAppeal);

router.delete('/:appealId', deleteAppealById);
router.get('/stats', getAppealStats);

router.patch("/:appealId/approve", validate("appealResponse"), approveAppeal);
router.patch("/:appealId/reject", validate("appealResponse"), rejectAppeal);


export default router;