import AWSXRay from 'aws-xray-sdk-core';
import { MonitoringConfig } from './types';

/**
 * Distributed Tracing Service using AWS X-Ray
 * Provides request tracing across microservices
 */
export class TracingService {
  private config: MonitoringConfig;
  private enabled: boolean;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.enabled = config.xray?.enabled || false;

    if (this.enabled) {
      this.initializeXRay();
    }
  }

  private initializeXRay(): void {
    if (!this.config.xray) {
      return;
    }

    // Configure X-Ray daemon address
    AWSXRay.setDaemonAddress(this.config.xray.daemonAddress);

    // Set service name
    AWSXRay.middleware.setSamplingRules({
      version: 2,
      default: {
        fixed_target: 1,
        rate: 0.1,
      },
      rules: [
        {
          description: 'High priority traces',
          service_name: this.config.serviceName,
          http_method: '*',
          url_path: '/api/*',
          fixed_target: 1,
          rate: 0.5,
        },
      ],
    });
  }

  /**
   * Get X-Ray middleware for Express
   */
  getExpressMiddleware() {
    if (!this.enabled) {
      return (req: any, res: any, next: any) => next();
    }
    return AWSXRay.express.openSegment(this.config.serviceName);
  }

  /**
   * Get X-Ray close middleware for Express
   */
  getExpressCloseMiddleware() {
    if (!this.enabled) {
      return (req: any, res: any, next: any) => next();
    }
    return AWSXRay.express.closeSegment();
  }

  /**
   * Create a new subsegment for tracing
   */
  createSubsegment(name: string, callback: (subsegment: any) => void): void {
    if (!this.enabled) {
      callback(null);
      return;
    }

    const segment = AWSXRay.getSegment();
    if (!segment) {
      callback(null);
      return;
    }

    const subsegment = segment.addNewSubsegment(name);
    try {
      callback(subsegment);
      subsegment.close();
    } catch (error) {
      subsegment.addError(error as Error);
      subsegment.close();
      throw error;
    }
  }

  /**
   * Trace async function
   */
  async traceAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return fn();
    }

    const segment = AWSXRay.getSegment();
    if (!segment) {
      return fn();
    }

    const subsegment = segment.addNewSubsegment(name);
    try {
      const result = await fn();
      subsegment.close();
      return result;
    } catch (error) {
      subsegment.addError(error as Error);
      subsegment.close();
      throw error;
    }
  }

  /**
   * Add annotation to current segment
   */
  addAnnotation(key: string, value: string | number | boolean): void {
    if (!this.enabled) {
      return;
    }

    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addAnnotation(key, value);
    }
  }

  /**
   * Add metadata to current segment
   */
  addMetadata(key: string, value: any, namespace?: string): void {
    if (!this.enabled) {
      return;
    }

    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addMetadata(key, value, namespace);
    }
  }

  /**
   * Capture AWS SDK calls
   */
  captureAWS<T>(aws: T): T {
    if (!this.enabled) {
      return aws;
    }
    return AWSXRay.captureAWS(aws);
  }

  /**
   * Capture HTTP/HTTPS calls
   */
  captureHTTPs(module: any): any {
    if (!this.enabled) {
      return module;
    }
    return AWSXRay.captureHTTPs(module);
  }

  /**
   * Get current trace ID
   */
  getTraceId(): string | undefined {
    if (!this.enabled) {
      return undefined;
    }

    const segment = AWSXRay.getSegment();
    return segment?.trace_id;
  }

  /**
   * Instrument agent execution
   */
  async traceAgentExecution<T>(
    agentName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.traceAsync(`Agent:${agentName}`, async () => {
      this.addAnnotation('agentName', agentName);
      this.addAnnotation('service', this.config.serviceName);
      
      const startTime = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        this.addMetadata('executionTime', duration, 'agent');
        this.addAnnotation('success', true);
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.addMetadata('executionTime', duration, 'agent');
        this.addMetadata('error', error, 'agent');
        this.addAnnotation('success', false);
        
        throw error;
      }
    });
  }

  /**
   * Instrument database query
   */
  async traceDatabaseQuery<T>(
    query: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.traceAsync('Database:Query', async () => {
      this.addMetadata('query', query, 'database');
      
      const startTime = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        this.addMetadata('duration', duration, 'database');
        
        return result;
      } catch (error) {
        this.addMetadata('error', error, 'database');
        throw error;
      }
    });
  }

  /**
   * Instrument external API call
   */
  async traceExternalCall<T>(
    serviceName: string,
    endpoint: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.traceAsync(`External:${serviceName}`, async () => {
      this.addAnnotation('externalService', serviceName);
      this.addMetadata('endpoint', endpoint, 'external');
      
      const startTime = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        this.addMetadata('duration', duration, 'external');
        this.addAnnotation('success', true);
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.addMetadata('duration', duration, 'external');
        this.addMetadata('error', error, 'external');
        this.addAnnotation('success', false);
        
        throw error;
      }
    });
  }
}

/**
 * Create tracing service instance
 */
export function createTracingService(config: MonitoringConfig): TracingService {
  return new TracingService(config);
}
