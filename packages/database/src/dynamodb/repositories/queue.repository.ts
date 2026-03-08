/**
 * Queue Management DynamoDB Repository
 * 
 * Handles real-time queue operations in DynamoDB
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

export interface QueueItem {
  itemId: string;
  facilityId: string;
  queueType: 'ED' | 'OPD' | 'ICU' | 'SURGERY';
  patientId: string;
  encounterId: string;
  patientName: string;
  urgencyScore: number;
  priority: number; // Calculated priority (0-100)
  estimatedWaitTime?: number; // Minutes
  position?: number;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string; // Clinician ID
  createdAt: string;
  updatedAt: string;
  calledAt?: string;
  completedAt?: string;
}

export class QueueDynamoRepository {
  private tableName = DYNAMODB_TABLES.QUEUE_MANAGEMENT;

  /**
   * Add item to queue
   */
  async addToQueue(item: Omit<QueueItem, 'itemId' | 'createdAt' | 'updatedAt'>): Promise<QueueItem> {
    const itemId = uuidv4();
    const now = new Date().toISOString();

    const queueItem: QueueItem = {
      ...item,
      itemId,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `QUEUE#${item.facilityId}#${item.queueType}`,
        SK: `ITEM#${String(100 - item.priority).padStart(3, '0')}#${now}`,
        GSI1PK: item.facilityId,
        GSI1SK: item.urgencyScore,
        GSI2PK: item.status,
        GSI2SK: now,
        ...queueItem,
      },
    });

    await dynamoDbClient.send(command);
    return queueItem;
  }

  /**
   * Get queue item by ID
   */
  async getById(facilityId: string, queueType: string, itemId: string): Promise<QueueItem | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `QUEUE#${facilityId}#${queueType}`,
        SK: `ITEM#${itemId}`,
      },
    });

    const result = await dynamoDbClient.send(command);
    return result.Item as QueueItem | null;
  }

  /**
   * Query queue items by facility and queue type
   */
  async queryQueue(
    facilityId: string,
    queueType: string,
    limit = 100
  ): Promise<QueueItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':pk': `QUEUE#${facilityId}#${queueType}`,
        ':status': 'waiting',
      },
      Limit: limit,
      ScanIndexForward: true, // Highest priority first
    });

    const result = await dynamoDbClient.send(command);
    return (result.Items || []) as QueueItem[];
  }

  /**
   * Query queue items by urgency score
   */
  async queryByUrgency(
    facilityId: string,
    minUrgency: number,
    limit = 50
  ): Promise<QueueItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :facilityId AND GSI1SK >= :minUrgency',
      ExpressionAttributeValues: {
        ':facilityId': facilityId,
        ':minUrgency': minUrgency,
      },
      Limit: limit,
      ScanIndexForward: false, // Highest urgency first
    });

    const result = await dynamoDbClient.send(command);
    return (result.Items || []) as QueueItem[];
  }

  /**
   * Update queue item status
   */
  async updateStatus(
    facilityId: string,
    queueType: string,
    itemId: string,
    status: QueueItem['status'],
    assignedTo?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const calledAt = status === 'in_progress' ? now : undefined;
    const completedAt = status === 'completed' || status === 'cancelled' ? now : undefined;

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: `QUEUE#${facilityId}#${queueType}`,
        SK: `ITEM#${itemId}`,
      },
      UpdateExpression:
        'SET #status = :status, updatedAt = :updatedAt, GSI2PK = :status' +
        (assignedTo ? ', assignedTo = :assignedTo' : '') +
        (calledAt ? ', calledAt = :calledAt' : '') +
        (completedAt ? ', completedAt = :completedAt' : ''),
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': now,
        ...(assignedTo && { ':assignedTo': assignedTo }),
        ...(calledAt && { ':calledAt': calledAt }),
        ...(completedAt && { ':completedAt': completedAt }),
      },
    });

    await dynamoDbClient.send(command);
  }

  /**
   * Update queue item priority
   */
  async updatePriority(
    facilityId: string,
    queueType: string,
    itemId: string,
    newPriority: number
  ): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: `QUEUE#${facilityId}#${queueType}`,
        SK: `ITEM#${itemId}`,
      },
      UpdateExpression: 'SET priority = :priority, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':priority': newPriority,
        ':updatedAt': new Date().toISOString(),
      },
    });

    await dynamoDbClient.send(command);
  }

  /**
   * Delete queue item
   */
  async delete(facilityId: string, queueType: string, itemId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `QUEUE#${facilityId}#${queueType}`,
        SK: `ITEM#${itemId}`,
      },
    });

    await dynamoDbClient.send(command);
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(facilityId: string, queueType: string): Promise<{
    totalWaiting: number;
    averageWaitTime: number;
    highestUrgency: number;
  }> {
    const items = await this.queryQueue(facilityId, queueType, 1000);
    
    const totalWaiting = items.length;
    const averageWaitTime = items.reduce((sum, item) => sum + (item.estimatedWaitTime || 0), 0) / totalWaiting || 0;
    const highestUrgency = Math.max(...items.map(item => item.urgencyScore), 0);

    return {
      totalWaiting,
      averageWaitTime,
      highestUrgency,
    };
  }
}

export const queueDynamoRepository = new QueueDynamoRepository();
