/**
 * Dashboard Service
 * Provides data aggregation and formatting for monitoring dashboards
 */

import { MetricsService } from './metrics';
import { HealthCheckService } from './health';
import { AlertManager } from './alert-manager';
import { PerformanceAnalyzer } from './performance-analyzer';

export interface DashboardData {
  systemHealth: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    timestamp: Date;
  };
  metrics: {
    requestRate: number;
    errorRate: number;
    avgResponseTime: number;
    activeConnections: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    heapUsed: number;
    heapTotal: number;
  };
  alerts: {
    critical: number;
    warning: number;
    info: number;
  };
  agents: {
    name: string;
    executionRate: number;
    successRate: number;
    avgConfidence: number;
    avgExecutionTime: number;
  }[];
}

export class DashboardService {
  private metrics: MetricsService;
  private health: HealthCheckService;
  private alertManager: AlertManager;
  private performanceAnalyzer: PerformanceAnalyzer;
  private startTime: Date;

  constructor(
    metrics: MetricsService,
    health: HealthCheckService,
    alertManager: AlertManager,
    performanceAnalyzer: PerformanceAnalyzer
  ) {
    this.metrics = metrics;
    this.health = health;
    this.alertManager = alertManager;
    this.performanceAnalyzer = performanceAnalyzer;
    this.startTime = new Date();
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    const [healthStatus, alertStats] = await Promise.all([
      this.health.getHealth(),
      Promise.resolve(this.alertManager.getStatistics()),
    ]);

    return {
      systemHealth: {
        status: healthStatus.status as any,
        uptime: Date.now() - this.startTime.getTime(),
        timestamp: new Date(),
      },
      metrics: {
        requestRate: 0, // Would be calculated from Prometheus metrics
        errorRate: 0,
        avgResponseTime: 0,
        activeConnections: 0,
      },
      resources: {
        cpuUsage: this.getCpuUsage(),
        memoryUsage: this.getMemoryUsage(),
        heapUsed: process.memoryUsage().heapUsed / 1024 / 1024,
        heapTotal: process.memoryUsage().heapTotal / 1024 / 1024,
      },
      alerts: {
        critical: alertStats.bySeverity.critical || 0,
        warning: alertStats.bySeverity.warning || 0,
        info: alertStats.bySeverity.info || 0,
      },
      agents: [], // Would be populated from agent metrics
    };
  }

  /**
   * Get uptime in seconds
   */
  getUptime(): number {
    return (Date.now() - this.startTime.getTime()) / 1000;
  }

  /**
   * Get CPU usage percentage
   */
  private getCpuUsage(): number {
    const usage = process.cpuUsage();
    const totalUsage = usage.user + usage.system;
    // Convert to percentage (simplified)
    return (totalUsage / 1000000) % 100;
  }

  /**
   * Get memory usage percentage
   */
  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return (usage.heapUsed / usage.heapTotal) * 100;
  }

  /**
   * Get system health summary
   */
  async getHealthSummary(): Promise<{
    status: string;
    uptime: number;
    checks: { [key: string]: string };
  }> {
    const health = await this.health.getDetailedHealth();
    
    const checks: { [key: string]: string } = {};
    for (const [name, check] of Object.entries(health.checks)) {
      checks[name] = check.status;
    }

    return {
      status: health.status,
      uptime: this.getUptime(),
      checks,
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    slowOperations: number;
    avgResponseTime: number;
    p95ResponseTime: number;
  } {
    const report = this.performanceAnalyzer.generateReport();
    
    const allStats = report.stats;
    const avgResponseTime = allStats.length > 0
      ? allStats.reduce((sum, s) => sum + s.avg, 0) / allStats.length
      : 0;
    
    const p95ResponseTime = allStats.length > 0
      ? allStats.reduce((sum, s) => sum + s.p95, 0) / allStats.length
      : 0;

    return {
      slowOperations: report.slowOperations.length,
      avgResponseTime,
      p95ResponseTime,
    };
  }

  /**
   * Get alert summary
   */
  getAlertSummary(): {
    active: number;
    critical: number;
    warning: number;
    recentAlerts: any[];
  } {
    const stats = this.alertManager.getStatistics();
    const recentAlerts = this.alertManager.getAlertHistory(10);

    return {
      active: stats.totalActive,
      critical: stats.bySeverity.critical || 0,
      warning: stats.bySeverity.warning || 0,
      recentAlerts: recentAlerts.map(a => ({
        id: a.id,
        severity: a.severity,
        message: a.message,
        timestamp: a.timestamp,
      })),
    };
  }

  /**
   * Get metrics for time series chart
   */
  async getTimeSeriesMetrics(
    metricName: string,
    startTime: Date,
    endTime: Date,
    interval: number = 60
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    // This would query Prometheus or CloudWatch for historical data
    // For now, return empty array
    return [];
  }

  /**
   * Export dashboard data as JSON
   */
  async exportDashboardData(): Promise<string> {
    const data = await this.getDashboardData();
    return JSON.stringify(data, null, 2);
  }
}

/**
 * Create dashboard service instance
 */
export function createDashboardService(
  metrics: MetricsService,
  health: HealthCheckService,
  alertManager: AlertManager,
  performanceAnalyzer: PerformanceAnalyzer
): DashboardService {
  return new DashboardService(metrics, health, alertManager, performanceAnalyzer);
}
