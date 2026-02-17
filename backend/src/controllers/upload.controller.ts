import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { storageService } from '../services/storage.service';

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
}

export default new UploadController();
