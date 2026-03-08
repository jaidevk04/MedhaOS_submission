import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { NotificationPayload, TTSRequest, TTSResponse } from '../types';
import { config } from '../config';

/**
 * Notification Service
 * Handles sending notifications via SMS, WhatsApp, voice calls, and push notifications
 */
export class NotificationService {
  private snsClient: SNSClient;
  private pollyClient: PollyClient;
  private s3Client: S3Client;

  constructor() {
    const awsConfig = {
      region: config.aws.region,
      credentials: config.aws.accessKeyId && config.aws.secretAccessKey ? {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      } : undefined,
    };

    this.snsClient = new SNSClient(awsConfig);
    this.pollyClient = new PollyClient(awsConfig);
    this.s3Client = new S3Client(awsConfig);
  }

  /**
   * Send notification via appropriate channel
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    console.log(`Sending ${payload.method} notification to patient ${payload.patientId}`);

    switch (payload.method) {
      case 'sms':
        await this.sendSMS(payload);
        break;
      case 'whatsapp':
        await this.sendWhatsApp(payload);
        break;
      case 'voice':
        await this.sendVoiceCall(payload);
        break;
      case 'push':
        await this.sendPushNotification(payload);
        break;
      case 'email':
        await this.sendEmail(payload);
        break;
      default:
        throw new Error(`Unsupported notification method: ${payload.method}`);
    }
  }

  /**
   * Send SMS notification via AWS SNS
   */
  private async sendSMS(payload: NotificationPayload): Promise<void> {
    try {
      // Get patient phone number
      const phoneNumber = await this.getPatientPhone(payload.patientId);
      
      if (!phoneNumber) {
        throw new Error('Patient phone number not found');
      }

      const command = new PublishCommand({
        Message: payload.message,
        PhoneNumber: phoneNumber,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      });

      const response = await this.snsClient.send(command);
      console.log('SMS sent successfully:', response.MessageId);
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp message
   */
  private async sendWhatsApp(payload: NotificationPayload): Promise<void> {
    try {
      // Get patient WhatsApp number
      const whatsappNumber = await this.getPatientWhatsApp(payload.patientId);
      
      if (!whatsappNumber) {
        throw new Error('Patient WhatsApp number not found');
      }

      // In production, integrate with WhatsApp Business API
      // For now, using SNS topic (would need WhatsApp Business API setup)
      if (config.aws.sns.whatsappTopicArn) {
        const command = new PublishCommand({
          TopicArn: config.aws.sns.whatsappTopicArn,
          Message: JSON.stringify({
            to: whatsappNumber,
            message: payload.message,
            language: payload.language,
          }),
        });

        const response = await this.snsClient.send(command);
        console.log('WhatsApp message queued:', response.MessageId);
      } else {
        console.log('WhatsApp API not configured, falling back to SMS');
        await this.sendSMS(payload);
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  /**
   * Send voice call with TTS
   */
  private async sendVoiceCall(payload: NotificationPayload): Promise<void> {
    try {
      // Generate audio from text using AWS Polly
      const ttsResponse = await this.textToSpeech({
        text: payload.message,
        language: payload.language,
      });

      // Get patient phone number
      const phoneNumber = await this.getPatientPhone(payload.patientId);
      
      if (!phoneNumber) {
        throw new Error('Patient phone number not found');
      }

      // In production, integrate with Twilio or AWS Connect for voice calls
      // For now, log the action
      console.log(`Voice call would be initiated to ${phoneNumber}`);
      console.log(`Audio URL: ${ttsResponse.audioUrl}`);
      
      // Example Twilio integration (commented out):
      // const call = await twilioClient.calls.create({
      //   url: ttsResponse.audioUrl,
      //   to: phoneNumber,
      //   from: config.twilio.phoneNumber,
      // });
    } catch (error) {
      console.error('Error sending voice call:', error);
      throw error;
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(payload: NotificationPayload): Promise<void> {
    try {
      // In production, integrate with FCM (Firebase Cloud Messaging) or SNS Mobile Push
      console.log('Push notification would be sent:', payload.message);
      
      // Example SNS Mobile Push (commented out):
      // const command = new PublishCommand({
      //   TargetArn: deviceEndpointArn,
      //   Message: JSON.stringify({
      //     default: payload.message,
      //     GCM: JSON.stringify({
      //       notification: {
      //         title: 'MedhaOS Reminder',
      //         body: payload.message,
      //       },
      //     }),
      //   }),
      //   MessageStructure: 'json',
      // });
      // await this.snsClient.send(command);
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(payload: NotificationPayload): Promise<void> {
    try {
      // Get patient email
      const email = await this.getPatientEmail(payload.patientId);
      
      if (!email) {
        throw new Error('Patient email not found');
      }

      // In production, use AWS SES or similar email service
      console.log(`Email would be sent to ${email}:`, payload.message);
      
      // Example SES integration (commented out):
      // const sesClient = new SESClient({ region: config.aws.region });
      // const command = new SendEmailCommand({
      //   Source: 'noreply@medhaos.com',
      //   Destination: { ToAddresses: [email] },
      //   Message: {
      //     Subject: { Data: 'MedhaOS Medication Reminder' },
      //     Body: { Text: { Data: payload.message } },
      //   },
      // });
      // await sesClient.send(command);
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech using AWS Polly
   */
  async textToSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      // Determine voice ID based on language
      const voiceId = this.getVoiceIdForLanguage(request.language, request.voiceId);

      const command = new SynthesizeSpeechCommand({
        Text: request.text,
        OutputFormat: 'mp3',
        VoiceId: voiceId,
        Engine: 'neural', // Use neural engine for better quality
        LanguageCode: this.getLanguageCode(request.language),
      });

      const response = await this.pollyClient.send(command);
      
      if (!response.AudioStream) {
        throw new Error('No audio stream received from Polly');
      }

      // Convert audio stream to buffer
      const audioBuffer = await this.streamToBuffer(response.AudioStream);
      
      // Upload to S3
      const audioKey = `tts/${uuidv4()}.mp3`;
      await this.uploadToS3(audioBuffer, audioKey, 'audio/mpeg');
      
      const audioUrl = `https://${config.aws.s3.bucketName}.s3.${config.aws.s3.region}.amazonaws.com/${audioKey}`;

      return {
        audioUrl,
        duration: 0, // Would need to calculate from audio
        format: 'mp3',
      };
    } catch (error) {
      console.error('Error generating TTS:', error);
      throw error;
    }
  }

  /**
   * Get voice ID for language
   */
  private getVoiceIdForLanguage(language: string, customVoiceId?: string): string {
    if (customVoiceId) return customVoiceId;

    const voiceMap: Record<string, string> = {
      hi: config.aws.polly.voiceIds.hindi,
      en: config.aws.polly.voiceIds.english,
      ta: config.aws.polly.voiceIds.tamil,
      kn: config.aws.polly.voiceIds.kannada,
    };

    return voiceMap[language] || config.aws.polly.voiceIds.english;
  }

  /**
   * Get AWS Polly language code
   */
  private getLanguageCode(language: string): string {
    const languageMap: Record<string, string> = {
      hi: 'hi-IN',
      en: 'en-IN',
      ta: 'ta-IN',
      kn: 'kn-IN',
      te: 'te-IN',
      ml: 'ml-IN',
      bn: 'bn-IN',
      mr: 'mr-IN',
      gu: 'gu-IN',
      pa: 'pa-IN',
    };

    return languageMap[language] || 'en-IN';
  }

  /**
   * Convert stream to buffer
   */
  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Upload file to S3
   */
  private async uploadToS3(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: config.aws.s3.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    console.log(`Uploaded to S3: ${key}`);
  }

  // Helper methods to get patient contact information
  // In production, these would query the database

  private async getPatientPhone(patientId: string): Promise<string | null> {
    // return await prisma.patient.findUnique({ where: { id: patientId }, select: { phone: true } });
    return '+919876543210'; // Mock
  }

  private async getPatientWhatsApp(patientId: string): Promise<string | null> {
    // return await prisma.patient.findUnique({ where: { id: patientId }, select: { whatsapp: true } });
    return '+919876543210'; // Mock
  }

  private async getPatientEmail(patientId: string): Promise<string | null> {
    // return await prisma.patient.findUnique({ where: { id: patientId }, select: { email: true } });
    return 'patient@example.com'; // Mock
  }
}
