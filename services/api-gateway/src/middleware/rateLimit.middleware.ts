import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

// Create Redis client for rate limiting
const redisClient = new Redis(config.redis.url);

redisClient.on('error', (err) => {
  logger.error('Redis rate limit error:', err);
});

// Global rate limiter (1000 requests per minute per user)
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known typing issue with rate-limit-redis
    client: redisClient,
    prefix: 'rl:global:',
  }),
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    const user = (req as any).user;
    return user?.id || req.ip || 'anonymous';
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000),
    });
  },
});

// Strict rate limiter for authentication endpoints (10 requests per minute)
export const authRateLimiter = rateLimit({
  windowMs: 60000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known typing issue with rate-limit-redis
    client: redisClient,
    prefix: 'rl:auth:',
  }),
  keyGenerator: (req) => req.ip || 'anonymous',
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later',
      retryAfter: 60,
    });
  },
});

// Moderate rate limiter for AI endpoints (100 requests per minute)
export const aiRateLimiter = rateLimit({
  windowMs: 60000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known typing issue with rate-limit-redis
    client: redisClient,
    prefix: 'rl:ai:',
  }),
  keyGenerator: (req) => {
    const user = (req as any).user;
    return user?.id || req.ip || 'anonymous';
  },
  handler: (req, res) => {
    logger.warn(`AI rate limit exceeded for ${req.ip}`);
    res.status(429).json({
      success: false,
      error: 'Too many AI requests, please try again later',
      retryAfter: 60,
    });
  },
});
