import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');

export interface ProcessedImage {
  filename: string;
  path: string;
  url: string;
  size: number;
  width: number;
  height: number;
  mimetype: string;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadDest: string;
  private readonly appUrl: string;
  private readonly maxWidth: number;
  private readonly maxHeight: number;

  constructor(private readonly configService: ConfigService) {
    this.uploadDest = this.configService.get<string>(
      'app.upload.dest',
      './uploads',
    );
    this.appUrl = this.configService.get<string>(
      'app.url',
      'http://localhost:8000',
    );
    this.maxWidth = this.configService.get<number>('app.org.logoMaxWidth', 800);
    this.maxHeight = this.configService.get<number>(
      'app.org.logoMaxHeight',
      800,
    );

    this.ensureDir(this.uploadDest);
    this.ensureDir(path.join(this.uploadDest, 'logos'));
  }

  async processLogo(file: Express.Multer.File): Promise<ProcessedImage> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const outputDir = path.join(this.uploadDest, 'logos');
    const outputFilename = file.filename ?? `logo-${Date.now()}.webp`;
    const outputPath = path.join(outputDir, outputFilename);
    const finalFilename = outputFilename.replace(/\.[^/.]+$/, '.webp');
    const finalPath = outputPath.replace(/\.[^/.]+$/, '.webp');

    try {
      const metadata = await sharp(file.path)
        .resize({
          width: this.maxWidth,
          height: this.maxHeight,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(finalPath);

      // Remove original after successful conversion
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      this.logger.log(`✅ Logo processed: ${finalFilename}`);

      return {
        filename: finalFilename,
        path: finalPath,
        url: `${this.appUrl}/uploads/logos/${finalFilename}`,
        size: metadata.size ?? 0,
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
        mimetype: 'image/webp',
      };
    } catch (err: any) {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      this.logger.error(`❌ Logo processing failed: ${err?.message}`);
      throw new BadRequestException(`Failed to process image: ${err?.message}`);
    }
  }

  deleteFile(filePath: string): void {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`🗑️  Deleted: ${filePath}`);
      }
    } catch (err: any) {
      this.logger.warn(`⚠️  Delete failed for ${filePath}: ${err?.message}`);
    }
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
