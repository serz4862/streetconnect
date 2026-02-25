import { Router } from 'express';
import dogController from '../controllers/dog.controller';
import { authenticate } from '../middleware/auth';
import 'express-async-errors';

const router = Router();

router.post('/validate-image', authenticate, (req, res) => dogController.validateImage(req, res));
router.post('/', authenticate, (req, res) => dogController.createDog(req, res));
router.get('/nearby', authenticate, (req, res) => dogController.getNearbyDogs(req, res));
router.get('/my-dogs', authenticate, (req, res) => dogController.getMyDogs(req, res));
router.get('/:id', authenticate, (req, res) => dogController.getDogById(req, res));
router.put('/:id', authenticate, (req, res) => dogController.updateDog(req, res));
router.delete('/:id', authenticate, (req, res) => dogController.deleteDog(req, res));
router.post('/scan-qr', authenticate, (req, res) => dogController.scanQRCode(req, res));
router.post('/:id/caretaker', authenticate, (req, res) => dogController.addCaretaker(req, res));
router.get('/:id/report', authenticate, (req, res) => dogController.generateReport(req, res));

export default router;
