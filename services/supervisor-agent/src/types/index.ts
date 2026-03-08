import { z } from 'zod';

// Event Types
export enum EventType {
  CLINICAL = 'CLINICAL',
  OPERATIONAL = 'OPERATIONAL',
  FINANCIAL = 'FINANCIAL',
  PUBLIC_HEALTH = 'PUBLIC_HEALTH',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN',
}

// Priority Levels
export enum Priority {
  CRITICAL = 'CRITICAL',
  URGENT = 'URGENT',
  ROUTINE = 'ROUTINE',
  SCHEDULED = 'SCHEDULED',
}

// Agent Types
export enum AgentType {
  TRIAGE = 'TRIAGE',
  QUEUE_OPTIMIZATION = 'QUEUE_OPTIMIZATION',
  AMBIENT_SCRIBE = 'AMBIENT_SCRIBE',
  DRUG_SAFETY = 'DRUG_SAFETY',
  CDSS = 'CDSS',
  DIAGNOSTIC_VISION = 'DIAGNOSTIC_VISION',
  BED_OCCUPANCY = 'BED_OCCUPANCY',
  ICU_DEMAND = 'ICU_DEMAND',
  STAFF_SCHEDULING = 'STAFF_SCHEDULING',
  WORKFLOW_OPTIMIZATION = 'WORKFLOW_OPTIMIZATION',
  DRUG_INVENTORY = 'DRUG_INVENTORY',
  BLOOD_BANK = 'BLOOD_BANK',
  REVENUE_CYCLE = 'REVENUE_CYCLE',
  CODING_BILLING = 'CODING_BILLING',
  DISEASE_PREDICTION = 'DISEASE_PREDICTION',
  INFECTION_SURVEILLANCE = 'INFECTION_SURVEILLANCE',
  FOLLOW_UP = 'FOLLOW_UP',
  NURSE_TASK_ROUTER = 'NURSE_TASK_ROUTER',
}

// Event Schema
export const EventSchema = z.object({
  eventId: z.string().uuid(),
  eventType: z.nativeEnum(EventType),
  priority: z.nativeEnum(Priority).optional(),
  timestamp: z.string().datetime(),
  source: z.string(),
  payload: z.record(z.any()),
  metadata: z.object({
    patientId: z.string().uuid().optional(),
    facilityId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    sessionId: z.string().uuid().optional(),
  }).optional(),
});

export type Event = z.infer<typeof EventSchema>;

// Agent Capability
export interface AgentCapability {
  agentType: AgentType;
  name: string;
  description: string;
  eventTypes: EventType[];
  requiredInputs: string[];
  outputs: string[];
  averageExecutionTime: number; // milliseconds
  confidenceThreshold: number;
  isAvailable: boolean;
  endpoint?: string;
}

// Agent Task
export interface AgentTask {
  taskId: string;
  agentType: AgentType;
  eventId: string;
  input: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'escalated';
  output?: Record<string, any>;
  confidence?: number;
  executionTimeMs?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Workflow State
export interface WorkflowState {
  workflowId: string;
  eventId: string;
  currentStep: number;
  totalSteps: number;
  tasks: AgentTask[];
  context: Record<string, any>;
  status: 'active' | 'completed' | 'failed' | 'escalated';
  createdAt: Date;
  updatedAt: Date;
}

// Context Management
export interface PatientContext {
  patientId: string;
  currentState: string;
  history: Array<{
    timestamp: Date;
    event: string;
    data: Record<string, any>;
  }>;
  activeWorkflows: string[];
  metadata: Record<string, any>;
}

// Escalation
export interface Escalation {
  escalationId: string;
  taskId: string;
  reason: string;
  confidence: number;
  escalatedTo: string; // user role or specific user
  status: 'pending' | 'acknowledged' | 'resolved';
  createdAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

// Agent Registry Entry
export interface AgentRegistryEntry {
  agentType: AgentType;
  capability: AgentCapability;
  healthStatus: 'healthy' | 'degraded' | 'unavailable';
  lastHealthCheck: Date;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    averageConfidence: number;
  };
}
