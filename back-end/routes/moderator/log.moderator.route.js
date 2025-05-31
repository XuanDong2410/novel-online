import express from 'express';
import { isModerator, isAdmin } from '../../middleware/isAdmin.js';
import { protectRoute } from '../../middleware/protectRoute.js';
import { 
    getAllModerationLogs,
    getModerationLogById,
    deleteModerationLogById,
    deleteAllModerationLogs
} from '../../controllers/moderator/log.moderator.controller.js';

const router = express.Router();

router.use(protectRoute, isModerator);

router.get('/', protectRoute, isModerator, getAllModerationLogs);
router.get('/:id', protectRoute, isModerator, getModerationLogById);
router.delete('/:id', protectRoute, isAdmin, deleteModerationLogById);
router.delete('/',protectRoute, isAdmin, deleteAllModerationLogs);

export default router;