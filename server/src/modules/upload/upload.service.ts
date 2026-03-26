import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly hasCloudinaryConfig: boolean;

  constructor() {
    this.hasCloudinaryConfig = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET,
    );

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder = 'hostel-complaints',
    baseUrl?: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WEBP images are allowed',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Image must be under 5MB');
    }

    if (!this.hasCloudinaryConfig) {
      this.logger.warn(
        'Cloudinary env vars missing, using local upload fallback.',
      );
      return this.uploadToLocal(file, baseUrl);
    }

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            transformation: [
              { width: 1200, height: 900, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error || !result) {
              reject(
                new BadRequestException(
                  'Upload failed. Check Cloudinary configuration on server.',
                ),
              );
              return;
            }

            resolve(result.secure_url);
          },
        )
        .end(file.buffer);
    });
  }

  private async uploadToLocal(
    file: Express.Multer.File,
    baseUrl?: string,
  ): Promise<string> {
    const uploadsDir = join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    const extension = extname(file.originalname || '') || this.extensionFromMime(file.mimetype);
    const fileName = `${randomUUID()}${extension}`;
    const filePath = join(uploadsDir, fileName);

    await writeFile(filePath, file.buffer);

    const serverBase =
      baseUrl ||
      process.env.SERVER_PUBLIC_URL ||
      `http://localhost:${process.env.PORT || 3001}`;

    return `${serverBase.replace(/\/$/, '')}/uploads/${fileName}`;
  }

  private extensionFromMime(mimeType: string): string {
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/webp') return '.webp';
    return '.jpg';
  }
}
