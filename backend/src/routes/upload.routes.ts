import { Router, Request, Response } from 'express';
import uploadController, { uploadMiddleware } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import 'express-async-errors';

const router = Router();

router.post('/signed-url', authenticate, uploadLimiter, (req, res) => uploadController.getSignedUploadUrl(req, res));

// Device → Backend → Supabase (bypasses ISP DNS issues with direct Supabase storage URLs)
router.post(
  '/from-device',
  authenticate,
  uploadLimiter,
  uploadMiddleware.single('file'),
  (req, res) => uploadController.uploadFromDevice(req as any, res),
);

/**
 * Image proxy: fetch a Supabase storage URL via the backend (which has working DNS)
 * and stream it to the device. No auth required so Image components work directly.
 * GET /upload/proxy?u=<url-encoded supabase URL>
 */
router.get('/proxy', async (req: Request, res: Response) => {
  const url = req.query.u as string;
  if (!url) { res.status(400).end(); return; }
  const decoded = decodeURIComponent(url);
  try {
    const resp = await fetch(decoded, { headers: { 'Accept': 'image/*' } });
    if (!resp.ok) { res.status(resp.status).end(); return; }
    const buf = Buffer.from(await resp.arrayBuffer());
    res.set('Content-Type', resp.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(buf);
  } catch {
    res.status(500).end();
  }
});

export default router;
