import { v4 as uuidv4 } from 'uuid';
import { Event, EventSchema, WorkflowState, AgentType } from '../types';
import { AgentRegistry } from '../registry/agent-registry';
import { IntentClassifier } from '../semantic/intent-classifier';
import { ContextManager } from '../context/context-manager';
import { WorkflowEngine } from '../workflow/workflow-engine';
import { EventRouter } from '../routing/event-router';
import { PriorityAssigner } from '../routing/priority-assigner';

/**
 * Supervisor Service - Main orchestration service
 */
export class SupervisorService {
  private registry: AgentRegistry;
  private classifier: IntentClassifier;
  private contextManager: ContextManager;
  private workflowEngine: WorkflowEngine;
  private eventRouter: EventRouter;
  private priorityAssigner: PriorityAssigner;

  constructor() {
    this.registry = new AgentRegistry();
    this.classifier = new IntentClassifier();
    this.contextManager = new ContextManager();
    this.workflowEngine = new WorkflowEngine(
      this.registry,
      this.classifier,
      this.contextManager
    );
    this.eventRouter = new EventRouter(this.registry, this.classifier);
    this.priorityAssigner = new PriorityAssigner();
  }

  /**
   * Process incoming event
   */
  async processEvent(eventData: Partial<Event>): Promise<{
    workflowId: string;
    status: string;
    message: string;
    routing: {
      eventType: string;
      priority: string;
      selectedAgents: string[];
      reasoning: string;
    };
  }> {
    try {
      // Validate and enrich event
      const event: Event = {
        eventId: eventData.eventId || uuidv4(),
        eventType: eventData.eventType!,
        priority: eventData.priority,
        timestamp: eventData.timestamp || new Date().toISOString(),
        source: eventData.source || 'unknown',
        payload: eventData.payload || {},
        metadata: eventData.metadata,
      };

      // Validate event schema
      EventSchema.parse(event);

      console.log(`Processing event ${event.eventId} from ${event.source}`);

      // Assign priority if not provided
      if (!event.priority) {
        event.priority = this.priorityAssigner.assignPriority(event);
        console.log(`Assigned priority: ${event.priority}`);
      }

      // Route event to appropriate agents
      const routing = await this.eventRouter.routeEvent(event);
      console.log(`Routed to agents: ${routing.selectedAgents.join(', ')}`);

      // Update patient context if applicable
      if (event.metadata?.patientId) {
        await this.contextManager.updatePatientContext(
          event.metadata.patientId,
          'processing',
          event.eventType,
          event.payload
        );
      }

      // Execute workflow
      const workflow = await this.workflowEngine.executeWorkflow(event);

      return {
        workflowId: workflow.workflowId,
        status: workflow.status,
        message: `Event processed successfully. Workflow ${workflow.status}.`,
        routing: {
          eventType: routing.eventType,
          priority: routing.priority,
          selectedAgents: routing.selectedAgents,
          reasoning: routing.reasoning,
        },
      };
    } catch (error) {
      console.error('Error processing event:', error);
      throw error;
    }
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<WorkflowState | null> {
    return this.workflowEngine.getWorkflowStatus(workflowId);
  }

  /**
   * Get agent registry
   */
  getAgentRegistry() {
    return this.registry;
  }

  /**
   * Get available agents
   */
  getAvailableAgents() {
    return this.registry.getAvailableAgents();
  }

  /**
   * Get agent by type
   */
  getAgent(agentType: AgentType) {
    return this.registry.getAgent(agentType);
  }

  /**
   * Update agent health status
   */
  updateAgentHealth(
    agentType: AgentType,
    status: 'healthy' | 'degraded' | 'unavailable'
  ) {
    this.registry.updateHealthStatus(agentType, status);
  }

  /**
   * Get patient context
   */
  async getPatientContext(patientId: string) {
    return this.contextManager.getPatientContext(patientId);
  }

  /**
   * Get active workflows for patient
   */
  async getActiveWorkflows(patientId: string) {
    return this.contextManager.getActiveWorkflows(patientId);
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    await this.workflowEngine.cancelWorkflow(workflowId);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: string;
    agents: {
      total: number;
      healthy: number;
      degraded: number;
      unavailable: number;
    };
    timestamp: string;
  }> {
    const allAgents = this.registry.getAllAgents();
    
    const healthy = allAgents.filter((a) => a.healthStatus === 'healthy').length;
    const degraded = allAgents.filter((a) => a.healthStatus === 'degraded').length;
    const unavailable = allAgents.filter(
      (a) => a.healthStatus === 'unavailable'
    ).length;

    return {
      status: unavailable > allAgents.length / 2 ? 'degraded' : 'healthy',
      agents: {
        total: allAgents.length,
        healthy,
        degraded,
        unavailable,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
