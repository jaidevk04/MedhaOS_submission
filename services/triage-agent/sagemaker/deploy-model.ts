/**
 * AWS SageMaker Model Deployment Script
 * Deploys trained urgency scoring model to SageMaker endpoint
 */

import { 
  SageMakerClient, 
  CreateModelCommand, 
  CreateEndpointConfigCommand,
  CreateEndpointCommand,
  DescribeEndpointCommand,
  UpdateEndpointCommand,
  DeleteEndpointCommand,
  DeleteEndpointConfigCommand,
  DeleteModelCommand
} from '@aws-sdk/client-sagemaker';

export interface SageMakerConfig {
  modelName: string;
  endpointName: string;
  instanceType: string;
  instanceCount: number;
  s3ModelPath: string;
  roleArn: string;
  region?: string;
}

export class SageMakerDeployment {
  private config: SageMakerConfig;
  private client: SageMakerClient;
  
  constructor(config: SageMakerConfig) {
    this.config = config;
    this.client = new SageMakerClient({ 
      region: config.region || process.env.AWS_REGION || 'ap-south-1' 
    });
  }
  
  /**
   * Deploy model to SageMaker endpoint
   */
  async deploy(): Promise<void> {
    console.log('=== Deploying Model to AWS SageMaker ===\n');
    
    // Step 1: Create model
    console.log('Step 1: Creating SageMaker model...');
    await this.createModel();
    
    // Step 2: Create endpoint configuration
    console.log('Step 2: Creating endpoint configuration...');
    await this.createEndpointConfig();
    
    // Step 3: Create endpoint
    console.log('Step 3: Creating endpoint...');
    await this.createEndpoint();
    
    // Step 4: Wait for endpoint to be in service
    console.log('Step 4: Waiting for endpoint to be ready...');
    await this.waitForEndpoint();
    
    console.log('\n=== Deployment Complete ===');
    console.log(`Endpoint: ${this.config.endpointName}`);
    console.log('Model is ready to serve predictions');
  }
  
  /**
   * Create SageMaker model
   */
  private async createModel(): Promise<void> {
    try {
      const command = new CreateModelCommand({
        ModelName: this.config.modelName,
        PrimaryContainer: {
          Image: '683313688378.dkr.ecr.ap-south-1.amazonaws.com/sagemaker-xgboost:1.5-1',
          ModelDataUrl: this.config.s3ModelPath,
          Environment: {
            'SAGEMAKER_PROGRAM': 'inference.py',
            'SAGEMAKER_SUBMIT_DIRECTORY': this.config.s3ModelPath,
          },
        },
        ExecutionRoleArn: this.config.roleArn,
        Tags: [
          { Key: 'Project', Value: 'MedhaOS' },
          { Key: 'Model', Value: 'UrgencyScoring' },
          { Key: 'Version', Value: '1.0.0' },
        ],
      });
      
      await this.client.send(command);
      console.log(`  ✓ Model created: ${this.config.modelName}`);
      console.log(`  Model data: ${this.config.s3ModelPath}`);
    } catch (error: any) {
      if (error.name === 'ValidationException' && error.message.includes('already exists')) {
        console.log(`  ℹ Model ${this.config.modelName} already exists, skipping creation`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Create endpoint configuration
   */
  private async createEndpointConfig(): Promise<void> {
    try {
      const configName = `${this.config.endpointName}-config`;
      
      const command = new CreateEndpointConfigCommand({
        EndpointConfigName: configName,
        ProductionVariants: [{
          VariantName: 'AllTraffic',
          ModelName: this.config.modelName,
          InstanceType: this.config.instanceType,
          InitialInstanceCount: this.config.instanceCount,
          InitialVariantWeight: 1,
        }],
        Tags: [
          { Key: 'Project', Value: 'MedhaOS' },
          { Key: 'Model', Value: 'UrgencyScoring' },
        ],
      });
      
      await this.client.send(command);
      console.log(`  ✓ Endpoint config created: ${configName}`);
      console.log(`  Instance type: ${this.config.instanceType}`);
      console.log(`  Instance count: ${this.config.instanceCount}`);
    } catch (error: any) {
      if (error.name === 'ValidationException' && error.message.includes('already exists')) {
        console.log(`  ℹ Endpoint config already exists, skipping creation`);
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Create endpoint
   */
  private async createEndpoint(): Promise<void> {
    try {
      const command = new CreateEndpointCommand({
        EndpointName: this.config.endpointName,
        EndpointConfigName: `${this.config.endpointName}-config`,
        Tags: [
          { Key: 'Project', Value: 'MedhaOS' },
          { Key: 'Model', Value: 'UrgencyScoring' },
        ],
      });
      
      await this.client.send(command);
      console.log(`  ✓ Endpoint created: ${this.config.endpointName}`);
    } catch (error: any) {
      if (error.name === 'ValidationException' && error.message.includes('already exists')) {
        console.log(`  ℹ Endpoint ${this.config.endpointName} already exists`);
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Wait for endpoint to be in service
   */
  private async waitForEndpoint(): Promise<void> {
    let status = 'Creating';
    let attempts = 0;
    const maxAttempts = 60; // 30 minutes max (30s intervals)
    
    console.log('  Waiting for endpoint to be ready...');
    
    while (status === 'Creating' || status === 'Updating') {
      if (attempts >= maxAttempts) {
        throw new Error('Endpoint creation timeout after 30 minutes');
      }
      
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s
      
      const command = new DescribeEndpointCommand({
        EndpointName: this.config.endpointName,
      });
      
      const response = await this.client.send(command);
      status = response.EndpointStatus || 'Unknown';
      
      console.log(`  Status: ${status} (${attempts + 1}/${maxAttempts})`);
      attempts++;
    }
    
    if (status !== 'InService') {
      throw new Error(`Endpoint creation failed with status: ${status}`);
    }
    
    console.log('  ✓ Endpoint is InService');
  }
  
  /**
   * Update existing endpoint with new model
   */
  async update(newModelName: string): Promise<void> {
    console.log('=== Updating SageMaker Endpoint ===\n');
    
    // Create new endpoint config with timestamp
    const newConfigName = `${this.config.endpointName}-config-${Date.now()}`;
    
    console.log(`Step 1: Creating new endpoint config: ${newConfigName}`);
    const createConfigCommand = new CreateEndpointConfigCommand({
      EndpointConfigName: newConfigName,
      ProductionVariants: [{
        VariantName: 'AllTraffic',
        ModelName: newModelName,
        InstanceType: this.config.instanceType,
        InitialInstanceCount: this.config.instanceCount,
        InitialVariantWeight: 1,
      }],
    });
    
    await this.client.send(createConfigCommand);
    console.log(`  ✓ New config created`);
    
    console.log(`\nStep 2: Updating endpoint: ${this.config.endpointName}`);
    const updateCommand = new UpdateEndpointCommand({
      EndpointName: this.config.endpointName,
      EndpointConfigName: newConfigName,
    });
    
    await this.client.send(updateCommand);
    console.log(`  ✓ Update initiated`);
    
    console.log('\nStep 3: Waiting for update to complete...');
    await this.waitForEndpoint();
    
    console.log('\n=== Update Complete ===');
  }
  
  /**
   * Delete endpoint and associated resources
   */
  async delete(): Promise<void> {
    console.log('=== Deleting SageMaker Resources ===\n');
    
    try {
      // Delete endpoint
      console.log(`Step 1: Deleting endpoint: ${this.config.endpointName}`);
      const deleteEndpointCommand = new DeleteEndpointCommand({
        EndpointName: this.config.endpointName,
      });
      await this.client.send(deleteEndpointCommand);
      console.log('  ✓ Endpoint deleted');
      
      // Delete endpoint config
      console.log(`\nStep 2: Deleting endpoint config: ${this.config.endpointName}-config`);
      const deleteConfigCommand = new DeleteEndpointConfigCommand({
        EndpointConfigName: `${this.config.endpointName}-config`,
      });
      await this.client.send(deleteConfigCommand);
      console.log('  ✓ Endpoint config deleted');
      
      // Delete model
      console.log(`\nStep 3: Deleting model: ${this.config.modelName}`);
      const deleteModelCommand = new DeleteModelCommand({
        ModelName: this.config.modelName,
      });
      await this.client.send(deleteModelCommand);
      console.log('  ✓ Model deleted');
      
      console.log('\n=== Deletion Complete ===');
    } catch (error: any) {
      console.error('Error during deletion:', error.message);
      throw error;
    }
  }
}

// Example usage
async function main() {
  const config: SageMakerConfig = {
    modelName: 'urgency-scoring-model-v1',
    endpointName: 'urgency-scoring-endpoint',
    instanceType: 'ml.t2.medium', // Use ml.m5.large for production
    instanceCount: 2, // For high availability
    s3ModelPath: 's3://medhaos-models/urgency-scoring/model.tar.gz',
    roleArn: 'arn:aws:iam::ACCOUNT_ID:role/SageMakerExecutionRole',
  };
  
  const deployment = new SageMakerDeployment(config);
  await deployment.deploy();
}

// Uncomment to run:
// main().catch(console.error);
