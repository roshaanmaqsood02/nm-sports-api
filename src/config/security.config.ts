import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  requestSizeLimit: process.env.REQUEST_SIZE_LIMIT ?? '10kb',
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS ?? '30000', 10),

  // Comma-separated list → string array
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:8000')
    .split(',')
    .map((o) => o.trim()),

  // Helmet CSP and other header configs
  helmet: {
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  },
}));
