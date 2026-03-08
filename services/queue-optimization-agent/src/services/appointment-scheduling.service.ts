import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import {
  Appointment,
  AppointmentSlot,
  AppointmentConflict,
  QueueType,
  NotificationRequest,
} from '../types';

export class AppointmentSchedulingService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Book an appointment
   */
  async bookAppointment(data: {
    patientId: string;
    facilityId: string;
    providerId: string;
    specialty: string;
    scheduledTime: Date;
    duration?: number;
    urgencyScore?: number;
    chiefComplaint?: string;
    notes?: string;
  }): Promise<{ appointment: Appointment; conflicts: AppointmentConflict[] }> {
    const duration = data.duration || 30; // Default 30 minutes
    const endTime = new Date(data.scheduledTime.getTime() + duration * 60000);

    // Check for conflicts
    const conflicts = await this.checkConflicts({
      facilityId: data.facilityId,
      providerId: data.providerId,
      startTime: data.scheduledTime,
      endTime,
    });

    if (conflicts.length > 0) {
      // Return conflicts without creating appointment
      const placeholderAppointment: Appointment = {
        id: '',
        patientId: data.patientId,
        facilityId: data.facilityId,
        providerId: data.providerId,
        specialty: data.specialty,
        appointmentType: QueueType.OPD,
        scheduledTime: data.scheduledTime,
        duration,
        status: 'SCHEDULED',
        urgencyScore: data.urgencyScore,
        chiefComplaint: data.chiefComplaint,
        notes: data.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { appointment: placeholderAppointment, conflicts };
    }

    // Create appointment
    const appointment: Appointment = {
      id: uuidv4(),
      patientId: data.patientId,
      facilityId: data.facilityId,
      providerId: data.providerId,
      specialty: data.specialty,
      appointmentType: QueueType.OPD,
      scheduledTime: data.scheduledTime,
      duration,
      status: 'SCHEDULED',
      urgencyScore: data.urgencyScore,
      chiefComplaint: data.chiefComplaint,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database (simplified - in production would use proper Prisma schema)
    // For now, we'll just return the appointment object
    
    // Send confirmation notification
    await this.sendNotification({
      patientId: data.patientId,
      type: 'APPOINTMENT_CONFIRMATION',
      channel: 'SMS',
      data: {
        appointmentId: appointment.id,
        scheduledTime: appointment.scheduledTime,
        facilityId: appointment.facilityId,
        providerId: appointment.providerId,
      },
    });

    return { appointment, conflicts: [] };
  }

  /**
   * Get available appointment slots
   */
  async getAvailableSlots(
    facilityId: string,
    providerId: string,
    specialty: string,
    date: Date,
    duration: number = 30
  ): Promise<AppointmentSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get provider's working hours (simplified - would come from provider schedule)
    const workingHours = this.getProviderWorkingHours(providerId, date);
    
    // Get existing appointments for the day
    const existingAppointments = await this.getAppointmentsByProvider(
      providerId,
      startOfDay,
      endOfDay
    );

    // Generate time slots
    const slots: AppointmentSlot[] = [];
    let currentTime = new Date(workingHours.start);

    while (currentTime < workingHours.end) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);
      
      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments.some((apt) => {
        const aptEnd = new Date(apt.scheduledTime.getTime() + apt.duration * 60000);
        return (
          (currentTime >= apt.scheduledTime && currentTime < aptEnd) ||
          (slotEnd > apt.scheduledTime && slotEnd <= aptEnd) ||
          (currentTime <= apt.scheduledTime && slotEnd >= aptEnd)
        );
      });

      slots.push({
        facilityId,
        providerId,
        specialty,
        startTime: new Date(currentTime),
        endTime: new Date(slotEnd),
        available: !hasConflict,
        duration,
      });

      // Move to next slot
      currentTime = new Date(currentTime.getTime() + duration * 60000);
    }

    return slots;
  }

  /**
   * Check for appointment conflicts
   */
  async checkConflicts(data: {
    facilityId: string;
    providerId: string;
    startTime: Date;
    endTime: Date;
  }): Promise<AppointmentConflict[]> {
    const conflicts: AppointmentConflict[] = [];

    // Check if facility is open
    if (!this.isFacilityOpen(data.facilityId, data.startTime)) {
      conflicts.push({
        type: 'FACILITY_CLOSED',
        message: 'Facility is closed at the requested time',
      });
    }

    // Check provider availability
    const providerAvailable = await this.isProviderAvailable(
      data.providerId,
      data.startTime,
      data.endTime
    );
    
    if (!providerAvailable.available) {
      conflicts.push({
        type: 'PROVIDER_UNAVAILABLE',
        message: providerAvailable.reason || 'Provider is not available at the requested time',
      });
    }

    // Check for double booking
    const existingAppointments = await this.getAppointmentsByProvider(
      data.providerId,
      data.startTime,
      data.endTime
    );

    for (const apt of existingAppointments) {
      const aptEnd = new Date(apt.scheduledTime.getTime() + apt.duration * 60000);
      
      if (
        (data.startTime >= apt.scheduledTime && data.startTime < aptEnd) ||
        (data.endTime > apt.scheduledTime && data.endTime <= aptEnd) ||
        (data.startTime <= apt.scheduledTime && data.endTime >= aptEnd)
      ) {
        conflicts.push({
          type: 'DOUBLE_BOOKING',
          message: 'Time slot is already booked',
          conflictingAppointmentId: apt.id,
        });
      }
    }

    return conflicts;
  }

  /**
   * Confirm an appointment
   */
  async confirmAppointment(appointmentId: string): Promise<Appointment> {
    // In production, would update database
    const appointment = await this.getAppointment(appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.status = 'CONFIRMED';
    appointment.updatedAt = new Date();

    // Send confirmation notification
    await this.sendNotification({
      patientId: appointment.patientId,
      type: 'APPOINTMENT_CONFIRMATION',
      channel: 'WHATSAPP',
      data: {
        appointmentId: appointment.id,
        scheduledTime: appointment.scheduledTime,
      },
    });

    return appointment;
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointment(appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.status = 'CANCELLED';
    appointment.notes = reason ? `${appointment.notes || ''}\nCancellation reason: ${reason}` : appointment.notes;
    appointment.updatedAt = new Date();

    // Send cancellation notification
    await this.sendNotification({
      patientId: appointment.patientId,
      type: 'APPOINTMENT_CANCELLATION',
      channel: 'SMS',
      data: {
        appointmentId: appointment.id,
        scheduledTime: appointment.scheduledTime,
        reason,
      },
    });

    return appointment;
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    newScheduledTime: Date
  ): Promise<{ appointment: Appointment; conflicts: AppointmentConflict[] }> {
    const appointment = await this.getAppointment(appointmentId);
    
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Check conflicts for new time
    const endTime = new Date(newScheduledTime.getTime() + appointment.duration * 60000);
    const conflicts = await this.checkConflicts({
      facilityId: appointment.facilityId,
      providerId: appointment.providerId,
      startTime: newScheduledTime,
      endTime,
    });

    if (conflicts.length > 0) {
      return { appointment, conflicts };
    }

    // Update appointment
    appointment.scheduledTime = newScheduledTime;
    appointment.updatedAt = new Date();

    // Send notification
    await this.sendNotification({
      patientId: appointment.patientId,
      type: 'APPOINTMENT_CONFIRMATION',
      channel: 'SMS',
      data: {
        appointmentId: appointment.id,
        scheduledTime: appointment.scheduledTime,
        rescheduled: true,
      },
    });

    return { appointment, conflicts: [] };
  }

  /**
   * Get appointments for a patient
   */
  async getPatientAppointments(
    patientId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Appointment[]> {
    // In production, would query database
    // For now, return empty array
    return [];
  }

  /**
   * Get appointments for a provider
   */
  async getAppointmentsByProvider(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Appointment[]> {
    // In production, would query database
    // For now, return empty array
    return [];
  }

  /**
   * Get appointment by ID
   */
  async getAppointment(appointmentId: string): Promise<Appointment | null> {
    // In production, would query database
    // For now, return null
    return null;
  }

  /**
   * Send appointment reminders
   */
  async sendAppointmentReminders(hoursBeforeAppointment: number = 24): Promise<number> {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + hoursBeforeAppointment * 60 * 60 * 1000);

    // Get appointments scheduled within the reminder window
    const upcomingAppointments = await this.getUpcomingAppointments(now, reminderTime);

    let sentCount = 0;
    for (const appointment of upcomingAppointments) {
      try {
        await this.sendNotification({
          patientId: appointment.patientId,
          type: 'APPOINTMENT_REMINDER',
          channel: 'SMS',
          data: {
            appointmentId: appointment.id,
            scheduledTime: appointment.scheduledTime,
            facilityId: appointment.facilityId,
            providerId: appointment.providerId,
          },
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send reminder for appointment ${appointment.id}:`, error);
      }
    }

    return sentCount;
  }

  /**
   * Integrate with calendar systems
   */
  async addToCalendar(
    appointmentId: string,
    calendarType: 'GOOGLE' | 'OUTLOOK' | 'APPLE'
  ): Promise<{ success: boolean; calendarEventId?: string; error?: string }> {
    const appointment = await this.getAppointment(appointmentId);
    
    if (!appointment) {
      return { success: false, error: 'Appointment not found' };
    }

    // In production, would integrate with calendar APIs
    // For now, return success
    return {
      success: true,
      calendarEventId: `cal-${uuidv4()}`,
    };
  }

  // Private helper methods

  private getProviderWorkingHours(providerId: string, date: Date): { start: Date; end: Date } {
    // In production, would query provider schedule
    // For now, return default working hours (9 AM - 5 PM)
    const start = new Date(date);
    start.setHours(9, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(17, 0, 0, 0);
    
    return { start, end };
  }

  private isFacilityOpen(facilityId: string, time: Date): boolean {
    // In production, would check facility operating hours
    // For now, assume open 24/7 for ED, 8 AM - 8 PM for OPD
    const hour = time.getHours();
    return hour >= 8 && hour < 20;
  }

  private async isProviderAvailable(
    providerId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ available: boolean; reason?: string }> {
    // In production, would check provider schedule, leave, etc.
    // For now, assume available during working hours
    const workingHours = this.getProviderWorkingHours(providerId, startTime);
    
    if (startTime < workingHours.start || endTime > workingHours.end) {
      return {
        available: false,
        reason: 'Outside provider working hours',
      };
    }
    
    return { available: true };
  }

  private async getUpcomingAppointments(startDate: Date, endDate: Date): Promise<Appointment[]> {
    // In production, would query database
    // For now, return empty array
    return [];
  }

  private async sendNotification(request: NotificationRequest): Promise<void> {
    // In production, would integrate with notification service
    // For now, just log
    console.log('Sending notification:', {
      patientId: request.patientId,
      type: request.type,
      channel: request.channel,
    });
  }
}
