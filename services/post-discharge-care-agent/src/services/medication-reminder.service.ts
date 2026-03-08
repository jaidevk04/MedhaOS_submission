import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import {
  MedicationReminder,
  MedicationSchedule,
  Patient,
  NotificationPayload,
  AdherenceRecord,
} from '../types';
import { config } from '../config';
import { NotificationService } from './notification.service';

/**
 * Medication Reminder Service
 * Manages automated medication reminders via SMS, WhatsApp, and voice calls
 */
export class MedicationReminderService {
  private notificationService: NotificationService;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Start the medication reminder scheduler
   */
  startScheduler(): void {
    // Check for due reminders every configured interval (default: 5 minutes)
    const interval = `*/${config.medicationReminder.checkIntervalMinutes} * * * *`;
    
    this.cronJob = cron.schedule(interval, async () => {
      console.log('Checking for due medication reminders...');
      await this.processDueReminders();
    });

    console.log(`✅ Medication reminder scheduler started (interval: ${config.medicationReminder.checkIntervalMinutes} minutes)`);
  }

  /**
   * Stop the medication reminder scheduler
   */
  stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('❌ Medication reminder scheduler stopped');
    }
  }

  /**
   * Schedule reminders for a medication
   */
  async scheduleMedicationReminders(
    patient: Patient,
    medication: MedicationSchedule
  ): Promise<MedicationReminder[]> {
    const reminders: MedicationReminder[] = [];
    const currentDate = new Date();
    
    // Generate reminders for each dose timing
    let date = new Date(medication.startDate);
    
    while (date <= medication.endDate) {
      for (const time of medication.timing) {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledTime = new Date(date);
        scheduledTime.setHours(hours, minutes, 0, 0);
        
        // Only schedule future reminders
        if (scheduledTime > currentDate) {
          const reminder: MedicationReminder = {
            id: uuidv4(),
            patientId: patient.id,
            medicationScheduleId: medication.id,
            scheduledTime,
            status: 'pending',
            attempts: 0,
            method: this.determinePreferredMethod(patient),
          };
          
          reminders.push(reminder);
          await this.saveReminder(reminder);
        }
      }
      
      // Move to next day
      date.setDate(date.getDate() + 1);
    }

    console.log(`Scheduled ${reminders.length} reminders for ${medication.medicationName}`);
    return reminders;
  }

  /**
   * Process all due reminders
   */
  private async processDueReminders(): Promise<void> {
    const now = new Date();
    const advanceTime = new Date(now.getTime() + config.medicationReminder.advanceMinutes * 60000);
    
    // Get all pending reminders that are due (within advance window)
    const dueReminders = await this.getDueReminders(now, advanceTime);
    
    console.log(`Found ${dueReminders.length} due reminders`);
    
    for (const reminder of dueReminders) {
      await this.sendReminder(reminder);
    }
  }

  /**
   * Send a medication reminder
   */
  async sendReminder(reminder: MedicationReminder): Promise<void> {
    try {
      // Get patient and medication details
      const patient = await this.getPatient(reminder.patientId);
      const medication = await this.getMedication(reminder.medicationScheduleId);
      
      if (!patient || !medication) {
        console.error('Patient or medication not found for reminder:', reminder.id);
        return;
      }

      // Create notification message
      const message = this.createReminderMessage(patient, medication);
      
      const notification: NotificationPayload = {
        patientId: patient.id,
        type: 'medication_reminder',
        method: reminder.method,
        message,
        language: patient.language,
      };

      // Send notification
      await this.notificationService.sendNotification(notification);
      
      // Update reminder status
      reminder.status = 'sent';
      reminder.attempts += 1;
      reminder.sentAt = new Date();
      await this.updateReminder(reminder);
      
      console.log(`✅ Sent ${reminder.method} reminder to ${patient.name} for ${medication.medicationName}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      
      // Retry logic
      if (reminder.attempts < config.medicationReminder.maxAttempts) {
        reminder.attempts += 1;
        await this.updateReminder(reminder);
      } else {
        reminder.status = 'missed';
        await this.updateReminder(reminder);
        console.error(`Failed to send reminder after ${config.medicationReminder.maxAttempts} attempts`);
      }
    }
  }

  /**
   * Create reminder message in patient's language
   */
  private createReminderMessage(patient: Patient, medication: MedicationSchedule): string {
    // In production, this would use proper i18n/translation service
    const messages: Record<string, string> = {
      en: `Hello ${patient.name}, it's time to take your medication: ${medication.medicationName} ${medication.dosage}. ${medication.instructions}`,
      hi: `नमस्ते ${patient.name}, आपकी दवा लेने का समय हो गया है: ${medication.medicationName} ${medication.dosage}। ${medication.instructions}`,
      ta: `வணக்கம் ${patient.name}, உங்கள் மருந்து எடுக்க வேண்டிய நேரம்: ${medication.medicationName} ${medication.dosage}। ${medication.instructions}`,
    };
    
    return messages[patient.language] || messages.en;
  }

  /**
   * Determine preferred notification method for patient
   */
  private determinePreferredMethod(patient: Patient): 'sms' | 'whatsapp' | 'voice' | 'push' {
    // Priority: WhatsApp > SMS > Voice > Push
    if (patient.whatsapp) return 'whatsapp';
    if (patient.phone) return 'sms';
    return 'push';
  }

  /**
   * Record medication adherence
   */
  async recordAdherence(
    patientId: string,
    medicationScheduleId: string,
    status: 'taken' | 'missed' | 'late' | 'skipped',
    verificationMethod?: 'manual' | 'image' | 'barcode',
    imageUrl?: string,
    notes?: string
  ): Promise<AdherenceRecord> {
    const record: AdherenceRecord = {
      id: uuidv4(),
      patientId,
      medicationScheduleId,
      scheduledTime: new Date(), // Should be actual scheduled time
      takenTime: status === 'taken' ? new Date() : undefined,
      status,
      verificationMethod,
      imageUrl,
      notes,
      createdAt: new Date(),
    };

    await this.saveAdherenceRecord(record);
    
    // Update reminder status if exists
    await this.acknowledgeReminder(patientId, medicationScheduleId);
    
    console.log(`Recorded adherence: ${status} for patient ${patientId}`);
    return record;
  }

  /**
   * Acknowledge a reminder (patient confirmed taking medication)
   */
  private async acknowledgeReminder(
    patientId: string,
    medicationScheduleId: string
  ): Promise<void> {
    // Find the most recent pending/sent reminder for this medication
    const reminder = await this.getLatestReminder(patientId, medicationScheduleId);
    
    if (reminder && (reminder.status === 'pending' || reminder.status === 'sent')) {
      reminder.status = 'acknowledged';
      reminder.acknowledgedAt = new Date();
      await this.updateReminder(reminder);
    }
  }

  /**
   * Get adherence metrics for a patient
   */
  async getAdherenceMetrics(
    patientId: string,
    period: 'week' | 'month' | 'all' = 'week'
  ): Promise<any> {
    const records = await this.getAdherenceRecords(patientId, period);
    
    const totalDoses = records.length;
    const takenDoses = records.filter(r => r.status === 'taken').length;
    const missedDoses = records.filter(r => r.status === 'missed').length;
    const lateDoses = records.filter(r => r.status === 'late').length;
    const adherenceRate = totalDoses > 0 ? (takenDoses / totalDoses) * 100 : 0;

    return {
      patientId,
      period,
      totalDoses,
      takenDoses,
      missedDoses,
      lateDoses,
      adherenceRate: Math.round(adherenceRate * 100) / 100,
    };
  }

  // Database operations (would use Prisma in production)
  
  private async saveReminder(reminder: MedicationReminder): Promise<void> {
    console.log('Saving reminder:', reminder.id);
    // await prisma.medicationReminder.create({ data: reminder });
  }

  private async updateReminder(reminder: MedicationReminder): Promise<void> {
    console.log('Updating reminder:', reminder.id);
    // await prisma.medicationReminder.update({ where: { id: reminder.id }, data: reminder });
  }

  private async getDueReminders(startTime: Date, endTime: Date): Promise<MedicationReminder[]> {
    // Query database for pending reminders within time window
    // return await prisma.medicationReminder.findMany({
    //   where: {
    //     status: 'pending',
    //     scheduledTime: { gte: startTime, lte: endTime }
    //   }
    // });
    return [];
  }

  private async getLatestReminder(
    patientId: string,
    medicationScheduleId: string
  ): Promise<MedicationReminder | null> {
    // return await prisma.medicationReminder.findFirst({
    //   where: { patientId, medicationScheduleId },
    //   orderBy: { scheduledTime: 'desc' }
    // });
    return null;
  }

  private async getPatient(patientId: string): Promise<Patient | null> {
    // return await prisma.patient.findUnique({ where: { id: patientId } });
    return null;
  }

  private async getMedication(medicationScheduleId: string): Promise<MedicationSchedule | null> {
    // return await prisma.medicationSchedule.findUnique({ where: { id: medicationScheduleId } });
    return null;
  }

  private async saveAdherenceRecord(record: AdherenceRecord): Promise<void> {
    console.log('Saving adherence record:', record.id);
    // await prisma.adherenceRecord.create({ data: record });
  }

  private async getAdherenceRecords(
    patientId: string,
    period: 'week' | 'month' | 'all'
  ): Promise<AdherenceRecord[]> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // Beginning of time
    }

    // return await prisma.adherenceRecord.findMany({
    //   where: {
    //     patientId,
    //     createdAt: { gte: startDate }
    //   }
    // });
    return [];
  }
}
