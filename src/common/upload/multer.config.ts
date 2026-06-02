import { BadRequestException } from '@nestjs/common';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuid } from 'uuid';

export const logoStorage = diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, process.env.UPLOAD_DEST ?? './uploads/logos');
  },
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const uniqueName = `logo-${uuid()}${ext}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_MIME_TYPES = (
  process.env.ALLOWED_IMAGE_TYPES ??
  'image/jpeg,image/png,image/webp,image/svg+xml'
).split(',');

export const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (err: Error | null, accept: boolean) => void,
) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new BadRequestException(
        `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      ),
      false,
    );
  }
  cb(null, true);
};

export const MAX_FILE_SIZE =
  parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? '5', 10) * 1024 * 1024;
