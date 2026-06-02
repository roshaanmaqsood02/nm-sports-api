import { SetMetadata } from '@nestjs/common';

export const THROTTLE_SKIP_KEY = 'throttle_skip';

// Skip throttling on internal / health-check routes
// Usage:
//   @SkipThrottle()
//   @Get('health')
//   healthCheck() { ... }
export const SkipThrottle = () => SetMetadata(THROTTLE_SKIP_KEY, true);

// Apply named throttle tier on a specific route
// Usage:
//   @ThrottleTier('auth')          ← maps to throttler named 'auth'
//   @Post('login')
//   login() { ... }
export const ThrottleTier = (name: 'auth' | 'public' | 'default') =>
  SetMetadata('throttler_tier', name);
