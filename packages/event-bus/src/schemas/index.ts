/**
 * Event Schema Definitions for MedhaOS Event-Driven Architecture
 * 
 * All events follow a standard structure with:
 * - eventId: Unique identifier
 * - eventType: Type of event
 * - source: Service that generated the event
 * - timestamp: When the event occurred
 * - correlationId: For tracking related events
 * - data: Event-specific payload
 */

export interface BaseEvent {
  eventId: string;
  eventType: string;
  source: string;
  timestamp: string;
  correlationId: string;
  version: string;
  metadata?: Record<string, any>;
}

// ==================== CLINICAL EVENTS ====================

export interface PatientRegisteredEvent extends BaseEvent {
  eventType: 'patient.registered';
  data: {
    patientId: string;
    abhaId?: string;
    demographics: {
      name: string;
      age: number;
      gender: string;
      language: string;
      contact: {
        phone: string;
        email?: string;
      };
    };
  };
}

export interface TriageCompletedEvent extends BaseEvent {
  eventType: 'triage.completed';
  data: {
    patientId: string;
    encounterId: string;
    urgencyScore: number;
    symptoms: string[];
    recommendedSpecialty: string;
    recommendedAction: 'ED' | 'OPD' | 'Telemedicine';
    triageData: Record<string, any>;
  };
}

export interface AppointmentScheduledEvent extends BaseEvent {
  eventType: 'appointment.scheduled';
  data: {
    appointmentId: string;
    patientId: string;
    facilityId: string;
    clinicianId: string;
    specialty: string;
    scheduledTime: string;
    appointmentType: 'ED' | 'OPD' | 'Telemedicine';
    estimatedWaitTime?: number;
  };
}

export interface ConsultationStartedEvent extends BaseEvent {
  eventType: 'consultation.started';
  data: {
    encounterId: string;
    patientId: string;
    clinicianId: string;
    facilityId: string;
    startTime: string;
    ambientScribeEnabled: boolean;
  };
}

export interface ConsultationCompletedEvent extends BaseEvent {
  eventType: 'consultation.completed';
  data: {
    encounterId: string;
    patientId: string;
    clinicianId: string;
    diagnoses: Array<{
      icdCode: string;
      description: string;
      confidence: number;
    }>;
    prescriptions: Array<{
      drugName: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    diagnosticOrders: Array<{
      testType: string;
      urgency: 'STAT' | 'Routine';
    }>;
    completedTime: string;
  };
}

export interface PrescriptionCreatedEvent extends BaseEvent {
  eventType: 'prescription.created';
  data: {
    prescriptionId: string;
    patientId: string;
    clinicianId: string;
    encounterId: string;
    medications: Array<{
      drugName: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions: string;
    }>;
    safetyChecksPerformed: boolean;
    interactionsDetected: boolean;
  };
}

export interface DiagnosticOrderedEvent extends BaseEvent {
  eventType: 'diagnostic.ordered';
  data: {
    orderId: string;
    patientId: string;
    encounterId: string;
    testType: string;
    modality?: string;
    urgency: 'STAT' | 'Routine';
    clinicalIndication: string;
  };
}

export interface DiagnosticCompletedEvent extends BaseEvent {
  eventType: 'diagnostic.completed';
  data: {
    reportId: string;
    orderId: string;
    patientId: string;
    reportType: 'radiology' | 'laboratory' | 'pathology';
    findings: string[];
    criticalFindingsDetected: boolean;
    aiAnalysisPerformed: boolean;
    aiConfidence?: number;
  };
}

export interface PatientAdmittedEvent extends BaseEvent {
  eventType: 'patient.admitted';
  data: {
    admissionId: string;
    patientId: string;
    facilityId: string;
    wardType: 'General' | 'ICU' | 'Emergency';
    bedId: string;
    admittingDiagnosis: string;
    admissionTime: string;
  };
}

export interface PatientDischargedEvent extends BaseEvent {
  eventType: 'patient.discharged';
  data: {
    admissionId: string;
    patientId: string;
    dischargeTime: string;
    dischargeSummary: string;
    followUpRequired: boolean;
    followUpDate?: string;
    recoveryPlanGenerated: boolean;
  };
}

// ==================== OPERATIONAL EVENTS ====================

export interface BedOccupancyChangedEvent extends BaseEvent {
  eventType: 'bed.occupancy.changed';
  data: {
    facilityId: string;
    bedId: string;
    bedType: 'General' | 'ICU' | 'Emergency';
    status: 'available' | 'occupied' | 'maintenance';
    patientId?: string;
    currentOccupancy: number;
    totalCapacity: number;
    occupancyPercentage: number;
  };
}

export interface QueueUpdatedEvent extends BaseEvent {
  eventType: 'queue.updated';
  data: {
    facilityId: string;
    queueType: 'ED' | 'OPD';
    queueLength: number;
    averageWaitTime: number;
    patientsInQueue: Array<{
      patientId: string;
      urgencyScore: number;
      waitTime: number;
    }>;
  };
}

export interface StaffScheduleChangedEvent extends BaseEvent {
  eventType: 'staff.schedule.changed';
  data: {
    facilityId: string;
    staffId: string;
    staffType: 'doctor' | 'nurse' | 'technician';
    shiftStart: string;
    shiftEnd: string;
    changeType: 'scheduled' | 'called_in' | 'called_off';
  };
}

export interface TaskAssignedEvent extends BaseEvent {
  eventType: 'task.assigned';
  data: {
    taskId: string;
    nurseId: string;
    patientId: string;
    taskType: string;
    priority: 'CRITICAL' | 'URGENT' | 'ROUTINE';
    dueTime: string;
    assignedTime: string;
  };
}

export interface TaskCompletedEvent extends BaseEvent {
  eventType: 'task.completed';
  data: {
    taskId: string;
    nurseId: string;
    patientId: string;
    taskType: string;
    completedTime: string;
    notes?: string;
  };
}

// ==================== SUPPLY CHAIN EVENTS ====================

export interface InventoryLowEvent extends BaseEvent {
  eventType: 'inventory.low';
  data: {
    facilityId: string;
    itemId: string;
    itemType: 'medication' | 'blood' | 'supply';
    itemName: string;
    currentStock: number;
    reorderLevel: number;
    criticalLevel: boolean;
  };
}

export interface InventoryRestockedEvent extends BaseEvent {
  eventType: 'inventory.restocked';
  data: {
    facilityId: string;
    itemId: string;
    itemType: 'medication' | 'blood' | 'supply';
    itemName: string;
    quantityAdded: number;
    newStock: number;
    expiryDate?: string;
  };
}

export interface MedicationExpiringEvent extends BaseEvent {
  eventType: 'medication.expiring';
  data: {
    facilityId: string;
    medicationId: string;
    medicationName: string;
    batchNumber: string;
    expiryDate: string;
    daysUntilExpiry: number;
    quantity: number;
  };
}

export interface BloodDonorDriveTriggeredEvent extends BaseEvent {
  eventType: 'blood.donor.drive.triggered';
  data: {
    facilityId: string;
    bloodGroup: string;
    currentStock: number;
    requiredStock: number;
    urgency: 'CRITICAL' | 'URGENT' | 'ROUTINE';
    targetDonors: number;
  };
}

// ==================== FINANCIAL EVENTS ====================

export interface ClaimGeneratedEvent extends BaseEvent {
  eventType: 'claim.generated';
  data: {
    claimId: string;
    patientId: string;
    encounterId: string;
    insuranceProvider: string;
    claimAmount: number;
    icdCodes: string[];
    cptCodes: string[];
    submissionDate: string;
  };
}

export interface ClaimSubmittedEvent extends BaseEvent {
  eventType: 'claim.submitted';
  data: {
    claimId: string;
    insuranceProvider: string;
    submissionDate: string;
    expectedResponseDate: string;
  };
}

export interface ClaimRejectedEvent extends BaseEvent {
  eventType: 'claim.rejected';
  data: {
    claimId: string;
    rejectionReason: string;
    rejectionCode: string;
    rejectionDate: string;
    canResubmit: boolean;
  };
}

export interface PaymentReceivedEvent extends BaseEvent {
  eventType: 'payment.received';
  data: {
    paymentId: string;
    claimId?: string;
    patientId: string;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
  };
}

// ==================== PUBLIC HEALTH EVENTS ====================

export interface InfectionClusterDetectedEvent extends BaseEvent {
  eventType: 'infection.cluster.detected';
  data: {
    clusterId: string;
    facilityId: string;
    infectionType: string;
    caseCount: number;
    wardLocation: string;
    detectionTime: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
}

export interface OutbreakPredictedEvent extends BaseEvent {
  eventType: 'outbreak.predicted';
  data: {
    predictionId: string;
    diseaseType: string;
    region: string;
    district: string;
    state: string;
    probability: number;
    predictedCases: number;
    timeHorizon: string;
    environmentalFactors: Record<string, any>;
  };
}

export interface PublicHealthAlertEvent extends BaseEvent {
  eventType: 'public.health.alert';
  data: {
    alertId: string;
    alertType: 'outbreak' | 'cluster' | 'environmental';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    region: string;
    description: string;
    recommendedActions: string[];
    alertTime: string;
  };
}

// ==================== AGENT EVENTS ====================

export interface AgentTaskStartedEvent extends BaseEvent {
  eventType: 'agent.task.started';
  data: {
    taskId: string;
    agentName: string;
    agentType: string;
    inputData: Record<string, any>;
    startTime: string;
  };
}

export interface AgentTaskCompletedEvent extends BaseEvent {
  eventType: 'agent.task.completed';
  data: {
    taskId: string;
    agentName: string;
    agentType: string;
    outputData: Record<string, any>;
    confidence: number;
    executionTimeMs: number;
    completedTime: string;
  };
}

export interface AgentEscalationEvent extends BaseEvent {
  eventType: 'agent.escalation';
  data: {
    taskId: string;
    agentName: string;
    reason: string;
    confidence: number;
    escalatedTo: 'human' | 'supervisor';
    escalationTime: string;
    context: Record<string, any>;
  };
}

// ==================== NOTIFICATION EVENTS ====================

export interface NotificationSentEvent extends BaseEvent {
  eventType: 'notification.sent';
  data: {
    notificationId: string;
    recipientId: string;
    recipientType: 'patient' | 'clinician' | 'nurse' | 'admin';
    channel: 'SMS' | 'Email' | 'WhatsApp' | 'Push' | 'Voice';
    messageType: string;
    sentTime: string;
    status: 'sent' | 'delivered' | 'failed';
  };
}

// Union type of all events
export type MedhaOSEvent =
  | PatientRegisteredEvent
  | TriageCompletedEvent
  | AppointmentScheduledEvent
  | ConsultationStartedEvent
  | ConsultationCompletedEvent
  | PrescriptionCreatedEvent
  | DiagnosticOrderedEvent
  | DiagnosticCompletedEvent
  | PatientAdmittedEvent
  | PatientDischargedEvent
  | BedOccupancyChangedEvent
  | QueueUpdatedEvent
  | StaffScheduleChangedEvent
  | TaskAssignedEvent
  | TaskCompletedEvent
  | InventoryLowEvent
  | InventoryRestockedEvent
  | MedicationExpiringEvent
  | BloodDonorDriveTriggeredEvent
  | ClaimGeneratedEvent
  | ClaimSubmittedEvent
  | ClaimRejectedEvent
  | PaymentReceivedEvent
  | InfectionClusterDetectedEvent
  | OutbreakPredictedEvent
  | PublicHealthAlertEvent
  | AgentTaskStartedEvent
  | AgentTaskCompletedEvent
  | AgentEscalationEvent
  | NotificationSentEvent;

// Event type constants
export const EventTypes = {
  // Clinical
  PATIENT_REGISTERED: 'patient.registered',
  TRIAGE_COMPLETED: 'triage.completed',
  APPOINTMENT_SCHEDULED: 'appointment.scheduled',
  CONSULTATION_STARTED: 'consultation.started',
  CONSULTATION_COMPLETED: 'consultation.completed',
  PRESCRIPTION_CREATED: 'prescription.created',
  DIAGNOSTIC_ORDERED: 'diagnostic.ordered',
  DIAGNOSTIC_COMPLETED: 'diagnostic.completed',
  PATIENT_ADMITTED: 'patient.admitted',
  PATIENT_DISCHARGED: 'patient.discharged',
  
  // Operational
  BED_OCCUPANCY_CHANGED: 'bed.occupancy.changed',
  QUEUE_UPDATED: 'queue.updated',
  STAFF_SCHEDULE_CHANGED: 'staff.schedule.changed',
  TASK_ASSIGNED: 'task.assigned',
  TASK_COMPLETED: 'task.completed',
  
  // Supply Chain
  INVENTORY_LOW: 'inventory.low',
  INVENTORY_RESTOCKED: 'inventory.restocked',
  MEDICATION_EXPIRING: 'medication.expiring',
  BLOOD_DONOR_DRIVE_TRIGGERED: 'blood.donor.drive.triggered',
  
  // Financial
  CLAIM_GENERATED: 'claim.generated',
  CLAIM_SUBMITTED: 'claim.submitted',
  CLAIM_REJECTED: 'claim.rejected',
  PAYMENT_RECEIVED: 'payment.received',
  
  // Public Health
  INFECTION_CLUSTER_DETECTED: 'infection.cluster.detected',
  OUTBREAK_PREDICTED: 'outbreak.predicted',
  PUBLIC_HEALTH_ALERT: 'public.health.alert',
  
  // Agent
  AGENT_TASK_STARTED: 'agent.task.started',
  AGENT_TASK_COMPLETED: 'agent.task.completed',
  AGENT_ESCALATION: 'agent.escalation',
  
  // Notification
  NOTIFICATION_SENT: 'notification.sent',
} as const;

export type EventType = typeof EventTypes[keyof typeof EventTypes];
