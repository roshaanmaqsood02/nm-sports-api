import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import { join } from 'path';
import * as express from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { AppLoggerService } from './modules/logger/logger.service';
import { IoAdapter } from '@nestjs/platform-socket.io';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const compression = require('compression');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const appLogger = app.get(AppLoggerService);

  const port = configService.get<number>('PORT', 8000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const isProd = configService.get<string>('NODE_ENV') === 'production';
  const swaggerPath = configService.get<string>('SWAGGER_PATH', 'docs');
  const uploadDest = configService.get<string>('UPLOAD_DEST', './uploads');

  const swaggerEnabledRaw = configService.get<any>('SWAGGER_ENABLED');
  const swaggerEnabled =
    swaggerEnabledRaw === true || swaggerEnabledRaw === 'true';

  app.use(compression());

  app.use(
    '/uploads',
    express.static(join(process.cwd(), uploadDest), {
      index: false,
      fallthrough: true,
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.useWebSocketAdapter(new IoAdapter(app));

  app.enableCors({
    origin: isProd
      ? configService
          .get<string>('ALLOWED_ORIGINS', 'http://localhost:8000')
          .split(',')
          .map((o) => o.trim())
      : '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  if (swaggerEnabled) {
    const docBuilder = new DocumentBuilder()
      .setTitle(configService.get<string>('SWAGGER_TITLE', 'NMSports API'))
      .setDescription(
        configService.get<string>(
          'SWAGGER_DESCRIPTION',
          'NMSports SaaS Platform API Documentation',
        ),
      )
      .setVersion(configService.get<string>('SWAGGER_VERSION', '1.0'))
      // ← include the api/v1 prefix so Swagger UI uses correct paths
      .addServer(`http://localhost:${port}/${apiPrefix}`, 'Local Development')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Paste your JWT access token here',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Health', 'Health check')
      .addTag('Auth', 'Authentication — login, logout, refresh')
      .addTag('Users', 'User management')
      .addTag('Staff', 'Staff management - organization roles & permissions')
      .addTag('Coaches', 'Coach management — assign to teams, status')
      .addTag('Roles', 'Role management')
      .addTag('Permissions', 'Permission management')
      .addTag('Organizations', 'Organization management')
      .addTag('Registrations', 'Multi-step organization registration form')
      .addTag('Teams', 'Team management — roster, stats, logo')
      .addTag('Players', 'Player profiles — injuries, stats, transfers')
      .addTag(
        'Chat',
        'Real-time messaging — conversations, messages, reactions',
      )
      .addTag(
        'Leagues',
        'League management — schedule, player stats, team stats',
      )
      .addTag('Divisions', 'Division management under organizations')
      .addTag('Clubs', 'Club management under organizations')
      .addTag('Matches', 'Match scheduling, live scoring, events & results')
      .addTag(
        'Tournaments',
        'Tournament management — bracket, standings, teams',
      )
      .addTag(
        'Seasons',
        'Season management — subseasons, game ID generation, seeds',
      )
      .addTag(
        'Websites',
        'Website template activation and custom website requests',
      )
      .addTag('Audit', 'Audit log queries')
      .build();

    const document = SwaggerModule.createDocument(app, docBuilder);

    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        tagsSorter: 'alpha',
        filter: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: 'NMSports API Docs',
      customCss: `
        .swagger-ui .topbar { background-color: #1a1a2e; padding: 8px 20px; }
        .swagger-ui .topbar-wrapper .link { display: none; }
        .swagger-ui .topbar-wrapper::after {
          content: '⚽  NMSports API';
          color: #ffffff;
          font-size: 1.3rem;
          font-weight: 700;
        }
        .swagger-ui .btn.authorize { border-color: #1d9e75; color: #1d9e75; border-radius: 6px; }
        .swagger-ui .btn.authorize:hover { background: #1d9e75; color: #fff; }
        .swagger-ui .opblock.opblock-post { border-color: #9fe1cb; background: #f0faf6; }
        .swagger-ui .opblock.opblock-get  { border-color: #b5d4f4; background: #f0f6fd; }
        .swagger-ui .opblock.opblock-patch { border-color: #cecbf6; background: #f5f4fe; }
        .swagger-ui .opblock.opblock-delete { border-color: #f7c1c1; background: #fef5f5; }
        .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #1d9e75; }
        .swagger-ui .opblock.opblock-get  .opblock-summary-method { background: #185fa5; }
        .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #534ab7; }
        .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #a32d2d; }
        .swagger-ui .btn.execute { background: #1d9e75; border-color: #1d9e75; border-radius: 6px; }
        .swagger-ui .btn.execute:hover { background: #0f6e56; }
        .swagger-ui .information-container { background: #0f3460; padding: 20px 24px; }
        .swagger-ui .info .title { color: #fff !important; }
        .swagger-ui .info p { color: #9fa3b1 !important; }
      `,
    });

    appLogger.log(
      `📖  Swagger UI   → http://localhost:${port}/${swaggerPath}`,
      'Bootstrap',
    );
  }

  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: swaggerPath, method: RequestMethod.GET },
      { path: `${swaggerPath}-json`, method: RequestMethod.GET },
      { path: `${swaggerPath}-yaml`, method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter(appLogger));

  await app.listen(port, '0.0.0.0');

  appLogger.log(
    `API running  → http://localhost:${port}/${apiPrefix}`,
    'Bootstrap',
  );
  appLogger.log(`Health check → http://localhost:${port}/health`, 'Bootstrap');
  appLogger.log(
    `Environment  : ${configService.get<string>('NODE_ENV')}`,
    'Bootstrap',
  );
}

bootstrap().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
