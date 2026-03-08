/**
 * Query Cache
 * Specialized caching for database queries
 */

import CacheService from './cache-service';
import { CacheNamespace } from './types';
import { DEFAULT_TTL } from './config';
import crypto from 'crypto';

export interface QueryCacheOptions {
  ttl?: number;
  tags?: string[]; // For cache invalidation by tag
}

export class QueryCache {
  private cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  /**
   * Generate cache key from query and parameters
   */
  private generateKey(query: string, params?: any[]): string {
    const data = JSON.stringify({ query, params });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Cache a query result
   */
  public async cacheQuery<T>(
    query: string,
    params: any[] | undefined,
    result: T,
    options: QueryCacheOptions = {}
  ): Promise<void> {
    const key = this.generateKey(query, params);
    const ttl = options.ttl || DEFAULT_TTL.QUERY;

    await this.cacheService.set(key, result, {
      prefix: CacheNamespace.QUERY,
      ttl,
    });

    // Store tags for invalidation
    if (options.tags && options.tags.length > 0) {
      await this.addTagsToKey(key, options.tags);
    }
  }

  /**
   * Get cached query result
   */
  public async getCachedQuery<T>(
    query: string,
    params?: any[]
  ): Promise<T | null> {
    const key = this.generateKey(query, params);
    return await this.cacheService.get<T>(key, {
      prefix: CacheNamespace.QUERY,
    });
  }

  /**
   * Execute query with caching
   */
  public async executeWithCache<T>(
    query: string,
    params: any[] | undefined,
    executor: () => Promise<T>,
    options: QueryCacheOptions = {}
  ): Promise<T> {
    const cached = await this.getCachedQuery<T>(query, params);
    if (cached !== null) {
      return cached;
    }

    const result = await executor();
    await this.cacheQuery(query, params, result, options);
    return result;
  }

  /**
   * Invalidate query cache by key
   */
  public async invalidateQuery(query: string, params?: any[]): Promise<void> {
    const key = this.generateKey(query, params);
    await this.cacheService.delete(key, {
      prefix: CacheNamespace.QUERY,
    });
  }

  /**
   * Add tags to a cache key for grouped invalidation
   */
  private async addTagsToKey(key: string, tags: string[]): Promise<void> {
    const client = this.cacheService['redisClient'].getClient();

    for (const tag of tags) {
      const tagKey = `${CacheNamespace.QUERY}:tag:${tag}`;
      await client.sadd(tagKey, key);
      // Set expiry on tag set
      await client.expire(tagKey, DEFAULT_TTL.QUERY);
    }
  }

  /**
   * Invalidate all queries with a specific tag
   */
  public async invalidateByTag(tag: string): Promise<number> {
    const client = this.cacheService['redisClient'].getClient();
    const tagKey = `${CacheNamespace.QUERY}:tag:${tag}`;

    const keys = await client.smembers(tagKey);
    if (keys.length === 0) {
      return 0;
    }

    // Delete all keys associated with this tag
    const fullKeys = keys.map((key) => `${CacheNamespace.QUERY}:${key}`);
    const deleted = await client.del(...fullKeys);

    // Delete the tag set itself
    await client.del(tagKey);

    return deleted;
  }

  /**
   * Invalidate multiple tags at once
   */
  public async invalidateByTags(tags: string[]): Promise<number> {
    let totalDeleted = 0;
    for (const tag of tags) {
      const deleted = await this.invalidateByTag(tag);
      totalDeleted += deleted;
    }
    return totalDeleted;
  }

  /**
   * Clear all query cache
   */
  public async clearAll(): Promise<void> {
    await this.cacheService.deleteByPattern('*', {
      prefix: CacheNamespace.QUERY,
    });
  }
}

export default QueryCache;
