import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import {
  FollowupCall,
  FollowupResponse,
  Patient,
  RecoveryPlan,
  SymptomReport,
  EscalationAlert,
} from '../types';
import { config } from '../config';
import { NotificationService } from './notification.service';

/**
 * Follow-up Call Service
 * Manages automated follow-up calls at 7, 14, and 30 days post-discharge
 */
export class FollowupCallService {
  private notificationService: NotificationService;
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Start the follow-up call scheduler
   */
  startScheduler(): void {
    // Check for due follow-up calls daily at 9 AM
    this.cronJob = cron.schedule('0 9 * * *', async () => {
      console.log('Checking for due follow-up calls...');
      await this.processDueFollowupCalls();
    });

    console.log('✅ Follow-up call scheduler started');
  }

  /**
   * Stop the follow-up call scheduler
   */
  stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('❌ Follow-up call scheduler stopped');
    }
  }

  /**
   * Schedule follow-up calls for a patient
   */
  async scheduleFollowupCalls(
    patient: Patient,
    recoveryPlan: RecoveryPlan
  ): Promise<FollowupCall[]> {
    const calls: FollowupCall[] = [];
    const dischargeDate = recoveryPlan.dischargeDate;

    // Schedule 7-day follow-up
    if (config.followup.day7Enabled) {
      const day7Date = new Date(dischargeDate);
      day7Date.setDate(day7Date.getDate() + 7);
      
      calls.push(await this.createFollowupCall(patient.id, day7Date, 7));
    }

    // Schedule 14-day follow-up
    if (config.followup.day14Enabled) {
      const day14Date = new Date(dischargeDate);
      day14Date.setDate(day14Date.getDate() + 14);
      
      calls.push(await this.createFollowupCall(patient.id, day14Date, 14));
    }

    // Schedule 30-day follow-up
    if (config.followup.day30Enabled) {
      const day30Date = new Date(dischargeDate);
      day30Date.setDate(day30Date.getDate() + 30);
      
      calls.push(await this.createFollowupCall(patient.id, day30Date, 30));
    }

    console.log(`Scheduled ${calls.length} follow-up calls for patient ${patient.id}`);
    return calls;
  }

  /**
   * Create a follow-up call record
   */
  private async createFollowupCall(
    patientId: string,
    scheduledDate: Date,
    daysSinceDischarge: number
  ): Promise<FollowupCall> {
    const call: FollowupCall = {
      id: uuidv4(),
      patientId,
      scheduledDate,
      daysSinceDischarge,
      status: 'scheduled',
      attempts: 0,
      responses: [],
      escalated: false,
    };

    await this.saveFollowupCall(call);
    return call;
  }

  /**
   * Process all due follow-up calls
   */
  private async processDueFollowupCalls(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueCalls = await this.getDueFollowupCalls(today);
    
    console.log(`Found ${dueCalls.length} due follow-up calls`);
    
    for (const call of dueCalls) {
      await this.initiateFollowupCall(call);
    }
  }

  /**
   * Initiate a follow-up call
   */
  async initiateFollowupCall(call: FollowupCall): Promise<void> {
    try {
      const patient = await this.getPatient(call.patientId);
      
      if (!patient) {
        console.error('Patient not found for follow-up call:', call.id);
        return;
      }

      console.log(`Initiating ${call.daysSinceDischarge}-day follow-up call for ${patient.name}`);

      // Generate follow-up questions based on days since discharge
      const questions = this.generateFollowupQuestions(call.daysSinceDischarge, patient.language);
      
      // In production, this would integrate with voice call system (Twilio, AWS Connect)
      // For now, we'll simulate the call and send SMS with questions
      
      const message = this.createFollowupMessage(patient, call.daysSinceDischarge, questions);
      
      // Send via preferred method
      await this.notificationService.sendNotification({
        patientId: patient.id,
        type: 'followup_call',
        method: 'voice', // Would use actual voice call in production
        message,
        language: patient.language,
      });

      // Update call status
      call.status = 'completed'; // In production, would be updated after actual call
      call.attempts += 1;
      call.completedAt = new Date();
      await this.updateFollowupCall(call);

      console.log(`✅ Follow-up call initiated for ${patient.name}`);
    } catch (error) {
      console.error('Error initiating follow-up call:', error);
      
      // Retry logic
      if (call.attempts < config.followup.callRetryAttempts) {
        call.attempts += 1;
        await this.updateFollowupCall(call);
        console.log(`Will retry follow-up call (attempt ${call.attempts}/${config.followup.callRetryAttempts})`);
      } else {
        call.status = 'failed';
        await this.updateFollowupCall(call);
        console.error(`Follow-up call failed after ${config.followup.callRetryAttempts} attempts`);
      }
    }
  }

  /**
   * Generate follow-up questions based on days since discharge
   */
  private generateFollowupQuestions(
    daysSinceDischarge: number,
    language: string
  ): string[] {
    // Questions in English (would be translated in production)
    const commonQuestions = [
      'How are you feeling overall?',
      'Are you taking your medications as prescribed?',
      'Have you experienced any new or worsening symptoms?',
      'Are you able to perform your daily activities?',
    ];

    const day7Questions = [
      ...commonQuestions,
      'Have you noticed any signs of infection at the surgical site?',
      'Are you experiencing any pain? If yes, how severe is it?',
      'Have you had any difficulty sleeping?',
    ];

    const day14Questions = [
      ...commonQuestions,
      'Have you been able to follow the dietary guidelines?',
      'Are you experiencing any side effects from your medications?',
      'Have you scheduled your follow-up appointment with your doctor?',
    ];

    const day30Questions = [
      ...commonQuestions,
      'Have you been able to return to your normal activities?',
      'Do you have any concerns about your recovery?',
      'Have you had any emergency room visits or hospitalizations?',
    ];

    if (daysSinceDischarge <= 7) return day7Questions;
    if (daysSinceDischarge <= 14) return day14Questions;
    return day30Questions;
  }

  /**
   * Create follow-up message
   */
  private createFollowupMessage(
    patient: Patient,
    daysSinceDischarge: number,
    questions: string[]
  ): string {
    // In production, use proper i18n/translation
    const messages: Record<string, string> = {
      en: `Hello ${patient.name}, this is your ${daysSinceDischarge}-day follow-up call from MedhaOS. We want to check on your recovery. Please answer the following questions:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
      hi: `नमस्ते ${patient.name}, यह MedhaOS से आपकी ${daysSinceDischarge} दिन की फॉलो-अप कॉल है। हम आपकी रिकवरी की जांच करना चाहते हैं।`,
      ta: `வணக்கம் ${patient.name}, இது MedhaOS இலிருந்து உங்கள் ${daysSinceDischarge} நாள் பின்தொடர்தல் அழைப்பு. உங்கள் மீட்பு நிலையை சரிபார்க்க விரும்புகிறோம்.`,
    };

    return messages[patient.language] || messages.en;
  }

  /**
   * Record follow-up responses
   */
  async recordFollowupResponses(
    callId: string,
    responses: FollowupResponse[]
  ): Promise<void> {
    const call = await this.getFollowupCall(callId);
    
    if (!call) {
      throw new Error('Follow-up call not found');
    }

    call.responses = responses;
    
    // Analyze responses for concerning symptoms
    const concerningResponses = responses.filter(r => r.concernLevel === 'high' || r.concernLevel === 'medium');
    
    if (concerningResponses.length > 0) {
      // Escalate to healthcare provider
      await this.escalateFollowup(call, concerningResponses);
    }

    await this.updateFollowupCall(call);
    console.log(`Recorded ${responses.length} follow-up responses for call ${callId}`);
  }

  /**
   * Escalate follow-up call to healthcare provider
   */
  private async escalateFollowup(
    call: FollowupCall,
    concerningResponses: FollowupResponse[]
  ): Promise<void> {
    call.escalated = true;
    call.escalationReason = concerningResponses.map(r => `${r.question}: ${r.answer}`).join('; ');

    // Create escalation alert
    const alert: EscalationAlert = {
      id: uuidv4(),
      patientId: call.patientId,
      type: 'followup',
      severity: this.determineSeverity(concerningResponses),
      description: `Follow-up call (Day ${call.daysSinceDischarge}) revealed concerning symptoms: ${call.escalationReason}`,
      triggeredAt: new Date(),
      acknowledged: false,
      resolved: false,
    };

    await this.createEscalationAlert(alert);

    // Notify healthcare provider
    if (config.escalation.phoneNumber) {
      const patient = await this.getPatient(call.patientId);
      const message = `ALERT: Patient ${patient?.name} (ID: ${call.patientId}) reported concerning symptoms during ${call.daysSinceDischarge}-day follow-up. Immediate review required.`;
      
      await this.notificationService.sendNotification({
        patientId: call.patientId,
        type: 'symptom_alert',
        method: 'sms',
        message,
        language: 'en',
      });
    }

    console.log(`⚠️ Escalated follow-up call ${call.id} to healthcare provider`);
  }

  /**
   * Determine severity based on responses
   */
  private determineSeverity(responses: FollowupResponse[]): 'low' | 'medium' | 'high' | 'critical' {
    const highConcern = responses.some(r => r.concernLevel === 'high');
    const mediumConcern = responses.some(r => r.concernLevel === 'medium');

    if (highConcern) return 'critical';
    if (mediumConcern) return 'high';
    return 'medium';
  }

  /**
   * Track symptom reports from follow-up calls
   */
  async trackSymptoms(
    patientId: string,
    symptoms: string[],
    severity: 'mild' | 'moderate' | 'severe',
    description: string
  ): Promise<SymptomReport> {
    const report: SymptomReport = {
      id: uuidv4(),
      patientId,
      reportedAt: new Date(),
      symptoms,
      severity,
      description,
      escalated: false,
    };

    // Check for escalation keywords
    const shouldEscalate = this.checkForEscalationKeywords(symptoms, description);
    
    if (shouldEscalate || severity === 'severe') {
      report.escalated = true;
      report.escalationReason = 'Severe symptoms or escalation keywords detected';
      
      // Create alert
      const alert: EscalationAlert = {
        id: uuidv4(),
        patientId,
        type: 'symptom',
        severity: severity === 'severe' ? 'critical' : 'high',
        description: `Patient reported ${severity} symptoms: ${symptoms.join(', ')}`,
        triggeredAt: new Date(),
        acknowledged: false,
        resolved: false,
      };
      
      await this.createEscalationAlert(alert);
    }

    await this.saveSymptomReport(report);
    console.log(`Tracked symptom report for patient ${patientId}`);
    
    return report;
  }

  /**
   * Check for escalation keywords in symptoms
   */
  private checkForEscalationKeywords(symptoms: string[], description: string): boolean {
    const text = [...symptoms, description].join(' ').toLowerCase();
    
    return config.escalation.keywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
  }

  // Database operations (would use Prisma in production)

  private async saveFollowupCall(call: FollowupCall): Promise<void> {
    console.log('Saving follow-up call:', call.id);
    // await prisma.followupCall.create({ data: call });
  }

  private async updateFollowupCall(call: FollowupCall): Promise<void> {
    console.log('Updating follow-up call:', call.id);
    // await prisma.followupCall.update({ where: { id: call.id }, data: call });
  }

  private async getFollowupCall(callId: string): Promise<FollowupCall | null> {
    // return await prisma.followupCall.findUnique({ where: { id: callId } });
    return null;
  }

  private async getDueFollowupCalls(date: Date): Promise<FollowupCall[]> {
    // return await prisma.followupCall.findMany({
    //   where: {
    //     status: 'scheduled',
    //     scheduledDate: { lte: date }
    //   }
    // });
    return [];
  }

  private async getPatient(patientId: string): Promise<Patient | null> {
    // return await prisma.patient.findUnique({ where: { id: patientId } });
    return null;
  }

  private async saveSymptomReport(report: SymptomReport): Promise<void> {
    console.log('Saving symptom report:', report.id);
    // await prisma.symptomReport.create({ data: report });
  }

  private async createEscalationAlert(alert: EscalationAlert): Promise<void> {
    console.log('Creating escalation alert:', alert.id);
    // await prisma.escalationAlert.create({ data: alert });
  }
}
