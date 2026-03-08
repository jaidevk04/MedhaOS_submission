/**
 * Session DynamoDB Repository
 * 
 * Handles real-time session data operations in DynamoDB
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

export interface SessionItem {
  sessionId: string;
  userId: string;
  userRole: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionData: Record<string, any>;
  status: 'active' | 'expired' | 'terminated';
  createdAt: string;
  lastAccessedAt: number; // Unix timestamp
  expiresAt: number; // Unix timestamp
  ttl: number; // DynamoDB TTL (Unix timestamp)
}

export class SessionDynamoRepository {
  private tableName = DYNAMODB_TABLES.SESSION_DATA;
  private defaultTTL = 24 * 60 * 60; // 24 hours in seconds

  /**
   * Create a new session
   */
  async create(
    userId: string,
    userRole: string,
    sessionData: Record<string, any>,
    ttlSeconds = this.defaultTTL
  ): Promise<SessionItem> {
    const sessionId = uuidv4();
    const now = new Date();
    const nowTimestamp = Math.floor(now.getTime() / 1000);
    const expiresAt = nowTimestamp + ttlSeconds;

    const item: SessionItem = {
      sessionId,
      userId,
      userRole,
      sessionData,
      status: 'active',
      createdAt: now.toISOString(),
      lastAccessedAt: nowTimestamp,
      expiresAt,
      ttl: expiresAt,
    };

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `SESSION#${sessionId}`,
        SK: `SESSION#${now.toISOString()}`,
        GSI1PK: userId,
        GSI1SK: nowTimestamp,
        GSI2PK: 'active',
        GSI2SK: nowTimestamp,
        ...item,
      },
    });

    await dynamoDbClient.send(command);
    return item;
  }

  /**
   * Get session by ID
   */
  async getById(sessionId: string): Promise<SessionItem | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `SESSION#${sessionId}`,
        SK: `SESSION#${sessionId}`,
      },
    });

    const result = await dynamoDbClient.send(command);
    return result.Item as SessionItem | null;
  }

  /**
   * Update session data and last accessed time
   */
  async updateSession(
    sessionId: string,
    sessionData: Record<string, any>
  ): Promise<void> {
    const nowTimestamp = Math.floor(Date.now() / 1000);

    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: `SESSION#${sessionId}`,
        SK: `SESSION#${sessionId}`,
      },
      UpdateExpression:
        'SET sessionData = :sessionData, lastAccessedAt = :lastAccessedAt, GSI1SK = :lastAccessedAt, GSI2SK = :lastAccessedAt',
      ExpressionAttributeValues: {
        ':sessionData': sessionData,
        ':lastAccessedAt': nowTimestamp,
      },
    });

    await dynamoDbClient.send(command);
  }

  /**
   * Terminate session
   */
  async terminate(sessionId: string): Promise<void> {
    const command = new UpdateCommand({
      TableName: this.tableName,
      Key: {
        PK: `SESSION#${sessionId}`,
        SK: `SESSION#${sessionId}`,
      },
      UpdateExpression: 'SET #status = :status, GSI2PK = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'terminated',
      },
    });

    await dynamoDbClient.send(command);
  }

  /**
   * Query sessions by user ID
   */
  async queryByUser(userId: string, limit = 10): Promise<SessionItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :userId',
      ExpressionAttributeValues: {
        ':userId': userId,
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    const result = await dynamoDbClient.send(command);
    return (result.Items || []) as SessionItem[];
  }

  /**
   * Query active sessions
   */
  async queryActiveSessions(limit = 100): Promise<SessionItem[]> {
    const command = new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :status',
      ExpressionAttributeValues: {
        ':status': 'active',
      },
      Limit: limit,
      ScanIndexForward: false, // Most recent first
    });

    const result = await dynamoDbClient.send(command);
    return (result.Items || []) as SessionItem[];
  }

  /**
   * Delete session
   */
  async delete(sessionId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: {
        PK: `SESSION#${sessionId}`,
        SK: `SESSION#${sessionId}`,
      },
    });

    await dynamoDbClient.send(command);
  }
}

export const sessionDynamoRepository = new SessionDynamoRepository();
