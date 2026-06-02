import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_META = 'cache_key';
export const CACHE_TTL_META = 'cache_ttl';
export const CACHE_SKIP_META = 'cache_skip';

export const UseCache = (key: string, ttl?: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_META, key)(target, propertyKey, descriptor);
    if (ttl !== undefined) {
      SetMetadata(CACHE_TTL_META, ttl)(target, propertyKey, descriptor);
    }
  };
};

export const SkipCache = () => SetMetadata(CACHE_SKIP_META, true);
