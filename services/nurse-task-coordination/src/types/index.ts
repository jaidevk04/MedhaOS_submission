export enum TaskType {
  MEDICATION_ADMINISTRATION = 'MEDICATION_ADMINISTRATION',
  VITAL_SIGNS_CHECK = 'VITAL_SIGNS_CHECK',
  WOUND_CARE = 'WOUND_CARE',
  PATIENT_ASSESSMENT = 'PATIENT_ASSESSMENT',
  IV_MANAGEMENT = 'IV_MANAGEMENT',
  PATIENT_TRANSPORT = 'PATIENT_TRANSPORT',
  DOCUMENTATION = 'DOCUMENTATION',
  PATIENT_EDUCATION = 'PATIENT_EDUCATION',
  SPECIMEN_COLLECTION = 'SPECIMEN_COLLECTION',
  EMERGENCY_RESPONSE = 'EMERGENCY_RESPONSE',
}

export enum TaskPriority {
  CRITICAL = 'CRITICAL', // 100
  URGENT = 'URGENT', // 75
  ROUTINE = 'ROUTINE', // 50
  SCHEDULED = 'SCHEDULED', // 25
}

export enum TaskStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ESCALATED = 'ESCALATED',
}

export enum NurseStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  ON_BREAK = 'ON_BREAK',
  OFF_DUTY = 'OFF_DUTY',
}

export interface NurseTask {
  taskId: string;
  patientId: string;
  patientName: string;
  patientRoom: string;
  taskType: TaskType;
  priority: TaskPriority;
  priorityScore: number;
  description: string;
  dueTime?: Date;
  assignedNurseId?: string;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  estimatedDurationMinutes: number;
  requiresBarcodeScan?: boolean;
  medicationDetails?: {
    medicationName: string;
    dosage: string;
    route: string;
    barcode?: string;
  };
}

export interface Nurse {
  nurseId: string;
  name: string;
  skillLevel: 'JUNIOR' | 'INTERMEDIATE' | 'SENIOR' | 'CHARGE';
  status: NurseStatus;
  currentWorkload: number; // Number of assigned tasks
  assignedPatients: string[];
  currentLocation?: string;
  shiftStart: Date;
  shiftEnd: Date;
}

export interface WorkloadMetrics {
  nurseId: string;
  nurseName: string;
  currentTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasksToday: number;
  averageTaskCompletionTime: number;
  workloadScore: number; // 0-100
  isOverloaded: boolean;
  lastUpdated: Date;
}

export interface TaskAssignment {
  taskId: string;
  nurseId: string;
  assignedAt: Date;
  reason: string;
  confidence: number;
}

export interface TaskRedistribution {
  taskId: string;
  fromNurseId: string;
  toNurseId: string;
  reason: string;
  timestamp: Date;
}

export interface OverloadAlert {
  alertId: string;
  nurseId: string;
  nurseName: string;
  currentWorkload: number;
  threshold: number;
  severity: 'WARNING' | 'CRITICAL';
  timestamp: Date;
  escalatedToChargeNurse: boolean;
  resolved: boolean;
}

export interface TaskRouterConfig {
  maxNurseWorkload: number;
  taskRedistributionThreshold: number;
  criticalTaskPriority: number;
  urgentTaskPriority: number;
  routineTaskPriority: number;
  overloadAlertThreshold: number;
  escalationTimeoutMinutes: number;
}

export interface TaskPrioritizationResult {
  taskId: string;
  priorityScore: number;
  recommendedNurseId: string;
  alternativeNurseIds: string[];
  reasoning: string;
}
