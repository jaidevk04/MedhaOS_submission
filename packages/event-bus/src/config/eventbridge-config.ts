/**
 * Amazon EventBridge Configuration
 * Defines event bus, rules, and routing configuration
 */

export interface EventBridgeConfig {
  eventBusName: string;
  region: string;
  deadLetterQueueArn?: string;
  retryPolicy?: {
    maximumRetryAttempts: number;
    maximumEventAge: number; // in seconds
  };
}

export interface EventRule {
  name: string;
  description: string;
  eventPattern: Record<string, any>;
  targets: EventTarget[];
  enabled: boolean;
}

export interface EventTarget {
  id: string;
  arn: string;
  targetType: 'Lambda' | 'SQS' | 'SNS' | 'StepFunctions' | 'EventBridge';
  deadLetterQueueArn?: string;
  retryPolicy?: {
    maximumRetryAttempts: number;
    maximumEventAge: number;
  };
  inputTransformer?: {
    inputPathsMap?: Record<string, string>;
    inputTemplate: string;
  };
}

// Default EventBridge configuration
export const defaultEventBridgeConfig: EventBridgeConfig = {
  eventBusName: process.env.EVENTBRIDGE_BUS_NAME || 'medhaos-event-bus',
  region: process.env.AWS_REGION || 'ap-south-1',
  deadLetterQueueArn: process.env.DLQ_ARN,
  retryPolicy: {
    maximumRetryAttempts: 3,
    maximumEventAge: 3600, // 1 hour
  },
};

/**
 * Event routing rules for MedhaOS
 * Each rule defines which events should be routed to which targets
 */
export const eventRoutingRules: EventRule[] = [
  // Clinical Events Routing
  {
    name: 'clinical-events-to-supervisor',
    description: 'Route all clinical events to Supervisor Agent',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': [
          { prefix: 'patient.' },
          { prefix: 'triage.' },
          { prefix: 'consultation.' },
          { prefix: 'prescription.' },
          { prefix: 'diagnostic.' },
        ],
      },
    },
    targets: [
      {
        id: 'supervisor-agent-lambda',
        arn: process.env.SUPERVISOR_AGENT_LAMBDA_ARN || '',
        targetType: 'Lambda',
        deadLetterQueueArn: process.env.CLINICAL_DLQ_ARN,
        retryPolicy: {
          maximumRetryAttempts: 3,
          maximumEventAge: 3600,
        },
      },
    ],
    enabled: true,
  },

  // Triage Events to Queue Optimization
  {
    name: 'triage-to-queue-optimization',
    description: 'Route triage completed events to Queue Optimization Agent',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': ['triage.completed'],
      },
    },
    targets: [
      {
        id: 'queue-optimization-sqs',
        arn: process.env.QUEUE_OPTIMIZATION_SQS_ARN || '',
        targetType: 'SQS',
        deadLetterQueueArn: process.env.QUEUE_DLQ_ARN,
      },
    ],
    enabled: true,
  },

  // Appointment Events to Notification Service
  {
    name: 'appointment-to-notifications',
    description: 'Route appointment events to Notification Service',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': ['appointment.scheduled', 'appointment.cancelled', 'appointment.rescheduled'],
      },
    },
    targets: [
      {
        id: 'notification-service-sns',
        arn: process.env.NOTIFICATION_SNS_ARN || '',
        targetType: 'SNS',
      },
    ],
    enabled: true,
  },

  // Prescription Events to Drug Safety Agent
  {
    name: 'prescription-to-drug-safety',
    description: 'Route prescription events to Drug Safety Agent',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': ['prescription.created'],
      },
    },
    targets: [
      {
        id: 'drug-safety-agent-lambda',
        arn: process.env.DRUG_SAFETY_AGENT_LAMBDA_ARN || '',
        targetType: 'Lambda',
        deadLetterQueueArn: process.env.DRUG_SAFETY_DLQ_ARN,
      },
    ],
    enabled: true,
  },

  // Diagnostic Events to Vision Agent
  {
    name: 'diagnostic-to-vision-agent',
    description: 'Route diagnostic imaging orders to Vision Agent',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': ['diagnostic.ordered'],
        'data': {
          'reportType': ['radiology'],
        },
      },
    },
    targets: [
      {
        id: 'vision-agent-sqs',
        arn: process.env.VISION_AGENT_SQS_ARN || '',
        targetType: 'SQS',
        deadLetterQueueArn: process.env.VISION_DLQ_ARN,
      },
    ],
    enabled: true,
  },

  // Operational Events Routing
  {
    name: 'operational-events-to-intelligence',
    description: 'Route operational events to Operational Intelligence Agent',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': [
          { prefix: 'bed.' },
          { prefix: 'queue.' },
          { prefix: 'staff.' },
          { prefix: 'task.' },
        ],
      },
    },
    targets: [
      {
        id: 'operational-intelligence-sqs',
        arn: process.env.OPERATIONAL_INTELLIGENCE_SQS_ARN || '',
        targetType: 'SQS',
        deadLetterQueueArn: process.env.OPERATIONAL_DLQ_ARN,
      },
    ],
    enabled: true,
  },

  // Bed Occupancy to Prediction Agent
  {
    name: 'bed-occupancy-to-prediction',
    description: 'Route bed occupancy changes to Bed Occupancy Prediction Agent',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': ['bed.occupancy.changed', 'patient.admitted', 'patient.discharged'],
      },
    },
    targets: [
      {
        id: 'bed-prediction-lambda',
        arn: process.env.BED_PREDICTION_LAMBDA_ARN || '',
        targetType: 'Lambda',
      },
    ],
    enabled: true,
  },

  // Task Events to Nurse Coordination
  {
    name: 'task-events-to-nurse-coordination',
    description: 'Route task events to Nurse Task Coordination Service',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': [{ prefix: 'task.' }],
      },
    },
    targets: [
      {
        id: 'nurse-coordination-sqs',
        arn: process.env.NURSE_COORDINATION_SQS_ARN || '',
        targetType: 'SQS',
      },
    ],
    enabled: true,
  },

  // Supply Chain Events Routing
  {
    name: 'supply-chain-events',
    description: 'Route supply chain events to Supply Chain Agent',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': [
          { prefix: 'inventory.' },
          { prefix: 'medication.' },
          { prefix: 'blood.' },
        ],
      },
    },
    targets: [
      {
        id: 'supply-chain-agent-sqs',
        arn: process.env.SUPPLY_CHAIN_SQS_ARN || '',
        targetType: 'SQS',
        deadLetterQueueArn: process.env.SUPPLY_CHAIN_DLQ_ARN,
      },
    ],
    enabled: true,
  },

  // Critical Inventory Alerts
  {
    name: 'critical-inventory-alerts',
    description: 'Route critical inventory alerts to administrators',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': ['inventory.low'],
        'data': {
          'criticalLevel': [true],
        },
      },
    },
    targets: [
      {
        id: 'admin-alert-sns',
        arn: process.env.ADMIN_ALERT_SNS_ARN || '',
        targetType: 'SNS',
      },
    ],
    enabled: true,
  },

  // Financial Events Routing
  {
    name: 'financial-events-to-revenue-cycle',
    description: 'Route financial events to Revenue Cycle Agent',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': [
          { prefix: 'claim.' },
          { prefix: 'payment.' },
        ],
      },
    },
    targets: [
      {
        id: 'revenue-cycle-agent-sqs',
        arn: process.env.REVENUE_CYCLE_SQS_ARN || '',
        targetType: 'SQS',
        deadLetterQueueArn: process.env.REVENUE_DLQ_ARN,
      },
    ],
    enabled: true,
  },

  // Consultation Completed to Billing
  {
    name: 'consultation-to-billing',
    description: 'Route completed consultations to billing system',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': ['consultation.completed'],
      },
    },
    targets: [
      {
        id: 'billing-automation-lambda',
        arn: process.env.BILLING_AUTOMATION_LAMBDA_ARN || '',
        targetType: 'Lambda',
      },
    ],
    enabled: true,
  },

  // Public Health Events Routing
  {
    name: 'public-health-events',
    description: 'Route public health events to Public Health Intelligence Agent',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': [
          { prefix: 'infection.' },
          { prefix: 'outbreak.' },
          { prefix: 'public.health.' },
        ],
      },
    },
    targets: [
      {
        id: 'public-health-agent-sqs',
        arn: process.env.PUBLIC_HEALTH_SQS_ARN || '',
        targetType: 'SQS',
        deadLetterQueueArn: process.env.PUBLIC_HEALTH_DLQ_ARN,
      },
    ],
    enabled: true,
  },

  // Critical Public Health Alerts
  {
    name: 'critical-public-health-alerts',
    description: 'Route critical public health alerts to authorities',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': ['infection.cluster.detected', 'outbreak.predicted', 'public.health.alert'],
        'data': {
          'severity': ['HIGH', 'CRITICAL'],
        },
      },
    },
    targets: [
      {
        id: 'public-health-authority-sns',
        arn: process.env.PUBLIC_HEALTH_AUTHORITY_SNS_ARN || '',
        targetType: 'SNS',
      },
    ],
    enabled: true,
  },

  // Agent Events Routing
  {
    name: 'agent-escalations',
    description: 'Route agent escalations to human operators',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': ['agent.escalation'],
      },
    },
    targets: [
      {
        id: 'escalation-handler-lambda',
        arn: process.env.ESCALATION_HANDLER_LAMBDA_ARN || '',
        targetType: 'Lambda',
        deadLetterQueueArn: process.env.ESCALATION_DLQ_ARN,
      },
      {
        id: 'escalation-notification-sns',
        arn: process.env.ESCALATION_SNS_ARN || '',
        targetType: 'SNS',
      },
    ],
    enabled: true,
  },

  // Discharge Events to Post-Discharge Care
  {
    name: 'discharge-to-post-care',
    description: 'Route patient discharge events to Post-Discharge Care Agent',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
      'detail': {
        'eventType': ['patient.discharged'],
      },
    },
    targets: [
      {
        id: 'post-discharge-care-sqs',
        arn: process.env.POST_DISCHARGE_CARE_SQS_ARN || '',
        targetType: 'SQS',
      },
    ],
    enabled: true,
  },

  // All Events to Analytics
  {
    name: 'all-events-to-analytics',
    description: 'Route all events to analytics data lake',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
    },
    targets: [
      {
        id: 'analytics-firehose',
        arn: process.env.ANALYTICS_FIREHOSE_ARN || '',
        targetType: 'EventBridge',
      },
    ],
    enabled: true,
  },

  // All Events to Audit Log
  {
    name: 'all-events-to-audit',
    description: 'Route all events to audit logging system',
    eventPattern: {
      'detail-type': ['MedhaOS Event'],
    },
    targets: [
      {
        id: 'audit-log-stream',
        arn: process.env.AUDIT_LOG_STREAM_ARN || '',
        targetType: 'EventBridge',
      },
    ],
    enabled: true,
  },
];

/**
 * Get routing rules for a specific event type
 */
export function getRoutingRulesForEventType(eventType: string): EventRule[] {
  return eventRoutingRules.filter((rule) => {
    const pattern = rule.eventPattern.detail?.eventType;
    if (!pattern) return false;

    return pattern.some((p: any) => {
      if (typeof p === 'string') {
        return p === eventType;
      }
      if (p.prefix) {
        return eventType.startsWith(p.prefix);
      }
      return false;
    });
  });
}
