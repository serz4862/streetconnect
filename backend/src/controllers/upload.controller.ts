import { Response } from 'express';
import { Request } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { storageService, StorageBucket } from '../services/storage.service';
import multer from 'multer';

const getUploadUrlSchema = z.object({
  file_type: z.string(),
  folder: z.enum(['dogs', 'reports', 'feed', 'chat', 'qr', 'avatars']),
});

export class UploadController {
  async getSignedUploadUrl(req: AuthRequest, res: Response): Promise<void> {
    const data = getUploadUrlSchema.parse(req.body);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(data.file_type)) {
      throw new AppError('Invalid file type. Only images are allowed', 400);
    }

    const { uploadUrl, fileUrl, key } = await storageService.getSignedUploadUrl(
      data.file_type,
      data.folder as any
    );

    res.json({
      upload_url: uploadUrl,
      file_url: fileUrl,
      key,
    });
  }

  /**
   * Accept multipart/form-data from the device, upload to Supabase via
   * server-side buffer upload (no direct device → Supabase connection needed).
   * Body: file (image), folder (string)
   */
  async uploadFromDevice(req: Request & { file?: Express.Multer.File }, res: Response): Promise<void> {
    if (!req.file) throw new AppError('No file provided', 400);

    const folderSchema = z.enum(['dogs', 'reports', 'feed', 'chat', 'qr', 'avatars']);
    const folder: StorageBucket = folderSchema.parse(req.body.folder || 'dogs');

    const fileUrl = await storageService.uploadBuffer(
      req.file.buffer,
      folder,
      req.file.mimetype,
    );

    res.json({ file_url: fileUrl });
  }
}

/** Multer config – keep files in memory so we can pass Buffer to Supabase */
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images are allowed'));
  },
});

export default new UploadController();
