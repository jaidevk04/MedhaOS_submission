import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { Escalation, AgentTask, AgentType } from '../types';
import { config } from '../config';

/**
 * Escalation Manager - Handles human escalation workflows
 */
export class EscalationManager {
  private docClient: DynamoDBDocumentClient;
  private escalationTableName = 'medhaos-escalations';

  constructor() {
    const client = new DynamoDBClient({
      region: config.dynamodb.region,
      endpoint: config.dynamodb.endpoint,
    });

    this.docClient = DynamoDBDocumentClient.from(client);
  }

  /**
   * Create escalation
   */
  async createEscalation(
    task: AgentTask,
    reason: string,
    confidence: number
  ): Promise<Escalation> {
    const escalation: Escalation = {
      escalationId: uuidv4(),
      taskId: task.taskId,
      reason,
      confidence,
      escalatedTo: this.determineEscalationTarget(task.agentType),
      status: 'pending',
      createdAt: new Date(),
    };

    try {
      await this.docClient.send(
        new PutCommand({
          TableName: this.escalationTableName,
          Item: {
            ...escalation,
            createdAt: escalation.createdAt.toISOString(),
          },
        })
      );

      console.log(`Escalation created: ${escalation.escalationId}`);
      return escalation;
    } catch (error) {
      console.error('Error creating escalation:', error);
      throw error;
    }
  }

  /**
   * Get escalation by ID
   */
  async getEscalation(escalationId: string): Promise<Escalation | null> {
    try {
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.escalationTableName,
          Key: { escalationId },
        })
      );

      if (!result.Item) {
        return null;
      }

      const item = result.Item;
      return {
        ...item,
        createdAt: new Date(item.createdAt),
        resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : undefined,
      } as Escalation;
    } catch (error) {
      console.error('Error getting escalation:', error);
      return null;
    }
  }

  /**
   * Acknowledge escalation
   */
  async acknowledgeEscalation(
    escalationId: string,
    acknowledgedBy: string
  ): Promise<void> {
    try {
      await this.docClient.send(
        new UpdateCommand({
          TableName: this.escalationTableName,
          Key: { escalationId },
          UpdateExpression:
            'SET #status = :status, acknowledgedBy = :acknowledgedBy, acknowledgedAt = :acknowledgedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': 'acknowledged',
            ':acknowledgedBy': acknowledgedBy,
            ':acknowledgedAt': new Date().toISOString(),
          },
        })
      );

      console.log(`Escalation acknowledged: ${escalationId} by ${acknowledgedBy}`);
    } catch (error) {
      console.error('Error acknowledging escalation:', error);
      throw error;
    }
  }

  /**
   * Resolve escalation
   */
  async resolveEscalation(
    escalationId: string,
    resolution: string,
    resolvedBy: string
  ): Promise<void> {
    try {
      await this.docClient.send(
        new UpdateCommand({
          TableName: this.escalationTableName,
          Key: { escalationId },
          UpdateExpression:
            'SET #status = :status, resolution = :resolution, resolvedBy = :resolvedBy, resolvedAt = :resolvedAt',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':status': 'resolved',
            ':resolution': resolution,
            ':resolvedBy': resolvedBy,
            ':resolvedAt': new Date().toISOString(),
          },
        })
      );

      console.log(`Escalation resolved: ${escalationId} by ${resolvedBy}`);
    } catch (error) {
      console.error('Error resolving escalation:', error);
      throw error;
    }
  }

  /**
   * Get pending escalations
   */
  async getPendingEscalations(escalatedTo?: string): Promise<Escalation[]> {
    try {
      const params: any = {
        TableName: this.escalationTableName,
        IndexName: 'status-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'pending',
        },
      };

      if (escalatedTo) {
        params.FilterExpression = 'escalatedTo = :escalatedTo';
        params.ExpressionAttributeValues[':escalatedTo'] = escalatedTo;
      }

      const result = await this.docClient.send(new QueryCommand(params));

      if (!result.Items || result.Items.length === 0) {
        return [];
      }

      return result.Items.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : undefined,
      })) as Escalation[];
    } catch (error) {
      console.error('Error getting pending escalations:', error);
      return [];
    }
  }

  /**
   * Get escalations by task
   */
  async getEscalationsByTask(taskId: string): Promise<Escalation[]> {
    try {
      const result = await this.docClient.send(
        new QueryCommand({
          TableName: this.escalationTableName,
          IndexName: 'taskId-index',
          KeyConditionExpression: 'taskId = :taskId',
          ExpressionAttributeValues: {
            ':taskId': taskId,
          },
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return [];
      }

      return result.Items.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : undefined,
      })) as Escalation[];
    } catch (error) {
      console.error('Error getting escalations by task:', error);
      return [];
    }
  }

  /**
   * Determine escalation target based on agent type
   */
  private determineEscalationTarget(agentType: AgentType): string {
    const escalationMap: Record<AgentType, string> = {
      [AgentType.TRIAGE]: 'triage_nurse',
      [AgentType.CDSS]: 'attending_physician',
      [AgentType.DRUG_SAFETY]: 'clinical_pharmacist',
      [AgentType.AMBIENT_SCRIBE]: 'medical_scribe_supervisor',
      [AgentType.DIAGNOSTIC_VISION]: 'radiologist',
      [AgentType.QUEUE_OPTIMIZATION]: 'ed_charge_nurse',
      [AgentType.BED_OCCUPANCY]: 'bed_management_coordinator',
      [AgentType.ICU_DEMAND]: 'icu_director',
      [AgentType.STAFF_SCHEDULING]: 'nurse_manager',
      [AgentType.WORKFLOW_OPTIMIZATION]: 'operations_manager',
      [AgentType.NURSE_TASK_ROUTER]: 'charge_nurse',
      [AgentType.DRUG_INVENTORY]: 'pharmacy_director',
      [AgentType.BLOOD_BANK]: 'blood_bank_supervisor',
      [AgentType.REVENUE_CYCLE]: 'billing_manager',
      [AgentType.CODING_BILLING]: 'coding_supervisor',
      [AgentType.DISEASE_PREDICTION]: 'public_health_officer',
      [AgentType.INFECTION_SURVEILLANCE]: 'infection_control_officer',
      [AgentType.FOLLOW_UP]: 'care_coordinator',
    };

    return escalationMap[agentType] || 'system_administrator';
  }

  /**
   * Get escalation statistics
   */
  async getEscalationStats(): Promise<{
    total: number;
    pending: number;
    acknowledged: number;
    resolved: number;
    averageResolutionTime: number;
  }> {
    try {
      // This is a simplified version - in production, you'd use aggregation queries
      const allEscalations = await this.getAllEscalations();

      const pending = allEscalations.filter((e) => e.status === 'pending').length;
      const acknowledged = allEscalations.filter(
        (e) => e.status === 'acknowledged'
      ).length;
      const resolved = allEscalations.filter((e) => e.status === 'resolved').length;

      // Calculate average resolution time
      const resolvedEscalations = allEscalations.filter(
        (e) => e.status === 'resolved' && e.resolvedAt
      );
      
      let totalResolutionTime = 0;
      for (const escalation of resolvedEscalations) {
        if (escalation.resolvedAt) {
          const resolutionTime =
            escalation.resolvedAt.getTime() - escalation.createdAt.getTime();
          totalResolutionTime += resolutionTime;
        }
      }

      const averageResolutionTime =
        resolvedEscalations.length > 0
          ? totalResolutionTime / resolvedEscalations.length / 60000 // Convert to minutes
          : 0;

      return {
        total: allEscalations.length,
        pending,
        acknowledged,
        resolved,
        averageResolutionTime,
      };
    } catch (error) {
      console.error('Error getting escalation stats:', error);
      return {
        total: 0,
        pending: 0,
        acknowledged: 0,
        resolved: 0,
        averageResolutionTime: 0,
      };
    }
  }

  /**
   * Get all escalations (helper method)
   */
  private async getAllEscalations(): Promise<Escalation[]> {
    // Simplified - in production, implement pagination
    return [];
  }
}
