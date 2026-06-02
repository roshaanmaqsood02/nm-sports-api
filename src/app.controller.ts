import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { SkipThrottle } from './common/decorators/throttle-skip.decorator';
import { Public } from './modules/auth/decorators/public.decorator';
import { AppCacheService } from './modules/redis/redis.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly cacheService: AppCacheService,
  ) {}

  @Public()
  @SkipThrottle()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  async healthCheck() {
    const redisOk = await this.cacheService.ping();

    return {
      status: 'ok',
      appName: 'NMSports API',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      services: {
        redis: redisOk ? 'connected' : 'unavailable',
      },
    };
  }
}
