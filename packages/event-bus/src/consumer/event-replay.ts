/**
 * Event Replay Mechanism
 * Handles replaying failed events from Dead Letter Queues
 */

import { Message } from '@aws-sdk/client-sqs';
import { MedhaOSSQSClient } from '../clients/sqs-client';
import { MedhaOSEventBridgeClient } from '../clients/eventbridge-client';
import { DLQReplayConfig, defaultDLQReplayConfig } from '../config/dlq-config';
import { EventBridgeConfig, defaultEventBridgeConfig } from '../config/eventbridge-config';
import { BaseEvent } from '../schemas';

export interface ReplayResult {
  totalMessages: number;
  successCount: number;
  failedCount: number;
  failedMessages: Array<{
    messageId: string;
    error: string;
    event?: BaseEvent;
  }>;
}

export interface ReplayOptions {
  maxMessages?: number;
  dryRun?: boolean;
  filterEventType?: string;
  replayConfig?: Partial<DLQReplayConfig>;
}

export class EventReplayService {
  private sqsClient: MedhaOSSQSClient;
  private eventBridgeClient: MedhaOSEventBridgeClient;
  private defaultConfig: DLQReplayConfig;

  constructor(
    region: string = 'ap-south-1',
    eventBridgeConfig?: EventBridgeConfig
  ) {
    this.sqsClient = new MedhaOSSQSClient(region);
    this.eventBridgeClient = new MedhaOSEventBridgeClient(
      eventBridgeConfig || defaultEventBridgeConfig
    );
    this.defaultConfig = defaultDLQReplayConfig;
  }

  /**
   * Replay events from a Dead Letter Queue
   */
  async replayFromDLQ(
    dlqUrl: string,
    targetQueueUrl: string,
    options: ReplayOptions = {}
  ): Promise<ReplayResult> {
    const config = { ...this.defaultConfig, ...options.replayConfig };
    const maxMessages = options.maxMessages || 100;

    console.log(`Starting replay from DLQ: ${dlqUrl}`);
    console.log(`Target queue: ${targetQueueUrl}`);
    console.log(`Max messages: ${maxMessages}`);
    console.log(`Dry run: ${options.dryRun || false}`);

    const result: ReplayResult = {
      totalMessages: 0,
      successCount: 0,
      failedCount: 0,
      failedMessages: [],
    };

    let processedCount = 0;

    while (processedCount < maxMessages) {
      // Receive messages from DLQ
      const receiveResult = await this.sqsClient.receiveMessages(
        dlqUrl,
        Math.min(config.batchSize, maxMessages - processedCount),
        0 // No wait time for replay
      );

      if (!receiveResult.success || !receiveResult.messages || receiveResult.messages.length === 0) {
        console.log('No more messages in DLQ');
        break;
      }

      const messages = receiveResult.messages;
      result.totalMessages += messages.length;

      // Filter messages if needed
      const filteredMessages = options.filterEventType
        ? messages.filter((msg) => this.matchesEventType(msg, options.filterEventType!))
        : messages;

      console.log(`Processing batch of ${filteredMessages.length} messages`);

      // Process each message
      for (const message of filteredMessages) {
        const replayResult = await this.replayMessage(
          message,
          targetQueueUrl,
          config,
          options.dryRun || false
        );

        if (replayResult.success) {
          result.successCount++;

          // Delete from DLQ if not dry run
          if (!options.dryRun && message.ReceiptHandle) {
            await this.sqsClient.deleteMessage(dlqUrl, message.ReceiptHandle);
          }
        } else {
          result.failedCount++;
          result.failedMessages.push({
            messageId: message.MessageId || 'unknown',
            error: replayResult.error || 'Unknown error',
            event: replayResult.event,
          });
        }
      }

      processedCount += messages.length;

      // Delay between batches
      if (processedCount < maxMessages && config.delayBetweenBatches > 0) {
        await this.delay(config.delayBetweenBatches);
      }
    }

    console.log('Replay completed:', result);
    return result;
  }

  /**
   * Replay events back to EventBridge
   */
  async replayToEventBridge(
    dlqUrl: string,
    options: ReplayOptions = {}
  ): Promise<ReplayResult> {
    const config = { ...this.defaultConfig, ...options.replayConfig };
    const maxMessages = options.maxMessages || 100;

    console.log(`Starting replay from DLQ to EventBridge: ${dlqUrl}`);
    console.log(`Max messages: ${maxMessages}`);
    console.log(`Dry run: ${options.dryRun || false}`);

    const result: ReplayResult = {
      totalMessages: 0,
      successCount: 0,
      failedCount: 0,
      failedMessages: [],
    };

    let processedCount = 0;

    while (processedCount < maxMessages) {
      // Receive messages from DLQ
      const receiveResult = await this.sqsClient.receiveMessages(
        dlqUrl,
        Math.min(config.batchSize, maxMessages - processedCount),
        0
      );

      if (!receiveResult.success || !receiveResult.messages || receiveResult.messages.length === 0) {
        console.log('No more messages in DLQ');
        break;
      }

      const messages = receiveResult.messages;
      result.totalMessages += messages.length;

      // Filter messages if needed
      const filteredMessages = options.filterEventType
        ? messages.filter((msg) => this.matchesEventType(msg, options.filterEventType!))
        : messages;

      console.log(`Processing batch of ${filteredMessages.length} messages`);

      // Process each message
      for (const message of filteredMessages) {
        const replayResult = await this.replayToEventBridgeMessage(
          message,
          options.dryRun || false
        );

        if (replayResult.success) {
          result.successCount++;

          // Delete from DLQ if not dry run
          if (!options.dryRun && message.ReceiptHandle) {
            await this.sqsClient.deleteMessage(dlqUrl, message.ReceiptHandle);
          }
        } else {
          result.failedCount++;
          result.failedMessages.push({
            messageId: message.MessageId || 'unknown',
            error: replayResult.error || 'Unknown error',
            event: replayResult.event,
          });
        }
      }

      processedCount += messages.length;

      // Delay between batches
      if (processedCount < maxMessages && config.delayBetweenBatches > 0) {
        await this.delay(config.delayBetweenBatches);
      }
    }

    console.log('Replay to EventBridge completed:', result);
    return result;
  }

  /**
   * Replay a single message to a target queue
   */
  private async replayMessage(
    message: Message,
    targetQueueUrl: string,
    config: DLQReplayConfig,
    dryRun: boolean
  ): Promise<{ success: boolean; error?: string; event?: BaseEvent }> {
    if (!message.Body) {
      return { success: false, error: 'Message has no body' };
    }

    try {
      // Parse the event
      const eventBridgeMessage = JSON.parse(message.Body);
      const event: BaseEvent = JSON.parse(eventBridgeMessage.detail || eventBridgeMessage);

      console.log(`Replaying event: ${event.eventType} (${event.eventId})`);

      if (dryRun) {
        console.log('Dry run - would replay event:', event);
        return { success: true, event };
      }

      // Send to target queue with retry
      let lastError: string | undefined;

      for (let attempt = 0; attempt < config.maxRetries; attempt++) {
        const sendResult = await this.sqsClient.sendMessage(
          targetQueueUrl,
          message.Body
        );

        if (sendResult.success) {
          return { success: true, event };
        }

        lastError = sendResult.error;

        if (attempt < config.maxRetries - 1) {
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      }

      return {
        success: false,
        error: lastError || 'Failed after retries',
        event,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Replay a single message back to EventBridge
   */
  private async replayToEventBridgeMessage(
    message: Message,
    dryRun: boolean
  ): Promise<{ success: boolean; error?: string; event?: BaseEvent }> {
    if (!message.Body) {
      return { success: false, error: 'Message has no body' };
    }

    try {
      // Parse the event
      const eventBridgeMessage = JSON.parse(message.Body);
      const event: BaseEvent = JSON.parse(eventBridgeMessage.detail || eventBridgeMessage);

      console.log(`Replaying event to EventBridge: ${event.eventType} (${event.eventId})`);

      if (dryRun) {
        console.log('Dry run - would replay event:', event);
        return { success: true, event };
      }

      // Publish to EventBridge
      const publishResult = await this.eventBridgeClient.publishEvent(event);

      if (publishResult.success) {
        return { success: true, event };
      }

      return {
        success: false,
        error: publishResult.error || 'Failed to publish',
        event,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if a message matches the event type filter
   */
  private matchesEventType(message: Message, eventType: string): boolean {
    try {
      const eventBridgeMessage = JSON.parse(message.Body || '{}');
      const event: BaseEvent = JSON.parse(eventBridgeMessage.detail || eventBridgeMessage);
      return event.eventType === eventType || event.eventType.startsWith(eventType);
    } catch {
      return false;
    }
  }

  /**
   * Get DLQ statistics
   */
  async getDLQStatistics(dlqUrl: string): Promise<{
    success: boolean;
    statistics?: {
      approximateNumberOfMessages: number;
      approximateNumberOfMessagesNotVisible: number;
      oldestMessageAge?: number;
    };
    error?: string;
  }> {
    const result = await this.sqsClient.getDLQMetrics(dlqUrl);

    if (!result.success || !result.metrics) {
      return {
        success: false,
        error: result.error,
      };
    }

    const now = Date.now() / 1000;
    const oldestMessageAge = result.metrics.createdTimestamp
      ? now - result.metrics.createdTimestamp
      : undefined;

    return {
      success: true,
      statistics: {
        approximateNumberOfMessages: result.metrics.approximateNumberOfMessages,
        approximateNumberOfMessagesNotVisible: result.metrics.approximateNumberOfMessagesNotVisible,
        oldestMessageAge,
      },
    };
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create an event replay service
 */
export function createEventReplayService(
  region?: string,
  eventBridgeConfig?: EventBridgeConfig
): EventReplayService {
  return new EventReplayService(region, eventBridgeConfig);
}
