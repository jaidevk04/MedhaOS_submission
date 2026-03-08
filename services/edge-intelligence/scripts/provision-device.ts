import { GreengrassService } from '../src/services/greengrass.service';
import { logger } from '../src/utils/logger';
import { config } from '../src/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to provision a new edge device with AWS IoT Greengrass
 */
async function provisionDevice() {
  try {
    logger.info('Starting edge device provisioning...');

    const greengrassService = new GreengrassService();
    const deviceId = config.device.id;

    // Step 1: Provision the edge device (create IoT Thing, certificates, policies)
    logger.info(`Step 1: Provisioning device ${deviceId}...`);
    const device = await greengrassService.provisionEdgeDevice(deviceId);
    logger.info('Device provisioned successfully');

    // Step 2: Create Greengrass group
    logger.info('Step 2: Creating Greengrass group...');
    const groupName = `${deviceId}-group`;
    const groupId = await greengrassService.createGreengrassGroup(groupName);
    logger.info(`Greengrass group created: ${groupId}`);

    // Step 3: Save device configuration
    logger.info('Step 3: Saving device configuration...');
    const deviceConfig = {
      deviceId: device.deviceId,
      facilityId: device.facilityId,
      deviceType: device.deviceType,
      greengrassGroupId: groupId,
      provisionedAt: new Date().toISOString(),
    };

    const configPath = path.join(__dirname, '../config/device-config.json');
    fs.writeFileSync(configPath, JSON.stringify(deviceConfig, null, 2));
    logger.info(`Device configuration saved to ${configPath}`);

    // Step 4: Display next steps
    logger.info('\n=== Provisioning Complete ===');
    logger.info(`Device ID: ${device.deviceId}`);
    logger.info(`Greengrass Group ID: ${groupId}`);
    logger.info('\nNext Steps:');
    logger.info('1. Download the certificates from AWS IoT Console');
    logger.info('2. Install AWS IoT Greengrass Core on the edge device');
    logger.info('3. Configure the Greengrass Core with the certificates');
    logger.info('4. Deploy models using: npm run deploy:greengrass');
    logger.info('5. Start the Greengrass Core daemon');

    process.exit(0);
  } catch (error) {
    logger.error('Device provisioning failed:', error);
    process.exit(1);
  }
}

// Run the provisioning script
provisionDevice();
