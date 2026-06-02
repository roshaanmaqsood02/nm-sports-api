import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { AppLoggerService } from 'src/modules/logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();
    const { method, originalUrl, ip } = req;
    const userAgent = req.headers['user-agent'] ?? '';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        const logLine = `${method} ${originalUrl} ${statusCode} — ${duration}ms — ${ip}`;

        if (statusCode >= 500) {
          this.logger.error(logLine, undefined, 'HTTP');
        } else if (statusCode >= 400) {
          this.logger.warn(logLine, 'HTTP');
        } else {
          this.logger.http(logLine, {
            method,
            url: originalUrl,
            statusCode,
            duration,
            ip,
            userAgent,
          });
        }
      }),
    );
  }
}
