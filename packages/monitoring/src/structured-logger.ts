import { Logger } from './logger';
import { LogContext } from './types';

/**
 * Structured Logger with predefined log formats
 * Ensures consistent logging across all services
 */
export class StructuredLogger {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Log API request
   */
  logApiRequest(context: {
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    responseTime: number;
    userId?: string;
    ip?: string;
    userAgent?: string;
  }): void {
    this.logger.info('API Request', {
      type: 'api_request',
      ...context,
    });
  }

  /**
   * Log API error
   */
  logApiError(context: {
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    error: Error;
    userId?: string;
  }): void {
    this.logger.error('API Error', {
      type: 'api_error',
      ...context,
      errorMessage: context.error.message,
      errorStack: context.error.stack,
    });
  }

  /**
   * Log agent execution start
   */
  logAgentStart(context: {
    requestId: string;
    agentName: string;
    input: any;
    userId?: string;
    patientId?: string;
  }): void {
    this.logger.info('Agent Execution Started', {
      type: 'agent_start',
      ...context,
    });
  }

  /**
   * Log agent execution completion
   */
  logAgentComplete(context: {
    requestId: string;
    agentName: string;
    executionTime: number;
    confidenceScore: number;
    success: boolean;
    output?: any;
    userId?: string;
    patientId?: string;
  }): void {
    this.logger.info('Agent Execution Completed', {
      type: 'agent_complete',
      ...context,
    });
  }

  /**
   * Log agent error
   */
  logAgentError(context: {
    requestId: string;
    agentName: string;
    executionTime: number;
    error: Error;
    userId?: string;
    patientId?: string;
  }): void {
    this.logger.error('Agent Execution Failed', {
      type: 'agent_error',
      ...context,
      errorMessage: context.error.message,
      errorStack: context.error.stack,
    });
  }

  /**
   * Log database query
   */
  logDatabaseQuery(context: {
    requestId: string;
    query: string;
    duration: number;
    rowCount?: number;
    error?: Error;
  }): void {
    if (context.error) {
      this.logger.error('Database Query Failed', {
        type: 'database_error',
        ...context,
        errorMessage: context.error.message,
      });
    } else {
      this.logger.debug('Database Query', {
        type: 'database_query',
        ...context,
      });
    }
  }

  /**
   * Log external API call
   */
  logExternalApiCall(context: {
    requestId: string;
    service: string;
    endpoint: string;
    method: string;
    statusCode?: number;
    duration: number;
    success: boolean;
    error?: Error;
  }): void {
    if (context.success) {
      this.logger.info('External API Call', {
        type: 'external_api_call',
        ...context,
      });
    } else {
      this.logger.error('External API Call Failed', {
        type: 'external_api_error',
        ...context,
        errorMessage: context.error?.message,
      });
    }
  }

  /**
   * Log authentication event
   */
  logAuthentication(context: {
    requestId: string;
    userId?: string;
    action: 'login' | 'logout' | 'token_refresh' | 'mfa_verify';
    success: boolean;
    ip?: string;
    userAgent?: string;
    error?: Error;
  }): void {
    if (context.success) {
      this.logger.info('Authentication Event', {
        type: 'authentication',
        ...context,
      });
    } else {
      this.logger.warn('Authentication Failed', {
        type: 'authentication_failed',
        ...context,
        errorMessage: context.error?.message,
      });
    }
  }

  /**
   * Log authorization event
   */
  logAuthorization(context: {
    requestId: string;
    userId: string;
    resource: string;
    action: string;
    allowed: boolean;
    reason?: string;
  }): void {
    if (context.allowed) {
      this.logger.debug('Authorization Granted', {
        type: 'authorization_granted',
        ...context,
      });
    } else {
      this.logger.warn('Authorization Denied', {
        type: 'authorization_denied',
        ...context,
      });
    }
  }

  /**
   * Log audit event (for compliance)
   */
  logAudit(context: {
    requestId: string;
    userId: string;
    action: string;
    resource: string;
    resourceId?: string;
    changes?: any;
    ip?: string;
    userAgent?: string;
  }): void {
    this.logger.info('Audit Event', {
      type: 'audit',
      ...context,
    });
  }

  /**
   * Log security event
   */
  logSecurity(context: {
    requestId: string;
    eventType: 'suspicious_activity' | 'rate_limit_exceeded' | 'invalid_token' | 'brute_force_attempt';
    userId?: string;
    ip?: string;
    details: any;
  }): void {
    this.logger.warn('Security Event', {
      type: 'security',
      ...context,
    });
  }

  /**
   * Log performance metric
   */
  logPerformance(context: {
    requestId: string;
    operation: string;
    duration: number;
    metadata?: any;
  }): void {
    this.logger.info('Performance Metric', {
      type: 'performance',
      ...context,
    });
  }

  /**
   * Log business event
   */
  logBusinessEvent(context: {
    requestId: string;
    eventType: string;
    patientId?: string;
    encounterId?: string;
    metadata: any;
  }): void {
    this.logger.info('Business Event', {
      type: 'business_event',
      ...context,
    });
  }

  /**
   * Log clinical event
   */
  logClinicalEvent(context: {
    requestId: string;
    eventType: 'triage' | 'diagnosis' | 'prescription' | 'lab_order' | 'imaging_order';
    patientId: string;
    encounterId?: string;
    clinicianId?: string;
    urgencyScore?: number;
    metadata: any;
  }): void {
    this.logger.info('Clinical Event', {
      type: 'clinical_event',
      ...context,
    });
  }

  /**
   * Log data access (for HIPAA/DISHA compliance)
   */
  logDataAccess(context: {
    requestId: string;
    userId: string;
    action: 'read' | 'write' | 'update' | 'delete';
    resourceType: 'patient' | 'encounter' | 'prescription' | 'lab_result' | 'image';
    resourceId: string;
    purpose?: string;
    ip?: string;
  }): void {
    this.logger.info('Data Access', {
      type: 'data_access',
      ...context,
    });
  }

  /**
   * Log error with context
   */
  logError(context: {
    requestId: string;
    errorType: string;
    error: Error;
    severity: 'low' | 'medium' | 'high' | 'critical';
    metadata?: any;
  }): void {
    this.logger.error('Error', {
      type: 'error',
      ...context,
      errorMessage: context.error.message,
      errorStack: context.error.stack,
    });
  }
}

/**
 * Create structured logger instance
 */
export function createStructuredLogger(logger: Logger): StructuredLogger {
  return new StructuredLogger(logger);
}
