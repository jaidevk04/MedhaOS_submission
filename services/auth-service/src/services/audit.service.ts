import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogInput {
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  recordId?: string;
  oldData?: any;
  newData?: any;
  userId?: string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogQuery {
  tableName?: string;
  operation?: string;
  userId?: string;
  recordId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  /**
   * Create an audit log entry
   */
  async createAuditLog(input: AuditLogInput) {
    return prisma.auditLog.create({
      data: {
        tableName: input.tableName,
        operation: input.operation,
        recordId: input.recordId,
        oldData: input.oldData ? JSON.parse(JSON.stringify(input.oldData)) : null,
        newData: input.newData ? JSON.parse(JSON.stringify(input.newData)) : null,
        userId: input.userId,
        userRole: input.userRole,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  /**
   * Query audit logs with filters
   */
  async queryAuditLogs(query: AuditLogQuery) {
    const where: any = {};

    if (query.tableName) {
      where.tableName = query.tableName;
    }

    if (query.operation) {
      where.operation = query.operation;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.recordId) {
      where.recordId = query.recordId;
    }

    if (query.startDate || query.endDate) {
      where.changedAt = {};
      if (query.startDate) {
        where.changedAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.changedAt.lte = query.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { changedAt: 'desc' },
        take: query.limit || 100,
        skip: query.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit: query.limit || 100,
      offset: query.offset || 0,
    };
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string) {
    return prisma.auditLog.findUnique({
      where: { id: BigInt(id) },
    });
  }

  /**
   * Get audit trail for a specific record
   */
  async getRecordAuditTrail(tableName: string, recordId: string) {
    return prisma.auditLog.findMany({
      where: {
        tableName,
        recordId,
      },
      orderBy: { changedAt: 'desc' },
    });
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(userId: string, limit: number = 100) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.changedAt = {};
      if (startDate) {
        where.changedAt.gte = startDate;
      }
      if (endDate) {
        where.changedAt.lte = endDate;
      }
    }

    const [
      totalLogs,
      operationCounts,
      tableCounts,
      userCounts,
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['operation'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['tableName'],
        where,
        _count: true,
        orderBy: { _count: { tableName: 'desc' } },
        take: 10,
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          ...where,
          userId: { not: null },
        },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      operationCounts: operationCounts.map((oc: any) => ({
        operation: oc.operation,
        count: oc._count,
      })),
      tableCounts: tableCounts.map((tc: any) => ({
        tableName: tc.tableName,
        count: tc._count,
      })),
      topUsers: userCounts.map((uc: any) => ({
        userId: uc.userId,
        count: uc._count,
      })),
    };
  }

  /**
   * Delete old audit logs (for retention policy)
   */
  async deleteOldAuditLogs(olderThanDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        changedAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      deletedCount: result.count,
      cutoffDate,
    };
  }

  /**
   * Export audit logs to JSON
   */
  async exportAuditLogs(query: AuditLogQuery) {
    const result = await this.queryAuditLogs({
      ...query,
      limit: query.limit || 10000, // Max export limit
    });

    return result.logs.map((log: any) => ({
      id: log.id.toString(),
      tableName: log.tableName,
      operation: log.operation,
      recordId: log.recordId,
      oldData: log.oldData,
      newData: log.newData,
      userId: log.userId,
      userRole: log.userRole,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      changedAt: log.changedAt.toISOString(),
    }));
  }
}

export const auditService = new AuditService();
