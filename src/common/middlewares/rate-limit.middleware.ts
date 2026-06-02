import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';

// Safely extract & normalize IP — handles IPv4, IPv6, x-forwarded-for
function extractIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0])
      .split(',')[0]
      .trim();
  }
  // Strip IPv6-mapped IPv4 prefix (::ffff:1.2.3.4 → 1.2.3.4)
  const ip = req.ip ?? req.socket?.remoteAddress ?? '0.0.0.0';
  return ip.replace(/^::ffff:/, '');
}

// Auth brute-force limiter
export function createAuthRateLimiter(configService: ConfigService) {
  return rateLimit({
    windowMs: configService.get<number>('throttler.auth.ttl', 900_000),
    max: configService.get<number>('throttler.auth.limit', 10),
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
      statusCode: 429,
      message: 'Too many login attempts. Please try again after 15 minutes.',
      error: 'Too Many Requests',
    },
    keyGenerator: (req: Request): string => {
      const ip = extractIp(req);
      const email = (req.body?.email ?? '').toLowerCase();
      return `${ip}:${email}`;
    },
  });
}

// Global API limiter
export function createGlobalRateLimiter(configService: ConfigService) {
  return rateLimit({
    windowMs: configService.get<number>('throttler.global.ttl', 60_000),
    max: configService.get<number>('throttler.global.limit', 100),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      statusCode: 429,
      message: 'Too many requests from this IP. Please slow down.',
      error: 'Too Many Requests',
    },
    keyGenerator: (req: Request): string => extractIp(req),
    skip: (req: Request): boolean => req.path === '/health',
  });
}
