import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';
import 'express-async-errors';

const router = Router();

router.post('/', authenticate, (req, res) => reportController.createReport(req, res));
router.get('/nearby', authenticate, (req, res) => reportController.getNearbyReports(req, res));
router.get('/my-reports', authenticate, (req, res) => reportController.getMyReports(req, res));
router.get('/dog/:dogId', authenticate, (req, res) => reportController.getDogReports(req, res));
router.get('/:id', authenticate, (req, res) => reportController.getReportById(req, res));
router.put('/:id', authenticate, (req, res) => reportController.updateReport(req, res));
router.delete('/:id', authenticate, (req, res) => reportController.deleteReport(req, res));

export default router;
