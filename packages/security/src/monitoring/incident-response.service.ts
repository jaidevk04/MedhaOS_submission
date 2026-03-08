/**
 * Security Incident Response Service
 * Manages security incidents and response workflows
 */

import { SecurityIncident, IncidentAction } from '../types';

export class IncidentResponseService {
  private incidents: Map<string, SecurityIncident>;

  constructor() {
    this.incidents = new Map();
  }

  /**
   * Create a new security incident
   */
  async createIncident(
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
    type: string,
    description: string,
    affectedResources: string[]
  ): Promise<string> {
    const incidentId = this.generateIncidentId();

    const incident: SecurityIncident = {
      incidentId,
      severity,
      type,
      description,
      affectedResources,
      detectedAt: new Date(),
      status: 'OPEN',
      actions: [],
    };

    this.incidents.set(incidentId, incident);

    // Auto-trigger response for critical incidents
    if (severity === 'CRITICAL') {
      await this.triggerAutomatedResponse(incidentId);
    }

    return incidentId;
  }

  /**
   * Get incident details
   */
  async getIncident(incidentId: string): Promise<SecurityIncident | null> {
    return this.incidents.get(incidentId) || null;
  }

  /**
   * Get all incidents
   */
  async getAllIncidents(): Promise<SecurityIncident[]> {
    return Array.from(this.incidents.values());
  }

  /**
   * Get open incidents
   */
  async getOpenIncidents(): Promise<SecurityIncident[]> {
    return Array.from(this.incidents.values()).filter(
      (incident) => incident.status === 'OPEN' || incident.status === 'INVESTIGATING'
    );
  }

  /**
   * Get critical incidents
   */
  async getCriticalIncidents(): Promise<SecurityIncident[]> {
    return Array.from(this.incidents.values()).filter(
      (incident) => incident.severity === 'CRITICAL' && incident.status !== 'RESOLVED'
    );
  }

  /**
   * Update incident status
   */
  async updateIncidentStatus(
    incidentId: string,
    status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED'
  ): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    incident.status = status;

    if (status === 'RESOLVED') {
      incident.resolvedAt = new Date();
    }

    this.incidents.set(incidentId, incident);
  }

  /**
   * Assign incident to responder
   */
  async assignIncident(incidentId: string, assignedTo: string): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    incident.assignedTo = assignedTo;
    incident.status = 'INVESTIGATING';
    this.incidents.set(incidentId, incident);
  }

  /**
   * Add action to incident
   */
  async addAction(
    incidentId: string,
    type: 'ISOLATE' | 'BLOCK' | 'ALERT' | 'INVESTIGATE' | 'REMEDIATE',
    description: string,
    performedBy: string,
    result: string
  ): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const action: IncidentAction = {
      actionId: this.generateActionId(),
      type,
      description,
      performedBy,
      performedAt: new Date(),
      result,
    };

    incident.actions.push(action);
    this.incidents.set(incidentId, incident);
  }

  /**
   * Trigger automated response for critical incidents
   */
  private async triggerAutomatedResponse(incidentId: string): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (!incident) return;

    // Automated response actions
    const actions = [
      {
        type: 'ALERT' as const,
        description: 'Send alert to security team',
        result: 'Alert sent successfully',
      },
      {
        type: 'ISOLATE' as const,
        description: 'Isolate affected resources',
        result: 'Resources isolated',
      },
      {
        type: 'INVESTIGATE' as const,
        description: 'Start automated investigation',
        result: 'Investigation initiated',
      },
    ];

    for (const action of actions) {
      await this.addAction(
        incidentId,
        action.type,
        action.description,
        'AUTOMATED_SYSTEM',
        action.result
      );
    }

    incident.status = 'CONTAINED';
    this.incidents.set(incidentId, incident);
  }

  /**
   * Get incident timeline
   */
  async getIncidentTimeline(incidentId: string): Promise<any[]> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error(`Incident ${incidentId} not found`);
    }

    const timeline = [
      {
        timestamp: incident.detectedAt,
        event: 'Incident detected',
        details: incident.description,
      },
      ...incident.actions.map((action) => ({
        timestamp: action.performedAt,
        event: `Action: ${action.type}`,
        details: action.description,
        performedBy: action.performedBy,
        result: action.result,
      })),
    ];

    if (incident.resolvedAt) {
      timeline.push({
        timestamp: incident.resolvedAt,
        event: 'Incident resolved',
        details: 'Incident has been fully resolved',
      });
    }

    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get incident statistics
   */
  async getIncidentStats(): Promise<any> {
    const allIncidents = Array.from(this.incidents.values());

    return {
      total: allIncidents.length,
      open: allIncidents.filter((i) => i.status === 'OPEN').length,
      investigating: allIncidents.filter((i) => i.status === 'INVESTIGATING').length,
      contained: allIncidents.filter((i) => i.status === 'CONTAINED').length,
      resolved: allIncidents.filter((i) => i.status === 'RESOLVED').length,
      critical: allIncidents.filter((i) => i.severity === 'CRITICAL').length,
      high: allIncidents.filter((i) => i.severity === 'HIGH').length,
      medium: allIncidents.filter((i) => i.severity === 'MEDIUM').length,
      low: allIncidents.filter((i) => i.severity === 'LOW').length,
      averageResolutionTime: this.calculateAverageResolutionTime(allIncidents),
    };
  }

  /**
   * Calculate average resolution time
   */
  private calculateAverageResolutionTime(incidents: SecurityIncident[]): number {
    const resolvedIncidents = incidents.filter((i) => i.resolvedAt);

    if (resolvedIncidents.length === 0) return 0;

    const totalTime = resolvedIncidents.reduce((sum, incident) => {
      const resolutionTime =
        incident.resolvedAt!.getTime() - incident.detectedAt.getTime();
      return sum + resolutionTime;
    }, 0);

    return totalTime / resolvedIncidents.length / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Generate unique incident ID
   */
  private generateIncidentId(): string {
    return `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}

export default new IncidentResponseService();
