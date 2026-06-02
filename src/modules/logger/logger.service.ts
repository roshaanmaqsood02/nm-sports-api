import { Injectable, LoggerService, Optional } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';
import { Logger } from 'winston';

@Injectable()
export class AppLoggerService implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: Logger,
  ) {}

  // NestJS LoggerService interface
  log(message: any, context?: string): void {
    this.winstonLogger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string): void {
    this.winstonLogger.error(message, { trace, context });
  }

  warn(message: any, context?: string): void {
    this.winstonLogger.warn(message, { context });
  }

  debug(message: any, context?: string): void {
    this.winstonLogger.debug(message, { context });
  }

  verbose(message: any, context?: string): void {
    this.winstonLogger.verbose(message, { context });
  }

  // Extended helpers for structured logging
  http(message: string, meta?: Record<string, any>): void {
    this.winstonLogger.http(message, meta);
  }

  // Log with arbitrary extra metadata
  info(message: string, meta?: Record<string, any>): void {
    this.winstonLogger.info(message, meta);
  }

  // Audit-specific structured log
  audit(action: string, meta: Record<string, any>): void {
    this.winstonLogger.info(`[AUDIT] ${action}`, {
      type: 'audit',
      action,
      ...meta,
    });
  }
}
