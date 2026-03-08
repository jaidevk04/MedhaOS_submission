/**
 * Cache Service
 * High-level caching operations with TTL, namespacing, and serialization
 */

import RedisClient from './redis-client';
import { CacheOptions, CacheNamespace, CacheStats } from './types';
import { DEFAULT_TTL } from './config';

export class CacheService {
  private redisClient: RedisClient;

  constructor() {
    this.redisClient = RedisClient.getInstance();
  }

  /**
   * Initialize cache connection
   */
  public async connect(): Promise<void> {
    await this.redisClient.connect();
  }

  /**
   * Generate namespaced key
   */
  private getKey(key: string, namespace?: CacheNamespace | string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  /**
   * Set a value in cache
   */
  public async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const client = this.redisClient.getClient();
    const fullKey = this.getKey(key, options.prefix);
    const serialized = JSON.stringify(value);
    const ttl = options.ttl || DEFAULT_TTL.DEFAULT;

    await client.setex(fullKey, ttl, serialized);
  }

  /**
   * Get a value from cache
   */
  public async get<T>(
    key: string,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const client = this.redisClient.getClient();
    const fullKey = this.getKey(key, options.prefix);

    const value = await client.get(fullKey);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Failed to parse cached value:', error);
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  public async delete(
    key: string,
    options: CacheOptions = {}
  ): Promise<boolean> {
    const client = this.redisClient.getClient();
    const fullKey = this.getKey(key, options.prefix);

    const result = await client.del(fullKey);
    return result > 0;
  }

  /**
   * Check if key exists
   */
  public async exists(
    key: string,
    options: CacheOptions = {}
  ): Promise<boolean> {
    const client = this.redisClient.getClient();
    const fullKey = this.getKey(key, options.prefix);

    const result = await client.exists(fullKey);
    return result === 1;
  }

  /**
   * Get or set pattern - fetch from cache or compute and cache
   */
  public async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Set multiple keys at once
   */
  public async setMany<T>(
    entries: Array<{ key: string; value: T; ttl?: number }>,
    options: CacheOptions = {}
  ): Promise<void> {
    const client = this.redisClient.getClient();
    const pipeline = client.pipeline();

    for (const entry of entries) {
      const fullKey = this.getKey(entry.key, options.prefix);
      const serialized = JSON.stringify(entry.value);
      const ttl = entry.ttl || options.ttl || DEFAULT_TTL.DEFAULT;

      pipeline.setex(fullKey, ttl, serialized);
    }

    await pipeline.exec();
  }

  /**
   * Get multiple keys at once
   */
  public async getMany<T>(
    keys: string[],
    options: CacheOptions = {}
  ): Promise<Map<string, T>> {
    const client = this.redisClient.getClient();
    const fullKeys = keys.map((key) => this.getKey(key, options.prefix));

    const values = await client.mget(...fullKeys);
    const result = new Map<string, T>();

    keys.forEach((key, index) => {
      const value = values[index];
      if (value) {
        try {
          result.set(key, JSON.parse(value) as T);
        } catch (error) {
          console.error(`Failed to parse cached value for key ${key}:`, error);
        }
      }
    });

    return result;
  }

  /**
   * Delete keys by pattern
   */
  public async deleteByPattern(
    pattern: string,
    options: CacheOptions = {}
  ): Promise<number> {
    const client = this.redisClient.getClient();
    const fullPattern = this.getKey(pattern, options.prefix);

    const keys = await client.keys(fullPattern);
    if (keys.length === 0) {
      return 0;
    }

    return await client.del(...keys);
  }

  /**
   * Increment a counter
   */
  public async increment(
    key: string,
    options: CacheOptions = {}
  ): Promise<number> {
    const client = this.redisClient.getClient();
    const fullKey = this.getKey(key, options.prefix);

    const result = await client.incr(fullKey);

    // Set expiry if specified
    if (options.ttl) {
      await client.expire(fullKey, options.ttl);
    }

    return result;
  }

  /**
   * Decrement a counter
   */
  public async decrement(
    key: string,
    options: CacheOptions = {}
  ): Promise<number> {
    const client = this.redisClient.getClient();
    const fullKey = this.getKey(key, options.prefix);

    return await client.decr(fullKey);
  }

  /**
   * Set expiry on existing key
   */
  public async expire(
    key: string,
    ttl: number,
    options: CacheOptions = {}
  ): Promise<boolean> {
    const client = this.redisClient.getClient();
    const fullKey = this.getKey(key, options.prefix);

    const result = await client.expire(fullKey, ttl);
    return result === 1;
  }

  /**
   * Get time to live for a key
   */
  public async ttl(key: string, options: CacheOptions = {}): Promise<number> {
    const client = this.redisClient.getClient();
    const fullKey = this.getKey(key, options.prefix);

    return await client.ttl(fullKey);
  }

  /**
   * Flush all keys in current database
   */
  public async flushAll(): Promise<void> {
    const client = this.redisClient.getClient();
    await client.flushdb();
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<CacheStats> {
    const client = this.redisClient.getClient();

    const info = await client.info('stats');
    const memory = await client.info('memory');
    const clients = await client.info('clients');
    const dbSize = await client.dbsize();

    // Parse info strings
    const parseInfo = (infoStr: string): Record<string, string> => {
      const lines = infoStr.split('\r\n');
      const result: Record<string, string> = {};
      for (const line of lines) {
        if (line && !line.startsWith('#')) {
          const [key, value] = line.split(':');
          if (key && value) {
            result[key] = value;
          }
        }
      }
      return result;
    };

    const statsInfo = parseInfo(info);
    const memoryInfo = parseInfo(memory);
    const clientsInfo = parseInfo(clients);

    const hits = parseInt(statsInfo.keyspace_hits || '0', 10);
    const misses = parseInt(statsInfo.keyspace_misses || '0', 10);
    const total = hits + misses;
    const hitRate = total > 0 ? hits / total : 0;

    return {
      hits,
      misses,
      hitRate,
      keys: dbSize,
      memory: {
        used: parseInt(memoryInfo.used_memory || '0', 10),
        peak: parseInt(memoryInfo.used_memory_peak || '0', 10),
        fragmentation: parseFloat(memoryInfo.mem_fragmentation_ratio || '1'),
      },
      connections: {
        connected: parseInt(clientsInfo.connected_clients || '0', 10),
        total: parseInt(clientsInfo.total_connections_received || '0', 10),
      },
    };
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    return await this.redisClient.healthCheck();
  }

  /**
   * Disconnect from cache
   */
  public async disconnect(): Promise<void> {
    await this.redisClient.disconnect();
  }
}

export default CacheService;
