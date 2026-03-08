import { AgentTask, AgentType } from '../types';
import { config } from '../config';

/**
 * Confidence Evaluator - Evaluates agent confidence and determines escalation needs
 */
export class ConfidenceEvaluator {
  private confidenceThreshold: number;
  private escalationThreshold: number;

  constructor() {
    this.confidenceThreshold = config.agent.confidenceThreshold;
    this.escalationThreshold = config.agent.escalationThreshold;
  }

  /**
   * Evaluate if task needs escalation
   */
  shouldEscalate(task: AgentTask): {
    shouldEscalate: boolean;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  } {
    // No confidence score - escalate by default for safety
    if (task.confidence === undefined) {
      return {
        shouldEscalate: true,
        reason: 'No confidence score provided',
        severity: 'medium',
      };
    }

    // Task failed - always escalate
    if (task.status === 'failed') {
      return {
        shouldEscalate: true,
        reason: `Task failed: ${task.error || 'Unknown error'}`,
        severity: 'high',
      };
    }

    // Low confidence - escalate
    if (task.confidence < this.confidenceThreshold) {
      const severity = this.determineEscalationSeverity(task);
      return {
        shouldEscalate: true,
        reason: `Low confidence score: ${task.confidence.toFixed(2)} (threshold: ${this.confidenceThreshold})`,
        severity,
      };
    }

    // Confidence between threshold and escalation threshold - review recommended
    if (task.confidence < this.escalationThreshold) {
      return {
        shouldEscalate: false,
        reason: `Moderate confidence: ${task.confidence.toFixed(2)} - human review recommended`,
        severity: 'low',
      };
    }

    // High confidence - no escalation needed
    return {
      shouldEscalate: false,
      reason: `High confidence: ${task.confidence.toFixed(2)}`,
      severity: 'low',
    };
  }

  /**
   * Determine escalation severity
   */
  private determineEscalationSeverity(
    task: AgentTask
  ): 'low' | 'medium' | 'high' {
    // Critical agents always get high severity
    const criticalAgents: AgentType[] = [
      AgentType.TRIAGE,
      AgentType.DRUG_SAFETY,
      AgentType.CDSS,
      AgentType.DIAGNOSTIC_VISION,
    ];

    if (criticalAgents.includes(task.agentType)) {
      return 'high';
    }

    // Very low confidence
    if (task.confidence !== undefined && task.confidence < 0.5) {
      return 'high';
    }

    // Low confidence
    if (task.confidence !== undefined && task.confidence < 0.65) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get confidence level description
   */
  getConfidenceLevel(confidence: number): {
    level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
    description: string;
    color: string;
  } {
    if (confidence < 0.5) {
      return {
        level: 'very_low',
        description: 'Very Low - Immediate human review required',
        color: 'red',
      };
    } else if (confidence < this.confidenceThreshold) {
      return {
        level: 'low',
        description: 'Low - Human escalation recommended',
        color: 'orange',
      };
    } else if (confidence < this.escalationThreshold) {
      return {
        level: 'moderate',
        description: 'Moderate - Human review suggested',
        color: 'yellow',
      };
    } else if (confidence < 0.95) {
      return {
        level: 'high',
        description: 'High - Proceed with caution',
        color: 'green',
      };
    } else {
      return {
        level: 'very_high',
        description: 'Very High - Proceed autonomously',
        color: 'blue',
      };
    }
  }

  /**
   * Calculate aggregate confidence for workflow
   */
  calculateWorkflowConfidence(tasks: AgentTask[]): {
    overallConfidence: number;
    lowestConfidence: number;
    highestConfidence: number;
    averageConfidence: number;
    tasksNeedingReview: number;
  } {
    const confidenceScores = tasks
      .filter((t) => t.confidence !== undefined)
      .map((t) => t.confidence!);

    if (confidenceScores.length === 0) {
      return {
        overallConfidence: 0,
        lowestConfidence: 0,
        highestConfidence: 0,
        averageConfidence: 0,
        tasksNeedingReview: tasks.length,
      };
    }

    const lowestConfidence = Math.min(...confidenceScores);
    const highestConfidence = Math.max(...confidenceScores);
    const averageConfidence =
      confidenceScores.reduce((sum, score) => sum + score, 0) /
      confidenceScores.length;

    // Overall confidence is weighted towards the lowest score
    // This ensures that one low-confidence task affects the overall score
    const overallConfidence = lowestConfidence * 0.6 + averageConfidence * 0.4;

    const tasksNeedingReview = tasks.filter((t) => {
      if (t.confidence === undefined) return true;
      return t.confidence < this.escalationThreshold;
    }).length;

    return {
      overallConfidence,
      lowestConfidence,
      highestConfidence,
      averageConfidence,
      tasksNeedingReview,
    };
  }

  /**
   * Get escalation recommendation
   */
  getEscalationRecommendation(task: AgentTask): {
    action: 'proceed' | 'review' | 'escalate' | 'block';
    message: string;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  } {
    const evaluation = this.shouldEscalate(task);

    if (task.status === 'failed') {
      return {
        action: 'block',
        message: 'Task failed - immediate intervention required',
        urgency: 'critical',
      };
    }

    if (!task.confidence) {
      return {
        action: 'escalate',
        message: 'No confidence score - escalate for safety',
        urgency: 'high',
      };
    }

    if (task.confidence < 0.5) {
      return {
        action: 'block',
        message: 'Very low confidence - do not proceed without human approval',
        urgency: 'critical',
      };
    }

    if (task.confidence < this.confidenceThreshold) {
      return {
        action: 'escalate',
        message: evaluation.reason,
        urgency: evaluation.severity === 'high' ? 'high' : 'medium',
      };
    }

    if (task.confidence < this.escalationThreshold) {
      return {
        action: 'review',
        message: 'Moderate confidence - human review recommended',
        urgency: 'low',
      };
    }

    return {
      action: 'proceed',
      message: 'High confidence - proceed autonomously',
      urgency: 'low',
    };
  }

  /**
   * Update confidence thresholds (for dynamic adjustment)
   */
  updateThresholds(confidence: number, escalation: number): void {
    if (confidence >= 0 && confidence <= 1) {
      this.confidenceThreshold = confidence;
    }
    if (escalation >= 0 && escalation <= 1) {
      this.escalationThreshold = escalation;
    }
  }

  /**
   * Get current thresholds
   */
  getThresholds(): {
    confidence: number;
    escalation: number;
  } {
    return {
      confidence: this.confidenceThreshold,
      escalation: this.escalationThreshold,
    };
  }
}
