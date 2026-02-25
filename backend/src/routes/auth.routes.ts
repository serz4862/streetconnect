import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import 'express-async-errors';

const router = Router();

router.post('/send-otp', authLimiter, (req, res) => authController.sendOtp(req, res));
router.post('/phone-login', authLimiter, (req, res) => authController.phoneLogin(req, res));
router.post('/signup', authLimiter, (req, res) => authController.signup(req, res));
router.post('/login', authLimiter, (req, res) => authController.login(req, res));
router.post('/logout', authenticate, (req, res) => authController.logout(req, res));
router.post('/refresh-token', (req, res) => authController.refreshToken(req, res));

export default router;
