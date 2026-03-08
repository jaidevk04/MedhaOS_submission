/**
 * Cache Types and Interfaces
 */

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  tls?: boolean;
  clusterMode?: boolean;
  clusterNodes?: string[];
  maxRetries?: number;
  retryDelay?: number;
  connectionTimeout?: number;
  commandTimeout?: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
}

export interface SessionData {
  userId: string;
  role: string;
  permissions: string[];
  facilityId?: string;
  expiresAt: number;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  keys: number;
  memory: {
    used: number;
    peak: number;
    fragmentation: number;
  };
  connections: {
    connected: number;
    total: number;
  };
}

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export enum CacheNamespace {
  SESSION = 'session',
  API_RESPONSE = 'api',
  QUERY = 'query',
  USER = 'user',
  PATIENT = 'patient',
  AGENT_CONTEXT = 'agent',
  RATE_LIMIT = 'ratelimit',
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}
