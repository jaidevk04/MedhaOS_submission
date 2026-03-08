/**
 * MedhaOS Event Bus Package
 * Event-driven architecture infrastructure for the MedhaOS Healthcare Platform
 */

// Schemas and Types
export * from './schemas';
export * from './schemas/json-schemas';

// Configuration
export * from './config/eventbridge-config';
export * from './config/dlq-config';

// Clients
export * from './clients/eventbridge-client';
export * from './clients/sqs-client';

// Publisher
export * from './publisher/event-publisher';
export * from './publisher/event-helpers';

// Consumer
export * from './consumer/event-consumer';
export * from './consumer/lambda-handler';
export * from './consumer/event-replay';

// Re-export commonly used functions
export { createEventPublisher } from './publisher/event-publisher';
export { createEventHelpers } from './publisher/event-helpers';
export { createEventConsumer } from './consumer/event-consumer';
export { createEventReplayService } from './consumer/event-replay';
export { createSQSLambdaHandler, createEventBridgeLambdaHandler } from './consumer/lambda-handler';
