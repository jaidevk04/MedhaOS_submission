import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { rbacService } from '../services/rbac.service';

/**
 * Middleware to check if user has specific permission
 */
export function requirePermission(resource: string, action: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      const hasPermission = await rbacService.hasPermission(
        req.user.userId,
        resource,
        action
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: `Insufficient permissions. Required: ${resource}:${action}`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Permission check failed',
      });
    }
  };
}

/**
 * Middleware to check if user has any of the specified permissions
 */
export function requireAnyPermission(permissions: Array<{ resource: string; action: string }>) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      for (const perm of permissions) {
        const hasPermission = await rbacService.hasPermission(
          req.user.userId,
          perm.resource,
          perm.action
        );

        if (hasPermission) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Permission check failed',
      });
    }
  };
}

/**
 * Middleware to check if user has all of the specified permissions
 */
export function requireAllPermissions(permissions: Array<{ resource: string; action: string }>) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }

      for (const perm of permissions) {
        const hasPermission = await rbacService.hasPermission(
          req.user.userId,
          perm.resource,
          perm.action
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: `Insufficient permissions. Required: ${perm.resource}:${perm.action}`,
          });
        }
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Permission check failed',
      });
    }
  };
}
