/**
 * DynamoDB Client Configuration
 * 
 * Provides DynamoDB client for real-time operational data
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

// Create DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  ...(isLocal && {
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  }),
});

// Create DynamoDB Document client for easier data manipulation
export const dynamoDbClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

/**
 * Table names
 */
export const DYNAMODB_TABLES = {
  AGENT_TASKS: process.env.DYNAMODB_TABLE_AGENT_TASKS || 'medhaos-agent-tasks',
  SESSION_DATA: process.env.DYNAMODB_TABLE_SESSION_DATA || 'medhaos-session-data',
  QUEUE_MANAGEMENT: process.env.DYNAMODB_TABLE_QUEUE_MANAGEMENT || 'medhaos-queue-management',
} as const;

/**
 * Health check for DynamoDB connection
 */
export async function checkDynamoDBHealth(): Promise<boolean> {
  try {
    await dynamoDbClient.send({
      name: 'ListTablesCommand',
    } as any);
    return true;
  } catch (error) {
    console.error('DynamoDB health check failed:', error);
    return false;
  }
}

export default dynamoDbClient;
