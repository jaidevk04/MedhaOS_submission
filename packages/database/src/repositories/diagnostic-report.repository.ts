/**
 * Diagnostic Report Repository
 * 
 * Handles all database operations for DiagnosticReport entity
 */

import { DiagnosticReport, Prisma } from '@prisma/client';
import { prisma } from '../client';
import { handlePrismaError } from '../utils';
import { BaseRepository, FindManyParams } from './base.repository';

export type DiagnosticReportCreateInput = Prisma.DiagnosticReportCreateInput;
export type DiagnosticReportUpdateInput = Prisma.DiagnosticReportUpdateInput;
export type DiagnosticReportWithRelations = Prisma.DiagnosticReportGetPayload<{
  include: {
    patient: true;
    encounter: true;
  };
}>;

export class DiagnosticReportRepository
  implements BaseRepository<DiagnosticReport, DiagnosticReportCreateInput, DiagnosticReportUpdateInput>
{
  /**
   * Find report by ID
   */
  async findById(id: string): Promise<DiagnosticReport | null> {
    try {
      return await prisma.diagnosticReport.findUnique({
        where: { id },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find report by ID with relations
   */
  async findByIdWithRelations(id: string): Promise<DiagnosticReportWithRelations | null> {
    try {
      return await prisma.diagnosticReport.findUnique({
        where: { id },
        include: {
          patient: true,
          encounter: true,
        },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find reports by patient ID
   */
  async findByPatientId(patientId: string, limit = 50): Promise<DiagnosticReport[]> {
    try {
      return await prisma.diagnosticReport.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find reports by encounter ID
   */
  async findByEncounterId(encounterId: string): Promise<DiagnosticReport[]> {
    try {
      return await prisma.diagnosticReport.findMany({
        where: { encounterId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find reports by status
   */
  async findByStatus(status: string, limit = 100): Promise<DiagnosticReport[]> {
    try {
      return await prisma.diagnosticReport.findMany({
        where: { status },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find pending AI analysis reports
   */
  async findPendingAIAnalysis(limit = 50): Promise<DiagnosticReport[]> {
    try {
      return await prisma.diagnosticReport.findMany({
        where: {
          status: 'pending',
          imageUrls: {
            isEmpty: false,
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find reports requiring verification
   */
  async findRequiringVerification(limit = 50): Promise<DiagnosticReport[]> {
    try {
      return await prisma.diagnosticReport.findMany({
        where: {
          status: 'ai_completed',
          verifiedAt: null,
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find reports by report type and modality
   */
  async findByTypeAndModality(
    reportType: string,
    modality?: string,
    limit = 100
  ): Promise<DiagnosticReport[]> {
    try {
      return await prisma.diagnosticReport.findMany({
        where: {
          reportType,
          ...(modality && { modality }),
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find many reports with filtering and pagination
   */
  async findMany(params: FindManyParams = {}): Promise<DiagnosticReport[]> {
    try {
      return await prisma.diagnosticReport.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy || { createdAt: 'desc' },
        include: params.include as Prisma.DiagnosticReportInclude,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Count reports
   */
  async count(where?: Record<string, unknown>): Promise<number> {
    try {
      return await prisma.diagnosticReport.count({ where });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Create a new report
   */
  async create(data: DiagnosticReportCreateInput): Promise<DiagnosticReport> {
    try {
      return await prisma.diagnosticReport.create({
        data,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Update report by ID
   */
  async update(id: string, data: DiagnosticReportUpdateInput): Promise<DiagnosticReport> {
    try {
      return await prisma.diagnosticReport.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Delete report by ID
   */
  async delete(id: string): Promise<DiagnosticReport> {
    try {
      return await prisma.diagnosticReport.delete({
        where: { id },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Check if report exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await prisma.diagnosticReport.count({
        where: { id },
      });
      return count > 0;
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Update AI analysis results
   */
  async updateAIAnalysis(
    id: string,
    aiFindings: string[],
    aiAnomalies: Prisma.JsonValue,
    aiDraftReport: string,
    aiConfidence: number,
    processingTimeMs: number
  ): Promise<DiagnosticReport> {
    try {
      return await prisma.diagnosticReport.update({
        where: { id },
        data: {
          aiFindings,
          aiAnomalies,
          aiDraftReport,
          aiConfidence,
          processingTimeMs,
          status: 'ai_completed',
        },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Verify report by radiologist
   */
  async verifyReport(
    id: string,
    radiologistReport: string,
    verifiedBy: string
  ): Promise<DiagnosticReport> {
    try {
      return await prisma.diagnosticReport.update({
        where: { id },
        data: {
          radiologistReport,
          verifiedBy,
          verifiedAt: new Date(),
          status: 'verified',
        },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Finalize report
   */
  async finalizeReport(id: string): Promise<DiagnosticReport> {
    try {
      return await prisma.diagnosticReport.update({
        where: { id },
        data: {
          status: 'finalized',
        },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Get report statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    averageProcessingTime: number;
    averageAIConfidence: number;
  }> {
    try {
      const [total, byType, byStatus, avgProcessing, avgConfidence] = await Promise.all([
        prisma.diagnosticReport.count(),
        prisma.diagnosticReport.groupBy({
          by: ['reportType'],
          _count: true,
        }),
        prisma.diagnosticReport.groupBy({
          by: ['status'],
          _count: true,
        }),
        prisma.diagnosticReport.aggregate({
          where: { processingTimeMs: { not: null } },
          _avg: { processingTimeMs: true },
        }),
        prisma.diagnosticReport.aggregate({
          where: { aiConfidence: { not: null } },
          _avg: { aiConfidence: true },
        }),
      ]);

      return {
        total,
        byType: Object.fromEntries(
          byType.map((t) => [t.reportType, t._count])
        ),
        byStatus: Object.fromEntries(
          byStatus.map((s) => [s.status, s._count])
        ),
        averageProcessingTime: avgProcessing._avg.processingTimeMs || 0,
        averageAIConfidence: avgConfidence._avg.aiConfidence || 0,
      };
    } catch (error) {
      throw handlePrismaError(error);
    }
  }
}

export const diagnosticReportRepository = new DiagnosticReportRepository();
