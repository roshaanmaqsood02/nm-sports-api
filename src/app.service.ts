import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    return 'Hello World!';
  }

  healthCheck() {
    return {
      status: 'ok',
      appName: this.configService.get<string>('APP_NAME', 'NMSports API'),
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      version: this.configService.get<string>('APP_VERSION', '1.0.0'),
    };
  }
}
