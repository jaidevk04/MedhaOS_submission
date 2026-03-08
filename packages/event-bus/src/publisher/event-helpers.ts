/**
 * Event Publishing Helper Functions
 * Provides type-safe convenience methods for publishing specific event types
 */

import { EventPublisher, PublishOptions, PublishResult } from './event-publisher';
import { EventTypes } from '../schemas';
import * as Events from '../schemas';

export class EventHelpers {
  constructor(private publisher: EventPublisher) {}

  // ==================== CLINICAL EVENTS ====================

  async publishPatientRegistered(
    data: Events.PatientRegisteredEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.PATIENT_REGISTERED, data, options);
  }

  async publishTriageCompleted(
    data: Events.TriageCompletedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.TRIAGE_COMPLETED, data, options);
  }

  async publishAppointmentScheduled(
    data: Events.AppointmentScheduledEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.APPOINTMENT_SCHEDULED, data, options);
  }

  async publishConsultationStarted(
    data: Events.ConsultationStartedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.CONSULTATION_STARTED, data, options);
  }

  async publishConsultationCompleted(
    data: Events.ConsultationCompletedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.CONSULTATION_COMPLETED, data, options);
  }

  async publishPrescriptionCreated(
    data: Events.PrescriptionCreatedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.PRESCRIPTION_CREATED, data, options);
  }

  async publishDiagnosticOrdered(
    data: Events.DiagnosticOrderedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.DIAGNOSTIC_ORDERED, data, options);
  }

  async publishDiagnosticCompleted(
    data: Events.DiagnosticCompletedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.DIAGNOSTIC_COMPLETED, data, options);
  }

  async publishPatientAdmitted(
    data: Events.PatientAdmittedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.PATIENT_ADMITTED, data, options);
  }

  async publishPatientDischarged(
    data: Events.PatientDischargedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.PATIENT_DISCHARGED, data, options);
  }

  // ==================== OPERATIONAL EVENTS ====================

  async publishBedOccupancyChanged(
    data: Events.BedOccupancyChangedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.BED_OCCUPANCY_CHANGED, data, options);
  }

  async publishQueueUpdated(
    data: Events.QueueUpdatedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.QUEUE_UPDATED, data, options);
  }

  async publishStaffScheduleChanged(
    data: Events.StaffScheduleChangedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.STAFF_SCHEDULE_CHANGED, data, options);
  }

  async publishTaskAssigned(
    data: Events.TaskAssignedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.TASK_ASSIGNED, data, options);
  }

  async publishTaskCompleted(
    data: Events.TaskCompletedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.TASK_COMPLETED, data, options);
  }

  // ==================== SUPPLY CHAIN EVENTS ====================

  async publishInventoryLow(
    data: Events.InventoryLowEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.INVENTORY_LOW, data, options);
  }

  async publishInventoryRestocked(
    data: Events.InventoryRestockedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.INVENTORY_RESTOCKED, data, options);
  }

  async publishMedicationExpiring(
    data: Events.MedicationExpiringEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.MEDICATION_EXPIRING, data, options);
  }

  async publishBloodDonorDriveTriggered(
    data: Events.BloodDonorDriveTriggeredEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.BLOOD_DONOR_DRIVE_TRIGGERED, data, options);
  }

  // ==================== FINANCIAL EVENTS ====================

  async publishClaimGenerated(
    data: Events.ClaimGeneratedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.CLAIM_GENERATED, data, options);
  }

  async publishClaimSubmitted(
    data: Events.ClaimSubmittedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.CLAIM_SUBMITTED, data, options);
  }

  async publishClaimRejected(
    data: Events.ClaimRejectedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.CLAIM_REJECTED, data, options);
  }

  async publishPaymentReceived(
    data: Events.PaymentReceivedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.PAYMENT_RECEIVED, data, options);
  }

  // ==================== PUBLIC HEALTH EVENTS ====================

  async publishInfectionClusterDetected(
    data: Events.InfectionClusterDetectedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.INFECTION_CLUSTER_DETECTED, data, options);
  }

  async publishOutbreakPredicted(
    data: Events.OutbreakPredictedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.OUTBREAK_PREDICTED, data, options);
  }

  async publishPublicHealthAlert(
    data: Events.PublicHealthAlertEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.PUBLIC_HEALTH_ALERT, data, options);
  }

  // ==================== AGENT EVENTS ====================

  async publishAgentTaskStarted(
    data: Events.AgentTaskStartedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.AGENT_TASK_STARTED, data, options);
  }

  async publishAgentTaskCompleted(
    data: Events.AgentTaskCompletedEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.AGENT_TASK_COMPLETED, data, options);
  }

  async publishAgentEscalation(
    data: Events.AgentEscalationEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.AGENT_ESCALATION, data, options);
  }

  // ==================== NOTIFICATION EVENTS ====================

  async publishNotificationSent(
    data: Events.NotificationSentEvent['data'],
    options?: PublishOptions
  ): Promise<PublishResult> {
    return this.publisher.publish(EventTypes.NOTIFICATION_SENT, data, options);
  }
}

/**
 * Create event helpers with a publisher
 */
export function createEventHelpers(publisher: EventPublisher): EventHelpers {
  return new EventHelpers(publisher);
}
