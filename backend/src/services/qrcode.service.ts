import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from './storage.service';
import logger from '../utils/logger';

class QRCodeService {
  async generateDogQRCode(dogId: string): Promise<{ qrCodeUrl: string; qrCodeId: string }> {
    try {
      const qrCodeId = uuidv4();
      const qrData = JSON.stringify({
        type: 'dog',
        id: dogId,
        qr_id: qrCodeId,
        timestamp: Date.now(),
      });

      // Generate QR code as buffer
      const qrBuffer = await QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 500,
        margin: 2,
      });

      // Upload to Supabase Storage
      const qrCodeUrl = await storageService.uploadBuffer(qrBuffer, 'qr', 'image/png');

      return { qrCodeUrl, qrCodeId };
    } catch (error) {
      logger.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  async verifyQRCode(qrData: string): Promise<{ valid: boolean; dogId?: string; qrCodeId?: string }> {
    try {
      const data = JSON.parse(qrData);
      
      if (data.type === 'dog' && data.id && data.qr_id) {
        return {
          valid: true,
          dogId: data.id,
          qrCodeId: data.qr_id,
        };
      }

      return { valid: false };
    } catch (error) {
      logger.error('QR code verification error:', error);
      return { valid: false };
    }
  }
}

export default new QRCodeService();
