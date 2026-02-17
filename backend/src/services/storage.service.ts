import { supabase } from './supabase.service';
import logger from '../utils/logger';

export type StorageBucket = 'dogs' | 'reports' | 'feed' | 'chat' | 'qr' | 'avatars';

class StorageService {
  /**
   * Get a signed upload URL for client-side uploads
   * @param fileType - MIME type (e.g., 'image/jpeg')
   * @param bucket - Storage bucket name
   * @returns Upload URL, public file URL, and file path
   */
  async getSignedUploadUrl(
    fileType: string,
    bucket: StorageBucket
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = fileType.split('/')[1] || 'jpg';
      const filename = `${timestamp}-${random}.${extension}`;

      // Create signed upload URL (valid for 60 seconds)
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(filename);

      if (error) {
        logger.error('Error creating signed upload URL:', error);
        throw new Error(`Failed to create signed upload URL: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        uploadUrl: data.signedUrl,
        fileUrl: publicUrlData.publicUrl,
        key: data.path,
      };
    } catch (error: any) {
      logger.error('Storage service error:', error);
      throw error;
    }
  }

  /**
   * Upload a buffer directly (server-side)
   * @param buffer - File buffer
   * @param bucket - Storage bucket name
   * @param contentType - MIME type
   * @returns Public URL of uploaded file
   */
  async uploadBuffer(
    buffer: Buffer,
    bucket: StorageBucket,
    contentType: string
  ): Promise<string> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const extension = contentType.split('/')[1] || 'bin';
      const filename = `${timestamp}-${random}.${extension}`;

      // Upload buffer
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filename, buffer, {
          contentType,
          upsert: false,
        });

      if (error) {
        logger.error('Error uploading buffer:', error);
        throw new Error(`Failed to upload buffer: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (error: any) {
      logger.error('Storage service error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   * @param bucket - Storage bucket name
   * @param path - File path in bucket
   */
  async deleteFile(bucket: StorageBucket, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        logger.error('Error deleting file:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      logger.info(`File deleted: ${bucket}/${path}`);
    } catch (error: any) {
      logger.error('Storage service error:', error);
      throw error;
    }
  }

  /**
   * List files in a bucket
   * @param bucket - Storage bucket name
   * @param folder - Optional folder path
   */
  async listFiles(bucket: StorageBucket, folder: string = ''): Promise<any[]> {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(folder);

      if (error) {
        logger.error('Error listing files:', error);
        throw new Error(`Failed to list files: ${error.message}`);
      }

      return data || [];
    } catch (error: any) {
      logger.error('Storage service error:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
