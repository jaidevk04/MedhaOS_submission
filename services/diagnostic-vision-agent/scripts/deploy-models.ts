/**
 * Script to deploy vision models to AWS SageMaker
 * 
 * This script handles:
 * - Model artifact preparation
 * - SageMaker endpoint creation
 * - Model deployment and configuration
 */

import { 
  SageMakerClient, 
  CreateModelCommand,
  CreateEndpointConfigCommand,
  CreateEndpointCommand,
  DescribeEndpointCommand
} from '@aws-sdk/client-sagemaker';

interface ModelConfig {
  modelName: string;
  endpointName: string;
  modelDataUrl: string;
  instanceType: string;
  instanceCount: number;
  containerImage: string;
}

class ModelDeploymentService {
  private sagemakerClient: SageMakerClient;
  private region: string;
  private roleArn: string;

  constructor(region: string = 'ap-south-1', roleArn: string) {
    this.region = region;
    this.roleArn = roleArn;
    this.sagemakerClient = new SageMakerClient({ region });
  }

  /**
   * Deploy LLaVA model
   */
  async deployLLaVA(): Promise<string> {
    console.log('Deploying LLaVA model...');

    const config: ModelConfig = {
      modelName: 'medhaos-llava-model',
      endpointName: 'medhaos-llava-endpoint',
      modelDataUrl: 's3://medhaos-models/llava/model.tar.gz',
      instanceType: 'ml.g5.2xlarge', // GPU instance for vision models
      instanceCount: 1,
      containerImage: this.getContainerImage('pytorch-inference', '2.0')
    };

    return await this.deployModel(config);
  }

  /**
   * Deploy BiomedCLIP model
   */
  async deployBiomedCLIP(): Promise<string> {
    console.log('Deploying BiomedCLIP model...');

    const config: ModelConfig = {
      modelName: 'medhaos-biomedclip-model',
      endpointName: 'medhaos-biomedclip-endpoint',
      modelDataUrl: 's3://medhaos-models/biomedclip/model.tar.gz',
      instanceType: 'ml.g5.xlarge',
      instanceCount: 1,
      containerImage: this.getContainerImage('pytorch-inference', '2.0')
    };

    return await this.deployModel(config);
  }

  /**
   * Deploy MedSAM model
   */
  async deployMedSAM(): Promise<string> {
    console.log('Deploying MedSAM model...');

    const config: ModelConfig = {
      modelName: 'medhaos-medsam-model',
      endpointName: 'medhaos-medsam-endpoint',
      modelDataUrl: 's3://medhaos-models/medsam/model.tar.gz',
      instanceType: 'ml.g5.xlarge',
      instanceCount: 1,
      containerImage: this.getContainerImage('pytorch-inference', '2.0')
    };

    return await this.deployModel(config);
  }

  /**
   * Deploy a model to SageMaker
   */
  private async deployModel(config: ModelConfig): Promise<string> {
    try {
      // Step 1: Create Model
      console.log(`Creating model: ${config.modelName}`);
      await this.createModel(config);

      // Step 2: Create Endpoint Configuration
      console.log(`Creating endpoint config: ${config.endpointName}-config`);
      await this.createEndpointConfig(config);

      // Step 3: Create Endpoint
      console.log(`Creating endpoint: ${config.endpointName}`);
      await this.createEndpoint(config);

      // Step 4: Wait for endpoint to be in service
      console.log('Waiting for endpoint to be in service...');
      await this.waitForEndpoint(config.endpointName);

      console.log(`✓ Model deployed successfully: ${config.endpointName}`);
      return config.endpointName;
    } catch (error) {
      console.error(`Error deploying model ${config.modelName}:`, error);
      throw error;
    }
  }

  /**
   * Create SageMaker model
   */
  private async createModel(config: ModelConfig): Promise<void> {
    const command = new CreateModelCommand({
      ModelName: config.modelName,
      ExecutionRoleArn: this.roleArn,
      PrimaryContainer: {
        Image: config.containerImage,
        ModelDataUrl: config.modelDataUrl,
        Environment: {
          'SAGEMAKER_PROGRAM': 'inference.py',
          'SAGEMAKER_SUBMIT_DIRECTORY': config.modelDataUrl,
          'SAGEMAKER_CONTAINER_LOG_LEVEL': '20',
          'SAGEMAKER_REGION': this.region
        }
      }
    });

    await this.sagemakerClient.send(command);
  }

  /**
   * Create endpoint configuration
   */
  private async createEndpointConfig(config: ModelConfig): Promise<void> {
    const command = new CreateEndpointConfigCommand({
      EndpointConfigName: `${config.endpointName}-config`,
      ProductionVariants: [
        {
          VariantName: 'AllTraffic',
          ModelName: config.modelName,
          InstanceType: config.instanceType,
          InitialInstanceCount: config.instanceCount,
          InitialVariantWeight: 1.0
        }
      ]
    });

    await this.sagemakerClient.send(command);
  }

  /**
   * Create endpoint
   */
  private async createEndpoint(config: ModelConfig): Promise<void> {
    const command = new CreateEndpointCommand({
      EndpointName: config.endpointName,
      EndpointConfigName: `${config.endpointName}-config`
    });

    await this.sagemakerClient.send(command);
  }

  /**
   * Wait for endpoint to be in service
   */
  private async waitForEndpoint(endpointName: string, maxWaitMinutes: number = 30): Promise<void> {
    const maxAttempts = maxWaitMinutes * 2; // Check every 30 seconds
    let attempts = 0;

    while (attempts < maxAttempts) {
      const command = new DescribeEndpointCommand({ EndpointName: endpointName });
      const response = await this.sagemakerClient.send(command);

      if (response.EndpointStatus === 'InService') {
        return;
      }

      if (response.EndpointStatus === 'Failed') {
        throw new Error(`Endpoint creation failed: ${response.FailureReason}`);
      }

      console.log(`Endpoint status: ${response.EndpointStatus}. Waiting...`);
      await this.sleep(30000); // Wait 30 seconds
      attempts++;
    }

    throw new Error(`Endpoint creation timed out after ${maxWaitMinutes} minutes`);
  }

  /**
   * Get container image URI for SageMaker
   */
  private getContainerImage(framework: string, version: string): string {
    // SageMaker Deep Learning Container images
    const accountId = '763104351884'; // AWS DLC account ID for ap-south-1
    return `${accountId}.dkr.ecr.${this.region}.amazonaws.com/${framework}:${version}-gpu-py310`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main deployment script
async function main() {
  const roleArn = process.env.SAGEMAKER_EXECUTION_ROLE_ARN;
  
  if (!roleArn) {
    console.error('Error: SAGEMAKER_EXECUTION_ROLE_ARN environment variable not set');
    process.exit(1);
  }

  const deployer = new ModelDeploymentService('ap-south-1', roleArn);

  try {
    console.log('Starting model deployment...\n');

    // Deploy all models
    await deployer.deployLLaVA();
    console.log('');
    
    await deployer.deployBiomedCLIP();
    console.log('');
    
    await deployer.deployMedSAM();
    console.log('');

    console.log('✓ All models deployed successfully!');
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { ModelDeploymentService };
