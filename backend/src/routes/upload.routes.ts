import { Router } from 'express';
import uploadController from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import 'express-async-errors';

const router = Router();

router.post('/signed-url', authenticate, uploadLimiter, (req, res) => uploadController.getSignedUploadUrl(req, res));

export default router;
