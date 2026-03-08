/**
 * Lambda Event Handler Utilities
 * Provides utilities for processing events in AWS Lambda functions
 */

import { SQSEvent, SQSRecord, EventBridgeEvent, Context } from 'aws-lambda';
import { BaseEvent, EventType } from '../schemas';

export interface LambdaEventHandler<T extends BaseEvent = BaseEvent> {
  eventType: EventType | EventType[];
  handle: (event: T, context: Context) => Promise<void>;
}

export interface LambdaHandlerConfig {
  handlers: LambdaEventHandler[];
  errorHandler?: (error: Error, event?: BaseEvent, context?: Context) => Promise<void>;
  logEvents?: boolean;
}

/**
 * Create a Lambda handler for SQS events
 */
export function createSQSLambdaHandler(config: LambdaHandlerConfig) {
  const handlerMap = new Map<EventType, LambdaEventHandler['handle'][]>();

  // Build handler map
  config.handlers.forEach((handler) => {
    const types = Array.isArray(handler.eventType) ? handler.eventType : [handler.eventType];
    types.forEach((type) => {
      if (!handlerMap.has(type)) {
        handlerMap.set(type, []);
      }
      handlerMap.get(type)!.push(handler.handle as any);
    });
  });

  return async (sqsEvent: SQSEvent, context: Context): Promise<any> => {
    if (config.logEvents) {
      console.log('Received SQS event:', JSON.stringify(sqsEvent, null, 2));
    }

    const results = await Promise.allSettled(
      sqsEvent.Records.map((record) => processSQSRecord(record, handlerMap, context, config))
    );

    // Check for failures
    const failures = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ index }) => sqsEvent.Records[index]);

    if (failures.length > 0) {
      // Return batch item failures for partial batch failure handling
      return {
        batchItemFailures: failures.map((record) => ({
          itemIdentifier: record.messageId,
        })),
      };
    }

    return { batchItemFailures: [] };
  };
}

/**
 * Process a single SQS record
 */
async function processSQSRecord(
  record: SQSRecord,
  handlerMap: Map<EventType, LambdaEventHandler['handle'][]>,
  context: Context,
  config: LambdaHandlerConfig
): Promise<void> {
  try {
    // Parse the event from SQS message
    const eventBridgeMessage = JSON.parse(record.body);
    const event: BaseEvent = JSON.parse(eventBridgeMessage.detail || eventBridgeMessage);

    if (config.logEvents) {
      console.log('Processing event:', event.eventType, event.eventId);
    }

    // Get handlers for this event type
    const handlers = handlerMap.get(event.eventType as EventType) || [];

    if (handlers.length === 0) {
      console.warn(`No handlers registered for event type: ${event.eventType}`);
      return;
    }

    // Execute all handlers
    await Promise.all(handlers.map((handler) => handler(event, context)));

    if (config.logEvents) {
      console.log('Successfully processed event:', event.eventId);
    }
  } catch (error) {
    console.error('Error processing SQS record:', error);

    // Parse event for error handler
    let event: BaseEvent | undefined;
    try {
      const eventBridgeMessage = JSON.parse(record.body);
      event = JSON.parse(eventBridgeMessage.detail || eventBridgeMessage);
    } catch {
      // Ignore parse errors
    }

    if (config.errorHandler) {
      await config.errorHandler(error as Error, event, context);
    }

    // Re-throw to mark as failed
    throw error;
  }
}

/**
 * Create a Lambda handler for EventBridge events
 */
export function createEventBridgeLambdaHandler(config: LambdaHandlerConfig) {
  const handlerMap = new Map<EventType, LambdaEventHandler['handle'][]>();

  // Build handler map
  config.handlers.forEach((handler) => {
    const types = Array.isArray(handler.eventType) ? handler.eventType : [handler.eventType];
    types.forEach((type) => {
      if (!handlerMap.has(type)) {
        handlerMap.set(type, []);
      }
      handlerMap.get(type)!.push(handler.handle as any);
    });
  });

  return async (eventBridgeEvent: EventBridgeEvent<string, any>, context: Context): Promise<void> => {
    if (config.logEvents) {
      console.log('Received EventBridge event:', JSON.stringify(eventBridgeEvent, null, 2));
    }

    try {
      const event: BaseEvent = eventBridgeEvent.detail;

      if (config.logEvents) {
        console.log('Processing event:', event.eventType, event.eventId);
      }

      // Get handlers for this event type
      const handlers = handlerMap.get(event.eventType as EventType) || [];

      if (handlers.length === 0) {
        console.warn(`No handlers registered for event type: ${event.eventType}`);
        return;
      }

      // Execute all handlers
      await Promise.all(handlers.map((handler) => handler(event, context)));

      if (config.logEvents) {
        console.log('Successfully processed event:', event.eventId);
      }
    } catch (error) {
      console.error('Error processing EventBridge event:', error);

      if (config.errorHandler) {
        await config.errorHandler(error as Error, eventBridgeEvent.detail, context);
      }

      // Re-throw to mark as failed
      throw error;
    }
  };
}

/**
 * Utility to extract correlation ID from Lambda context
 */
export function getCorrelationId(event: BaseEvent, context: Context): string {
  return event.correlationId || context.requestId;
}

/**
 * Utility to add correlation ID to logs
 */
export function logWithCorrelation(
  correlationId: string,
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: any
): void {
  const logData = {
    correlationId,
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };

  console.log(JSON.stringify(logData));
}
