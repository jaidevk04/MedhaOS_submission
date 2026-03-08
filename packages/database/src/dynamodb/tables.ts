/**
 * DynamoDB Table Definitions
 * 
 * Defines table schemas and access patterns for DynamoDB tables
 */

import {
  CreateTableCommand,
  DescribeTableCommand,
  UpdateTimeToLiveCommand,
} from '@aws-sdk/client-dynamodb';
import { dynamoDbClient, DYNAMODB_TABLES } from './client';

/**
 * Agent Tasks Table Schema
 * 
 * Single-table design with the following access patterns:
 * 1. Get task by ID (PK: TASK#{taskId})
 * 2. Query tasks by agent name (GSI1: agentName, createdAt)
 * 3. Query tasks by status (GSI2: status, createdAt)
 * 4. Query tasks by patient (GSI3: patientId, createdAt)
 */
export const AGENT_TASKS_TABLE_SCHEMA = {
  TableName: DYNAMODB_TABLES.AGENT_TASKS,
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' }, // Partition key: TASK#{taskId}
    { AttributeName: 'SK', KeyType: 'RANGE' }, // Sort key: TASK#{timestamp}
  ],
  AttributeDefinitions: [
    { AttributeName: 'PK', AttributeType: 'S' },
    { AttributeName: 'SK', AttributeType: 'S' },
    { AttributeName: 'GSI1PK', AttributeType: 'S' }, // agentName
    { AttributeName: 'GSI1SK', AttributeType: 'S' }, // createdAt
    { AttributeName: 'GSI2PK', AttributeType: 'S' }, // status
    { AttributeName: 'GSI2SK', AttributeType: 'S' }, // createdAt
    { AttributeName: 'GSI3PK', AttributeType: 'S' }, // patientId
    { AttributeName: 'GSI3SK', AttributeType: 'S' }, // createdAt
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GSI1',
      KeySchema: [
        { AttributeName: 'GSI1PK', KeyType: 'HASH' },
        { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      IndexName: 'GSI2',
      KeySchema: [
        { AttributeName: 'GSI2PK', KeyType: 'HASH' },
        { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      IndexName: 'GSI3',
      KeySchema: [
        { AttributeName: 'GSI3PK', KeyType: 'HASH' },
        { AttributeName: 'GSI3SK', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ],
  BillingMode: 'PROVISIONED',
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10,
  },
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: 'NEW_AND_OLD_IMAGES',
  },
  Tags: [
    { Key: 'Environment', Value: process.env.NODE_ENV || 'development' },
    { Key: 'Application', Value: 'MedhaOS' },
    { Key: 'Purpose', Value: 'AgentTasks' },
  ],
};

/**
 * Session Data Table Schema
 * 
 * Access patterns:
 * 1. Get session by ID (PK: SESSION#{sessionId})
 * 2. Query sessions by user (GSI1: userId, lastAccessedAt)
 * 3. Query active sessions (GSI2: status, lastAccessedAt)
 */
export const SESSION_DATA_TABLE_SCHEMA = {
  TableName: DYNAMODB_TABLES.SESSION_DATA,
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' }, // Partition key: SESSION#{sessionId}
    { AttributeName: 'SK', KeyType: 'RANGE' }, // Sort key: SESSION#{timestamp}
  ],
  AttributeDefinitions: [
    { AttributeName: 'PK', AttributeType: 'S' },
    { AttributeName: 'SK', AttributeType: 'S' },
    { AttributeName: 'GSI1PK', AttributeType: 'S' }, // userId
    { AttributeName: 'GSI1SK', AttributeType: 'N' }, // lastAccessedAt (timestamp)
    { AttributeName: 'GSI2PK', AttributeType: 'S' }, // status
    { AttributeName: 'GSI2SK', AttributeType: 'N' }, // lastAccessedAt (timestamp)
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GSI1',
      KeySchema: [
        { AttributeName: 'GSI1PK', KeyType: 'HASH' },
        { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      IndexName: 'GSI2',
      KeySchema: [
        { AttributeName: 'GSI2PK', KeyType: 'HASH' },
        { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ],
  BillingMode: 'PROVISIONED',
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10,
  },
  TimeToLiveSpecification: {
    Enabled: true,
    AttributeName: 'ttl',
  },
  Tags: [
    { Key: 'Environment', Value: process.env.NODE_ENV || 'development' },
    { Key: 'Application', Value: 'MedhaOS' },
    { Key: 'Purpose', Value: 'SessionData' },
  ],
};

/**
 * Queue Management Table Schema
 * 
 * Access patterns:
 * 1. Get queue item by ID (PK: QUEUE#{queueId}, SK: ITEM#{itemId})
 * 2. Query queue items by facility (GSI1: facilityId, priority)
 * 3. Query queue items by status (GSI2: status, createdAt)
 * 4. Query queue items by urgency (GSI3: urgencyScore, createdAt)
 */
export const QUEUE_MANAGEMENT_TABLE_SCHEMA = {
  TableName: DYNAMODB_TABLES.QUEUE_MANAGEMENT,
  KeySchema: [
    { AttributeName: 'PK', KeyType: 'HASH' }, // Partition key: QUEUE#{facilityId}#{queueType}
    { AttributeName: 'SK', KeyType: 'RANGE' }, // Sort key: ITEM#{priority}#{timestamp}
  ],
  AttributeDefinitions: [
    { AttributeName: 'PK', AttributeType: 'S' },
    { AttributeName: 'SK', AttributeType: 'S' },
    { AttributeName: 'GSI1PK', AttributeType: 'S' }, // facilityId
    { AttributeName: 'GSI1SK', AttributeType: 'N' }, // urgencyScore
    { AttributeName: 'GSI2PK', AttributeType: 'S' }, // status
    { AttributeName: 'GSI2SK', AttributeType: 'S' }, // createdAt
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: 'GSI1',
      KeySchema: [
        { AttributeName: 'GSI1PK', KeyType: 'HASH' },
        { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
    {
      IndexName: 'GSI2',
      KeySchema: [
        { AttributeName: 'GSI2PK', KeyType: 'HASH' },
        { AttributeName: 'GSI2SK', KeyType: 'RANGE' },
      ],
      Projection: { ProjectionType: 'ALL' },
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    },
  ],
  BillingMode: 'PROVISIONED',
  ProvisionedThroughput: {
    ReadCapacityUnits: 10,
    WriteCapacityUnits: 10,
  },
  StreamSpecification: {
    StreamEnabled: true,
    StreamViewType: 'NEW_AND_OLD_IMAGES',
  },
  Tags: [
    { Key: 'Environment', Value: process.env.NODE_ENV || 'development' },
    { Key: 'Application', Value: 'MedhaOS' },
    { Key: 'Purpose', Value: 'QueueManagement' },
  ],
};

/**
 * Create all DynamoDB tables
 */
export async function createTables(): Promise<void> {
  const tables = [
    AGENT_TASKS_TABLE_SCHEMA,
    SESSION_DATA_TABLE_SCHEMA,
    QUEUE_MANAGEMENT_TABLE_SCHEMA,
  ];

  for (const tableSchema of tables) {
    try {
      // Check if table exists
      try {
        await dynamoDbClient.send(
          new DescribeTableCommand({ TableName: tableSchema.TableName })
        );
        console.log(`✅ Table ${tableSchema.TableName} already exists`);
        continue;
      } catch (error: any) {
        if (error.name !== 'ResourceNotFoundException') {
          throw error;
        }
      }

      // Create table
      await dynamoDbClient.send(new CreateTableCommand(tableSchema as any));
      console.log(`✅ Created table: ${tableSchema.TableName}`);

      // Enable TTL for session data table
      if (tableSchema.TableName === DYNAMODB_TABLES.SESSION_DATA) {
        await dynamoDbClient.send(
          new UpdateTimeToLiveCommand({
            TableName: tableSchema.TableName,
            TimeToLiveSpecification: {
              Enabled: true,
              AttributeName: 'ttl',
            },
          })
        );
        console.log(`✅ Enabled TTL for ${tableSchema.TableName}`);
      }
    } catch (error) {
      console.error(`❌ Error creating table ${tableSchema.TableName}:`, error);
      throw error;
    }
  }
}

/**
 * Configure auto-scaling for tables
 */
export async function configureAutoScaling(): Promise<void> {
  // Note: Auto-scaling configuration requires AWS Application Auto Scaling
  // This is typically done via AWS CLI, CloudFormation, or Terraform
  // For local development with LocalStack, auto-scaling is not needed
  
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Auto-scaling should be configured via Infrastructure as Code (Terraform)');
  }
}

/**
 * Configure backup policies
 */
export async function configureBackups(): Promise<void> {
  // Note: Backup configuration requires AWS Backup service
  // This is typically done via AWS CLI, CloudFormation, or Terraform
  
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Backup policies should be configured via Infrastructure as Code (Terraform)');
  }
}
