import Anthropic from '@anthropic-ai/sdk';
import { EventType, Priority, Event, AgentType } from '../types';
import { config } from '../config';

/**
 * Intent Classifier - Uses LLM to classify events and determine routing
 */
export class IntentClassifier {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: config.llm.anthropicApiKey,
    });
  }

  /**
   * Classify event type and priority
   */
  async classifyEvent(event: Event): Promise<{
    eventType: EventType;
    priority: Priority;
    suggestedAgents: AgentType[];
    reasoning: string;
  }> {
    const prompt = this.buildClassificationPrompt(event);

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const result = this.parseClassificationResponse(content.text);
      return result;
    } catch (error) {
      console.error('Error classifying event:', error);
      // Fallback to rule-based classification
      return this.fallbackClassification(event);
    }
  }

  /**
   * Build classification prompt
   */
  private buildClassificationPrompt(event: Event): string {
    return `You are an intelligent healthcare event classifier for the MedhaOS system. Analyze the following event and classify it.

Event Details:
- Event ID: ${event.eventId}
- Source: ${event.source}
- Timestamp: ${event.timestamp}
- Payload: ${JSON.stringify(event.payload, null, 2)}
${event.metadata ? `- Metadata: ${JSON.stringify(event.metadata, null, 2)}` : ''}

Your task:
1. Classify the event type as one of: CLINICAL, OPERATIONAL, FINANCIAL, PUBLIC_HEALTH, SUPPLY_CHAIN
2. Assign a priority level: CRITICAL, URGENT, ROUTINE, SCHEDULED
3. Suggest which AI agents should handle this event from the following options:
   - TRIAGE: Patient symptom analysis and urgency scoring
   - QUEUE_OPTIMIZATION: ED/OPD queue management
   - AMBIENT_SCRIBE: Clinical conversation documentation
   - DRUG_SAFETY: Drug interaction and allergy checking
   - CDSS: Clinical decision support
   - DIAGNOSTIC_VISION: Medical image analysis
   - BED_OCCUPANCY: Bed availability forecasting
   - ICU_DEMAND: ICU demand prediction
   - STAFF_SCHEDULING: Staff schedule optimization
   - WORKFLOW_OPTIMIZATION: Process bottleneck identification
   - DRUG_INVENTORY: Medication inventory forecasting
   - BLOOD_BANK: Blood stock forecasting
   - REVENUE_CYCLE: Medical coding and billing
   - CODING_BILLING: Billing error detection
   - DISEASE_PREDICTION: Regional disease outbreak prediction
   - INFECTION_SURVEILLANCE: Infection cluster detection
   - FOLLOW_UP: Post-discharge care management
   - NURSE_TASK_ROUTER: Nursing task prioritization

4. Provide reasoning for your classification

Respond in the following JSON format:
{
  "eventType": "CLINICAL|OPERATIONAL|FINANCIAL|PUBLIC_HEALTH|SUPPLY_CHAIN",
  "priority": "CRITICAL|URGENT|ROUTINE|SCHEDULED",
  "suggestedAgents": ["AGENT_TYPE_1", "AGENT_TYPE_2"],
  "reasoning": "Brief explanation of your classification"
}

Guidelines:
- CRITICAL: Life-threatening situations, system failures, critical resource shortages
- URGENT: Time-sensitive but not immediately life-threatening
- ROUTINE: Standard operations, scheduled tasks
- SCHEDULED: Pre-planned activities

Respond only with the JSON object, no additional text.`;
  }

  /**
   * Parse classification response
   */
  private parseClassificationResponse(response: string): {
    eventType: EventType;
    priority: Priority;
    suggestedAgents: AgentType[];
    reasoning: string;
  } {
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        eventType: parsed.eventType as EventType,
        priority: parsed.priority as Priority,
        suggestedAgents: parsed.suggestedAgents.map((a: string) => a as AgentType),
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      console.error('Error parsing classification response:', error);
      throw new Error('Failed to parse classification response');
    }
  }

  /**
   * Fallback rule-based classification
   */
  private fallbackClassification(event: Event): {
    eventType: EventType;
    priority: Priority;
    suggestedAgents: AgentType[];
    reasoning: string;
  } {
    // Simple rule-based classification as fallback
    const payload = event.payload;

    // Determine event type
    let eventType: EventType = EventType.OPERATIONAL;
    if (payload.symptoms || payload.diagnosis || payload.prescription) {
      eventType = EventType.CLINICAL;
    } else if (payload.claim || payload.billing) {
      eventType = EventType.FINANCIAL;
    } else if (payload.outbreak || payload.surveillance) {
      eventType = EventType.PUBLIC_HEALTH;
    } else if (payload.inventory || payload.stock) {
      eventType = EventType.SUPPLY_CHAIN;
    }

    // Determine priority
    let priority: Priority = Priority.ROUTINE;
    if (payload.urgencyScore && payload.urgencyScore > 70) {
      priority = Priority.CRITICAL;
    } else if (payload.urgencyScore && payload.urgencyScore > 40) {
      priority = Priority.URGENT;
    } else if (payload.scheduled) {
      priority = Priority.SCHEDULED;
    }

    // Suggest agents based on event type
    const suggestedAgents: AgentType[] = [];
    if (eventType === EventType.CLINICAL) {
      if (payload.symptoms) suggestedAgents.push(AgentType.TRIAGE);
      if (payload.audio) suggestedAgents.push(AgentType.AMBIENT_SCRIBE);
      if (payload.prescription) suggestedAgents.push(AgentType.DRUG_SAFETY);
      if (payload.image) suggestedAgents.push(AgentType.DIAGNOSTIC_VISION);
    }

    return {
      eventType,
      priority,
      suggestedAgents,
      reasoning: 'Fallback rule-based classification due to LLM unavailability',
    };
  }

  /**
   * Decompose complex task into subtasks
   */
  async decomposeTask(
    event: Event,
    primaryAgent: AgentType
  ): Promise<{
    subtasks: Array<{
      agentType: AgentType;
      description: string;
      dependencies: number[];
      priority: number;
    }>;
    reasoning: string;
  }> {
    const prompt = `You are a task decomposition expert for the MedhaOS healthcare system. 

Event: ${JSON.stringify(event, null, 2)}
Primary Agent: ${primaryAgent}

Decompose this complex task into a sequence of subtasks that different AI agents should handle. Consider:
1. What information needs to be gathered first?
2. What analyses need to be performed?
3. What validations are required?
4. What actions need to be taken?

Available agents: TRIAGE, QUEUE_OPTIMIZATION, AMBIENT_SCRIBE, DRUG_SAFETY, CDSS, DIAGNOSTIC_VISION, BED_OCCUPANCY, ICU_DEMAND, STAFF_SCHEDULING, WORKFLOW_OPTIMIZATION, DRUG_INVENTORY, BLOOD_BANK, REVENUE_CYCLE, CODING_BILLING, DISEASE_PREDICTION, INFECTION_SURVEILLANCE, FOLLOW_UP, NURSE_TASK_ROUTER

Respond in JSON format:
{
  "subtasks": [
    {
      "agentType": "AGENT_TYPE",
      "description": "What this subtask does",
      "dependencies": [0, 1],
      "priority": 1
    }
  ],
  "reasoning": "Explanation of the decomposition"
}

Dependencies are indices of subtasks that must complete first. Priority 1 is highest.
Respond only with the JSON object.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Error decomposing task:', error);
      // Return simple single-task decomposition as fallback
      return {
        subtasks: [
          {
            agentType: primaryAgent,
            description: 'Execute primary task',
            dependencies: [],
            priority: 1,
          },
        ],
        reasoning: 'Fallback to single-task execution',
      };
    }
  }
}
