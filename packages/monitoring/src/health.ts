import { HealthCheckResult } from './types';

/**
 * Health Check Service
 * Provides health check endpoints and dependency monitoring
 */
export class HealthCheckService {
  private checks: Map<string, () => Promise<boolean>>;
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
    this.checks = new Map();
  }

  /**
   * Register a health check
   */
  registerCheck(name: string, checkFn: () => Promise<boolean>): void {
    this.checks.set(name, checkFn);
  }

  /**
   * Run all health checks
   */
  async runHealthChecks(): Promise<HealthCheckResult> {
    const timestamp = new Date();
    const checks: HealthCheckResult['checks'] = {};
    let allPassed = true;
    let anyFailed = false;

    for (const [name, checkFn] of this.checks.entries()) {
      const startTime = Date.now();
      try {
        const passed = await Promise.race([
          checkFn(),
          new Promise<boolean>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 5000)
          ),
        ]);

        const responseTime = Date.now() - startTime;

        checks[name] = {
          status: passed ? 'pass' : 'fail',
          responseTime,
        };

        if (!passed) {
          anyFailed = true;
        }
      } catch (error) {
        const responseTime = Date.now() - startTime;
        checks[name] = {
          status: 'fail',
          message: error instanceof Error ? error.message : 'Unknown error',
          responseTime,
        };
        anyFailed = true;
        allPassed = false;
      }
    }

    const status = anyFailed ? (allPassed ? 'degraded' : 'unhealthy') : 'healthy';

    return {
      status,
      timestamp,
      checks,
    };
  }

  /**
   * Get simple health status
   */
  async getHealth(): Promise<{ status: string; timestamp: Date }> {
    const result = await this.runHealthChecks();
    return {
      status: result.status,
      timestamp: result.timestamp,
    };
  }

  /**
   * Get detailed health status
   */
  async getDetailedHealth(): Promise<HealthCheckResult> {
    return this.runHealthChecks();
  }

  /**
   * Register database health check
   */
  registerDatabaseCheck(checkFn: () => Promise<boolean>): void {
    this.registerCheck('database', checkFn);
  }

  /**
   * Register cache health check
   */
  registerCacheCheck(checkFn: () => Promise<boolean>): void {
    this.registerCheck('cache', checkFn);
  }

  /**
   * Register external service health check
   */
  registerExternalServiceCheck(serviceName: string, checkFn: () => Promise<boolean>): void {
    this.registerCheck(`external:${serviceName}`, checkFn);
  }

  /**
   * Register memory health check
   */
  registerMemoryCheck(thresholdPercent: number = 90): void {
    this.registerCheck('memory', async () => {
      const usage = process.memoryUsage();
      const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
      return heapUsedPercent < thresholdPercent;
    });
  }

  /**
   * Register CPU health check
   */
  registerCpuCheck(thresholdPercent: number = 90): void {
    this.registerCheck('cpu', async () => {
      const usage = process.cpuUsage();
      const totalUsage = usage.user + usage.system;
      // Simple check - in production, use more sophisticated CPU monitoring
      return totalUsage < thresholdPercent * 1000000; // Convert to microseconds
    });
  }
}

/**
 * Create health check service instance
 */
export function createHealthCheckService(serviceName: string): HealthCheckService {
  return new HealthCheckService(serviceName);
}
