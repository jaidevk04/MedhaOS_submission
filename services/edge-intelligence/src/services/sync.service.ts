import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import { SyncOperation, SyncStatus, ConflictResolution, OfflineEntity } from '../types';
import { OfflineStorageService } from './offline-storage.service';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for synchronizing offline data with cloud when connectivity is restored
 */
export class SyncService {
  private offlineStorage: OfflineStorageService;
  private apiClient: AxiosInstance;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;
  private isOnline: boolean = false;

  constructor(offlineStorage: OfflineStorageService) {
    this.offlineStorage = offlineStorage;
    this.apiClient = axios.create({
      baseURL: config.cloud.apiGatewayUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': config.device.id,
        'X-Facility-ID': config.device.facilityId,
      },
    });

    this.initializeConnectivityMonitoring();
  }

  /**
   * Initialize connectivity monitoring
   */
  private initializeConnectivityMonitoring(): void {
    // Check connectivity every 30 seconds
    setInterval(async () => {
      const wasOnline = this.isOnline;
      this.isOnline = await this.checkConnectivity();

      if (!wasOnline && this.isOnline) {
        logger.info('Connectivity restored - starting sync');
        await this.startSync();
      } else if (wasOnline && !this.isOnline) {
        logger.warn('Connectivity lost - stopping sync');
        this.stopSync();
      }
    }, 30000);

    // Initial connectivity check
    this.checkConnectivity().then((online) => {
      this.isOnline = online;
      if (online) {
        this.startSync();
      }
    });
  }

  /**
   * Check if device has internet connectivity
   */
  private async checkConnectivity(): Promise<boolean> {
    try {
      await this.apiClient.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start periodic sync
   */
  async startSync(): Promise<void> {
    if (this.syncInterval) {
      return; // Already running
    }

    logger.info('Starting periodic sync');

    // Run initial sync immediately
    await this.performSync();

    // Schedule periodic sync
    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, config.sync.intervalMs);
  }

  /**
   * Stop periodic sync
   */
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      logger.info('Periodic sync stopped');
    }
  }

  /**
   * Perform synchronization
   */
  async performSync(): Promise<SyncStatus> {
    if (this.isSyncing) {
      logger.info('Sync already in progress, skipping');
      return this.getSyncStatus();
    }

    if (!this.isOnline) {
      logger.info('Device offline, skipping sync');
      return this.getSyncStatus();
    }

    this.isSyncing = true;
    const startTime = Date.now();

    try {
      logger.info('Starting sync operation');

      // Step 1: Upload pending local changes
      const uploadResult = await this.uploadPendingChanges();
      logger.info(`Uploaded ${uploadResult.successCount} entities, ${uploadResult.failureCount} failed`);

      // Step 2: Download server changes
      const downloadResult = await this.downloadServerChanges();
      logger.info(`Downloaded ${downloadResult.successCount} entities, ${downloadResult.conflictCount} conflicts`);

      // Step 3: Resolve conflicts
      if (downloadResult.conflicts.length > 0) {
        await this.resolveConflicts(downloadResult.conflicts);
      }

      const syncTime = Date.now() - startTime;
      logger.info(`Sync completed in ${syncTime}ms`);

      return this.getSyncStatus();
    } catch (error) {
      logger.error('Sync failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Upload pending local changes to server
   */
  private async uploadPendingChanges(): Promise<{ successCount: number; failureCount: number }> {
    const pendingEntities = this.offlineStorage.getPendingSyncEntities(config.sync.batchSize);
    let successCount = 0;
    let failureCount = 0;

    for (const entity of pendingEntities) {
      try {
        await this.uploadEntity(entity);
        this.offlineStorage.updateSyncStatus(entity.id, 'synced');
        successCount++;
      } catch (error) {
        logger.error(`Failed to upload entity ${entity.id}:`, error);
        failureCount++;
      }
    }

    return { successCount, failureCount };
  }

  /**
   * Upload single entity to server
   */
  private async uploadEntity(entity: OfflineEntity): Promise<void> {
    const endpoint = this.getEntityEndpoint(entity.entityType);

    if (entity.deleted) {
      // Delete on server
      await this.apiClient.delete(`${endpoint}/${entity.id}`);
    } else {
      // Create or update on server
      await this.apiClient.put(`${endpoint}/${entity.id}`, {
        data: entity.data,
        version: entity.version,
        deviceId: config.device.id,
      });
    }

    logger.info(`Entity uploaded: ${entity.entityType}/${entity.id}`);
  }

  /**
   * Download server changes
   */
  private async downloadServerChanges(): Promise<{
    successCount: number;
    conflictCount: number;
    conflicts: ConflictResolution[];
  }> {
    try {
      const lastSyncTimestamp = this.getLastSyncTimestamp();

      const response = await this.apiClient.get('/sync/changes', {
        params: {
          deviceId: config.device.id,
          since: lastSyncTimestamp,
          limit: config.sync.batchSize,
        },
      });

      const serverChanges = response.data.changes || [];
      let successCount = 0;
      let conflictCount = 0;
      const conflicts: ConflictResolution[] = [];

      for (const change of serverChanges) {
        const localEntity = this.offlineStorage.getEntity(change.entityType, change.entityId);

        if (localEntity && localEntity.syncStatus === 'pending') {
          // Conflict detected
          const conflict = this.createConflict(localEntity, change);
          conflicts.push(conflict);
          conflictCount++;
        } else {
          // No conflict, apply server change
          this.offlineStorage.saveEntity(change.entityType, change.entityId, change.data);
          this.offlineStorage.updateSyncStatus(change.entityId, 'synced');
          successCount++;
        }
      }

      this.updateLastSyncTimestamp();

      return { successCount, conflictCount, conflicts };
    } catch (error) {
      logger.error('Failed to download server changes:', error);
      throw error;
    }
  }

  /**
   * Create conflict resolution object
   */
  private createConflict(localEntity: OfflineEntity, serverChange: any): ConflictResolution {
    return {
      conflictId: uuidv4(),
      entityType: localEntity.entityType,
      entityId: localEntity.id,
      localVersion: localEntity.data,
      serverVersion: serverChange.data,
      resolution: config.sync.conflictResolutionStrategy as any,
    };
  }

  /**
   * Resolve conflicts based on strategy
   */
  private async resolveConflicts(conflicts: ConflictResolution[]): Promise<void> {
    for (const conflict of conflicts) {
      try {
        const resolvedVersion = this.applyConflictResolution(conflict);

        if (resolvedVersion) {
          this.offlineStorage.saveEntity(conflict.entityType, conflict.entityId, resolvedVersion);
          this.offlineStorage.updateSyncStatus(conflict.entityId, 'synced');
          logger.info(`Conflict resolved for ${conflict.entityType}/${conflict.entityId}`);
        } else {
          this.offlineStorage.updateSyncStatus(conflict.entityId, 'conflict');
          logger.warn(`Conflict requires manual resolution: ${conflict.entityType}/${conflict.entityId}`);
        }
      } catch (error) {
        logger.error(`Failed to resolve conflict for ${conflict.entityId}:`, error);
      }
    }
  }

  /**
   * Apply conflict resolution strategy
   */
  private applyConflictResolution(conflict: ConflictResolution): any | null {
    switch (conflict.resolution) {
      case 'server-wins':
        return conflict.serverVersion;

      case 'local-wins':
        return conflict.localVersion;

      case 'merge':
        // Attempt to merge changes
        return this.mergeVersions(conflict.localVersion, conflict.serverVersion);

      case 'manual':
        // Requires manual intervention
        return null;

      default:
        return conflict.serverVersion; // Default to server-wins
    }
  }

  /**
   * Merge two versions of an entity
   */
  private mergeVersions(localVersion: any, serverVersion: any): any {
    // Simple merge strategy: take non-null values from both
    // In production, this would be more sophisticated
    return {
      ...serverVersion,
      ...localVersion,
      _mergedAt: new Date().toISOString(),
    };
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    const stats = this.offlineStorage.getStorageStats();

    return {
      deviceId: config.device.id,
      lastSyncTimestamp: new Date(this.getLastSyncTimestamp()),
      pendingOperations: stats.pendingSyncEntities,
      failedOperations: 0, // Would track this separately in production
      syncInProgress: this.isSyncing,
      nextSyncTimestamp: new Date(Date.now() + config.sync.intervalMs),
    };
  }

  /**
   * Force immediate sync
   */
  async forceSyncNow(): Promise<SyncStatus> {
    logger.info('Force sync requested');
    return await this.performSync();
  }

  /**
   * Get entity API endpoint
   */
  private getEntityEndpoint(entityType: string): string {
    const endpoints: Record<string, string> = {
      patient: '/api/v1/patients',
      encounter: '/api/v1/encounters',
      diagnostic: '/api/v1/diagnostics',
      inference: '/api/v1/inferences',
    };

    return endpoints[entityType] || `/api/v1/${entityType}s`;
  }

  /**
   * Get last sync timestamp from storage
   */
  private getLastSyncTimestamp(): number {
    // In production, this would be stored in a metadata table
    return Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours
  }

  /**
   * Update last sync timestamp
   */
  private updateLastSyncTimestamp(): void {
    // In production, this would update a metadata table
    logger.info('Last sync timestamp updated');
  }

  /**
   * Get connectivity status
   */
  getConnectivityStatus(): { online: boolean; syncing: boolean } {
    return {
      online: this.isOnline,
      syncing: this.isSyncing,
    };
  }
}
