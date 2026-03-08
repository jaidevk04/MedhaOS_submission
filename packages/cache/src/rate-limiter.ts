/**
 * Rate Limiter
 * Token bucket algorithm implementation using Redis
 */

import CacheService from './cache-service';
import { RateLimitConfig, RateLimitResult, CacheNamespace } from './types';

export class RateLimiter {
  private cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  /**
   * Check if request is allowed under rate limit
   * Uses sliding window algorithm
   */
  public async checkLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const key = `${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const client = this.cacheService['redisClient'].getClient();
    const fullKey = `${CacheNamespace.RATE_LIMIT}:${key}`;

    // Use Redis sorted set for sliding window
    const pipeline = client.pipeline();

    // Remove old entries outside the window
    pipeline.zremrangebyscore(fullKey, 0, windowStart);

    // Count requests in current window
    pipeline.zcard(fullKey);

    // Add current request
    pipeline.zadd(fullKey, now, `${now}`);

    // Set expiry
    pipeline.expire(fullKey, Math.ceil(config.windowMs / 1000));

    const results = await pipeline.exec();

    // Extract count from pipeline results
    const count = (results?.[1]?.[1] as number) || 0;

    const allowed = count < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count - 1);
    const resetAt = now + config.windowMs;

    // If not allowed, remove the request we just added
    if (!allowed) {
      await client.zrem(fullKey, `${now}`);
    }

    return {
      allowed,
      remaining,
      resetAt,
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  public async resetLimit(identifier: string): Promise<void> {
    await this.cacheService.delete(identifier, {
      prefix: CacheNamespace.RATE_LIMIT,
    });
  }

  /**
   * Get current request count
   */
  public async getCurrentCount(
    identifier: string,
    windowMs: number
  ): Promise<number> {
    const key = `${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const client = this.cacheService['redisClient'].getClient();
    const fullKey = `${CacheNamespace.RATE_LIMIT}:${key}`;

    const count = await client.zcount(fullKey, windowStart, now);
    return count;
  }

  /**
   * Middleware-friendly rate limit check
   */
  public async limit(
    identifier: string,
    maxRequests: number = 1000,
    windowMs: number = 60000 // 1 minute
  ): Promise<RateLimitResult> {
    return await this.checkLimit(identifier, { maxRequests, windowMs });
  }
}

export default RateLimiter;
