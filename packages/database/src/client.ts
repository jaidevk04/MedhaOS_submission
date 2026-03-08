/**
 * Prisma Client Singleton with Connection Pooling and Read Replicas
 * 
 * Ensures a single Prisma client instance is used across the application
 * to prevent connection pool exhaustion. Supports read replicas for scaling.
 */

import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  prismaReadReplica: PrismaClient;
};

/**
 * Primary database client (read/write)
 */
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

/**
 * Read replica client (read-only)
 * Falls back to primary if no read replica is configured
 */
export const prismaReadReplica =
  globalForPrisma.prismaReadReplica ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'pretty',
    datasources: {
      db: {
        url: process.env.DATABASE_READ_REPLICA_URL || process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaReadReplica = prismaReadReplica;
}

/**
 * Gracefully disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  await Promise.all([prisma.$disconnect(), prismaReadReplica.$disconnect()]);
}

/**
 * Connect to database with retry logic
 */
export async function connectDatabase(
  maxRetries = 5,
  retryDelay = 2000
): Promise<void> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await Promise.all([prisma.$connect(), prismaReadReplica.$connect()]);
      console.log('✅ Database connected successfully');
      console.log(
        `📖 Read replica: ${
          process.env.DATABASE_READ_REPLICA_URL ? 'enabled' : 'using primary'
        }`
      );
      return;
    } catch (error) {
      retries++;
      console.error(
        `❌ Database connection attempt ${retries}/${maxRetries} failed:`,
        error
      );

      if (retries >= maxRetries) {
        throw new Error(
          `Failed to connect to database after ${maxRetries} attempts`
        );
      }

      // Exponential backoff
      const delay = retryDelay * Math.pow(2, retries - 1);
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<{
  primary: boolean;
  replica: boolean;
}> {
  try {
    const [primaryHealth, replicaHealth] = await Promise.allSettled([
      prisma.$queryRaw`SELECT 1`,
      prismaReadReplica.$queryRaw`SELECT 1`,
    ]);

    return {
      primary: primaryHealth.status === 'fulfilled',
      replica: replicaHealth.status === 'fulfilled',
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      primary: false,
      replica: false,
    };
  }
}

/**
 * Get connection pool statistics
 */
export async function getConnectionPoolStats() {
  const metrics = await prisma.$metrics.json();
  return {
    activeConnections: metrics.counters.find(
      (c: any) => c.key === 'prisma_client_queries_active'
    )?.value || 0,
    totalQueries: metrics.counters.find(
      (c: any) => c.key === 'prisma_client_queries_total'
    )?.value || 0,
  };
}

export default prisma;

