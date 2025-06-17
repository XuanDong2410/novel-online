import express from 'express';
import { 
    getAllModerationLogs,
    getModerationLogById,
    deleteModerationLogById,
    deleteAllModerationLogs,
    getModerationLogStats
} from '../../controllers/admin/log.admin.controller.js';

const router = express.Router();

router.get('/', getAllModerationLogs);
router.get('/stats', getModerationLogStats);
router.get('/:logId', getModerationLogById);
router.delete('/:logId', deleteModerationLogById);
router.delete('/', deleteAllModerationLogs);
export default router;