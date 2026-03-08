import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { PatientContext, WorkflowState } from '../types';
import { config } from '../config';

/**
 * Context Manager - Manages patient context and workflow state in DynamoDB
 */
export class ContextManager {
  private docClient: DynamoDBDocumentClient;
  private contextTableName = 'medhaos-patient-context';
  private workflowTableName = 'medhaos-workflows';

  constructor() {
    const client = new DynamoDBClient({
      region: config.dynamodb.region,
      endpoint: config.dynamodb.endpoint,
    });

    this.docClient = DynamoDBDocumentClient.from(client);
  }

  /**
   * Get patient context
   */
  async getPatientContext(patientId: string): Promise<PatientContext | null> {
    try {
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.contextTableName,
          Key: { patientId },
        })
      );

      if (!result.Item) {
        return null;
      }

      return result.Item as PatientContext;
    } catch (error) {
      console.error('Error getting patient context:', error);
      return null;
    }
  }

  /**
   * Create or update patient context
   */
  async updatePatientContext(
    patientId: string,
    state: string,
    event: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const existingContext = await this.getPatientContext(patientId);

      if (existingContext) {
        // Update existing context
        await this.docClient.send(
          new UpdateCommand({
            TableName: this.contextTableName,
            Key: { patientId },
            UpdateExpression:
              'SET currentState = :state, history = list_append(if_not_exists(history, :empty_list), :new_event), #metadata = :metadata',
            ExpressionAttributeNames: {
              '#metadata': 'metadata',
            },
            ExpressionAttributeValues: {
              ':state': state,
              ':new_event': [
                {
                  timestamp: new Date().toISOString(),
                  event,
                  data,
                },
              ],
              ':empty_list': [],
              ':metadata': {
                ...existingContext.metadata,
                lastUpdated: new Date().toISOString(),
              },
            },
          })
        );
      } else {
        // Create new context
        const newContext: PatientContext = {
          patientId,
          currentState: state,
          history: [
            {
              timestamp: new Date(),
              event,
              data,
            },
          ],
          activeWorkflows: [],
          metadata: {
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
          },
        };

        await this.docClient.send(
          new PutCommand({
            TableName: this.contextTableName,
            Item: newContext,
          })
        );
      }
    } catch (error) {
      console.error('Error updating patient context:', error);
      throw error;
    }
  }

  /**
   * Add workflow to patient context
   */
  async addWorkflowToContext(
    patientId: string,
    workflowId: string
  ): Promise<void> {
    try {
      await this.docClient.send(
        new UpdateCommand({
          TableName: this.contextTableName,
          Key: { patientId },
          UpdateExpression:
            'SET activeWorkflows = list_append(if_not_exists(activeWorkflows, :empty_list), :workflow)',
          ExpressionAttributeValues: {
            ':workflow': [workflowId],
            ':empty_list': [],
          },
        })
      );
    } catch (error) {
      console.error('Error adding workflow to context:', error);
      throw error;
    }
  }

  /**
   * Remove workflow from patient context
   */
  async removeWorkflowFromContext(
    patientId: string,
    workflowId: string
  ): Promise<void> {
    try {
      const context = await this.getPatientContext(patientId);
      if (!context) return;

      const updatedWorkflows = context.activeWorkflows.filter(
        (id) => id !== workflowId
      );

      await this.docClient.send(
        new UpdateCommand({
          TableName: this.contextTableName,
          Key: { patientId },
          UpdateExpression: 'SET activeWorkflows = :workflows',
          ExpressionAttributeValues: {
            ':workflows': updatedWorkflows,
          },
        })
      );
    } catch (error) {
      console.error('Error removing workflow from context:', error);
      throw error;
    }
  }

  /**
   * Create workflow state
   */
  async createWorkflow(workflow: WorkflowState): Promise<void> {
    try {
      await this.docClient.send(
        new PutCommand({
          TableName: this.workflowTableName,
          Item: {
            ...workflow,
            createdAt: workflow.createdAt.toISOString(),
            updatedAt: workflow.updatedAt.toISOString(),
          },
        })
      );
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  /**
   * Get workflow state
   */
  async getWorkflow(workflowId: string): Promise<WorkflowState | null> {
    try {
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.workflowTableName,
          Key: { workflowId },
        })
      );

      if (!result.Item) {
        return null;
      }

      const item = result.Item;
      return {
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      } as WorkflowState;
    } catch (error) {
      console.error('Error getting workflow:', error);
      return null;
    }
  }

  /**
   * Update workflow state
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<WorkflowState>
  ): Promise<void> {
    try {
      const updateExpressions: string[] = [];
      const expressionAttributeValues: Record<string, any> = {};
      const expressionAttributeNames: Record<string, string> = {};

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'workflowId') {
          const placeholder = `:${key}`;
          const namePlaceholder = `#${key}`;
          updateExpressions.push(`${namePlaceholder} = ${placeholder}`);
          expressionAttributeValues[placeholder] = value;
          expressionAttributeNames[namePlaceholder] = key;
        }
      });

      // Always update the updatedAt timestamp
      updateExpressions.push('#updatedAt = :updatedAt');
      expressionAttributeValues[':updatedAt'] = new Date().toISOString();
      expressionAttributeNames['#updatedAt'] = 'updatedAt';

      await this.docClient.send(
        new UpdateCommand({
          TableName: this.workflowTableName,
          Key: { workflowId },
          UpdateExpression: `SET ${updateExpressions.join(', ')}`,
          ExpressionAttributeValues: expressionAttributeValues,
          ExpressionAttributeNames: expressionAttributeNames,
        })
      );
    } catch (error) {
      console.error('Error updating workflow:', error);
      throw error;
    }
  }

  /**
   * Get active workflows for patient
   */
  async getActiveWorkflows(patientId: string): Promise<WorkflowState[]> {
    try {
      const context = await this.getPatientContext(patientId);
      if (!context || context.activeWorkflows.length === 0) {
        return [];
      }

      const workflows: WorkflowState[] = [];
      for (const workflowId of context.activeWorkflows) {
        const workflow = await this.getWorkflow(workflowId);
        if (workflow && workflow.status === 'active') {
          workflows.push(workflow);
        }
      }

      return workflows;
    } catch (error) {
      console.error('Error getting active workflows:', error);
      return [];
    }
  }

  /**
   * Get workflow history for event
   */
  async getWorkflowsByEvent(eventId: string): Promise<WorkflowState[]> {
    try {
      const result = await this.docClient.send(
        new QueryCommand({
          TableName: this.workflowTableName,
          IndexName: 'eventId-index',
          KeyConditionExpression: 'eventId = :eventId',
          ExpressionAttributeValues: {
            ':eventId': eventId,
          },
        })
      );

      if (!result.Items || result.Items.length === 0) {
        return [];
      }

      return result.Items.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })) as WorkflowState[];
    } catch (error) {
      console.error('Error getting workflows by event:', error);
      return [];
    }
  }
}
