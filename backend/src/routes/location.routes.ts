import { Router } from 'express';
import locationController from '../controllers/location.controller';
import { authenticate } from '../middleware/auth';
import 'express-async-errors';

const router = Router();

router.get('/', authenticate, (req, res) => locationController.listLocations(req, res));
router.post('/', authenticate, (req, res) => locationController.saveLocation(req, res));
router.put('/:id', authenticate, (req, res) => locationController.updateLocation(req, res));
router.delete('/:id', authenticate, (req, res) => locationController.deleteLocation(req, res));
router.post('/:id/set-default', authenticate, (req, res) => locationController.setDefault(req, res));

export default router;
