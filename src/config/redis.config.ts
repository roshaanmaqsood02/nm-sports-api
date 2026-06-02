import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  password: process.env.REDIS_PASSWORD ?? '',
  db: parseInt(process.env.REDIS_DB ?? '0', 10),
  ttl: parseInt(process.env.REDIS_TTL ?? '300', 10),
  maxItems: parseInt(process.env.REDIS_MAX_ITEMS ?? '1000', 10),
  enabled: process.env.REDIS_ENABLED === 'true',
}));
