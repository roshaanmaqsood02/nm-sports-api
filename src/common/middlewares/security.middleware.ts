import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityHeadersMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    // ── Prevent clickjacking ────────────────────────────────────
    res.setHeader('X-Frame-Options', 'DENY');

    // ── Prevent MIME sniffing ───────────────────────────────────
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // ── Strict Transport Security (production only) ────────────
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    // Remove server fingerprint
    res.removeHeader('X-Powered-By');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    //  Permissions policy (disable unused browser APIs)
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    );

    // Log suspicious large payloads
    const contentLength = parseInt(req.headers['content-length'] ?? '0', 10);
    if (contentLength > 5 * 1024 * 1024) {
      // 5MB
      this.logger.warn(
        `Large payload detected: ${contentLength} bytes from ${req.ip} → ${req.method} ${req.path}`,
      );
    }

    next();
  }
}
