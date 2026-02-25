import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import dogRoutes from './dog.routes';
import feedRoutes from './feed.routes';
import reportRoutes from './report.routes';
import chatRoutes from './chat.routes';
import notificationRoutes from './notification.routes';
import uploadRoutes from './upload.routes';
import locationRoutes from './location.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/dogs', dogRoutes);
router.use('/feed', feedRoutes);
router.use('/reports', reportRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);
router.use('/locations', locationRoutes);

export default router;
