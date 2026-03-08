/**
 * Dead Letter Queue (DLQ) Configuration
 * Handles failed event processing and retry mechanisms
 */

export interface DLQConfig {
  queueName: string;
  queueUrl: string;
  queueArn: string;
  maxReceiveCount: number;
  visibilityTimeout: number; // in seconds
  messageRetentionPeriod: number; // in seconds
  redrivePolicy?: {
    deadLetterTargetArn: string;
    maxReceiveCount: number;
  };
}

/**
 * Dead Letter Queues for different event categories
 */
export const deadLetterQueues: Record<string, DLQConfig> = {
  clinical: {
    queueName: 'medhaos-clinical-dlq',
    queueUrl: process.env.CLINICAL_DLQ_URL || '',
    queueArn: process.env.CLINICAL_DLQ_ARN || '',
    maxReceiveCount: 3,
    visibilityTimeout: 300, // 5 minutes
    messageRetentionPeriod: 1209600, // 14 days
  },

  operational: {
    queueName: 'medhaos-operational-dlq',
    queueUrl: process.env.OPERATIONAL_DLQ_URL || '',
    queueArn: process.env.OPERATIONAL_DLQ_ARN || '',
    maxReceiveCount: 3,
    visibilityTimeout: 300,
    messageRetentionPeriod: 1209600,
  },

  supplyChain: {
    queueName: 'medhaos-supply-chain-dlq',
    queueUrl: process.env.SUPPLY_CHAIN_DLQ_URL || '',
    queueArn: process.env.SUPPLY_CHAIN_DLQ_ARN || '',
    maxReceiveCount: 3,
    visibilityTimeout: 300,
    messageRetentionPeriod: 1209600,
  },

  financial: {
    queueName: 'medhaos-revenue-dlq',
    queueUrl: process.env.REVENUE_DLQ_URL || '',
    queueArn: process.env.REVENUE_DLQ_ARN || '',
    maxReceiveCount: 5, // More retries for financial events
    visibilityTimeout: 600, // 10 minutes
    messageRetentionPeriod: 1209600,
  },

  publicHealth: {
    queueName: 'medhaos-public-health-dlq',
    queueUrl: process.env.PUBLIC_HEALTH_DLQ_URL || '',
    queueArn: process.env.PUBLIC_HEALTH_DLQ_ARN || '',
    maxReceiveCount: 3,
    visibilityTimeout: 300,
    messageRetentionPeriod: 1209600,
  },

  agent: {
    queueName: 'medhaos-agent-dlq',
    queueUrl: process.env.AGENT_DLQ_URL || '',
    queueArn: process.env.AGENT_DLQ_ARN || '',
    maxReceiveCount: 3,
    visibilityTimeout: 300,
    messageRetentionPeriod: 1209600,
  },

  notification: {
    queueName: 'medhaos-notification-dlq',
    queueUrl: process.env.NOTIFICATION_DLQ_URL || '',
    queueArn: process.env.NOTIFICATION_DLQ_ARN || '',
    maxReceiveCount: 5, // More retries for notifications
    visibilityTimeout: 180, // 3 minutes
    messageRetentionPeriod: 604800, // 7 days
  },
};

/**
 * Get DLQ configuration for an event type
 */
export function getDLQForEventType(eventType: string): DLQConfig | undefined {
  if (eventType.startsWith('patient.') || eventType.startsWith('triage.') || 
      eventType.startsWith('consultation.') || eventType.startsWith('prescription.') ||
      eventType.startsWith('diagnostic.')) {
    return deadLetterQueues.clinical;
  }

  if (eventType.startsWith('bed.') || eventType.startsWith('queue.') ||
      eventType.startsWith('staff.') || eventType.startsWith('task.')) {
    return deadLetterQueues.operational;
  }

  if (eventType.startsWith('inventory.') || eventType.startsWith('medication.') ||
      eventType.startsWith('blood.')) {
    return deadLetterQueues.supplyChain;
  }

  if (eventType.startsWith('claim.') || eventType.startsWith('payment.')) {
    return deadLetterQueues.financial;
  }

  if (eventType.startsWith('infection.') || eventType.startsWith('outbreak.') ||
      eventType.startsWith('public.health.')) {
    return deadLetterQueues.publicHealth;
  }

  if (eventType.startsWith('agent.')) {
    return deadLetterQueues.agent;
  }

  if (eventType.startsWith('notification.')) {
    return deadLetterQueues.notification;
  }

  return undefined;
}

/**
 * DLQ monitoring and alerting thresholds
 */
export const dlqAlertThresholds = {
  // Alert when DLQ has more than this many messages
  messageCountThreshold: 10,
  
  // Alert when oldest message is older than this (in seconds)
  messageAgeThreshold: 3600, // 1 hour
  
  // Alert when receive count exceeds this
  receiveCountThreshold: 5,
  
  // Critical alert thresholds
  criticalMessageCountThreshold: 50,
  criticalMessageAgeThreshold: 7200, // 2 hours
};

/**
 * DLQ replay configuration
 * Used for replaying failed events after fixing issues
 */
export interface DLQReplayConfig {
  batchSize: number;
  delayBetweenBatches: number; // in milliseconds
  maxRetries: number;
  replayToOriginalTarget: boolean;
}

export const defaultDLQReplayConfig: DLQReplayConfig = {
  batchSize: 10,
  delayBetweenBatches: 1000, // 1 second
  maxRetries: 3,
  replayToOriginalTarget: true,
};
