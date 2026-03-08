/**
 * Performance Analyzer
 * Analyzes performance metrics and identifies bottlenecks
 */

export interface PerformanceData {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: any;
}

export interface PerformanceStats {
  operation: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface PerformanceReport {
  stats: PerformanceStats[];
  slowOperations: PerformanceData[];
  trends: {
    operation: string;
    trend: 'improving' | 'degrading' | 'stable';
    changePercent: number;
  }[];
  timestamp: Date;
}

export class PerformanceAnalyzer {
  private data: Map<string, PerformanceData[]>;
  private maxDataPoints: number;

  constructor(maxDataPoints: number = 10000) {
    this.data = new Map();
    this.maxDataPoints = maxDataPoints;
  }

  /**
   * Record performance data
   */
  record(operation: string, duration: number, metadata?: any): void {
    if (!this.data.has(operation)) {
      this.data.set(operation, []);
    }

    const dataPoints = this.data.get(operation)!;
    dataPoints.push({
      operation,
      duration,
      timestamp: new Date(),
      metadata,
    });

    // Keep only recent data points
    if (dataPoints.length > this.maxDataPoints) {
      dataPoints.shift();
    }
  }

  /**
   * Calculate statistics for an operation
   */
  getStats(operation: string): PerformanceStats | null {
    const dataPoints = this.data.get(operation);
    if (!dataPoints || dataPoints.length === 0) {
      return null;
    }

    const durations = dataPoints.map(d => d.duration).sort((a, b) => a - b);
    const count = durations.length;

    return {
      operation,
      count,
      min: durations[0],
      max: durations[count - 1],
      avg: durations.reduce((sum, d) => sum + d, 0) / count,
      p50: this.percentile(durations, 0.50),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
    };
  }

  /**
   * Get statistics for all operations
   */
  getAllStats(): PerformanceStats[] {
    const stats: PerformanceStats[] = [];
    
    for (const operation of this.data.keys()) {
      const stat = this.getStats(operation);
      if (stat) {
        stats.push(stat);
      }
    }

    return stats.sort((a, b) => b.p95 - a.p95);
  }

  /**
   * Get slow operations (above threshold)
   */
  getSlowOperations(thresholdMs: number = 3000, limit: number = 100): PerformanceData[] {
    const slowOps: PerformanceData[] = [];

    for (const dataPoints of this.data.values()) {
      for (const dataPoint of dataPoints) {
        if (dataPoint.duration > thresholdMs) {
          slowOps.push(dataPoint);
        }
      }
    }

    return slowOps
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Analyze performance trends
   */
  analyzeTrends(windowMinutes: number = 60): PerformanceReport['trends'] {
    const trends: PerformanceReport['trends'] = [];
    const now = new Date();
    const windowMs = windowMinutes * 60 * 1000;

    for (const [operation, dataPoints] of this.data.entries()) {
      // Split data into two halves
      const midpoint = now.getTime() - windowMs / 2;
      const oldData = dataPoints.filter(d => d.timestamp.getTime() < midpoint);
      const newData = dataPoints.filter(d => d.timestamp.getTime() >= midpoint);

      if (oldData.length < 10 || newData.length < 10) {
        continue; // Not enough data
      }

      const oldAvg = oldData.reduce((sum, d) => sum + d.duration, 0) / oldData.length;
      const newAvg = newData.reduce((sum, d) => sum + d.duration, 0) / newData.length;

      const changePercent = ((newAvg - oldAvg) / oldAvg) * 100;

      let trend: 'improving' | 'degrading' | 'stable';
      if (changePercent < -10) {
        trend = 'improving';
      } else if (changePercent > 10) {
        trend = 'degrading';
      } else {
        trend = 'stable';
      }

      trends.push({
        operation,
        trend,
        changePercent,
      });
    }

    return trends.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  }

  /**
   * Generate performance report
   */
  generateReport(slowThresholdMs: number = 3000): PerformanceReport {
    return {
      stats: this.getAllStats(),
      slowOperations: this.getSlowOperations(slowThresholdMs),
      trends: this.analyzeTrends(),
      timestamp: new Date(),
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Reset all data
   */
  reset(): void {
    this.data.clear();
  }

  /**
   * Get data for specific operation
   */
  getData(operation: string): PerformanceData[] {
    return this.data.get(operation) || [];
  }

  /**
   * Get operations list
   */
  getOperations(): string[] {
    return Array.from(this.data.keys());
  }

  /**
   * Export data for analysis
   */
  exportData(): { [operation: string]: PerformanceData[] } {
    const exported: { [operation: string]: PerformanceData[] } = {};
    
    for (const [operation, dataPoints] of this.data.entries()) {
      exported[operation] = dataPoints;
    }

    return exported;
  }

  /**
   * Import data
   */
  importData(data: { [operation: string]: PerformanceData[] }): void {
    for (const [operation, dataPoints] of Object.entries(data)) {
      this.data.set(operation, dataPoints);
    }
  }
}

/**
 * Create performance analyzer instance
 */
export function createPerformanceAnalyzer(maxDataPoints?: number): PerformanceAnalyzer {
  return new PerformanceAnalyzer(maxDataPoints);
}
