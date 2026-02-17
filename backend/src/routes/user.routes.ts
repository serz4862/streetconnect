import { Router } from 'express';
import userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import 'express-async-errors';

const router = Router();

router.get('/', authenticate, (req, res) => userController.getAllUsers(req, res));
router.get('/profile', authenticate, (req, res) => userController.getProfile(req, res));
router.put('/profile', authenticate, (req, res) => userController.updateProfile(req, res));
router.put('/role', authenticate, (req, res) => userController.updateRole(req, res));
router.post('/complete-onboarding', authenticate, (req, res) => userController.completeOnboarding(req, res));
router.get('/nearby', authenticate, (req, res) => userController.getNearbyUsers(req, res));
router.put('/location', authenticate, (req, res) => userController.updateLocation(req, res));
router.get('/:id', authenticate, (req, res) => userController.getUserById(req, res));

export default router;
