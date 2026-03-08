/**
 * Clinical Encounter Repository
 * 
 * Handles all database operations for ClinicalEncounter entity
 */

import { ClinicalEncounter, Prisma } from '@prisma/client';
import { prisma } from '../client';
import { handlePrismaError } from '../utils';
import { BaseRepository, FindManyParams } from './base.repository';

export type ClinicalEncounterCreateInput = Prisma.ClinicalEncounterCreateInput;
export type ClinicalEncounterUpdateInput = Prisma.ClinicalEncounterUpdateInput;
export type ClinicalEncounterWithRelations = Prisma.ClinicalEncounterGetPayload<{
  include: {
    patient: true;
    diagnoses: true;
    prescriptions: true;
    diagnosticOrders: true;
    diagnosticReports: true;
  };
}>;

export class ClinicalEncounterRepository
  implements BaseRepository<ClinicalEncounter, ClinicalEncounterCreateInput, ClinicalEncounterUpdateInput>
{
  /**
   * Find encounter by ID
   */
  async findById(id: string): Promise<ClinicalEncounter | null> {
    try {
      return await prisma.clinicalEncounter.findUnique({
        where: { id },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find encounter by ID with all relations
   */
  async findByIdWithRelations(id: string): Promise<ClinicalEncounterWithRelations | null> {
    try {
      return await prisma.clinicalEncounter.findUnique({
        where: { id },
        include: {
          patient: true,
          diagnoses: true,
          prescriptions: true,
          diagnosticOrders: true,
          diagnosticReports: true,
        },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find encounter by encounter number
   */
  async findByEncounterNumber(encounterNumber: string): Promise<ClinicalEncounter | null> {
    try {
      return await prisma.clinicalEncounter.findUnique({
        where: { encounterNumber },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find encounters by patient ID
   */
  async findByPatientId(patientId: string, limit = 20): Promise<ClinicalEncounter[]> {
    try {
      return await prisma.clinicalEncounter.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find encounters by facility ID
   */
  async findByFacilityId(facilityId: string, limit = 100): Promise<ClinicalEncounter[]> {
    try {
      return await prisma.clinicalEncounter.findMany({
        where: { facilityId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find active encounters (in_progress status)
   */
  async findActive(facilityId?: string): Promise<ClinicalEncounter[]> {
    try {
      return await prisma.clinicalEncounter.findMany({
        where: {
          status: 'in_progress',
          ...(facilityId && { facilityId }),
        },
        orderBy: [
          { urgencyScore: 'desc' },
          { createdAt: 'asc' },
        ],
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find encounters by urgency score range
   */
  async findByUrgencyRange(minScore: number, maxScore: number, limit = 50): Promise<ClinicalEncounter[]> {
    try {
      return await prisma.clinicalEncounter.findMany({
        where: {
          urgencyScore: {
            gte: minScore,
            lte: maxScore,
          },
          status: 'in_progress',
        },
        orderBy: { urgencyScore: 'desc' },
        take: limit,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find many encounters with filtering and pagination
   */
  async findMany(params: FindManyParams = {}): Promise<ClinicalEncounter[]> {
    try {
      return await prisma.clinicalEncounter.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy || { createdAt: 'desc' },
        include: params.include as Prisma.ClinicalEncounterInclude,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Count encounters
   */
  async count(where?: Record<string, unknown>): Promise<number> {
    try {
      return await prisma.clinicalEncounter.count({ where });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Create a new encounter
   */
  async create(data: ClinicalEncounterCreateInput): Promise<ClinicalEncounter> {
    try {
      return await prisma.clinicalEncounter.create({
        data,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Update encounter by ID
   */
  async update(id: string, data: ClinicalEncounterUpdateInput): Promise<ClinicalEncounter> {
    try {
      return await prisma.clinicalEncounter.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Delete encounter by ID
   */
  async delete(id: string): Promise<ClinicalEncounter> {
    try {
      return await prisma.clinicalEncounter.delete({
        where: { id },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Check if encounter exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await prisma.clinicalEncounter.count({
        where: { id },
      });
      return count > 0;
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Update encounter status
   */
  async updateStatus(id: string, status: string): Promise<ClinicalEncounter> {
    try {
      return await prisma.clinicalEncounter.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Get encounter statistics
   */
  async getStatistics(facilityId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    averageUrgencyScore: number;
  }> {
    try {
      const where = facilityId ? { facilityId } : {};

      const [total, byType, byStatus, avgUrgency] = await Promise.all([
        prisma.clinicalEncounter.count({ where }),
        prisma.clinicalEncounter.groupBy({
          by: ['encounterType'],
          where,
          _count: true,
        }),
        prisma.clinicalEncounter.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        prisma.clinicalEncounter.aggregate({
          where: {
            ...where,
            urgencyScore: { not: null },
          },
          _avg: { urgencyScore: true },
        }),
      ]);

      return {
        total,
        byType: Object.fromEntries(
          byType.map((t) => [t.encounterType, t._count])
        ),
        byStatus: Object.fromEntries(
          byStatus.map((s) => [s.status, s._count])
        ),
        averageUrgencyScore: avgUrgency._avg.urgencyScore || 0,
      };
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Generate unique encounter number
   */
  async generateEncounterNumber(facilityId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Get count of encounters today for this facility
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const count = await prisma.clinicalEncounter.count({
      where: {
        facilityId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    const facilityCode = facilityId.substring(0, 4).toUpperCase();
    
    return `ENC-${facilityCode}-${year}${month}${day}-${sequence}`;
  }
}

export const clinicalEncounterRepository = new ClinicalEncounterRepository();
