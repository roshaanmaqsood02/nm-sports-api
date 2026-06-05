import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { CACHE_TTL } from './enums/redis.constant';

@Injectable()
export class AppCacheService {
  private readonly logger = new Logger(AppCacheService.name);
  private readonly enabled: boolean;
  private readonly defaultTtl: number;

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    const raw = this.configService.get<any>('REDIS_ENABLED');
    this.enabled = raw === true || raw === 'true';
    this.defaultTtl = this.configService.get<number>(
      'REDIS_TTL',
      CACHE_TTL.DEFAULT,
    );
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const value = await this.cacheManager.get<T>(key);
      if (value !== undefined && value !== null) {
        this.logger.debug(`Cache HIT  → ${key}`);
        return value;
      }
      this.logger.debug(`Cache MISS → ${key}`);
      return null;
    } catch (err: any) {
      this.logger.warn(`Cache GET error [${key}]: ${err?.message}`);
      return null; // degrade gracefully
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttl: number = this.defaultTtl,
  ): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.cacheManager.set(key, value, ttl * 1000); // ms
      this.logger.debug(`Cache SET  → ${key} (TTL: ${ttl}s)`);
    } catch (err: any) {
      this.logger.warn(`Cache SET error [${key}]: ${err?.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL  → ${key}`);
    } catch (err: any) {
      this.logger.warn(`Cache DEL error [${key}]: ${err?.message}`);
    }
  }

  async delMany(keys: string[]): Promise<void> {
    if (!this.enabled || keys.length === 0) return;

    try {
      await Promise.all(keys.map((k) => this.cacheManager.del(k)));
      this.logger.debug(`Cache DEL MANY → ${keys.length} keys`);
    } catch (err: any) {
      this.logger.warn(`Cache DEL MANY error: ${err?.message}`);
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTtl,
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    // Fetch from source
    const value = await fetchFn();

    // Store in cache (don't await — fire and forget)
    this.set(key, value, ttl).catch(() => {});

    return value;
  }

  async wrap<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.defaultTtl,
  ): Promise<T> {
    try {
      return await this.getOrSet(key, fetchFn, ttl);
    } catch (err: any) {
      // If cache fails entirely, fall back to direct fetch
      this.logger.warn(`Cache WRAP fallback [${key}]: ${err?.message}`);
      return fetchFn();
    }
  }

  // Stores a tag set in Redis — all keys tagged under this prefix
  async invalidateByPrefix(prefix: string): Promise<void> {
    if (!this.enabled) return;

    try {
      // Get the Redis client directly to use SCAN
      const store = (this.cacheManager as any).store;
      const client = store?.getClient?.() ?? store?.client;

      if (!client) {
        this.logger.warn('Redis client not accessible for SCAN operation');
        return;
      }

      let cursor = '0';
      let count = 0;

      // SCAN instead of KEYS — non-blocking in production
      do {
        const [nextCursor, keys]: [string, string[]] = await client.scan(
          cursor,
          'MATCH',
          `*${prefix}*`,
          'COUNT',
          '100',
        );

        cursor = nextCursor;

        if (keys.length > 0) {
          await Promise.all(keys.map((k: string) => client.del(k)));
          count += keys.length;
        }
      } while (cursor !== '0');

      this.logger.debug(
        `Cache INVALIDATE prefix "${prefix}" → ${count} keys removed`,
      );
    } catch (err: any) {
      this.logger.warn(`Cache INVALIDATE error [${prefix}]: ${err?.message}`);
    }
  }

  async reset(): Promise<void> {
    if (!this.enabled) return;

    try {
      const store = (this.cacheManager as any).store;
      if (store?.clear) {
        await store.clear();
      } else {
        // Fallback: manually scan and delete all keys
        const client = store?.getClient?.() ?? store?.client;
        if (client) {
          let cursor = '0';
          do {
            const [nextCursor, keys]: [string, string[]] = await client.scan(
              cursor,
              'COUNT',
              '100',
            );
            cursor = nextCursor;
            if (keys.length > 0) {
              await Promise.all(keys.map((k: string) => client.del(k)));
            }
          } while (cursor !== '0');
        }
      }
      this.logger.log('Cache RESET — all keys cleared');
    } catch (err: any) {
      this.logger.warn(`Cache RESET error: ${err?.message}`);
    }
  }

  async ping(): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const testKey = '__health_check__';
      await this.cacheManager.set(testKey, '1', 5000);
      const val = await this.cacheManager.get(testKey);
      await this.cacheManager.del(testKey);
      return val === '1';
    } catch {
      return false;
    }
  }
}
