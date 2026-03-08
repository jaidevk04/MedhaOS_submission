# @medhaos/cache

Comprehensive caching solution for MedhaOS with Redis/ElastiCache support.

## Features

- **Redis/ElastiCache Support**: Works with standalone Redis, Redis Sentinel, and ElastiCache cluster mode
- **Session Management**: Secure session storage with automatic expiration
- **Rate Limiting**: Token bucket algorithm for API rate limiting
- **Query Caching**: Database query result caching with tag-based invalidation
- **API Response Caching**: HTTP response caching with ETag support
- **Connection Pooling**: Automatic connection management and retry logic
- **Health Checks**: Built-in health monitoring
- **TypeScript**: Full type safety

## Installation

```bash
npm install @medhaos/cache
```

## Configuration

Create a `.env` file:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ElastiCache (Production)
ELASTICACHE_CLUSTER_ENDPOINT=your-cluster.cache.amazonaws.com
ELASTICACHE_CLUSTER_PORT=6379

# Cache TTL (seconds)
CACHE_SESSION_TTL=900
CACHE_API_RESPONSE_TTL=300
CACHE_QUERY_TTL=600
CACHE_DEFAULT_TTL=3600
```

## Usage

### Initialize Cache

```typescript
import { initializeCache } from '@medhaos/cache';

const cache = await initializeCache();
```

### Basic Caching

```typescript
import { CacheService, CacheNamespace } from '@medhaos/cache';

const cacheService = new CacheService();
await cacheService.connect();

// Set a value
await cacheService.set('user:123', { name: 'John', age: 30 }, {
  prefix: CacheNamespace.USER,
  ttl: 3600
});

// Get a value
const user = await cacheService.get('user:123', {
  prefix: CacheNamespace.USER
});

// Get or set pattern
const data = await cacheService.getOrSet(
  'expensive-operation',
  async () => {
    // Expensive computation
    return await fetchDataFromDatabase();
  },
  { ttl: 600 }
);
```

### Session Management

```typescript
import { SessionManager } from '@medhaos/cache';

const sessionManager = new SessionManager(cacheService);

// Create session
await sessionManager.createSession('session-id-123', {
  userId: 'user-123',
  role: 'doctor',
  permissions: ['read:patients', 'write:prescriptions'],
  facilityId: 'facility-456',
  expiresAt: Date.now() + 900000
});

// Get session
const session = await sessionManager.getSession('session-id-123');

// Refresh session
await sessionManager.refreshSession('session-id-123');

// Delete session
await sessionManager.deleteSession('session-id-123');
```

### Rate Limiting

```typescript
import { RateLimiter } from '@medhaos/cache';

const rateLimiter = new RateLimiter(cacheService);

// Check rate limit
const result = await rateLimiter.limit('user:123', 1000, 60000);

if (!result.allowed) {
  throw new Error(`Rate limit exceeded. Try again in ${result.resetAt - Date.now()}ms`);
}

console.log(`Remaining requests: ${result.remaining}`);
```

### Query Caching

```typescript
import { QueryCache } from '@medhaos/cache';

const queryCache = new QueryCache(cacheService);

// Execute query with caching
const patients = await queryCache.executeWithCache(
  'SELECT * FROM patients WHERE facility_id = ?',
  ['facility-123'],
  async () => {
    return await database.query('SELECT * FROM patients WHERE facility_id = ?', ['facility-123']);
  },
  {
    ttl: 600,
    tags: ['patients', 'facility-123']
  }
);

// Invalidate by tag
await queryCache.invalidateByTag('patients');
```

### API Response Caching

```typescript
import { ApiCache } from '@medhaos/cache';

const apiCache = new ApiCache(cacheService);

// In your API handler
const url = '/api/patients/123';
const ifNoneMatch = req.headers['if-none-match'];

const cached = await apiCache.handleCachedRequest(url, ifNoneMatch, {
  ttl: 300,
  varyBy: ['Accept-Language']
}, req.headers);

if (cached.status === 'not-modified') {
  return res.status(304).send();
}

if (cached.status === 'hit') {
  return res
    .set('ETag', cached.etag)
    .set('Age', cached.age.toString())
    .set('X-Cache', 'HIT')
    .json(cached.data);
}

// Fetch fresh data
const data = await fetchPatientData('123');

// Cache the response
const etag = await apiCache.cacheResponse(url, data, { ttl: 300 }, req.headers);

return res
  .set('ETag', etag)
  .set('X-Cache', 'MISS')
  .json(data);
```

### Express Middleware Example

```typescript
import express from 'express';
import { getCache } from '@medhaos/cache';

const app = express();
const cache = await getCache();

// Rate limiting middleware
app.use(async (req, res, next) => {
  const identifier = req.ip || 'anonymous';
  const result = await cache.rateLimiter.limit(identifier, 1000, 60000);

  res.set('X-RateLimit-Limit', '1000');
  res.set('X-RateLimit-Remaining', result.remaining.toString());
  res.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString());

  if (!result.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  next();
});

// API caching middleware
function cacheMiddleware(ttl: number = 300) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const url = req.originalUrl;
    const ifNoneMatch = req.headers['if-none-match'];

    const cached = await cache.apiCache.handleCachedRequest(
      url,
      ifNoneMatch as string,
      { ttl },
      req.headers as Record<string, string>
    );

    if (cached.status === 'not-modified') {
      return res.status(304).send();
    }

    if (cached.status === 'hit') {
      return res
        .set('ETag', cached.etag)
        .set('Age', cached.age.toString())
        .set('X-Cache', 'HIT')
        .json(cached.data);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (data: any) {
      cache.apiCache.cacheResponse(url, data, { ttl }, req.headers as Record<string, string>)
        .then(etag => {
          res.set('ETag', etag);
          res.set('X-Cache', 'MISS');
        });
      return originalJson(data);
    };

    next();
  };
}

// Use caching on specific routes
app.get('/api/patients', cacheMiddleware(300), async (req, res) => {
  const patients = await fetchPatients();
  res.json(patients);
});
```

### Health Check

```typescript
// Health check endpoint
app.get('/health/cache', async (req, res) => {
  const healthy = await cache.cacheService.healthCheck();
  const stats = await cache.cacheService.getStats();

  res.json({
    status: healthy ? 'healthy' : 'unhealthy',
    stats
  });
});
```

## Cache Namespaces

The package provides predefined namespaces for organizing cache keys:

- `SESSION`: User sessions
- `API_RESPONSE`: API response caching
- `QUERY`: Database query results
- `USER`: User data
- `PATIENT`: Patient data
- `AGENT_CONTEXT`: AI agent context
- `RATE_LIMIT`: Rate limiting counters

## Performance Considerations

- **Connection Pooling**: The package uses a singleton pattern to reuse Redis connections
- **Pipeline Operations**: Batch operations use Redis pipelines for better performance
- **Compression**: Consider enabling Redis compression for large values
- **TTL Strategy**: Set appropriate TTLs based on data volatility
- **Monitoring**: Use the stats API to monitor cache hit rates

## Production Deployment

### ElastiCache Configuration

```typescript
// .env for production
ELASTICACHE_CLUSTER_ENDPOINT=medhaos-prod.abc123.cache.amazonaws.com
ELASTICACHE_CLUSTER_PORT=6379
REDIS_TLS_ENABLED=true
REDIS_CLUSTER_MODE=true
REDIS_CLUSTER_NODES=node1:6379,node2:6379,node3:6379
```

### Monitoring

```typescript
// Get cache statistics
const stats = await cacheService.getStats();
console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`Total keys: ${stats.keys}`);
console.log(`Memory used: ${(stats.memory.used / 1024 / 1024).toFixed(2)} MB`);
```

## License

MIT
