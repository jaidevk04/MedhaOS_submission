import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { auditService } from '../services/audit.service';

/**
 * Middleware to audit API requests
 */
export function auditRequest(tableName: string, operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT') {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to capture response
    res.send = function (data: any): Response {
      // Restore original send
      res.send = originalSend;

      // Only audit successful requests
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Parse response data
        let responseData;
        try {
          responseData = typeof data === 'string' ? JSON.parse(data) : data;
        } catch {
          responseData = null;
        }

        // Extract record ID from response or request
        let recordId: string | undefined;
        if (responseData?.data?.id) {
          recordId = responseData.data.id;
        } else if (req.params.id) {
          recordId = req.params.id;
        }

        // Create audit log asynchronously (don't block response)
        auditService.createAuditLog({
          tableName,
          operation,
          recordId,
          oldData: operation === 'UPDATE' || operation === 'DELETE' ? req.body : undefined,
          newData: operation === 'INSERT' || operation === 'UPDATE' ? responseData?.data : undefined,
          userId: req.user?.userId,
          userRole: req.user?.role,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch((error) => {
          console.error('Failed to create audit log:', error);
        });
      }

      // Send response
      return originalSend.call(res, data);
    };

    next();
  };
}

/**
 * Middleware to audit sensitive data access
 */
export function auditSensitiveAccess(resourceType: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    // Log access attempt
    auditService.createAuditLog({
      tableName: resourceType,
      operation: 'SELECT',
      recordId: req.params.id,
      userId: req.user?.userId,
      userRole: req.user?.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    }).catch((error) => {
      console.error('Failed to create audit log:', error);
    });

    next();
  };
}
