/**
 * Query Optimizer
 * Utilities for optimizing database queries and managing indexes
 */

import { prisma, prismaReadReplica } from './client';

export interface QueryPerformance {
  query: string;
  executionTime: number;
  rowsAffected: number;
  useIndex: boolean;
}

export class QueryOptimizer {
  /**
   * Execute query with performance tracking
   */
  static async executeWithTracking<T>(
    queryFn: () => Promise<T>,
    queryName: string
  ): Promise<{ result: T; performance: QueryPerformance }> {
    const startTime = Date.now();

    const result = await queryFn();

    const executionTime = Date.now() - startTime;

    const performance: QueryPerformance = {
      query: queryName,
      executionTime,
      rowsAffected: Array.isArray(result) ? result.length : 1,
      useIndex: true, // This would need actual EXPLAIN analysis
    };

    if (executionTime > 1000) {
      console.warn(
        `⚠️ Slow query detected: ${queryName} took ${executionTime}ms`
      );
    }

    return { result, performance };
  }

  /**
   * Route read queries to read replica
   */
  static getReadClient() {
    return prismaReadReplica;
  }

  /**
   * Route write queries to primary
   */
  static getWriteClient() {
    return prisma;
  }

  /**
   * Batch operations for better performance
   */
  static async batchCreate<T>(
    model: any,
    data: T[],
    batchSize: number = 100
  ): Promise<number> {
    let totalCreated = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const result = await model.createMany({
        data: batch,
        skipDuplicates: true,
      });
      totalCreated += result.count;
    }

    return totalCreated;
  }

  /**
   * Batch update operations
   */
  static async batchUpdate<T>(
    model: any,
    updates: Array<{ where: any; data: any }>,
    batchSize: number = 50
  ): Promise<number> {
    let totalUpdated = 0;

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      await prisma.$transaction(
        batch.map((update) =>
          model.update({
            where: update.where,
            data: update.data,
          })
        )
      );

      totalUpdated += batch.length;
    }

    return totalUpdated;
  }

  /**
   * Analyze query performance
   */
  static async analyzeQuery(query: string): Promise<any> {
    // This would use EXPLAIN ANALYZE in production
    const result = await prisma.$queryRawUnsafe(`EXPLAIN ANALYZE ${query}`);
    return result;
  }

  /**
   * Get slow query log
   */
  static async getSlowQueries(
    minDuration: number = 1000
  ): Promise<QueryPerformance[]> {
    // This would integrate with PostgreSQL slow query log
    // For now, return empty array
    return [];
  }

  /**
   * Suggest indexes based on query patterns
   */
  static async suggestIndexes(tableName: string): Promise<string[]> {
    // This would analyze query patterns and suggest indexes
    // For now, return common index suggestions
    return [
      `CREATE INDEX IF NOT EXISTS idx_${tableName}_created_at ON ${tableName}(created_at DESC);`,
      `CREATE INDEX IF NOT EXISTS idx_${tableName}_updated_at ON ${tableName}(updated_at DESC);`,
    ];
  }

  /**
   * Vacuum and analyze tables for better performance
   */
  static async optimizeTables(tables: string[]): Promise<void> {
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`VACUUM ANALYZE ${table}`);
      console.log(`✅ Optimized table: ${table}`);
    }
  }
}

export default QueryOptimizer;
