/**
 * Database Type Definitions
 * 
 * Re-exports Prisma types and defines additional utility types
 */

export { PrismaClient } from '@prisma/client';

export type {
  // Clinical models
  Patient,
  MedicalHistory,
  CurrentMedication,
  ClinicalEncounter,
  Diagnosis,
  Prescription,
  DiagnosticOrder,
  DiagnosticReport,
  // Operational models
  Facility,
  AgentTask,
  // Auth models
  User,
  RefreshToken,
  Role,
  Permission,
  RolePermission,
  UserPermission,
  // Audit models
  AuditLog,
  // Prisma namespace
  Prisma,
} from '@prisma/client';

/**
 * Encounter types
 */
export enum EncounterType {
  ED = 'ED',
  OPD = 'OPD',
  IPD = 'IPD',
  Telemedicine = 'Telemedicine',
}

/**
 * Encounter status
 */
export enum EncounterStatus {
  InProgress = 'in_progress',
  Completed = 'completed',
  Admitted = 'admitted',
  Discharged = 'discharged',
}

/**
 * Report status
 */
export enum ReportStatus {
  Pending = 'pending',
  AICompleted = 'ai_completed',
  Verified = 'verified',
  Finalized = 'finalized',
}

/**
 * Task status
 */
export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed',
}

/**
 * Urgency levels
 */
export enum UrgencyLevel {
  CRITICAL = 'CRITICAL',
  URGENT = 'URGENT',
  ROUTINE = 'ROUTINE',
  SCHEDULED = 'SCHEDULED',
}

/**
 * Diagnostic urgency
 */
export enum DiagnosticUrgency {
  STAT = 'STAT',
  Urgent = 'Urgent',
  Routine = 'Routine',
}

/**
 * Medical history status
 */
export enum MedicalHistoryStatus {
  Active = 'active',
  Resolved = 'resolved',
  Chronic = 'chronic',
}

/**
 * Diagnosis type
 */
export enum DiagnosisType {
  Primary = 'primary',
  Secondary = 'secondary',
  Differential = 'differential',
}

/**
 * Facility type
 */
export enum FacilityType {
  Hospital = 'hospital',
  Clinic = 'clinic',
  DiagnosticCenter = 'diagnostic_center',
}

/**
 * Audit operation
 */
export enum AuditOperation {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}
