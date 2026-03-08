/**
 * Amazon SQS Client Wrapper for DLQ Management
 */

import {
  SQSClient,
  SendMessageCommand,
  SendMessageBatchCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  DeleteMessageBatchCommand,
  GetQueueAttributesCommand,
  PurgeQueueCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { DLQConfig } from '../config/dlq-config';

export class MedhaOSSQSClient {
  private client: SQSClient;
  private region: string;

  constructor(region: string = 'ap-south-1') {
    this.region = region;
    this.client = new SQSClient({ region });
  }

  /**
   * Send a message to a queue
   */
  async sendMessage(
    queueUrl: string,
    messageBody: any,
    delaySeconds?: number
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(messageBody),
        DelaySeconds: delaySeconds,
      });

      const response = await this.client.send(command);

      return {
        success: true,
        messageId: response.MessageId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send multiple messages in batch
   */
  async sendMessageBatch(
    queueUrl: string,
    messages: Array<{ id: string; body: any; delaySeconds?: number }>
  ): Promise<{
    successCount: number;
    failedCount: number;
    failedMessages: Array<{ id: string; error: string }>;
  }> {
    try {
      const entries = messages.map((msg) => ({
        Id: msg.id,
        MessageBody: JSON.stringify(msg.body),
        DelaySeconds: msg.delaySeconds,
      }));

      const command = new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: entries,
      });

      const response = await this.client.send(command);

      const successCount = response.Successful?.length || 0;
      const failedCount = response.Failed?.length || 0;
      const failedMessages =
        response.Failed?.map((f) => ({
          id: f.Id || '',
          error: f.Message || 'Unknown error',
        })) || [];

      return {
        successCount,
        failedCount,
        failedMessages,
      };
    } catch (error: any) {
      return {
        successCount: 0,
        failedCount: messages.length,
        failedMessages: messages.map((m) => ({
          id: m.id,
          error: error.message,
        })),
      };
    }
  }

  /**
   * Receive messages from a queue
   */
  async receiveMessages(
    queueUrl: string,
    maxMessages: number = 10,
    waitTimeSeconds: number = 20
  ): Promise<{ success: boolean; messages?: Message[]; error?: string }> {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: waitTimeSeconds,
        AttributeNames: ['All'],
        MessageAttributeNames: ['All'],
      });

      const response = await this.client.send(command);

      return {
        success: true,
        messages: response.Messages || [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete a message from a queue
   */
  async deleteMessage(
    queueUrl: string,
    receiptHandle: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      });

      await this.client.send(command);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete multiple messages in batch
   */
  async deleteMessageBatch(
    queueUrl: string,
    messages: Array<{ id: string; receiptHandle: string }>
  ): Promise<{
    successCount: number;
    failedCount: number;
    failedDeletes: Array<{ id: string; error: string }>;
  }> {
    try {
      const entries = messages.map((msg) => ({
        Id: msg.id,
        ReceiptHandle: msg.receiptHandle,
      }));

      const command = new DeleteMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: entries,
      });

      const response = await this.client.send(command);

      const successCount = response.Successful?.length || 0;
      const failedCount = response.Failed?.length || 0;
      const failedDeletes =
        response.Failed?.map((f) => ({
          id: f.Id || '',
          error: f.Message || 'Unknown error',
        })) || [];

      return {
        successCount,
        failedCount,
        failedDeletes,
      };
    } catch (error: any) {
      return {
        successCount: 0,
        failedCount: messages.length,
        failedDeletes: messages.map((m) => ({
          id: m.id,
          error: error.message,
        })),
      };
    }
  }

  /**
   * Get queue attributes (for monitoring)
   */
  async getQueueAttributes(queueUrl: string): Promise<{
    success: boolean;
    attributes?: Record<string, string>;
    error?: string;
  }> {
    try {
      const command = new GetQueueAttributesCommand({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      });

      const response = await this.client.send(command);

      return {
        success: true,
        attributes: response.Attributes,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get DLQ metrics for monitoring
   */
  async getDLQMetrics(queueUrl: string): Promise<{
    success: boolean;
    metrics?: {
      approximateNumberOfMessages: number;
      approximateNumberOfMessagesNotVisible: number;
      approximateNumberOfMessagesDelayed: number;
      createdTimestamp: number;
      lastModifiedTimestamp: number;
      messageRetentionPeriod: number;
    };
    error?: string;
  }> {
    const result = await this.getQueueAttributes(queueUrl);

    if (!result.success || !result.attributes) {
      return {
        success: false,
        error: result.error,
      };
    }

    const attrs = result.attributes;

    return {
      success: true,
      metrics: {
        approximateNumberOfMessages: parseInt(attrs.ApproximateNumberOfMessages || '0'),
        approximateNumberOfMessagesNotVisible: parseInt(
          attrs.ApproximateNumberOfMessagesNotVisible || '0'
        ),
        approximateNumberOfMessagesDelayed: parseInt(
          attrs.ApproximateNumberOfMessagesDelayed || '0'
        ),
        createdTimestamp: parseInt(attrs.CreatedTimestamp || '0'),
        lastModifiedTimestamp: parseInt(attrs.LastModifiedTimestamp || '0'),
        messageRetentionPeriod: parseInt(attrs.MessageRetentionPeriod || '0'),
      },
    };
  }

  /**
   * Purge all messages from a queue (use with caution!)
   */
  async purgeQueue(queueUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new PurgeQueueCommand({
        QueueUrl: queueUrl,
      });

      await this.client.send(command);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
