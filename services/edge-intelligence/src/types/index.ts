// Edge Device Types
export interface EdgeDevice {
  deviceId: string;
  facilityId: string;
  deviceType: 'clinic-terminal' | 'mobile-device' | 'tablet';
  status: 'online' | 'offline' | 'syncing';
  lastSyncTimestamp: Date;
  softwareVersion: string;
  capabilities: DeviceCapabilities;
}

export interface DeviceCapabilities {
  triageSupport: boolean;
  documentationSupport: boolean;
  offlineMode: boolean;
  modelVersions: {
    triage?: string;
    documentation?: string;
  };
}

// Greengrass Types
export interface GreengrassConfig {
  groupId: string;
  coreThingName: string;
  certificatePath: string;
  privateKeyPath: string;
  rootCaPath: string;
}

export interface GreengrassDeployment {
  deploymentId: string;
  groupId: string;
  deploymentType: 'NewDeployment' | 'Redeployment' | 'ResetDeployment';
  status: 'Building' | 'InProgress' | 'Success' | 'Failure';
  createdAt: Date;
}

// Model Types
export interface EdgeModel {
  modelId: string;
  modelName: string;
  modelType: 'triage' | 'documentation' | 'nlp';
  version: string;
  format: 'onnx' | 'tflite' | 'pytorch';
  filePath: string;
  fileSize: number;
  checksum: string;
  deployedAt: Date;
}

export interface ModelDeployment {
  modelId: string;
  deviceId: string;
  status: 'pending' | 'downloading' | 'deployed' | 'failed';
  progress: number;
  error?: string;
}

// Inference Types
export interface InferenceRequest {
  requestId: string;
  modelType: 'triage' | 'documentation';
  input: any;
  timestamp: Date;
  offline: boolean;
}

export interface InferenceResponse {
  requestId: string;
  modelType: 'triage' | 'documentation';
  output: any;
  confidence: number;
  processingTimeMs: number;
  timestamp: Date;
  offline: boolean;
}

// Sync Types
export interface SyncOperation {
  operationId: string;
  deviceId: string;
  operationType: 'upload' | 'download';
  entityType: 'patient' | 'encounter' | 'diagnostic' | 'inference';
  entityId: string;
  data: any;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  retryCount: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface SyncStatus {
  deviceId: string;
  lastSyncTimestamp: Date;
  pendingOperations: number;
  failedOperations: number;
  syncInProgress: boolean;
  nextSyncTimestamp: Date;
}

export interface ConflictResolution {
  conflictId: string;
  entityType: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  resolution: 'local-wins' | 'server-wins' | 'merge' | 'manual';
  resolvedVersion?: any;
  resolvedAt?: Date;
}

// Offline Storage Types
export interface OfflineEntity {
  id: string;
  entityType: string;
  data: any;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  deleted: boolean;
}

// Monitoring Types
export interface EdgeMetrics {
  deviceId: string;
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkStatus: 'online' | 'offline';
  inferenceCount: number;
  averageInferenceTimeMs: number;
  syncOperationsPending: number;
  syncOperationsFailed: number;
}

export interface HealthCheck {
  deviceId: string;
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    connectivity: boolean;
    modelAvailability: boolean;
    storageCapacity: boolean;
    syncService: boolean;
  };
  errors: string[];
}
