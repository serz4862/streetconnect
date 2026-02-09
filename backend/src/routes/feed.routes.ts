import { Router } from 'express';
import feedController from '../controllers/feed.controller';
import { authenticate } from '../middleware/auth';
import 'express-async-errors';

const router = Router();

router.post('/log', authenticate, (req, res) => feedController.logFeed(req, res));
router.get('/my-logs', authenticate, (req, res) => feedController.getMyFeedLogs(req, res));
router.get('/dog/:dogId', authenticate, (req, res) => feedController.getDogFeedHistory(req, res));
router.get('/unfed-dogs', authenticate, (req, res) => feedController.checkUnfedDogs(req, res));
router.post('/send-reminders', authenticate, (req, res) => feedController.sendFeedReminders(req, res));

export default router;
