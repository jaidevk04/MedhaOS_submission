import { AgentType, AgentCapability, AgentRegistryEntry, EventType } from '../types';

/**
 * Agent Registry - Service discovery and capability management
 * Maintains a registry of all available agents and their capabilities
 */
export class AgentRegistry {
  private agents: Map<AgentType, AgentRegistryEntry> = new Map();

  constructor() {
    this.initializeAgents();
  }

  /**
   * Initialize all agent capabilities
   */
  private initializeAgents(): void {
    // Clinical Intelligence Agents
    this.registerAgent({
      agentType: AgentType.TRIAGE,
      name: 'AI Triage & Urgency Scoring Agent',
      description: 'Analyzes patient symptoms and assigns urgency scores',
      eventTypes: [EventType.CLINICAL],
      requiredInputs: ['symptoms', 'vitals', 'demographics'],
      outputs: ['urgencyScore', 'specialty', 'recommendations'],
      averageExecutionTime: 3000,
      confidenceThreshold: 0.85,
      isAvailable: true,
    });

    this.registerAgent({
      agentType: AgentType.CDSS,
      name: 'Clinical Decision Support System Agent',
      description: 'Provides evidence-based clinical recommendations',
      eventTypes: [EventType.CLINICAL],
      requiredInputs: ['patientData', 'clinicalNotes', 'diagnostics'],
      outputs: ['differentialDiagnosis', 'recommendations', 'guidelines'],
      averageExecutionTime: 10000,
      confidenceThreshold: 0.75,
      isAvailable: true,
    });

    this.registerAgent({
      agentType: AgentType.DRUG_SAFETY,
      name: 'Drug Interaction & Allergy Safety Agent',
      description: 'Checks drug interactions and allergy conflicts',
      eventTypes: [EventType.CLINICAL],
      requiredInputs: ['prescription', 'allergies', 'currentMedications'],
      outputs: ['safetyAlerts', 'interactions', 'alternatives'],
      averageExecutionTime: 1000,
      confidenceThreshold: 0.95,
      isAvailable: true,
    });

    this.registerAgent({
      agentType: AgentType.AMBIENT_SCRIBE,
      name: 'Ambient Scribe Agent',
      description: 'Transcribes and structures clinical conversations',
      eventTypes: [EventType.CLINICAL],
      requiredInputs: ['audioStream', 'patientContext'],
      outputs: ['transcription', 'clinicalFacts', 'soapNotes'],
      averageExecutionTime: 2000,
      confidenceThreshold: 0.80,
      isAvailable: true,
    });

    this.registerAgent({
      agentType: AgentType.DIAGNOSTIC_VISION,
      name: 'Diagnostic Vision Agent',
      description: 'Analyzes medical images for anomalies',
      eventTypes: [EventType.CLINICAL],
      requiredInputs: ['medicalImage', 'imageType', 'clinicalContext'],
      outputs: ['findings', 'anomalies', 'draftReport'],
      averageExecutionTime: 8000,
      confidenceThreshold: 0.85,
      isAvailable: true,
    });

    // Operational Intelligence Agents
    this.registerAgent({
      agentType: AgentType.QUEUE_OPTIMIZATION,
      name: 'ED/OPD Queue Optimization Agent',
      description: 'Optimizes patient queues and wait times',
      eventTypes: [EventType.OPERATIONAL],
      requiredInputs: ['queueState', 'urgencyScores', 'resourceAvailability'],
      outputs: ['optimizedQueue', 'waitTimeEstimates', 'assignments'],
      averageExecutionTime: 2000,
      confidenceThreshold: 0.80,
      isAvailable: true,
    });

    this.registerAgent({
      agentType: AgentType.BED_OCCUPANCY,
      name: 'Bed Occupancy Prediction Agent',
      description: 'Forecasts bed availability 24-72 hours ahead',
      eventTypes: [EventType.OPERATIONAL],
      requiredInputs: ['currentOccupancy', 'admissionPatterns', 'dischargeSchedule'],
      outputs: ['forecast', 'recommendations', 'alerts'],
      averageExecutionTime: 5000,
      confidenceThreshold: 0.85,
      isAvailable: true,
    });

    this.registerAgent({
      agentType: AgentType.ICU_DEMAND,
      name: 'ICU Demand Forecasting Agent',
      description: 'Predicts ICU demand 6-24 hours ahead',
      eventTypes: [EventType.OPERATIONAL],
      requiredInputs: ['currentICUStatus', 'patientAcuity', 'admissionTrends'],
      outputs: ['demandForecast', 'capacityAlerts', 'recommendations'],
      averageExecutionTime: 5000,
      confidenceThreshold: 0.85,
      isAvailable: true,
    });

    this.registerAgent({
      agentType: AgentType.STAFF_SCHEDULING,
      name: 'Staff Scheduling Optimization Agent',
      description: 'Optimizes staff schedules and workload distribution',
      eventTypes: [EventType.OPERATIONAL],
      requiredInputs: ['staffAvailability', 'patientLoad', 'skillRequirements'],
      outputs: ['optimizedSchedule', 'workloadAlerts', 'recommendations'],
      averageExecutionTime: 7000,
      confidenceThreshold: 0.80,
      isAvailable: true,
    });

    this.registerAgent({
      agentType: AgentType.WORKFLOW_OPTIMIZATION,
      name: 'Workflow Optimization Agent',
      description: 'Identifies bottlenecks and suggests improvements',
      eventTypes: [EventType.OPERATIONAL],
      requiredInputs: ['processData', 'performanceMetrics', 'resourceUtilization'],
      outputs: ['bottlenecks', 'recommendations', 'optimizations'],
      averageExecutionTime: 10000,
      confidenceThreshold: 0.75,
      isAvailable: true,
    });

    this.registerAgent({
      agentType: AgentType.NURSE_TASK_ROUTER,
      name: 'Intelligent Task Router',
      description: 'Routes and prioritizes nursing tasks',
      eventTypes: [EventType.OPERATIONAL],
      requiredInputs: ['tasks', 'nurseAvailability', 'patientAcuity'],
      outputs: ['taskAssignments', 'priorities', 'workloadAlerts'],
      averageExecutionTime: 2000,
      confidenceThreshold: 0.80,
      isAvailable: true,
    });

    // Supply Chain Intelligence Agents
    this.registerAgent({
      agentType: AgentType.DRUG_INVENTORY,
      name: 'Drug Inventory Forecasting Agent',
      description: 'Predicts medication demand and manages inventory',
      eventTypes: [EventType.SUPPLY_CHAIN],
      requiredInputs: ['currentStock', 'usagePatterns', 'seasonalFactors'],
      outputs: ['demandForecast', 'reorderAlerts', 'recommendations'],
      averageExecutionTime: 5000,
      confidenceThreshold: 0.85,
      isAvailable: true,
    });

    this.registerAgent({
      agentType: AgentType.BLOOD_BANK,
      name: 'Blood Bank Stock Forecasting Agent',
      description: 'Predicts blood demand by blood group',
      eventTypes: [EventType.SUPPLY_CHAIN],
      requiredInputs: ['currentStock', 'usagePatterns', 'surgerySchedule'],
      outputs: ['demandForecast', 'shortageAlerts', 'donorDriveTriggers'],
      averageExecutionTime: 5000,
      confidenceThreshold: 0.85,
      isAvailable: true,
    });

    // Financial Intelligence Agents
    this.registerAgent({
      agentType: AgentType.REVENUE_CYCLE,
      name: 'Revenue Cycle Agent',
      description: 'Automates medical coding and claim submission',
      eventTypes: [EventType.FINANCIAL],
      requiredInputs: ['clinicalNotes', 'procedures', 'diagnoses'],
      outputs: ['icdCodes', 'cptCodes', 'claimData'],
      averageExecutionTime: 5000,
      confidenceThreshold: 0.90,
      isAvailable: true,
    });

    this.registerAgent({
      agentType: AgentType.CODING_BILLING,
      name: 'Coding & Billing Error Minimization Agent',
      description: 'Validates claims and minimizes billing errors',
      eventTypes: [EventType.FINANCIAL],
      requiredInputs: ['claimData', 'insuranceRules', 'historicalData'],
      outputs: ['validationResults', 'errorAlerts', 'corrections'],
      averageExecutionTime: 3000,
      confidenceThreshold: 0.90,
      isAvailable: true,
    });

    // Public Health Intelligence Agents
    this.registerAgent({
      agentType: AgentType.DISEASE_PREDICTION,
      name: 'Regional Disease Prediction Agent',
      description: 'Forecasts disease outbreaks 2-4 weeks ahead',
      eventTypes: [EventType.PUBLIC_HEALTH],
      requiredInputs: ['syndromicData', 'climateData', 'mobilityPatterns'],
      outputs: ['outbreakProbability', 'riskAreas', 'recommendations'],
      averageExecutionTime: 15000,
      confidenceThreshold: 0.85,
      isAvailable: true,
    });

    this.registerAgent({
      agentType: AgentType.INFECTION_SURVEILLANCE,
      name: 'Infection Surveillance Agent',
      description: 'Detects infection clusters and HAI outbreaks',
      eventTypes: [EventType.PUBLIC_HEALTH],
      requiredInputs: ['symptomData', 'labResults', 'locationData'],
      outputs: ['clusters', 'outbreakAlerts', 'sourceIdentification'],
      averageExecutionTime: 5000,
      confidenceThreshold: 0.85,
      isAvailable: true,
    });

    // Post-Discharge Care
    this.registerAgent({
      agentType: AgentType.FOLLOW_UP,
      name: 'Follow-up & Adherence Agent',
      description: 'Manages post-discharge care and medication adherence',
      eventTypes: [EventType.CLINICAL],
      requiredInputs: ['dischargePlan', 'patientProfile', 'medicationSchedule'],
      outputs: ['followUpPlan', 'reminders', 'adherenceTracking'],
      averageExecutionTime: 3000,
      confidenceThreshold: 0.80,
      isAvailable: true,
    });
  }

  /**
   * Register a new agent
   */
  private registerAgent(capability: AgentCapability): void {
    const entry: AgentRegistryEntry = {
      agentType: capability.agentType,
      capability,
      healthStatus: 'healthy',
      lastHealthCheck: new Date(),
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        averageConfidence: 0,
      },
    };

    this.agents.set(capability.agentType, entry);
  }

  /**
   * Get agent by type
   */
  getAgent(agentType: AgentType): AgentRegistryEntry | undefined {
    return this.agents.get(agentType);
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentRegistryEntry[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by event type
   */
  getAgentsByEventType(eventType: EventType): AgentRegistryEntry[] {
    return Array.from(this.agents.values()).filter((entry) =>
      entry.capability.eventTypes.includes(eventType)
    );
  }

  /**
   * Get available agents
   */
  getAvailableAgents(): AgentRegistryEntry[] {
    return Array.from(this.agents.values()).filter(
      (entry) => entry.capability.isAvailable && entry.healthStatus === 'healthy'
    );
  }

  /**
   * Update agent health status
   */
  updateHealthStatus(
    agentType: AgentType,
    status: 'healthy' | 'degraded' | 'unavailable'
  ): void {
    const agent = this.agents.get(agentType);
    if (agent) {
      agent.healthStatus = status;
      agent.lastHealthCheck = new Date();
    }
  }

  /**
   * Update agent metrics
   */
  updateMetrics(
    agentType: AgentType,
    success: boolean,
    responseTime: number,
    confidence?: number
  ): void {
    const agent = this.agents.get(agentType);
    if (agent) {
      agent.metrics.totalRequests++;
      if (success) {
        agent.metrics.successfulRequests++;
      } else {
        agent.metrics.failedRequests++;
      }

      // Update average response time
      const totalTime =
        agent.metrics.averageResponseTime * (agent.metrics.totalRequests - 1) +
        responseTime;
      agent.metrics.averageResponseTime = totalTime / agent.metrics.totalRequests;

      // Update average confidence
      if (confidence !== undefined) {
        const totalConfidence =
          agent.metrics.averageConfidence * (agent.metrics.successfulRequests - 1) +
          confidence;
        agent.metrics.averageConfidence =
          totalConfidence / agent.metrics.successfulRequests;
      }
    }
  }

  /**
   * Check if agent is available
   */
  isAgentAvailable(agentType: AgentType): boolean {
    const agent = this.agents.get(agentType);
    return (
      agent !== undefined &&
      agent.capability.isAvailable &&
      agent.healthStatus === 'healthy'
    );
  }
}
