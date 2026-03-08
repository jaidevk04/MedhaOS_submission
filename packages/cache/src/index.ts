/**
 * MedhaOS Cache Package
 * Comprehensive caching solution with Redis/ElastiCache support
 */

export { default as CacheService } from './cache-service';
export { default as SessionManager } from './session-manager';
export { default as RateLimiter } from './rate-limiter';
export { default as QueryCache } from './query-cache';
export { default as ApiCache } from './api-cache';
export { default as RedisClient } from './redis-client';

export * from './types';
export * from './config';

// Convenience exports
import CacheService from './cache-service';
import SessionManager from './session-manager';
import RateLimiter from './rate-limiter';
import QueryCache from './query-cache';
import ApiCache from './api-cache';

/**
 * Initialize all cache services
 */
export async function initializeCache() {
  const cacheService = new CacheService();
  await cacheService.connect();

  const sessionManager = new SessionManager(cacheService);
  const rateLimiter = new RateLimiter(cacheService);
  const queryCache = new QueryCache(cacheService);
  const apiCache = new ApiCache(cacheService);

  return {
    cacheService,
    sessionManager,
    rateLimiter,
    queryCache,
    apiCache,
  };
}

/**
 * Singleton instance for easy access
 */
let cacheInstance: Awaited<ReturnType<typeof initializeCache>> | null = null;

export async function getCache() {
  if (!cacheInstance) {
    cacheInstance = await initializeCache();
  }
  return cacheInstance;
}

export async function closeCache() {
  if (cacheInstance) {
    await cacheInstance.cacheService.disconnect();
    cacheInstance = null;
  }
}
