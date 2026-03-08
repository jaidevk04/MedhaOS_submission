/**
 * Patient Repository
 * 
 * Handles all database operations for Patient entity
 */

import { Patient, Prisma } from '@prisma/client';
import { prisma } from '../client';
import { handlePrismaError } from '../utils';
import { BaseRepository, FindManyParams } from './base.repository';

export type PatientCreateInput = Prisma.PatientCreateInput;
export type PatientUpdateInput = Prisma.PatientUpdateInput;
export type PatientWithRelations = Prisma.PatientGetPayload<{
  include: {
    medicalHistory: true;
    currentMedications: true;
    encounters: true;
    diagnosticReports: true;
  };
}>;

export class PatientRepository implements BaseRepository<Patient, PatientCreateInput, PatientUpdateInput> {
  /**
   * Find patient by ID
   */
  async findById(id: string): Promise<Patient | null> {
    try {
      return await prisma.patient.findUnique({
        where: { id },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find patient by ID with all relations
   */
  async findByIdWithRelations(id: string): Promise<PatientWithRelations | null> {
    try {
      return await prisma.patient.findUnique({
        where: { id },
        include: {
          medicalHistory: {
            orderBy: { diagnosedDate: 'desc' },
          },
          currentMedications: {
            where: {
              OR: [
                { endDate: null },
                { endDate: { gte: new Date() } },
              ],
            },
            orderBy: { startDate: 'desc' },
          },
          encounters: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          diagnosticReports: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find patient by ABHA ID
   */
  async findByAbhaId(abhaId: string): Promise<Patient | null> {
    try {
      return await prisma.patient.findUnique({
        where: { abhaId },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find patient by phone number
   */
  async findByPhone(phone: string): Promise<Patient | null> {
    try {
      return await prisma.patient.findFirst({
        where: { phone },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Search patients by name
   */
  async searchByName(query: string, limit = 20): Promise<Patient[]> {
    try {
      return await prisma.patient.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find many patients with filtering and pagination
   */
  async findMany(params: FindManyParams = {}): Promise<Patient[]> {
    try {
      return await prisma.patient.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy || { createdAt: 'desc' },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Count patients
   */
  async count(where?: Record<string, unknown>): Promise<number> {
    try {
      return await prisma.patient.count({ where });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Create a new patient
   */
  async create(data: PatientCreateInput): Promise<Patient> {
    try {
      return await prisma.patient.create({
        data,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Update patient by ID
   */
  async update(id: string, data: PatientUpdateInput): Promise<Patient> {
    try {
      return await prisma.patient.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Delete patient by ID
   */
  async delete(id: string): Promise<Patient> {
    try {
      return await prisma.patient.delete({
        where: { id },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Check if patient exists
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await prisma.patient.count({
        where: { id },
      });
      return count > 0;
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Find patients by district and state
   */
  async findByLocation(district: string, state: string, limit = 100): Promise<Patient[]> {
    try {
      return await prisma.patient.findMany({
        where: {
          district,
          state,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw handlePrismaError(error);
    }
  }

  /**
   * Get patient statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byGender: Record<string, number>;
    byState: Record<string, number>;
  }> {
    try {
      const [total, byGender, byState] = await Promise.all([
        prisma.patient.count(),
        prisma.patient.groupBy({
          by: ['gender'],
          _count: true,
        }),
        prisma.patient.groupBy({
          by: ['state'],
          _count: true,
          orderBy: { _count: { state: 'desc' } },
          take: 10,
        }),
      ]);

      return {
        total,
        byGender: Object.fromEntries(
          byGender.map((g) => [g.gender, g._count])
        ),
        byState: Object.fromEntries(
          byState.map((s) => [s.state, s._count])
        ),
      };
    } catch (error) {
      throw handlePrismaError(error);
    }
  }
}

export const patientRepository = new PatientRepository();
