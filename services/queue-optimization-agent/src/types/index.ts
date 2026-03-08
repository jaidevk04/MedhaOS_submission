export enum QueueType {
  ED = 'ED',
  OPD = 'OPD',
}

export enum QueueStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum Priority {
  CRITICAL = 'CRITICAL',
  URGENT = 'URGENT',
  ROUTINE = 'ROUTINE',
  SCHEDULED = 'SCHEDULED',
}

export interface QueueEntry {
  id: string;
  patientId: string;
  facilityId: string;
  queueType: QueueType;
  priority: Priority;
  urgencyScore: number;
  status: QueueStatus;
  position: number;
  estimatedWaitTime: number; // in minutes
  checkInTime: Date;
  expectedServiceTime: Date;
  actualServiceTime?: Date;
  completedTime?: Date;
  specialty?: string;
  assignedProviderId?: string;
  chiefComplaint?: string;
  metadata?: Record<string, any>;
}

export interface QueueMetrics {
  facilityId: string;
  queueType: QueueType;
  totalPatients: number;
  waitingPatients: number;
  inProgressPatients: number;
  averageWaitTime: number;
  medianWaitTime: number;
  longestWaitTime: number;
  averageServiceTime: number;
  throughputPerHour: number;
  timestamp: Date;
}

export interface WaitTimePrediction {
  patientId: string;
  queueEntryId: string;
  predictedWaitTime: number; // in minutes
  confidence: number; // 0-1
  factors: {
    currentQueueLength: number;
    averageServiceTime: number;
    priorityAdjustment: number;
    historicalPattern: number;
    staffAvailability: number;
  };
  timestamp: Date;
}

export interface ReorderRequest {
  facilityId: string;
  queueType: QueueType;
  reason: string;
}

export interface ReorderResult {
  facilityId: string;
  queueType: QueueType;
  reorderedCount: number;
  averageWaitTimeReduction: number;
  timestamp: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  facilityId: string;
  providerId: string;
  specialty: string;
  appointmentType: QueueType;
  scheduledTime: Date;
  duration: number; // in minutes
  status: 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  urgencyScore?: number;
  chiefComplaint?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentSlot {
  facilityId: string;
  providerId: string;
  specialty: string;
  startTime: Date;
  endTime: Date;
  available: boolean;
  duration: number;
}

export interface AppointmentConflict {
  type: 'DOUBLE_BOOKING' | 'PROVIDER_UNAVAILABLE' | 'FACILITY_CLOSED' | 'SLOT_TAKEN';
  message: string;
  conflictingAppointmentId?: string;
}

export interface NotificationRequest {
  patientId: string;
  type: 'APPOINTMENT_CONFIRMATION' | 'APPOINTMENT_REMINDER' | 'QUEUE_UPDATE' | 'APPOINTMENT_CANCELLATION';
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'PUSH';
  data: Record<string, any>;
}
