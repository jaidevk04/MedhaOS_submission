/**
 * Alert Manager
 * Manages alert rules, escalation policies, and notification routing
 */

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (value: number) => boolean;
  severity: 'info' | 'warning' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  value: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface EscalationPolicy {
  id: string;
  name: string;
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  delayMinutes: number;
  channels: ('slack' | 'pagerduty' | 'email' | 'sms')[];
  recipients: string[];
}

export class AlertManager {
  private rules: Map<string, AlertRule>;
  private activeAlerts: Map<string, Alert>;
  private escalationPolicies: Map<string, EscalationPolicy>;
  private alertHistory: Alert[];
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 10000) {
    this.rules = new Map();
    this.activeAlerts = new Map();
    this.escalationPolicies = new Map();
    this.alertHistory = [];
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Register an alert rule
   */
  registerRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Unregister an alert rule
   */
  unregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Evaluate a metric against all rules
   */
  evaluateMetric(metricName: string, value: number): Alert[] {
    const triggeredAlerts: Alert[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) {
        continue;
      }

      // Check cooldown period
      if (rule.lastTriggered) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < cooldownMs) {
          continue;
        }
      }

      // Evaluate condition
      if (rule.condition(value)) {
        const alert: Alert = {
          id: `${rule.id}-${Date.now()}`,
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          message: `${rule.description}: ${metricName} = ${value}`,
          value,
          timestamp: new Date(),
          acknowledged: false,
          resolved: false,
        };

        this.activeAlerts.set(alert.id, alert);
        this.alertHistory.push(alert);
        triggeredAlerts.push(alert);

        // Update last triggered time
        rule.lastTriggered = new Date();

        // Trim history if needed
        if (this.alertHistory.length > this.maxHistorySize) {
          this.alertHistory.shift();
        }
      }
    }

    return triggeredAlerts;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    return true;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    this.activeAlerts.delete(alertId);

    return true;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(severity?: Alert['severity']): Alert[] {
    const alerts = Array.from(this.activeAlerts.values());
    
    if (severity) {
      return alerts.filter(a => a.severity === severity);
    }

    return alerts;
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit?: number): Alert[] {
    if (limit) {
      return this.alertHistory.slice(-limit);
    }
    return this.alertHistory;
  }

  /**
   * Register escalation policy
   */
  registerEscalationPolicy(policy: EscalationPolicy): void {
    this.escalationPolicies.set(policy.id, policy);
  }

  /**
   * Get escalation policy
   */
  getEscalationPolicy(policyId: string): EscalationPolicy | undefined {
    return this.escalationPolicies.get(policyId);
  }

  /**
   * Get alerts requiring escalation
   */
  getAlertsForEscalation(policyId: string): Array<{ alert: Alert; level: EscalationLevel }> {
    const policy = this.escalationPolicies.get(policyId);
    if (!policy) {
      return [];
    }

    const result: Array<{ alert: Alert; level: EscalationLevel }> = [];

    for (const alert of this.activeAlerts.values()) {
      if (alert.acknowledged || alert.resolved) {
        continue;
      }

      const minutesSinceTriggered = (Date.now() - alert.timestamp.getTime()) / 1000 / 60;

      for (const level of policy.levels) {
        if (minutesSinceTriggered >= level.delayMinutes) {
          result.push({ alert, level });
          break;
        }
      }
    }

    return result;
  }

  /**
   * Get alert statistics
   */
  getStatistics(): {
    totalActive: number;
    bySeverity: { [key: string]: number };
    totalResolved: number;
    avgResolutionTimeMinutes: number;
  } {
    const stats = {
      totalActive: this.activeAlerts.size,
      bySeverity: {
        info: 0,
        warning: 0,
        critical: 0,
      },
      totalResolved: 0,
      avgResolutionTimeMinutes: 0,
    };

    // Count by severity
    for (const alert of this.activeAlerts.values()) {
      stats.bySeverity[alert.severity]++;
    }

    // Calculate resolution stats
    const resolvedAlerts = this.alertHistory.filter(a => a.resolved);
    stats.totalResolved = resolvedAlerts.length;

    if (resolvedAlerts.length > 0) {
      const totalResolutionTime = resolvedAlerts.reduce((sum, alert) => {
        if (alert.resolvedAt) {
          return sum + (alert.resolvedAt.getTime() - alert.timestamp.getTime());
        }
        return sum;
      }, 0);

      stats.avgResolutionTimeMinutes = totalResolutionTime / resolvedAlerts.length / 1000 / 60;
    }

    return stats;
  }

  /**
   * Clear resolved alerts from history
   */
  clearResolvedAlerts(): void {
    this.alertHistory = this.alertHistory.filter(a => !a.resolved);
  }

  /**
   * Export alert data
   */
  exportData(): {
    rules: AlertRule[];
    activeAlerts: Alert[];
    history: Alert[];
  } {
    return {
      rules: Array.from(this.rules.values()),
      activeAlerts: Array.from(this.activeAlerts.values()),
      history: this.alertHistory,
    };
  }
}

/**
 * Create alert manager instance
 */
export function createAlertManager(maxHistorySize?: number): AlertManager {
  return new AlertManager(maxHistorySize);
}

/**
 * Predefined alert rules for common scenarios
 */
export const CommonAlertRules = {
  highErrorRate: (threshold: number = 5): AlertRule => ({
    id: 'high-error-rate',
    name: 'High Error Rate',
    description: `Error rate exceeds ${threshold}%`,
    condition: (value) => value > threshold,
    severity: 'critical',
    enabled: true,
    cooldownMinutes: 5,
  }),

  highResponseTime: (threshold: number = 3000): AlertRule => ({
    id: 'high-response-time',
    name: 'High Response Time',
    description: `Response time exceeds ${threshold}ms`,
    condition: (value) => value > threshold,
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 5,
  }),

  lowAgentConfidence: (threshold: number = 0.70): AlertRule => ({
    id: 'low-agent-confidence',
    name: 'Low Agent Confidence',
    description: `Agent confidence below ${threshold}`,
    condition: (value) => value < threshold,
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 10,
  }),

  highQueueDepth: (threshold: number = 100): AlertRule => ({
    id: 'high-queue-depth',
    name: 'High Queue Depth',
    description: `Queue depth exceeds ${threshold} messages`,
    condition: (value) => value > threshold,
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 5,
  }),

  highMemoryUsage: (threshold: number = 90): AlertRule => ({
    id: 'high-memory-usage',
    name: 'High Memory Usage',
    description: `Memory usage exceeds ${threshold}%`,
    condition: (value) => value > threshold,
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 10,
  }),

  highCpuUsage: (threshold: number = 90): AlertRule => ({
    id: 'high-cpu-usage',
    name: 'High CPU Usage',
    description: `CPU usage exceeds ${threshold}%`,
    condition: (value) => value > threshold,
    severity: 'warning',
    enabled: true,
    cooldownMinutes: 10,
  }),
};
