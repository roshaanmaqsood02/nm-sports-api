import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import { THROTTLE_SKIP_KEY } from '../decorators/throttle-skip.decorator';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(options: any, storageService: any, reflector: Reflector) {
    super(options, storageService, reflector);
  }

  // Allow skipping throttle via @SkipThrottle()
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(THROTTLE_SKIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) return true;

    return super.canActivate(context);
  }

  // Extract real IP behind proxies
  protected getTracker(req: Record<string, any>): Promise<string> {
    const ip =
      (req.headers?.['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
      req.ip ??
      req.socket?.remoteAddress ??
      '0.0.0.0';
    return Promise.resolve(ip);
  }

  // Improve default 429 error message
  protected throwThrottlingException(
    context: ExecutionContext,
    _throttlerLimitDetail: any,
  ): Promise<void> {
    throw new ThrottlerException(
      'Too many requests. Please slow down and try again later.',
    );
  }
}
