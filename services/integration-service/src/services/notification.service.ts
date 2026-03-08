import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { config } from '../config';
import {
  NotificationRequest,
  NotificationResponse,
  EmailTemplate,
  SMSMessage,
  WhatsAppMessage,
  PushNotification,
} from '../types';

/**
 * Notification Service
 * Handles multi-channel notifications
 * - AWS SNS for push notifications
 * - Twilio for SMS
 * - WhatsApp Business API
 * - Email service with templates
 */
export class NotificationService {
  private snsClient: SNSClient;
  private twilioClient: any;
  private emailTransporter: any;

  constructor() {
    // Initialize AWS SNS
    this.snsClient = new SNSClient({
      region: config.aws.region,
    });

    // Initialize Twilio
    if (config.twilio.accountSid && config.twilio.authToken) {
      this.twilioClient = twilio(
        config.twilio.accountSid,
        config.twilio.authToken
      );
    }

    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  /**
   * Send notification via specified channel
   */
  async sendNotification(
    request: NotificationRequest
  ): Promise<NotificationResponse> {
    try {
      switch (request.channel) {
        case 'SMS':
          return await this.sendSMS({
            to: request.recipient,
            body: this.renderTemplate(request.template, request.data),
          });

        case 'EMAIL':
          return await this.sendEmail(
            request.recipient,
            request.template,
            request.data
          );

        case 'WHATSAPP':
          return await this.sendWhatsApp({
            to: request.recipient,
            type: 'text',
            text: {
              body: this.renderTemplate(request.template, request.data),
            },
          });

        case 'PUSH':
          return await this.sendPushNotification({
            title: request.data.title || 'MedhaOS Notification',
            body: this.renderTemplate(request.template, request.data),
            data: request.data,
          });

        default:
          throw new Error(`Unsupported notification channel: ${request.channel}`);
      }
    } catch (error: any) {
      console.error('Notification send failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendSMS(message: SMSMessage): Promise<NotificationResponse> {
    try {
      if (!this.twilioClient) {
        throw new Error('Twilio client not initialized');
      }

      const result = await this.twilioClient.messages.create({
        body: message.body,
        from: config.twilio.phoneNumber,
        to: message.to,
      });

      return {
        success: true,
        messageId: result.sid,
      };
    } catch (error: any) {
      console.error('SMS send failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send email
   */
  async sendEmail(
    to: string,
    templateName: string,
    data: Record<string, any>
  ): Promise<NotificationResponse> {
    try {
      const template = this.getEmailTemplate(templateName, data);

      const result = await this.emailTransporter.sendMail({
        from: config.email.from,
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error: any) {
      console.error('Email send failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send WhatsApp message via WhatsApp Business API
   */
  async sendWhatsApp(
    message: WhatsAppMessage
  ): Promise<NotificationResponse> {
    try {
      const url = `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`;

      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          to: message.to,
          type: message.type,
          text: message.text,
          template: message.template,
        },
        {
          headers: {
            Authorization: `Bearer ${config.whatsapp.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error: any) {
      console.error('WhatsApp send failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send push notification via AWS SNS
   */
  async sendPushNotification(
    notification: PushNotification
  ): Promise<NotificationResponse> {
    try {
      const message = JSON.stringify({
        default: notification.body,
        APNS: JSON.stringify({
          aps: {
            alert: {
              title: notification.title,
              body: notification.body,
            },
            badge: notification.badge || 0,
            sound: 'default',
          },
          data: notification.data,
        }),
        GCM: JSON.stringify({
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data,
        }),
      });

      const result = await this.snsClient.send(
        new PublishCommand({
          TopicArn: config.aws.snsTopicArn,
          Message: message,
          MessageStructure: 'json',
        })
      );

      return {
        success: true,
        messageId: result.MessageId,
      };
    } catch (error: any) {
      console.error('Push notification send failed:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(
    requests: NotificationRequest[]
  ): Promise<NotificationResponse[]> {
    const results = await Promise.all(
      requests.map((request) => this.sendNotification(request))
    );

    return results;
  }

  /**
   * Get email template
   */
  private getEmailTemplate(
    templateName: string,
    data: Record<string, any>
  ): EmailTemplate {
    const templates: Record<string, EmailTemplate> = {
      appointment_confirmation: {
        subject: 'Appointment Confirmation - MedhaOS',
        text: `Dear ${data.patientName},\n\nYour appointment has been confirmed.\n\nDate: ${data.appointmentDate}\nTime: ${data.appointmentTime}\nDoctor: ${data.doctorName}\nFacility: ${data.facilityName}\n\nThank you,\nMedhaOS Team`,
        html: `
          <h2>Appointment Confirmation</h2>
          <p>Dear ${data.patientName},</p>
          <p>Your appointment has been confirmed.</p>
          <ul>
            <li><strong>Date:</strong> ${data.appointmentDate}</li>
            <li><strong>Time:</strong> ${data.appointmentTime}</li>
            <li><strong>Doctor:</strong> ${data.doctorName}</li>
            <li><strong>Facility:</strong> ${data.facilityName}</li>
          </ul>
          <p>Thank you,<br>MedhaOS Team</p>
        `,
      },
      medication_reminder: {
        subject: 'Medication Reminder - MedhaOS',
        text: `Dear ${data.patientName},\n\nThis is a reminder to take your medication:\n\n${data.medicationName}\nDosage: ${data.dosage}\nTime: ${data.time}\n\nThank you,\nMedhaOS Team`,
        html: `
          <h2>Medication Reminder</h2>
          <p>Dear ${data.patientName},</p>
          <p>This is a reminder to take your medication:</p>
          <ul>
            <li><strong>Medication:</strong> ${data.medicationName}</li>
            <li><strong>Dosage:</strong> ${data.dosage}</li>
            <li><strong>Time:</strong> ${data.time}</li>
          </ul>
          <p>Thank you,<br>MedhaOS Team</p>
        `,
      },
      lab_results_ready: {
        subject: 'Lab Results Available - MedhaOS',
        text: `Dear ${data.patientName},\n\nYour lab results are now available.\n\nTest: ${data.testName}\nDate: ${data.testDate}\n\nPlease log in to your MedhaOS account to view your results.\n\nThank you,\nMedhaOS Team`,
        html: `
          <h2>Lab Results Available</h2>
          <p>Dear ${data.patientName},</p>
          <p>Your lab results are now available.</p>
          <ul>
            <li><strong>Test:</strong> ${data.testName}</li>
            <li><strong>Date:</strong> ${data.testDate}</li>
          </ul>
          <p>Please log in to your MedhaOS account to view your results.</p>
          <p>Thank you,<br>MedhaOS Team</p>
        `,
      },
      discharge_summary: {
        subject: 'Discharge Summary - MedhaOS',
        text: `Dear ${data.patientName},\n\nYou have been discharged from ${data.facilityName}.\n\nDischarge Date: ${data.dischargeDate}\n\nPlease follow the instructions provided by your doctor.\n\nThank you,\nMedhaOS Team`,
        html: `
          <h2>Discharge Summary</h2>
          <p>Dear ${data.patientName},</p>
          <p>You have been discharged from ${data.facilityName}.</p>
          <p><strong>Discharge Date:</strong> ${data.dischargeDate}</p>
          <p>Please follow the instructions provided by your doctor.</p>
          <p>Thank you,<br>MedhaOS Team</p>
        `,
      },
    };

    return (
      templates[templateName] || {
        subject: 'Notification from MedhaOS',
        text: JSON.stringify(data),
        html: `<p>${JSON.stringify(data)}</p>`,
      }
    );
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(placeholder, String(value));
    }

    return rendered;
  }

  /**
   * Schedule notification for future delivery
   */
  async scheduleNotification(
    request: NotificationRequest,
    scheduledTime: Date
  ): Promise<{ scheduledId: string }> {
    try {
      // In a real implementation, this would use a job queue like AWS SQS or Bull
      console.log('Scheduling notification for:', scheduledTime);

      return {
        scheduledId: `scheduled_${Date.now()}`,
      };
    } catch (error: any) {
      console.error('Notification scheduling failed:', error.message);
      throw new Error(`Notification scheduling failed: ${error.message}`);
    }
  }

  /**
   * Get notification delivery status
   */
  async getNotificationStatus(messageId: string): Promise<{
    status: 'SENT' | 'DELIVERED' | 'FAILED' | 'PENDING';
    deliveredAt?: string;
    error?: string;
  }> {
    try {
      // In a real implementation, this would query the delivery status
      console.log('Checking notification status:', messageId);

      return {
        status: 'DELIVERED',
        deliveredAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Status check failed:', error.message);
      throw new Error(`Status check failed: ${error.message}`);
    }
  }
}
