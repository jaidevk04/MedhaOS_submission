/**
 * Cache Configuration
 */

import { CacheConfig } from './types';

export const getCacheConfig = (): CacheConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const clusterMode = process.env.REDIS_CLUSTER_MODE === 'true';

  // ElastiCache configuration for production
  if (isProduction && process.env.ELASTICACHE_CLUSTER_ENDPOINT) {
    return {
      host: process.env.ELASTICACHE_CLUSTER_ENDPOINT,
      port: parseInt(process.env.ELASTICACHE_CLUSTER_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      tls: true,
      clusterMode,
      clusterNodes: clusterMode
        ? process.env.REDIS_CLUSTER_NODES?.split(',')
        : undefined,
      maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
      retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
      connectionTimeout: parseInt(
        process.env.REDIS_CONNECTION_TIMEOUT || '5000',
        10
      ),
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '3000', 10),
    };
  }

  // Local Redis configuration for development
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    tls: process.env.REDIS_TLS_ENABLED === 'true',
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
    connectionTimeout: parseInt(
      process.env.REDIS_CONNECTION_TIMEOUT || '5000',
      10
    ),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '3000', 10),
  };
};

export const DEFAULT_TTL = {
  SESSION: parseInt(process.env.CACHE_SESSION_TTL || '900', 10), // 15 minutes
  API_RESPONSE: parseInt(process.env.CACHE_API_RESPONSE_TTL || '300', 10), // 5 minutes
  QUERY: parseInt(process.env.CACHE_QUERY_TTL || '600', 10), // 10 minutes
  DEFAULT: parseInt(process.env.CACHE_DEFAULT_TTL || '3600', 10), // 1 hour
};
