/**
 * API Response Cache
 * Caching layer for API responses with ETags and conditional requests
 */

import CacheService from './cache-service';
import { CacheNamespace } from './types';
import { DEFAULT_TTL } from './config';
import crypto from 'crypto';

export interface ApiCacheEntry {
  data: any;
  etag: string;
  headers?: Record<string, string>;
  statusCode: number;
  cachedAt: number;
}

export interface ApiCacheOptions {
  ttl?: number;
  varyBy?: string[]; // Headers to vary cache by (e.g., ['Accept-Language', 'Authorization'])
}

export class ApiCache {
  private cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  /**
   * Generate cache key from URL and vary headers
   */
  private generateKey(
    url: string,
    varyBy?: string[],
    headers?: Record<string, string>
  ): string {
    let keyData = url;

    if (varyBy && headers) {
      const varyValues = varyBy
        .map((header) => `${header}:${headers[header.toLowerCase()] || ''}`)
        .join('|');
      keyData = `${url}|${varyValues}`;
    }

    return crypto.createHash('sha256').update(keyData).digest('hex');
  }

  /**
   * Generate ETag from response data
   */
  private generateETag(data: any): string {
    const content = JSON.stringify(data);
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Cache API response
   */
  public async cacheResponse(
    url: string,
    data: any,
    options: ApiCacheOptions = {},
    headers?: Record<string, string>,
    statusCode: number = 200
  ): Promise<string> {
    const key = this.generateKey(url, options.varyBy, headers);
    const etag = this.generateETag(data);
    const ttl = options.ttl || DEFAULT_TTL.API_RESPONSE;

    const entry: ApiCacheEntry = {
      data,
      etag,
      headers: headers || {},
      statusCode,
      cachedAt: Date.now(),
    };

    await this.cacheService.set(key, entry, {
      prefix: CacheNamespace.API_RESPONSE,
      ttl,
    });

    return etag;
  }

  /**
   * Get cached API response
   */
  public async getCachedResponse(
    url: string,
    options: ApiCacheOptions = {},
    headers?: Record<string, string>
  ): Promise<ApiCacheEntry | null> {
    const key = this.generateKey(url, options.varyBy, headers);
    return await this.cacheService.get<ApiCacheEntry>(key, {
      prefix: CacheNamespace.API_RESPONSE,
    });
  }

  /**
   * Check if cached response matches ETag (for conditional requests)
   */
  public async checkETag(
    url: string,
    etag: string,
    options: ApiCacheOptions = {},
    headers?: Record<string, string>
  ): Promise<boolean> {
    const cached = await this.getCachedResponse(url, options, headers);
    return cached?.etag === etag;
  }

  /**
   * Invalidate cached response
   */
  public async invalidateResponse(
    url: string,
    options: ApiCacheOptions = {},
    headers?: Record<string, string>
  ): Promise<void> {
    const key = this.generateKey(url, options.varyBy, headers);
    await this.cacheService.delete(key, {
      prefix: CacheNamespace.API_RESPONSE,
    });
  }

  /**
   * Invalidate all responses matching a URL pattern
   */
  public async invalidateByPattern(urlPattern: string): Promise<number> {
    // This is a simplified implementation
    // In production, you might want to maintain a URL index
    return await this.cacheService.deleteByPattern(`*${urlPattern}*`, {
      prefix: CacheNamespace.API_RESPONSE,
    });
  }

  /**
   * Get cache age in seconds
   */
  public getCacheAge(entry: ApiCacheEntry): number {
    return Math.floor((Date.now() - entry.cachedAt) / 1000);
  }

  /**
   * Check if cache entry is stale
   */
  public isStale(entry: ApiCacheEntry, maxAge: number): boolean {
    return this.getCacheAge(entry) > maxAge;
  }

  /**
   * Middleware helper for Express/Fastify
   */
  public async handleCachedRequest(
    url: string,
    ifNoneMatch?: string,
    options: ApiCacheOptions = {},
    headers?: Record<string, string>
  ): Promise<
    | { status: 'hit'; data: any; etag: string; age: number }
    | { status: 'not-modified'; etag: string }
    | { status: 'miss' }
  > {
    const cached = await this.getCachedResponse(url, options, headers);

    if (!cached) {
      return { status: 'miss' };
    }

    // Check if client has valid cached version (If-None-Match header)
    if (ifNoneMatch && ifNoneMatch === cached.etag) {
      return { status: 'not-modified', etag: cached.etag };
    }

    return {
      status: 'hit',
      data: cached.data,
      etag: cached.etag,
      age: this.getCacheAge(cached),
    };
  }
}

export default ApiCache;
