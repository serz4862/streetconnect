import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import 'express-async-errors';

const router = Router();

router.get('/', authenticate, (req, res) => notificationController.getNotifications(req, res));
router.put('/:id/read', authenticate, (req, res) => notificationController.markAsRead(req, res));
router.put('/mark-all-read', authenticate, (req, res) => notificationController.markAllAsRead(req, res));
router.delete('/:id', authenticate, (req, res) => notificationController.deleteNotification(req, res));
router.get('/unread-count', authenticate, (req, res) => notificationController.getUnreadCount(req, res));

export default router;
