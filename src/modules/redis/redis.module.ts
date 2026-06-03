import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis-yet';
import { AppCacheService } from './redis.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('redis.host', 'localhost');
        const port = configService.get<number>('redis.port', 6379);
        const password = configService.get<string>('redis.password', '');
        const db = configService.get<number>('redis.db', 0);
        const ttl = configService.get<number>('redis.ttl', 300);
        const maxItems = configService.get<number>('redis.maxItems', 1000);
        const raw = configService.get<any>('REDIS_ENABLED');
        const isEnabled = raw === true || raw === 'true';

        // ── Fallback: in-memory when Redis disabled ──────────
        if (!isEnabled) {
          console.log('⚠️   Redis disabled — using in-memory cache');
          return {
            ttl: ttl * 1000,
            max: maxItems,
          };
        }

        // ── ioredis store ────────────────────────────────────
        try {
          const store = await redisStore({
            host,
            port,
            password: password || undefined,
            db,
            ttl: ttl * 1000,
            lazyConnect: true,
            retryStrategy: (times: number) => {
              if (times > 5) {
                console.error('❌  Redis max retries reached');
                return null;
              }
              return Math.min(times * 200, 2000);
            },
          });

          console.log(`Redis (ioredis) connected → ${host}:${port}/${db}`);

          return {
            store,
            ttl: ttl * 1000,
            max: maxItems,
          };
        } catch (err: any) {
          console.error(`❌  Redis failed: ${err?.message}`);
          console.log('⚠️   Falling back to in-memory cache');
          return {
            ttl: ttl * 1000,
            max: maxItems,
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AppCacheService],
  exports: [AppCacheService, CacheModule],
})
export class AppRedisModule {}
