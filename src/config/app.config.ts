import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'NMSports API',
  version: process.env.APP_VERSION ?? '1.0.0',
  url: process.env.APP_URL ?? 'http://localhost:8000',
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '8000', 10),
  prefix: process.env.API_PREFIX ?? 'api/v1',
  upload: {
    dest: process.env.UPLOAD_DEST ?? './uploads',
    maxSizeMb: parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? '5', 10),
    allowedImageTypes: (
      process.env.ALLOWED_IMAGE_TYPES ??
      'image/jpeg,image/png,image/webp,image/svg+xml'
    ).split(','),
  },
  org: {
    logoMaxWidth: parseInt(process.env.ORG_LOGO_MAX_WIDTH ?? '800', 10),
    logoMaxHeight: parseInt(process.env.ORG_LOGO_MAX_HEIGHT ?? '800', 10),
  },
}));
