import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerModuleOptions } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import databaseConfig from './config/database.config';
import throttlerConfig from './config/throttler.config';
import securityConfig from './config/security.config';
import appConfig from './config/app.config';
import { configValidationSchema } from './config/config.validation';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerModule } from './modules/logger/logger.module';
import { UploadModule } from './common/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AuditModule } from './modules/audit/audit.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { SeederModule } from './database/seeder/seeder.module';
import { JwtAuthGuard } from './modules/auth/guard/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guard/roles.guard';
import { PermissionsGuard } from './modules/auth/guard/permissions.guard';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SecurityHeadersMiddleware } from './common/middlewares/security.middleware';
import {
  HppMiddleware,
  MongoSanitizeMiddleware,
} from './common/middlewares/sanitize.middleware';
import {
  createAuthRateLimiter,
  createGlobalRateLimiter,
} from './common/middlewares/rate-limit.middleware';
import { TeamsModule } from './modules/teams/teams.module';
import { PlayersModule } from './modules/players/players.module';
import { MatchesModule } from './modules/matches/matches.module';
import { LeaguesModule } from './modules/leagues/leagues.module';
import { DivisionsModule } from './modules/divisions/divisions.module';
import { ClubsModule } from './modules/clubs/clubs.module';

@Module({
  imports: [
    // ─── Config with Joi validation ───────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, throttlerConfig, securityConfig, appConfig],
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),

    // ─── MongoDB ──────────────────────────────────────────────
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (cs: ConfigService) => ({
        uri: cs.get<string>('database.uri'),
        connectionFactory: (connection) => {
          connection.on('connected', () =>
            console.log('✅  MongoDB connected'),
          );
          connection.on('disconnected', () =>
            console.warn('⚠️   MongoDB disconnected'),
          );
          connection.on('error', (e: Error) =>
            console.error('❌  MongoDB error:', e.message),
          );
          return connection;
        },
      }),
      inject: [ConfigService],
    }),

    // ─── Throttler ────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (cs: ConfigService): ThrottlerModuleOptions => ({
        throttlers: [
          {
            name: 'default',
            ttl: cs.get<number>('throttler.global.ttl', 60_000),
            limit: cs.get<number>('throttler.global.limit', 100),
          },
          {
            name: 'auth',
            ttl: cs.get<number>('throttler.auth.ttl', 900_000),
            limit: cs.get<number>('throttler.auth.limit', 10),
          },
          {
            name: 'public',
            ttl: cs.get<number>('throttler.public.ttl', 60_000),
            limit: cs.get<number>('throttler.public.limit', 300),
          },
        ],
      }),
      inject: [ConfigService],
    }),

    LoggerModule,
    UploadModule,
    UsersModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    AuditModule,
    OrganizationsModule,
    TeamsModule,
    PlayersModule,
    LeaguesModule,
    DivisionsModule,
    ClubsModule,
    MatchesModule,
    SeederModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,

    // ─── Global Guards ────────────────────────────────────────
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },

    // ─── Global Interceptors ──────────────────────────────────
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
  ],
})
export class AppModule implements NestModule {
  constructor(private readonly configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');

    consumer.apply(MongoSanitizeMiddleware).forRoutes('*');

    consumer.apply(HppMiddleware).forRoutes('*');

    consumer
      .apply(createAuthRateLimiter(this.configService))
      .forRoutes(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.POST },
      );

    consumer.apply(createGlobalRateLimiter(this.configService)).forRoutes('*');
  }
}
