import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { SkipThrottle } from './common/decorators/throttle-skip.decorator';
import { Public } from './modules/auth/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @SkipThrottle()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        status: 'ok',
        appName: 'NMSports API',
        timestamp: '2026-05-25T06:00:00.000Z',
        environment: 'development',
      },
    },
  })
  healthCheck() {
    return this.appService.healthCheck();
  }
}
