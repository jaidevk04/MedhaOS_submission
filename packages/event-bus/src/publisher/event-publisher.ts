/**
 * Event Publisher Service
 * Handles publishing events to EventBridge with validation, retry logic, and correlation
 */

import { v4 as uuidv4 } from 'uuid';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { MedhaOSEventBridgeClient } from '../clients/eventbridge-client';
import { EventBridgeConfig, defaultEventBridgeConfig } from '../config/eventbridge-config';
import { BaseEvent, MedhaOSEvent, EventType } from '../schemas';
import { getSchemaForEventType } from '../schemas/json-schemas';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export interface PublishOptions {
  correlationId?: string;
  metadata?: Record<string, any>;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface PublishResult {
  success: boolean;
  eventId?: string;
  error?: string;
  validationErrors?: string[];
}

export class EventPublisher {
  private client: MedhaOSEventBridgeClient;
  private serviceName: string;
  private defaultRetryAttempts: number = 3;
  private defaultRetryDelayMs: number = 1000;

  constructor(serviceName: string, config?: EventBridgeConfig) {
    this.serviceName = serviceName;
    this.client = new MedhaOSEventBridgeClient(config || defaultEventBridgeConfig);
  }

  /**
   * Publish a single event
   */
  async publish(
    eventType: EventType,
    data: any,
    options: PublishOptions = {}
  ): Promise<PublishResult> {
    // Create the event
    const event = this.createEvent(eventType, data, options);

    // Validate the event
    const validationResult = this.validateEvent(event);
    if (!validationResult.valid) {
      return {
        success: false,
        error: 'Event validation failed',
        validationErrors: validationResult.errors,
      };
    }

    // Publish with retry logic
    const retryAttempts = options.retryAttempts ?? this.defaultRetryAttempts;
    const retryDelayMs = options.retryDelayMs ?? this.defaultRetryDelayMs;

    let lastError: string | undefined;

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      if (attempt > 0) {
        // Wait before retrying
        await this.delay(retryDelayMs * attempt);
      }

      const result = await this.client.publishEvent(event);

      if (result.success) {
        return {
          success: true,
          eventId: result.eventId,
        };
      }

      lastError = result.error;
    }

    return {
      success: false,
      error: lastError || 'Failed to publish event after retries',
    };
  }

  /**
   * Publish multiple events in batch
   */
  async publishBatch(
    events: Array<{ eventType: EventType; data: any; options?: PublishOptions }>
  ): Promise<{
    successCount: number;
    failedCount: number;
    results: PublishResult[];
  }> {
    const createdEvents = events.map((e) =>
      this.createEvent(e.eventType, e.data, e.options || {})
    );

    // Validate all events
    const validationResults = createdEvents.map((event) => this.validateEvent(event));

    const validEvents: any[] = [];
    const results: PublishResult[] = [];

    validationResults.forEach((validation, index) => {
      if (validation.valid) {
        validEvents.push(createdEvents[index]);
        results.push({ success: true }); // Placeholder, will be updated
      } else {
        results.push({
          success: false,
          error: 'Event validation failed',
          validationErrors: validation.errors,
        });
      }
    });

    if (validEvents.length === 0) {
      return {
        successCount: 0,
        failedCount: events.length,
        results,
      };
    }

    // Publish valid events
    const publishResult = await this.client.publishEvents(validEvents);

    // Update results with publish outcomes
    let validEventIndex = 0;
    for (let i = 0; i < results.length; i++) {
      if (results[i].success) {
        if (validEventIndex < publishResult.successCount) {
          results[i] = { success: true };
        } else {
          const failedEvent = publishResult.failedEvents.find(
            (fe) => fe.event === validEvents[validEventIndex]
          );
          results[i] = {
            success: false,
            error: failedEvent?.error || 'Unknown error',
          };
        }
        validEventIndex++;
      }
    }

    return {
      successCount: publishResult.successCount,
      failedCount: results.filter((r) => !r.success).length,
      results,
    };
  }

  /**
   * Create an event with standard structure
   */
  private createEvent(
    eventType: EventType,
    data: any,
    options: PublishOptions
  ): BaseEvent & { data: any } {
    return {
      eventId: uuidv4(),
      eventType,
      source: this.serviceName,
      timestamp: new Date().toISOString(),
      correlationId: options.correlationId || uuidv4(),
      version: '1.0',
      metadata: options.metadata,
      data,
    };
  }

  /**
   * Validate an event against its schema
   */
  private validateEvent(event: any): { valid: boolean; errors?: string[] } {
    const schema = getSchemaForEventType(event.eventType);

    const validate = ajv.compile(schema);
    const valid = validate(event);

    if (!valid && validate.errors) {
      const errors = validate.errors.map(
        (err) => `${err.instancePath} ${err.message}`
      );
      return { valid: false, errors };
    }

    return { valid: true };
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create a correlation ID for tracking related events
   */
  static createCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Extract correlation ID from an event
   */
  static getCorrelationId(event: BaseEvent): string {
    return event.correlationId;
  }
}

/**
 * Convenience function to create an event publisher
 */
export function createEventPublisher(
  serviceName: string,
  config?: EventBridgeConfig
): EventPublisher {
  return new EventPublisher(serviceName, config);
}
