import { v4 as uuidv4 } from 'uuid';
import { Event, AgentTask, WorkflowState } from '../types';
import { AgentRegistry } from '../registry/agent-registry';
import { IntentClassifier } from '../semantic/intent-classifier';
import { ContextManager } from '../context/context-manager';
import { EscalationManager } from '../escalation/escalation-manager';
import { ConfidenceEvaluator } from '../escalation/confidence-evaluator';
import { NotificationService } from '../escalation/notification-service';
import { config } from '../config';

/**
 * Workflow Engine - LangGraph-based orchestration of agent tasks
 */
export class WorkflowEngine {
  private registry: AgentRegistry;
  private classifier: IntentClassifier;
  private contextManager: ContextManager;
  private escalationManager: EscalationManager;
  private confidenceEvaluator: ConfidenceEvaluator;
  private notificationService: NotificationService;

  constructor(
    registry: AgentRegistry,
    classifier: IntentClassifier,
    contextManager: ContextManager
  ) {
    this.registry = registry;
    this.classifier = classifier;
    this.contextManager = contextManager;
    this.escalationManager = new EscalationManager();
    this.confidenceEvaluator = new ConfidenceEvaluator();
    this.notificationService = new NotificationService();
  }

  /**
   * Execute workflow for an event
   */
  async executeWorkflow(event: Event): Promise<WorkflowState> {
    // Create workflow state
    const workflowId = uuidv4();
    const workflow: WorkflowState = {
      workflowId,
      eventId: event.eventId,
      currentStep: 0,
      totalSteps: 0,
      tasks: [],
      context: {
        event,
        classification: null,
        results: {},
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Save initial workflow state
      await this.contextManager.createWorkflow(workflow);

      // Add workflow to patient context if applicable
      if (event.metadata?.patientId) {
        await this.contextManager.addWorkflowToContext(
          event.metadata.patientId,
          workflowId
        );
      }

      // Build and execute the workflow graph
      const graph = await this.buildWorkflowGraph(event);
      const result = await graph.invoke({
        workflow,
        event,
      });

      // Update final workflow state
      await this.contextManager.updateWorkflow(workflowId, {
        status: result.workflow.status,
        tasks: result.workflow.tasks,
        context: result.workflow.context,
        currentStep: result.workflow.currentStep,
      });

      // Remove from active workflows if completed
      if (
        result.workflow.status !== 'active' &&
        event.metadata?.patientId
      ) {
        await this.contextManager.removeWorkflowFromContext(
          event.metadata.patientId,
          workflowId
        );
      }

      return result.workflow;
    } catch (error) {
      console.error('Error executing workflow:', error);
      
      // Update workflow as failed
      await this.contextManager.updateWorkflow(workflowId, {
        status: 'failed',
        context: {
          ...workflow.context,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    }
  }

  /**
   * Build workflow graph using simplified state machine
   */
  private async buildWorkflowGraph(_event: Event) {
    // Simplified workflow execution without complex LangGraph types
    return {
      invoke: async (initialState: { workflow: WorkflowState; event: Event }) => {
        let state = initialState;

        // Step 1: Classify
        state = await this.classifyStep(state);

        // Step 2: Decompose
        state = await this.decomposeStep(state);

        // Step 3: Execute
        state = await this.executeStep(state);

        return state;
      },
    };
  }

  /**
   * Classification step
   */
  private async classifyStep(state: {
    workflow: WorkflowState;
    event: Event;
  }): Promise<{ workflow: WorkflowState; event: Event }> {
    console.log('Classifying event...');

    const classification = await this.classifier.classifyEvent(state.event);

    state.workflow.context.classification = classification;
    state.workflow.currentStep = 1;

    return state;
  }

  /**
   * Decomposition step
   */
  private async decomposeStep(state: {
    workflow: WorkflowState;
    event: Event;
  }): Promise<{ workflow: WorkflowState; event: Event }> {
    console.log('Decomposing task...');

    const classification = state.workflow.context.classification;
    if (!classification || classification.suggestedAgents.length === 0) {
      state.workflow.status = 'failed';
      return state;
    }

    const primaryAgent = classification.suggestedAgents[0];
    const decomposition = await this.classifier.decomposeTask(
      state.event,
      primaryAgent
    );

    state.workflow.context.decomposition = decomposition;
    state.workflow.totalSteps = decomposition.subtasks.length + 2; // +2 for classify and decompose
    state.workflow.currentStep = 2;

    return state;
  }

  /**
   * Execution step
   */
  private async executeStep(state: {
    workflow: WorkflowState;
    event: Event;
  }): Promise<{ workflow: WorkflowState; event: Event }> {
    console.log('Executing agents...');

    const decomposition = state.workflow.context.decomposition;
    if (!decomposition) {
      state.workflow.status = 'failed';
      return state;
    }

    // Execute subtasks in order, respecting dependencies
    const results: Record<string, any> = {};
    const tasks: AgentTask[] = [];

    for (let i = 0; i < decomposition.subtasks.length; i++) {
      const subtask = decomposition.subtasks[i];

      // Check if dependencies are met
      const dependenciesMet = subtask.dependencies.every(
        (depIndex: number) => results[depIndex] !== undefined
      );

      if (!dependenciesMet) {
        console.warn(`Dependencies not met for subtask ${i}`);
        continue;
      }

      // Create agent task
      const task: AgentTask = {
        taskId: uuidv4(),
        agentType: subtask.agentType,
        eventId: state.event.eventId,
        input: {
          event: state.event,
          previousResults: results,
          context: state.workflow.context,
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Execute task
      const taskResult = await this.executeAgentTask(task);

      tasks.push(taskResult);
      results[i] = taskResult.output;

      // Check if escalation is needed
      if (
        taskResult.confidence !== undefined &&
        taskResult.confidence < config.agent.confidenceThreshold
      ) {
        state.workflow.status = 'escalated';
        state.workflow.context.escalationReason = `Low confidence (${taskResult.confidence}) from ${subtask.agentType}`;
        break;
      }
    }

    state.workflow.tasks = tasks;
    state.workflow.context.results = results;
    state.workflow.currentStep = state.workflow.totalSteps;

    if (state.workflow.status === 'active') {
      state.workflow.status = 'completed';
    }

    return state;
  }

  /**
   * Execute individual agent task (placeholder - will be replaced with actual agent calls)
   */
  private async executeAgentTask(task: AgentTask): Promise<AgentTask> {
    const startTime = Date.now();
    
    try {
      task.status = 'in_progress';
      
      // Check if agent is available
      if (!this.registry.isAgentAvailable(task.agentType)) {
        throw new Error(`Agent ${task.agentType} is not available`);
      }

      // Simulate agent execution (replace with actual agent API calls)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulated output
      task.output = {
        success: true,
        data: {
          message: `Task executed by ${task.agentType}`,
          timestamp: new Date().toISOString(),
        },
      };
      task.confidence = 0.85;
      task.status = 'completed';
      task.executionTimeMs = Date.now() - startTime;

      // Evaluate confidence and check for escalation
      const evaluation = this.confidenceEvaluator.shouldEscalate(task);
      
      if (evaluation.shouldEscalate) {
        console.log(`⚠️  Task requires escalation: ${evaluation.reason}`);
        
        // Create escalation
        const escalation = await this.escalationManager.createEscalation(
          task,
          evaluation.reason,
          task.confidence || 0
        );

        // Send notification
        if (evaluation.severity === 'high') {
          await this.notificationService.sendCriticalAlert(escalation, task);
        } else {
          await this.notificationService.sendEscalationNotification(escalation, task);
        }

        // Mark task as escalated
        task.status = 'escalated';
      }

      // Update agent metrics
      this.registry.updateMetrics(
        task.agentType,
        true,
        task.executionTimeMs,
        task.confidence
      );

      return task;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.executionTimeMs = Date.now() - startTime;

      // Failed tasks should be escalated
      const escalation = await this.escalationManager.createEscalation(
        task,
        `Task failed: ${task.error}`,
        0
      );

      await this.notificationService.sendCriticalAlert(escalation, task);

      // Update agent metrics
      this.registry.updateMetrics(task.agentType, false, task.executionTimeMs);

      return task;
    }
  }

  /**
   * Get workflow status
   */
  async getWorkflowStatus(workflowId: string): Promise<WorkflowState | null> {
    return this.contextManager.getWorkflow(workflowId);
  }

  /**
   * Cancel workflow
   */
  async cancelWorkflow(workflowId: string): Promise<void> {
    await this.contextManager.updateWorkflow(workflowId, {
      status: 'failed',
      context: {
        cancelledAt: new Date().toISOString(),
        reason: 'Cancelled by user',
      },
    });
  }
}
