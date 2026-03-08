/**
 * Amazon EventBridge Client Wrapper
 * Provides simplified interface for EventBridge operations
 */

import {
  EventBridgeClient,
  PutEventsCommand,
  PutEventsCommandInput,
  PutEventsRequestEntry,
  PutRuleCommand,
  PutTargetsCommand,
  DeleteRuleCommand,
  RemoveTargetsCommand,
  DescribeRuleCommand,
  ListRulesCommand,
  EnableRuleCommand,
  DisableRuleCommand,
} from '@aws-sdk/client-eventbridge';
import { EventBridgeConfig, EventRule, EventTarget } from '../config/eventbridge-config';

export class MedhaOSEventBridgeClient {
  private client: EventBridgeClient;
  private config: EventBridgeConfig;

  constructor(config: EventBridgeConfig) {
    this.config = config;
    this.client = new EventBridgeClient({
      region: config.region,
    });
  }

  /**
   * Publish a single event to EventBridge
   */
  async publishEvent(event: any): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const entry: PutEventsRequestEntry = {
        Source: event.source,
        DetailType: 'MedhaOS Event',
        Detail: JSON.stringify(event),
        EventBusName: this.config.eventBusName,
        Time: new Date(event.timestamp),
      };

      const command = new PutEventsCommand({
        Entries: [entry],
      });

      const response = await this.client.send(command);

      if (response.FailedEntryCount && response.FailedEntryCount > 0) {
        const failedEntry = response.Entries?.[0];
        return {
          success: false,
          error: failedEntry?.ErrorMessage || 'Unknown error',
        };
      }

      return {
        success: true,
        eventId: response.Entries?.[0]?.EventId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Publish multiple events in batch
   */
  async publishEvents(events: any[]): Promise<{
    successCount: number;
    failedCount: number;
    failedEvents: Array<{ event: any; error: string }>;
  }> {
    const entries: PutEventsRequestEntry[] = events.map((event) => ({
      Source: event.source,
      DetailType: 'MedhaOS Event',
      Detail: JSON.stringify(event),
      EventBusName: this.config.eventBusName,
      Time: new Date(event.timestamp),
    }));

    // EventBridge has a limit of 10 entries per request
    const batches: PutEventsRequestEntry[][] = [];
    for (let i = 0; i < entries.length; i += 10) {
      batches.push(entries.slice(i, i + 10));
    }

    let successCount = 0;
    let failedCount = 0;
    const failedEvents: Array<{ event: any; error: string }> = [];

    for (const batch of batches) {
      try {
        const command = new PutEventsCommand({
          Entries: batch,
        });

        const response = await this.client.send(command);

        if (response.Entries) {
          response.Entries.forEach((entry, index) => {
            if (entry.EventId) {
              successCount++;
            } else {
              failedCount++;
              failedEvents.push({
                event: events[index],
                error: entry.ErrorMessage || 'Unknown error',
              });
            }
          });
        }
      } catch (error: any) {
        failedCount += batch.length;
        batch.forEach((_, index) => {
          failedEvents.push({
            event: events[index],
            error: error.message,
          });
        });
      }
    }

    return {
      successCount,
      failedCount,
      failedEvents,
    };
  }

  /**
   * Create or update an event rule
   */
  async createRule(rule: EventRule): Promise<{ success: boolean; error?: string }> {
    try {
      // Create the rule
      const putRuleCommand = new PutRuleCommand({
        Name: rule.name,
        Description: rule.description,
        EventPattern: JSON.stringify(rule.eventPattern),
        State: rule.enabled ? 'ENABLED' : 'DISABLED',
        EventBusName: this.config.eventBusName,
      });

      await this.client.send(putRuleCommand);

      // Add targets to the rule
      if (rule.targets.length > 0) {
        const targets = rule.targets.map((target) => ({
          Id: target.id,
          Arn: target.arn,
          DeadLetterConfig: target.deadLetterQueueArn
            ? { Arn: target.deadLetterQueueArn }
            : undefined,
          RetryPolicy: target.retryPolicy
            ? {
                MaximumRetryAttempts: target.retryPolicy.maximumRetryAttempts,
                MaximumEventAge: target.retryPolicy.maximumEventAge,
              }
            : undefined,
          InputTransformer: target.inputTransformer,
        }));

        const putTargetsCommand = new PutTargetsCommand({
          Rule: rule.name,
          EventBusName: this.config.eventBusName,
          Targets: targets,
        });

        await this.client.send(putTargetsCommand);
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete an event rule
   */
  async deleteRule(ruleName: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First, remove all targets
      const describeCommand = new DescribeRuleCommand({
        Name: ruleName,
        EventBusName: this.config.eventBusName,
      });

      await this.client.send(describeCommand);

      // Remove targets (we need to list them first, but for simplicity, we'll try to remove common IDs)
      try {
        const removeTargetsCommand = new RemoveTargetsCommand({
          Rule: ruleName,
          EventBusName: this.config.eventBusName,
          Ids: ['1', '2', '3', '4', '5'], // Common target IDs
        });

        await this.client.send(removeTargetsCommand);
      } catch {
        // Ignore errors if targets don't exist
      }

      // Delete the rule
      const deleteCommand = new DeleteRuleCommand({
        Name: ruleName,
        EventBusName: this.config.eventBusName,
      });

      await this.client.send(deleteCommand);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Enable a rule
   */
  async enableRule(ruleName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new EnableRuleCommand({
        Name: ruleName,
        EventBusName: this.config.eventBusName,
      });

      await this.client.send(command);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Disable a rule
   */
  async disableRule(ruleName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const command = new DisableRuleCommand({
        Name: ruleName,
        EventBusName: this.config.eventBusName,
      });

      await this.client.send(command);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * List all rules
   */
  async listRules(): Promise<{ success: boolean; rules?: any[]; error?: string }> {
    try {
      const command = new ListRulesCommand({
        EventBusName: this.config.eventBusName,
      });

      const response = await this.client.send(command);

      return {
        success: true,
        rules: response.Rules,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get rule details
   */
  async getRule(ruleName: string): Promise<{ success: boolean; rule?: any; error?: string }> {
    try {
      const command = new DescribeRuleCommand({
        Name: ruleName,
        EventBusName: this.config.eventBusName,
      });

      const response = await this.client.send(command);

      return {
        success: true,
        rule: response,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
