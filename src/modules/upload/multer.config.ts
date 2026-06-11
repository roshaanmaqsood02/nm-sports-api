import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto'; // ← Node built-in, no package needed

// Disk storage
export const logoStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(
      null,
      process.env.UPLOAD_DEST
        ? `${process.env.UPLOAD_DEST}/logos`
        : './uploads/logos',
    );
  },
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const uniqueName = `logo-${randomUUID()}${ext}`; // ← crypto.randomUUID()
    cb(null, uniqueName);
  },
});

// Allowed MIME types
const ALLOWED_MIME_TYPES = (
  process.env.ALLOWED_IMAGE_TYPES ??
  'image/jpeg,image/png,image/webp,image/svg+xml'
)
  .split(',')
  .map((t) => t.trim());

export const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (err: Error | null, accept: boolean) => void,
) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new BadRequestException(
        `Unsupported file type: ${file.mimetype}. ` +
          `Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      ),
      false,
    );
  }
  cb(null, true);
};

// Max file size in bytes
export const MAX_FILE_SIZE =
  parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? '5', 10) * 1024 * 1024;
