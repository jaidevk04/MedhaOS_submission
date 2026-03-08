import { GreengrassService } from '../src/services/greengrass.service';
import { ModelDeploymentService } from '../src/services/model-deployment.service';
import { logger } from '../src/utils/logger';
import { config } from '../src/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to deploy models and configuration to edge devices via Greengrass
 */
async function deployToGreengrass() {
  try {
    logger.info('Starting Greengrass deployment...');

    // Load device configuration
    const configPath = path.join(__dirname, '../config/device-config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('Device not provisioned. Run npm run provision:device first.');
    }

    const deviceConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    logger.info(`Deploying to device: ${deviceConfig.deviceId}`);

    const greengrassService = new GreengrassService();
    const modelDeploymentService = new ModelDeploymentService();

    // Step 1: Deploy models to S3 (for Greengrass to download)
    logger.info('Step 1: Deploying models to S3...');
    const models = [
      {
        modelId: 'triage-model-v1',
        modelName: 'Triage Urgency Scoring',
        modelType: 'triage' as const,
        localPath: config.models.triageModelPath,
      },
      {
        modelId: 'documentation-model-v1',
        modelName: 'Clinical Documentation',
        modelType: 'documentation' as const,
        localPath: config.models.documentationModelPath,
      },
    ];

    for (const model of models) {
      logger.info(`Deploying model: ${model.modelName}`);
      await modelDeploymentService.deployModelToS3(model.modelId, model.localPath);
    }

    // Step 2: Create Greengrass deployment
    logger.info('Step 2: Creating Greengrass deployment...');
    const groupId = deviceConfig.greengrassGroupId;
    
    // Get the latest group version
    const groupVersionId = await getLatestGroupVersion(greengrassService, groupId);
    
    const deployment = await greengrassService.deployToEdge(groupId, groupVersionId);
    logger.info(`Deployment created: ${deployment.deploymentId}`);

    // Step 3: Monitor deployment status
    logger.info('Step 3: Monitoring deployment status...');
    let status = 'InProgress';
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals

    while (status === 'InProgress' && attempts < maxAttempts) {
      await sleep(10000); // Wait 10 seconds
      status = await greengrassService.getDeploymentStatus(groupId, deployment.deploymentId);
      logger.info(`Deployment status: ${status}`);
      attempts++;
    }

    if (status === 'Success') {
      logger.info('\n=== Deployment Successful ===');
      logger.info(`Device: ${deviceConfig.deviceId}`);
      logger.info(`Deployment ID: ${deployment.deploymentId}`);
      logger.info('Models deployed:');
      models.forEach((model) => {
        logger.info(`  - ${model.modelName} (${model.modelType})`);
      });
    } else {
      logger.error(`Deployment failed with status: ${status}`);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    logger.error('Greengrass deployment failed:', error);
    process.exit(1);
  }
}

async function getLatestGroupVersion(
  greengrassService: GreengrassService,
  groupId: string
): Promise<string> {
  // This is a placeholder - in production, you would fetch the actual latest version
  // For now, we'll return a default version ID
  return 'latest-version-id';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the deployment script
deployToGreengrass();
