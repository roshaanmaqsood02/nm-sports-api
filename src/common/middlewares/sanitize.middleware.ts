import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// NoSQL Injection Sanitizer
// Strips $-prefixed keys from req.body / req.params / req.query
// Uses mongoSanitize.sanitize() directly instead of the middleware factory
// because the middleware factory reassigns req.query which is getter-only
// in newer versions of the router package used by NestJS.
@Injectable()
export class MongoSanitizeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // body and params are writable — safe to reassign
    if (req.body) {
      req.body = mongoSanitize.sanitize(req.body, {
        replaceWith: '_',
        allowDots: true,
      });
    }

    if (req.params) {
      req.params = mongoSanitize.sanitize(req.params, {
        replaceWith: '_',
        allowDots: true,
      }) as Record<string, string>;
    }

    // req.query is getter-only — mutate in place instead of reassigning
    if (req.query) {
      const sanitized = mongoSanitize.sanitize(
        { ...req.query },
        { replaceWith: '_', allowDots: true },
      ) as Record<string, any>;

      Object.keys(req.query).forEach((key) => {
        delete (req.query as any)[key];
      });
      Object.assign(req.query, sanitized);
    }

    next();
  }
}

// HTTP Parameter Pollution Guard
// Prevents attackers from sending duplicate query params like
// ?sort=asc&sort=desc&sort[$gt]=x which can override intended query behavior.
@Injectable()
export class HppMiddleware implements NestMiddleware {
  private readonly hppGuard = hpp({
    // These params are legitimately allowed to be arrays
    whitelist: ['permissions', 'roles', 'ids', 'tags', 'filter', 'sort'],
  });

  use(req: Request, res: Response, next: NextFunction): void {
    this.hppGuard(req, res, next);
  }
}
