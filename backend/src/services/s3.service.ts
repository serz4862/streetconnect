import AWS from 'aws-sdk';
import { config } from '../config';
import logger from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

class S3Service {
  private s3: AWS.S3;

  constructor() {
    AWS.config.update({
      region: config.aws.region,
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    });

    this.s3 = new AWS.S3({
      signatureVersion: 'v4',
    });
  }

  async getSignedUploadUrl(
    fileType: string,
    folder: 'dogs' | 'reports' | 'feed' | 'chat' | 'qr' | 'avatars' = 'dogs'
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    try {
      const fileExtension = fileType.split('/')[1] || 'jpg';
      const key = `${folder}/${uuidv4()}.${fileExtension}`;

      const uploadUrl = await this.s3.getSignedUrlPromise('putObject', {
        Bucket: config.aws.s3Bucket,
        Key: key,
        ContentType: fileType,
        Expires: 300, // 5 minutes
      });

      const fileUrl = `${config.aws.s3Url}/${key}`;

      return { uploadUrl, fileUrl, key };
    } catch (error) {
      logger.error('S3 signed URL generation error:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3
        .deleteObject({
          Bucket: config.aws.s3Bucket,
          Key: key,
        })
        .promise();
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error('Failed to delete file');
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    contentType: string
  ): Promise<string> {
    try {
      const fileExtension = contentType.split('/')[1] || 'jpg';
      const key = `${folder}/${uuidv4()}.${fileExtension}`;

      await this.s3
        .putObject({
          Bucket: config.aws.s3Bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
        })
        .promise();

      return `${config.aws.s3Url}/${key}`;
    } catch (error) {
      logger.error('S3 upload buffer error:', error);
      throw new Error('Failed to upload file');
    }
  }
}

export default new S3Service();
