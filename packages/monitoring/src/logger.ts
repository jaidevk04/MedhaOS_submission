import winston from 'winston';
import WinstonCloudWatch from 'winston-cloudwatch';
import { CloudWatchLogsClient } from '@aws-sdk/client-cloudwatch-logs';
import { MonitoringConfig, LogContext, LogLevel } from './types';

/**
 * Centralized Logger with CloudWatch integration
 * Provides structured logging in JSON format with correlation IDs
 */
export class Logger {
  private logger: winston.Logger;
  private config: MonitoringConfig;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport (always enabled)
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
            return `${timestamp} [${level}] [${this.config.serviceName}]: ${message} ${metaStr}`;
          })
        ),
      })
    );

    // CloudWatch transport (if enabled)
    if (this.config.cloudWatch?.enabled) {
      const cloudWatchClient = new CloudWatchLogsClient({
        region: this.config.cloudWatch.region,
      });

      transports.push(
        new WinstonCloudWatch({
          logGroupName: this.config.cloudWatch.logGroup,
          logStreamName: `${this.config.cloudWatch.logStreamPrefix}-${this.config.serviceName}-${new Date().toISOString().split('T')[0]}`,
          awsRegion: this.config.cloudWatch.region,
          jsonMessage: true,
          messageFormatter: (logObject: any) => {
            return JSON.stringify({
              timestamp: logObject.timestamp || new Date().toISOString(),
              level: logObject.level,
              message: logObject.message,
              service: this.config.serviceName,
              environment: this.config.environment,
              ...logObject.meta,
            });
          },
        })
      );
    }

    return winston.createLogger({
      level: this.config.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: {
        service: this.config.serviceName,
        environment: this.config.environment,
      },
      transports,
    });
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext): void {
    this.logger.error(message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  /**
   * Log verbose message
   */
  verbose(message: string, context?: LogContext): void {
    this.logger.verbose(message, context);
  }

  /**
   * Log with custom level
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    this.logger.log(level, message, context);
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config);
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }

  /**
   * Log agent execution
   */
  logAgentExecution(
    agentName: string,
    executionTime: number,
    success: boolean,
    context?: LogContext
  ): void {
    this.info(`Agent execution: ${agentName}`, {
      agentName,
      executionTime,
      success,
      ...context,
    });
  }

  /**
   * Log API request
   */
  logRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    context?: LogContext
  ): void {
    this.info(`${method} ${path} ${statusCode}`, {
      method,
      path,
      statusCode,
      responseTime,
      ...context,
    });
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, context?: LogContext): void {
    this.debug('Database query executed', {
      query,
      duration,
      ...context,
    });
  }
}

/**
 * Create logger instance
 */
export function createLogger(config: MonitoringConfig): Logger {
  return new Logger(config);
}
