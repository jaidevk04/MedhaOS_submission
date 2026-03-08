/**
 * Agent Task DynamoDB Repository
 * 
 * Handles real-time agent task operations in DynamoDB
 */

import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoDbClient, DYNAMODB_TABLES } from '../client';
import { v4 as uuidv4 } from 'uuid';

export interface AgentTaskItem {
  taskId: string;
  agentName: string;
  taskType: string;
  patientId?: string;
  encounterId?: string;
  inputData: Record<string, any>;
  outputData?: Record<string, any>;
  confidenceScore?: number;
  escalatedToHuman: boolean;
  executionTimeMs?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

export class AgentTaskDynamoRepository {
  private tableName = DYNAMODB_TABLES.AGENT_TASKS;

  /**
   * Create a new agent task
   */
  async create(task: Omit<AgentTaskItem, 'taskId' | 'createdAt' | 'updatedAt'>): Promise<AgentTaskItem> {
    const taskId = uuidv4();
    const now = new Date().toISOString();

    const item: AgentTaskItem = {
      ...task,
      taskId,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `TASK#${taskId}`,
        SK: `TASK#${now}`,
        GSI1PK: task.agentName,
        GSI1SK: now,
        GSI2PK: task.status,
        GSI2SK: now,
        ...(task.patientId && {
          GSI3PK: task.patientId,
          GSI3SK: now,
        }),
        ...item,
      },
    });

    await dynamoDbClient.send(command);
    return item;
  }

  /**
   * Get task by ID
   */
  async getById(taskId: string): Promise<AgentTaskItem | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `TASK#${taskId}`,
        SK: `TASK#${taskId}`,
      },
    });

    const result = await dynamoDbClient.send(command);
    return result.Item as AgentTaskItem | null;
  }

  /**
   * Update task status
   */
  async updateStatus(
    taskId: string,
    status: AgentTaskItem['status'],
    outputData?: Record<string, any>,
    errorMessage?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const completedAt = status === 'completed' || status === 'failed' ? now : undefined;

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: `TASK#${taskId}`,
        SK: `TASK#${taskId}`,
      },
      UpdateExpression:
        'SET #status = :status, updatedAt = :updatedAt, GSI2PK = :status' +
        (outputData ? ', outputData = :outputData' : '') +
        (errorMessage ? ', errorMessage = :errorMessage' : '') +
        (completedAt ? ', completedAt = :completedAt' : ''),
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': now,
        ...(outputData && { ':outputData': outputData }),
        ...(errorMessage && { ':errorMessage': errorMessage }),
        ...(completedAt && { ':completedAt': completedAt }),
      },
    });

    await dynamoDbClient.send(command);
  }

  /**
   * Query tasks by agent name
   */
  async queryByAgent(agentName: string, limit = 50): Promise<AgentTaskItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :agentName',
      ExpressionAttributeValues: {
        ':agentName': agentName,
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    const result = await dynamoDbClient.send(command);
    return (result.Items || []) as AgentTaskItem[];
  }

  /**
   * Query tasks by status
   */
  async queryByStatus(status: AgentTaskItem['status'], limit = 100): Promise<AgentTaskItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :status',
      ExpressionAttributeValues: {
        ':status': status,
      },
      Limit: limit,
      ScanIndexForward: true, // Oldest first for pending tasks
    });

    const result = await dynamoDbClient.send(command);
    return (result.Items || []) as AgentTaskItem[];
  }

  /**
   * Query tasks by patient ID
   */
  async queryByPatient(patientId: string, limit = 50): Promise<AgentTaskItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI3',
      KeyConditionExpression: 'GSI3PK = :patientId',
      ExpressionAttributeValues: {
        ':patientId': patientId,
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    const result = await dynamoDbClient.send(command);
    return (result.Items || []) as AgentTaskItem[];
  }

  /**
   * Delete task
   */
  async delete(taskId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `TASK#${taskId}`,
        SK: `TASK#${taskId}`,
      },
    });

    await dynamoDbClient.send(command);
  }

  /**
   * Update execution metrics
   */
  async updateMetrics(
    taskId: string,
    executionTimeMs: number,
    confidenceScore?: number,
    escalatedToHuman?: boolean
  ): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: `TASK#${taskId}`,
        SK: `TASK#${taskId}`,
      },
      UpdateExpression:
        'SET executionTimeMs = :executionTimeMs, updatedAt = :updatedAt' +
        (confidenceScore !== undefined ? ', confidenceScore = :confidenceScore' : '') +
        (escalatedToHuman !== undefined ? ', escalatedToHuman = :escalatedToHuman' : ''),
      ExpressionAttributeValues: {
        ':executionTimeMs': executionTimeMs,
        ':updatedAt': new Date().toISOString(),
        ...(confidenceScore !== undefined && { ':confidenceScore': confidenceScore }),
        ...(escalatedToHuman !== undefined && { ':escalatedToHuman': escalatedToHuman }),
      },
    });

    await dynamoDbClient.send(command);
  }
}

export const agentTaskDynamoRepository = new AgentTaskDynamoRepository();
