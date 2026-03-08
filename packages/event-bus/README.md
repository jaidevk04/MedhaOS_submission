# @medhaos/event-bus

Event-driven architecture infrastructure for the MedhaOS Healthcare Intelligence Ecosystem.

## Overview

This package provides a comprehensive event-driven architecture implementation using Amazon EventBridge and SQS. It includes:

- **Event Schemas**: Type-safe event definitions for all MedhaOS events
- **Event Publishing**: Reliable event publishing with validation and retry logic
- **Event Consumption**: Consumer infrastructure for processing events from SQS queues
- **Lambda Handlers**: Utilities for processing events in AWS Lambda functions
- **Dead Letter Queue Management**: DLQ configuration and event replay mechanisms
- **Event Routing**: EventBridge rules for routing events to appropriate handlers

## Installation

```bash
npm install @medhaos/event-bus
```

## Quick Start

### Publishing Events

```typescript
import { createEventPublisher, EventTypes } from '@medhaos/event-bus';

// Create a publisher
const publisher = createEventPublisher('triage-agent');

// Publish an event
await publisher.publish(EventTypes.TRIAGE_COMPLETED, {
  patientId: 'patient-123',
  encounterId: 'encounter-456',
  urgencyScore: 78,
  symptoms: ['chest pain', 'shortness of breath'],
  recommendedSpecialty: 'Cardiology',
  recommendedAction: 'ED',
  triageData: {},
});
```

### Using Event Helpers

```typescript
import { createEventPublisher, createEventHelpers } from '@medhaos/event-bus';

const publisher = createEventPublisher('triage-agent');
const helpers = createEventHelpers(publisher);

// Type-safe event publishing
await helpers.publishTriageCompleted({
  patientId: 'patient-123',
  encounterId: 'encounter-456',
  urgencyScore: 78,
  symptoms: ['chest pain'],
  recommendedSpecialty: 'Cardiology',
  recommendedAction: 'ED',
  triageData: {},
});
```

### Consuming Events

```typescript
import { createEventConsumer, EventTypes } from '@medhaos/event-bus';

// Create a consumer
const consumer = createEventConsumer({
  queueUrl: process.env.QUEUE_URL!,
  region: 'ap-south-1',
});

// Register event handlers
consumer.on(EventTypes.TRIAGE_COMPLETED, async (event) => {
  console.log('Triage completed:', event.data.patientId);
  // Process the event
});

// Start consuming
await consumer.start();
```

### Lambda Event Handlers

```typescript
import { createSQSLambdaHandler, EventTypes } from '@medhaos/event-bus';

export const handler = createSQSLambdaHandler({
  handlers: [
    {
      eventType: EventTypes.TRIAGE_COMPLETED,
      handle: async (event, context) => {
        console.log('Processing triage:', event.data.patientId);
        // Process the event
      },
    },
  ],
  logEvents: true,
});
```

### Event Replay from DLQ

```typescript
import { createEventReplayService } from '@medhaos/event-bus';

const replayService = createEventReplayService('ap-south-1');

// Replay events from DLQ back to the original queue
const result = await replayService.replayFromDLQ(
  process.env.DLQ_URL!,
  process.env.TARGET_QUEUE_URL!,
  {
    maxMessages: 100,
    dryRun: false,
  }
);

console.log(`Replayed ${result.successCount} events`);
```

## Event Types

The package includes comprehensive event schemas for all MedhaOS events:

### Clinical Events
- `patient.registered` - Patient registration
- `triage.completed` - Triage assessment completed
- `appointment.scheduled` - Appointment scheduled
- `consultation.started` - Consultation started
- `consultation.completed` - Consultation completed
- `prescription.created` - Prescription created
- `diagnostic.ordered` - Diagnostic test ordered
- `diagnostic.completed` - Diagnostic results available
- `patient.admitted` - Patient admitted to hospital
- `patient.discharged` - Patient discharged

### Operational Events
- `bed.occupancy.changed` - Bed occupancy status changed
- `queue.updated` - Patient queue updated
- `staff.schedule.changed` - Staff schedule modified
- `task.assigned` - Task assigned to nurse
- `task.completed` - Task completed

### Supply Chain Events
- `inventory.low` - Inventory below reorder level
- `inventory.restocked` - Inventory restocked
- `medication.expiring` - Medication approaching expiry
- `blood.donor.drive.triggered` - Blood donor drive initiated

### Financial Events
- `claim.generated` - Insurance claim generated
- `claim.submitted` - Claim submitted to payer
- `claim.rejected` - Claim rejected
- `payment.received` - Payment received

### Public Health Events
- `infection.cluster.detected` - Infection cluster detected
- `outbreak.predicted` - Disease outbreak predicted
- `public.health.alert` - Public health alert issued

### Agent Events
- `agent.task.started` - AI agent task started
- `agent.task.completed` - AI agent task completed
- `agent.escalation` - Agent escalated to human

## Configuration

### EventBridge Configuration

```typescript
import { EventBridgeConfig } from '@medhaos/event-bus';

const config: EventBridgeConfig = {
  eventBusName: 'medhaos-event-bus',
  region: 'ap-south-1',
  deadLetterQueueArn: process.env.DLQ_ARN,
  retryPolicy: {
    maximumRetryAttempts: 3,
    maximumEventAge: 3600,
  },
};
```

### Dead Letter Queue Configuration

```typescript
import { DLQConfig } from '@medhaos/event-bus';

const dlqConfig: DLQConfig = {
  queueName: 'medhaos-clinical-dlq',
  queueUrl: process.env.CLINICAL_DLQ_URL!,
  queueArn: process.env.CLINICAL_DLQ_ARN!,
  maxReceiveCount: 3,
  visibilityTimeout: 300,
  messageRetentionPeriod: 1209600, // 14 days
};
```

## Event Routing

Events are automatically routed to appropriate handlers based on EventBridge rules:

- **Clinical events** → Supervisor Agent, CDSS Agent
- **Triage events** → Queue Optimization Agent
- **Prescription events** → Drug Safety Agent
- **Diagnostic events** → Vision Agent
- **Operational events** → Operational Intelligence Agent
- **Supply chain events** → Supply Chain Agent
- **Financial events** → Revenue Cycle Agent
- **Public health events** → Public Health Intelligence Agent
- **Agent escalations** → Human operators

## Error Handling

The package includes comprehensive error handling:

- **Validation**: Events are validated against JSON schemas before publishing
- **Retry Logic**: Automatic retries with exponential backoff
- **Dead Letter Queues**: Failed events are sent to DLQs for later replay
- **Error Callbacks**: Custom error handlers for logging and alerting

## Monitoring

Get consumer statistics:

```typescript
const stats = await consumer.getStatistics();
console.log('Queue metrics:', stats.queueMetrics);
```

Get DLQ statistics:

```typescript
const dlqStats = await replayService.getDLQStatistics(dlqUrl);
console.log('Messages in DLQ:', dlqStats.statistics?.approximateNumberOfMessages);
```

## Best Practices

1. **Use Correlation IDs**: Always pass correlation IDs to track related events
2. **Validate Events**: Events are automatically validated, but ensure data quality
3. **Handle Errors**: Implement error handlers for logging and alerting
4. **Monitor DLQs**: Set up CloudWatch alarms for DLQ message counts
5. **Replay Failed Events**: Regularly review and replay failed events from DLQs
6. **Use Type-Safe Helpers**: Use event helpers for type-safe event publishing

## Architecture

```
┌─────────────────┐
│   Service A     │
│  (Publisher)    │
└────────┬────────┘
         │
         │ publish event
         ▼
┌─────────────────┐
│  EventBridge    │
│   Event Bus     │
└────────┬────────┘
         │
         │ route based on rules
         ▼
┌─────────────────┐
│   SQS Queue     │
└────────┬────────┘
         │
         │ consume
         ▼
┌─────────────────┐
│   Service B     │
│  (Consumer)     │
└─────────────────┘
         │
         │ on failure
         ▼
┌─────────────────┐
│  Dead Letter    │
│     Queue       │
└─────────────────┘
         │
         │ replay
         ▼
┌─────────────────┐
│  Event Replay   │
│    Service      │
└─────────────────┘
```

## License

MIT

## Support

For issues and questions, please contact the MedhaOS development team.
