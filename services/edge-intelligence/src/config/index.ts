import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // AWS IoT Greengrass
  aws: {
    region: process.env.AWS_REGION || 'ap-south-1',
    iotEndpoint: process.env.AWS_IOT_ENDPOINT || '',
    greengrassGroupId: process.env.GREENGRASS_GROUP_ID || '',
    greengrassCoreThingName: process.env.GREENGRASS_CORE_THING_NAME || 'MedhaOS-Edge-Core',
  },

  // Edge Device
  device: {
    id: process.env.DEVICE_ID || 'edge-device-001',
    facilityId: process.env.FACILITY_ID || 'facility-001',
    type: process.env.DEVICE_TYPE || 'clinic-terminal',
  },

  // Model Configuration
  models: {
    storagePath: process.env.MODEL_STORAGE_PATH || '/opt/medhaos/models',
    triageModelPath: process.env.TRIAGE_MODEL_PATH || '/opt/medhaos/models/triage-model.onnx',
    documentationModelPath: process.env.DOCUMENTATION_MODEL_PATH || '/opt/medhaos/models/documentation-model.onnx',
  },

  // Sync Configuration
  sync: {
    intervalMs: parseInt(process.env.SYNC_INTERVAL_MS || '300000', 10),
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '100', 10),
    conflictResolutionStrategy: process.env.CONFLICT_RESOLUTION_STRATEGY || 'server-wins',
  },

  // Local Storage
  storage: {
    localDbPath: process.env.LOCAL_DB_PATH || '/opt/medhaos/data/local.db',
    indexedDbName: process.env.INDEXEDDB_NAME || 'medhaos-offline',
    indexedDbVersion: parseInt(process.env.INDEXEDDB_VERSION || '1', 10),
  },

  // Cloud Endpoints
  cloud: {
    apiGatewayUrl: process.env.API_GATEWAY_URL || 'https://api.medhaos.health',
    websocketUrl: process.env.WEBSOCKET_URL || 'wss://ws.medhaos.health',
  },

  // Monitoring
  monitoring: {
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
    heartbeatIntervalMs: parseInt(process.env.HEARTBEAT_INTERVAL_MS || '60000', 10),
  },

  // Server
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || '0.0.0.0',
  },
};
