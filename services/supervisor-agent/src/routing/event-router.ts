import { Event, EventType, Priority, AgentType } from '../types';
import { AgentRegistry } from '../registry/agent-registry';
import { IntentClassifier } from '../semantic/intent-classifier';

/**
 * Event Router - Routes events to appropriate agents based on classification
 */
export class EventRouter {
  private registry: AgentRegistry;
  private classifier: IntentClassifier;

  constructor(registry: AgentRegistry, classifier: IntentClassifier) {
    this.registry = registry;
    this.classifier = classifier;
  }

  /**
   * Route event to appropriate agents
   */
  async routeEvent(event: Event): Promise<{
    eventType: EventType;
    priority: Priority;
    selectedAgents: AgentType[];
    reasoning: string;
    routingMetadata: {
      classificationTime: number;
      availableAgents: number;
      unavailableAgents: string[];
    };
  }> {
    const startTime = Date.now();

    // Classify event
    const classification = await this.classifier.classifyEvent(event);

    // Filter suggested agents by availability
    const availableAgents: AgentType[] = [];
    const unavailableAgents: string[] = [];

    for (const agentType of classification.suggestedAgents) {
      if (this.registry.isAgentAvailable(agentType)) {
        availableAgents.push(agentType);
      } else {
        unavailableAgents.push(agentType);
      }
    }

    // If no agents available, try to find alternatives
    if (availableAgents.length === 0) {
      const alternatives = this.findAlternativeAgents(
        classification.eventType,
        classification.suggestedAgents
      );
      availableAgents.push(...alternatives);
    }

    const classificationTime = Date.now() - startTime;

    return {
      eventType: classification.eventType,
      priority: classification.priority,
      selectedAgents: availableAgents,
      reasoning: classification.reasoning,
      routingMetadata: {
        classificationTime,
        availableAgents: availableAgents.length,
        unavailableAgents,
      },
    };
  }

  /**
   * Find alternative agents when primary agents are unavailable
   */
  private findAlternativeAgents(
    eventType: EventType,
    unavailableAgents: AgentType[]
  ): AgentType[] {
    // Get all agents that can handle this event type
    const capableAgents = this.registry.getAgentsByEventType(eventType);

    // Filter out unavailable agents
    const alternatives = capableAgents
      .filter(
        (agent) =>
          !unavailableAgents.includes(agent.agentType) &&
          agent.capability.isAvailable &&
          agent.healthStatus === 'healthy'
      )
      .map((agent) => agent.agentType);

    return alternatives;
  }

  /**
   * Assign priority based on event characteristics
   */
  assignPriority(event: Event): Priority {
    const payload = event.payload;

    // Critical conditions
    if (this.isCriticalCondition(payload)) {
      return Priority.CRITICAL;
    }

    // Urgent conditions
    if (this.isUrgentCondition(payload)) {
      return Priority.URGENT;
    }

    // Scheduled tasks
    if (payload.scheduled || payload.appointmentTime) {
      return Priority.SCHEDULED;
    }

    // Default to routine
    return Priority.ROUTINE;
  }

  /**
   * Check if condition is critical
   */
  private isCriticalCondition(payload: Record<string, any>): boolean {
    // High urgency score
    if (payload.urgencyScore && payload.urgencyScore > 70) {
      return true;
    }

    // Critical symptoms
    const criticalSymptoms = [
      'chest pain',
      'difficulty breathing',
      'severe bleeding',
      'loss of consciousness',
      'stroke symptoms',
      'severe trauma',
    ];

    if (payload.symptoms) {
      const symptoms = Array.isArray(payload.symptoms)
        ? payload.symptoms
        : [payload.symptoms];
      
      for (const symptom of symptoms) {
        if (
          criticalSymptoms.some((critical) =>
            symptom.toLowerCase().includes(critical)
          )
        ) {
          return true;
        }
      }
    }

    // Critical alerts
    if (payload.alertLevel === 'CRITICAL' || payload.severity === 'CRITICAL') {
      return true;
    }

    // Resource shortages
    if (
      payload.stockLevel !== undefined &&
      payload.stockLevel < 10 &&
      payload.critical === true
    ) {
      return true;
    }

    // ICU capacity critical
    if (payload.icuOccupancy && payload.icuOccupancy > 95) {
      return true;
    }

    return false;
  }

  /**
   * Check if condition is urgent
   */
  private isUrgentCondition(payload: Record<string, any>): boolean {
    // Moderate urgency score
    if (
      payload.urgencyScore &&
      payload.urgencyScore > 40 &&
      payload.urgencyScore <= 70
    ) {
      return true;
    }

    // Urgent symptoms
    const urgentSymptoms = [
      'high fever',
      'severe pain',
      'persistent vomiting',
      'dehydration',
      'infection',
    ];

    if (payload.symptoms) {
      const symptoms = Array.isArray(payload.symptoms)
        ? payload.symptoms
        : [payload.symptoms];
      
      for (const symptom of symptoms) {
        if (
          urgentSymptoms.some((urgent) =>
            symptom.toLowerCase().includes(urgent)
          )
        ) {
          return true;
        }
      }
    }

    // Time-sensitive tasks
    if (payload.timeSensitive === true) {
      return true;
    }

    // Resource warnings
    if (
      payload.stockLevel !== undefined &&
      payload.stockLevel < 20 &&
      payload.stockLevel >= 10
    ) {
      return true;
    }

    // High bed occupancy
    if (payload.bedOccupancy && payload.bedOccupancy > 85) {
      return true;
    }

    return false;
  }

  /**
   * Select agents based on event type and payload
   */
  selectAgents(eventType: EventType, payload: Record<string, any>): AgentType[] {
    const selectedAgents: AgentType[] = [];

    switch (eventType) {
      case EventType.CLINICAL:
        selectedAgents.push(...this.selectClinicalAgents(payload));
        break;

      case EventType.OPERATIONAL:
        selectedAgents.push(...this.selectOperationalAgents(payload));
        break;

      case EventType.FINANCIAL:
        selectedAgents.push(...this.selectFinancialAgents(payload));
        break;

      case EventType.PUBLIC_HEALTH:
        selectedAgents.push(...this.selectPublicHealthAgents(payload));
        break;

      case EventType.SUPPLY_CHAIN:
        selectedAgents.push(...this.selectSupplyChainAgents(payload));
        break;
    }

    // Filter by availability
    return selectedAgents.filter((agent) =>
      this.registry.isAgentAvailable(agent)
    );
  }

  /**
   * Select clinical agents
   */
  private selectClinicalAgents(payload: Record<string, any>): AgentType[] {
    const agents: AgentType[] = [];

    if (payload.symptoms || payload.triage) {
      agents.push(AgentType.TRIAGE);
    }

    if (payload.audio || payload.transcription) {
      agents.push(AgentType.AMBIENT_SCRIBE);
    }

    if (payload.prescription || payload.medications) {
      agents.push(AgentType.DRUG_SAFETY);
    }

    if (payload.diagnosis || payload.clinicalQuestion) {
      agents.push(AgentType.CDSS);
    }

    if (payload.medicalImage || payload.imaging) {
      agents.push(AgentType.DIAGNOSTIC_VISION);
    }

    if (payload.dischargePlan || payload.followUp) {
      agents.push(AgentType.FOLLOW_UP);
    }

    return agents;
  }

  /**
   * Select operational agents
   */
  private selectOperationalAgents(payload: Record<string, any>): AgentType[] {
    const agents: AgentType[] = [];

    if (payload.queue || payload.waitTime) {
      agents.push(AgentType.QUEUE_OPTIMIZATION);
    }

    if (payload.bedRequest || payload.admission) {
      agents.push(AgentType.BED_OCCUPANCY);
    }

    if (payload.icuRequest || payload.criticalCare) {
      agents.push(AgentType.ICU_DEMAND);
    }

    if (payload.staffSchedule || payload.shiftPlanning) {
      agents.push(AgentType.STAFF_SCHEDULING);
    }

    if (payload.processAnalysis || payload.bottleneck) {
      agents.push(AgentType.WORKFLOW_OPTIMIZATION);
    }

    if (payload.nursingTask || payload.taskAssignment) {
      agents.push(AgentType.NURSE_TASK_ROUTER);
    }

    return agents;
  }

  /**
   * Select financial agents
   */
  private selectFinancialAgents(payload: Record<string, any>): AgentType[] {
    const agents: AgentType[] = [];

    if (payload.clinicalNotes || payload.procedures) {
      agents.push(AgentType.REVENUE_CYCLE);
    }

    if (payload.claim || payload.billing) {
      agents.push(AgentType.CODING_BILLING);
    }

    return agents;
  }

  /**
   * Select public health agents
   */
  private selectPublicHealthAgents(payload: Record<string, any>): AgentType[] {
    const agents: AgentType[] = [];

    if (payload.syndromicData || payload.outbreak) {
      agents.push(AgentType.DISEASE_PREDICTION);
    }

    if (payload.infectionData || payload.cluster) {
      agents.push(AgentType.INFECTION_SURVEILLANCE);
    }

    return agents;
  }

  /**
   * Select supply chain agents
   */
  private selectSupplyChainAgents(payload: Record<string, any>): AgentType[] {
    const agents: AgentType[] = [];

    if (payload.drugInventory || payload.medication) {
      agents.push(AgentType.DRUG_INVENTORY);
    }

    if (payload.bloodBank || payload.bloodGroup) {
      agents.push(AgentType.BLOOD_BANK);
    }

    return agents;
  }
}
