import * as os from 'os';
import { config } from '../config';
import { EdgeMetrics, HealthCheck } from '../types';
import { logger } from '../utils/logger';
import { OfflineStorageService } from './offline-storage.service';
import { InferenceEngineService } from './inference-engine.service';

/**
 * Service for monitoring edge device health and metrics
 */
export class MonitoringService {
  private offlineStorage: OfflineStorageService;
  private inferenceEngine: InferenceEngineService;
  private metricsHistory: EdgeMetrics[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(offlineStorage: OfflineStorageService, inferenceEngine: InferenceEngineService) {
    this.offlineStorage = offlineStorage;
    this.inferenceEngine = inferenceEngine;

    if (config.monitoring.metricsEnabled) {
      this.startHeartbeat();
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    logger.info('Starting heartbeat monitoring');

    this.heartbeatInterval = setInterval(() => {
      this.collectMetrics();
    }, config.monitoring.heartbeatIntervalMs);
  }

  /**
   * Stop heartbeat monitoring
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      logger.info('Heartbeat monitoring stopped');
    }
  }

  /**
   * Collect device metrics
   */
  collectMetrics(): EdgeMetrics {
    const metrics: EdgeMetrics = {
      deviceId: config.device.id,
      timestamp: new Date(),
      cpuUsage: this.getCpuUsage(),
      memoryUsage: this.getMemoryUsage(),
      diskUsage: this.getDiskUsage(),
      networkStatus: this.getNetworkStatus(),
      inferenceCount: this.getInferenceCount(),
      averageInferenceTimeMs: this.getAverageInferenceTime(),
      syncOperationsPending: this.getSyncOperationsPending(),
      syncOperationsFailed: this.getSyncOperationsFailed(),
    };

    // Store metrics
    this.metricsHistory.push(metrics);

    // Keep only last 100 metrics
    if (this.metricsHistory.length > 100) {
      this.metricsHistory.shift();
    }

    logger.info('Metrics collected', {
      cpu: `${metrics.cpuUsage.toFixed(2)}%`,
      memory: `${metrics.memoryUsage.toFixed(2)}%`,
      disk: `${metrics.diskUsage.toFixed(2)}%`,
    });

    return metrics;
  }

  /**
   * Get CPU usage percentage
   */
  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (100 * idle) / total;

    return Math.round(usage * 100) / 100;
  }

  /**
   * Get memory usage percentage
   */
  private getMemoryUsage(): number {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usage = (usedMem / totalMem) * 100;

    return Math.round(usage * 100) / 100;
  }

  /**
   * Get disk usage percentage
   */
  private getDiskUsage(): number {
    // This is a simplified implementation
    // In production, use a library like 'diskusage' for accurate disk stats
    try {
      const stats = this.offlineStorage.getStorageStats();
      // Estimate based on database size (placeholder)
      return Math.min(stats.databaseSizeMB / 1000 * 100, 100);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get network status
   */
  private getNetworkStatus(): 'online' | 'offline' {
    // This would be updated by the sync service
    // For now, return a placeholder
    return 'online';
  }

  /**
   * Get inference count
   */
  private getInferenceCount(): number {
    // This would track actual inference calls
    // For now, return a placeholder
    return 0;
  }

  /**
   * Get average inference time
   */
  private getAverageInferenceTime(): number {
    // This would calculate from actual inference metrics
    // For now, return a placeholder
    return 0;
  }

  /**
   * Get pending sync operations count
   */
  private getSyncOperationsPending(): number {
    try {
      const stats = this.offlineStorage.getStorageStats();
      return stats.pendingSyncEntities;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get failed sync operations count
   */
  private getSyncOperationsFailed(): number {
    // This would track actual failed operations
    // For now, return a placeholder
    return 0;
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<HealthCheck> {
    const checks = {
      connectivity: await this.checkConnectivity(),
      modelAvailability: this.checkModelAvailability(),
      storageCapacity: this.checkStorageCapacity(),
      syncService: this.checkSyncService(),
    };

    const errors: string[] = [];
    if (!checks.connectivity) errors.push('No internet connectivity');
    if (!checks.modelAvailability) errors.push('Models not available');
    if (!checks.storageCapacity) errors.push('Low storage capacity');
    if (!checks.syncService) errors.push('Sync service not running');

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (errors.length === 0) {
      status = 'healthy';
    } else if (errors.length <= 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    const healthCheck: HealthCheck = {
      deviceId: config.device.id,
      timestamp: new Date(),
      status,
      checks,
      errors,
    };

    logger.info('Health check completed', { status, errors });

    return healthCheck;
  }

  /**
   * Check connectivity
   */
  private async checkConnectivity(): Promise<boolean> {
    try {
      // Simple connectivity check
      const dns = require('dns');
      return new Promise((resolve) => {
        dns.resolve('www.google.com', (err: any) => {
          resolve(!err);
        });
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Check model availability
   */
  private checkModelAvailability(): boolean {
    return this.inferenceEngine.isReady();
  }

  /**
   * Check storage capacity
   */
  private checkStorageCapacity(): boolean {
    const diskUsage = this.getDiskUsage();
    return diskUsage < 90; // Alert if disk usage > 90%
  }

  /**
   * Check sync service
   */
  private checkSyncService(): boolean {
    // This would check if sync service is running
    // For now, return true
    return true;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit: number = 10): EdgeMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics(): EdgeMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] || null;
  }

  /**
   * Send metrics to cloud (when online)
   */
  async sendMetricsToCloud(metrics: EdgeMetrics): Promise<void> {
    try {
      // This would send metrics to CloudWatch or custom monitoring service
      logger.info('Metrics sent to cloud', { deviceId: metrics.deviceId });
    } catch (error) {
      logger.error('Failed to send metrics to cloud:', error);
    }
  }
}
