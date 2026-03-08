import AWS from 'aws-sdk';
import { config } from '../config';
import { GreengrassConfig, GreengrassDeployment, EdgeDevice } from '../types';
import { logger } from '../utils/logger';

export class GreengrassService {
  private greengrass: AWS.Greengrass;
  private iot: AWS.Iot;
  private iotData: AWS.IotData;

  constructor() {
    AWS.config.update({ region: config.aws.region });
    this.greengrass = new AWS.Greengrass();
    this.iot = new AWS.Iot();
    this.iotData = new AWS.IotData({ endpoint: config.aws.iotEndpoint });
  }

  /**
   * Create a new Greengrass group for edge deployment
   */
  async createGreengrassGroup(groupName: string): Promise<string> {
    try {
      logger.info(`Creating Greengrass group: ${groupName}`);

      const response = await this.greengrass
        .createGroup({
          Name: groupName,
          InitialVersion: {
            CoreDefinitionVersionArn: '',
            FunctionDefinitionVersionArn: '',
            SubscriptionDefinitionVersionArn: '',
          },
        })
        .promise();

      logger.info(`Greengrass group created: ${response.Id}`);
      return response.Id!;
    } catch (error) {
      logger.error('Failed to create Greengrass group:', error);
      throw error;
    }
  }

  /**
   * Create and register an IoT Thing for edge device
   */
  async provisionEdgeDevice(deviceId: string): Promise<EdgeDevice> {
    try {
      logger.info(`Provisioning edge device: ${deviceId}`);

      // Create IoT Thing
      const thing = await this.iot
        .createThing({
          thingName: deviceId,
          attributePayload: {
            attributes: {
              deviceType: config.device.type,
              facilityId: config.device.facilityId,
            },
          },
        })
        .promise();

      // Create certificate
      const cert = await this.iot.createKeysAndCertificate({ setAsActive: true }).promise();

      // Attach certificate to thing
      await this.iot
        .attachThingPrincipal({
          thingName: deviceId,
          principal: cert.certificateArn!,
        })
        .promise();

      // Create policy
      const policyDocument = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['iot:*', 'greengrass:*'],
            Resource: '*',
          },
        ],
      };

      await this.iot
        .createPolicy({
          policyName: `${deviceId}-policy`,
          policyDocument: JSON.stringify(policyDocument),
        })
        .promise();

      // Attach policy to certificate
      await this.iot
        .attachPolicy({
          policyName: `${deviceId}-policy`,
          target: cert.certificateArn!,
        })
        .promise();

      logger.info(`Edge device provisioned: ${deviceId}`);

      return {
        deviceId,
        facilityId: config.device.facilityId,
        deviceType: config.device.type as any,
        status: 'offline',
        lastSyncTimestamp: new Date(),
        softwareVersion: '1.0.0',
        capabilities: {
          triageSupport: true,
          documentationSupport: true,
          offlineMode: true,
          modelVersions: {},
        },
      };
    } catch (error) {
      logger.error('Failed to provision edge device:', error);
      throw error;
    }
  }

  /**
   * Deploy Greengrass configuration to edge device
   */
  async deployToEdge(groupId: string, groupVersionId: string): Promise<GreengrassDeployment> {
    try {
      logger.info(`Deploying Greengrass group ${groupId} version ${groupVersionId}`);

      const response = await this.greengrass
        .createDeployment({
          GroupId: groupId,
          GroupVersionId: groupVersionId,
          DeploymentType: 'NewDeployment',
        })
        .promise();

      const deployment: GreengrassDeployment = {
        deploymentId: response.DeploymentId!,
        groupId,
        deploymentType: 'NewDeployment',
        status: 'InProgress',
        createdAt: new Date(),
      };

      logger.info(`Deployment created: ${deployment.deploymentId}`);
      return deployment;
    } catch (error) {
      logger.error('Failed to deploy to edge:', error);
      throw error;
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(groupId: string, deploymentId: string): Promise<string> {
    try {
      const response = await this.greengrass
        .getDeploymentStatus({
          GroupId: groupId,
          DeploymentId: deploymentId,
        })
        .promise();

      return response.DeploymentStatus!;
    } catch (error) {
      logger.error('Failed to get deployment status:', error);
      throw error;
    }
  }

  /**
   * Create Greengrass core definition
   */
  async createCoreDefinition(coreName: string, certificateArn: string): Promise<string> {
    try {
      const response = await this.greengrass
        .createCoreDefinition({
          Name: `${coreName}-core-definition`,
          InitialVersion: {
            Cores: [
              {
                Id: coreName,
                ThingArn: `arn:aws:iot:${config.aws.region}:${await this.getAccountId()}:thing/${coreName}`,
                CertificateArn: certificateArn,
                SyncShadow: true,
              },
            ],
          },
        })
        .promise();

      return response.Id!;
    } catch (error) {
      logger.error('Failed to create core definition:', error);
      throw error;
    }
  }

  /**
   * Create function definition for Lambda@Edge
   */
  async createFunctionDefinition(functionName: string, functionArn: string): Promise<string> {
    try {
      const response = await this.greengrass
        .createFunctionDefinition({
          Name: `${functionName}-function-definition`,
          InitialVersion: {
            Functions: [
              {
                Id: functionName,
                FunctionArn: functionArn,
                FunctionConfiguration: {
                  MemorySize: 128000, // 128 MB
                  Timeout: 30,
                  Pinned: true,
                  Environment: {
                    Variables: {
                      MODEL_PATH: config.models.storagePath,
                    },
                  },
                },
              },
            ],
          },
        })
        .promise();

      return response.Id!;
    } catch (error) {
      logger.error('Failed to create function definition:', error);
      throw error;
    }
  }

  /**
   * Publish message to edge device via IoT Core
   */
  async publishToDevice(deviceId: string, topic: string, message: any): Promise<void> {
    try {
      await this.iotData
        .publish({
          topic: `medhaos/edge/${deviceId}/${topic}`,
          payload: JSON.stringify(message),
          qos: 1,
        })
        .promise();

      logger.info(`Message published to device ${deviceId} on topic ${topic}`);
    } catch (error) {
      logger.error('Failed to publish message to device:', error);
      throw error;
    }
  }

  /**
   * Get device shadow (current state)
   */
  async getDeviceShadow(deviceId: string): Promise<any> {
    try {
      const response = await this.iotData
        .getThingShadow({
          thingName: deviceId,
        })
        .promise();

      return JSON.parse(response.payload as string);
    } catch (error) {
      logger.error('Failed to get device shadow:', error);
      throw error;
    }
  }

  /**
   * Update device shadow (desired state)
   */
  async updateDeviceShadow(deviceId: string, desiredState: any): Promise<void> {
    try {
      await this.iotData
        .updateThingShadow({
          thingName: deviceId,
          payload: JSON.stringify({
            state: {
              desired: desiredState,
            },
          }),
        })
        .promise();

      logger.info(`Device shadow updated for ${deviceId}`);
    } catch (error) {
      logger.error('Failed to update device shadow:', error);
      throw error;
    }
  }

  /**
   * Helper to get AWS account ID
   */
  private async getAccountId(): Promise<string> {
    const sts = new AWS.STS();
    const identity = await sts.getCallerIdentity().promise();
    return identity.Account!;
  }
}
