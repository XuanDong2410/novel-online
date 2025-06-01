import express from 'express';
import { 
    viewAllMyModerationLogs,
    viewMyModerationLogDetailById
} from '../../controllers/moderator/log.moderator.controller.js';

const router = express.Router();

router.get('/', viewAllMyModerationLogs);
router.get('/:logId', viewMyModerationLogDetailById);

export default router;