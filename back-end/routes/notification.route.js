import express from 'express'
import { protectRoute} from '../middleware/protectRoute.js'
import { 
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotifications, 
    deleteNotification } from '../controllers/notification.controller.js'
const router = express.Router()

router.get('/', protectRoute, getNotifications)
router.patch('/:id/read', protectRoute, markNotificationRead)
router.patch('/readAll', protectRoute, markAllNotificationsRead)
router.delete('/', protectRoute, deleteNotifications)
router.delete('/:id', protectRoute, deleteNotification)
    
export default router