/**
 * Event Consumer Base Class
 * Provides infrastructure for consuming events from SQS queues
 */

import { Message } from '@aws-sdk/client-sqs';
import { MedhaOSSQSClient } from '../clients/sqs-client';
import { BaseEvent, EventType } from '../schemas';

export interface ConsumerConfig {
  queueUrl: string;
  region?: string;
  maxMessages?: number;
  waitTimeSeconds?: number;
  visibilityTimeout?: number;
  pollingIntervalMs?: number;
  errorHandler?: (error: Error, event?: BaseEvent) => Promise<void>;
  deadLetterQueueUrl?: string;
}

export interface EventHandler<T extends BaseEvent = BaseEvent> {
  eventType: EventType | EventType[];
  handle: (event: T) => Promise<void>;
}

export class EventConsumer {
  private client: MedhaOSSQSClient;
  private config: ConsumerConfig;
  private handlers: Map<EventType, EventHandler['handle'][]> = new Map();
  private isRunning: boolean = false;
  private pollingTimeout?: NodeJS.Timeout;

  constructor(config: ConsumerConfig) {
    this.config = {
      maxMessages: 10,
      waitTimeSeconds: 20,
      pollingIntervalMs: 1000,
      ...config,
    };
    this.client = new MedhaOSSQSClient(config.region);
  }

  /**
   * Register an event handler
   */
  on<T extends BaseEvent>(
    eventType: EventType | EventType[],
    handler: (event: T) => Promise<void>
  ): void {
    const types = Array.isArray(eventType) ? eventType : [eventType];

    types.forEach((type) => {
      if (!this.handlers.has(type)) {
        this.handlers.set(type, []);
      }
      this.handlers.get(type)!.push(handler as any);
    });
  }

  /**
   * Start consuming events
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('Consumer is already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting event consumer for queue: ${this.config.queueUrl}`);

    await this.poll();
  }

  /**
   * Stop consuming events
   */
  stop(): void {
    this.isRunning = false;
    if (this.pollingTimeout) {
      clearTimeout(this.pollingTimeout);
    }
    console.log('Event consumer stopped');
  }

  /**
   * Poll for messages
   */
  private async poll(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      const result = await this.client.receiveMessages(
        this.config.queueUrl,
        this.config.maxMessages,
        this.config.waitTimeSeconds
      );

      if (result.success && result.messages && result.messages.length > 0) {
        await this.processMessages(result.messages);
      }
    } catch (error) {
      console.error('Error polling for messages:', error);
      if (this.config.errorHandler) {
        await this.config.errorHandler(error as Error);
      }
    }

    // Schedule next poll
    this.pollingTimeout = setTimeout(
      () => this.poll(),
      this.config.pollingIntervalMs
    );
  }

  /**
   * Process received messages
   */
  private async processMessages(messages: Message[]): Promise<void> {
    const processPromises = messages.map((message) =>
      this.processMessage(message)
    );

    await Promise.allSettled(processPromises);
  }

  /**
   * Process a single message
   */
  private async processMessage(message: Message): Promise<void> {
    if (!message.Body || !message.ReceiptHandle) {
      console.warn('Received message without body or receipt handle');
      return;
    }

    try {
      // Parse the message
      const eventBridgeMessage = JSON.parse(message.Body);
      const event: BaseEvent = JSON.parse(eventBridgeMessage.detail || eventBridgeMessage);

      // Get handlers for this event type
      const handlers = this.handlers.get(event.eventType as EventType) || [];

      if (handlers.length === 0) {
        console.warn(`No handlers registered for event type: ${event.eventType}`);
        // Still delete the message to avoid reprocessing
        await this.deleteMessage(message.ReceiptHandle);
        return;
      }

      // Execute all handlers
      await Promise.all(handlers.map((handler) => handler(event)));

      // Delete the message after successful processing
      await this.deleteMessage(message.ReceiptHandle);
    } catch (error) {
      console.error('Error processing message:', error);

      // Parse event for error handler
      let event: BaseEvent | undefined;
      try {
        const eventBridgeMessage = JSON.parse(message.Body!);
        event = JSON.parse(eventBridgeMessage.detail || eventBridgeMessage);
      } catch {
        // Ignore parse errors
      }

      if (this.config.errorHandler) {
        await this.config.errorHandler(error as Error, event);
      }

      // Don't delete the message - let it go back to the queue or DLQ
    }
  }

  /**
   * Delete a message from the queue
   */
  private async deleteMessage(receiptHandle: string): Promise<void> {
    const result = await this.client.deleteMessage(
      this.config.queueUrl,
      receiptHandle
    );

    if (!result.success) {
      console.error('Failed to delete message:', result.error);
    }
  }

  /**
   * Get consumer statistics
   */
  async getStatistics(): Promise<{
    queueUrl: string;
    isRunning: boolean;
    registeredHandlers: number;
    queueMetrics?: any;
  }> {
    const metricsResult = await this.client.getDLQMetrics(this.config.queueUrl);

    return {
      queueUrl: this.config.queueUrl,
      isRunning: this.isRunning,
      registeredHandlers: Array.from(this.handlers.values()).reduce(
        (sum, handlers) => sum + handlers.length,
        0
      ),
      queueMetrics: metricsResult.success ? metricsResult.metrics : undefined,
    };
  }
}

/**
 * Create an event consumer
 */
export function createEventConsumer(config: ConsumerConfig): EventConsumer {
  return new EventConsumer(config);
}
