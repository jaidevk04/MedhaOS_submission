import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { auditService } from '../services/audit.service';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';

const router = Router();

// All audit routes require authentication
router.use(authenticate);

/**
 * GET /audit/logs
 * Query audit logs with filters
 */
router.get(
  '/logs',
  [
    authorize('admin', 'public_health'),
    requirePermission('audit', 'read'),
    query('tableName').optional().trim(),
    query('operation').optional().isIn(['INSERT', 'UPDATE', 'DELETE', 'SELECT']),
    query('userId').optional().isUUID(),
    query('recordId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 1000 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const result = await auditService.queryAuditLogs({
        tableName: req.query.tableName as string,
        operation: req.query.operation as string,
        userId: req.query.userId as string,
        recordId: req.query.recordId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to query audit logs',
      });
    }
  }
);

/**
 * GET /audit/logs/:id
 * Get audit log by ID
 */
router.get(
  '/logs/:id',
  [authorize('admin'), requirePermission('audit', 'read')],
  async (req, res) => {
    try {
      const log = await auditService.getAuditLogById(req.params.id);

      if (!log) {
        return res.status(404).json({
          success: false,
          error: 'Audit log not found',
        });
      }

      res.json({
        success: true,
        data: {
          ...log,
          id: log.id.toString(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit log',
      });
    }
  }
);

/**
 * GET /audit/records/:tableName/:recordId
 * Get audit trail for a specific record
 */
router.get(
  '/records/:tableName/:recordId',
  [authorize('admin', 'doctor', 'nurse'), requirePermission('audit', 'read')],
  async (req, res) => {
    try {
      const logs = await auditService.getRecordAuditTrail(
        req.params.tableName,
        req.params.recordId
      );

      res.json({
        success: true,
        data: logs.map((log) => ({
          ...log,
          id: log.id.toString(),
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit trail',
      });
    }
  }
);

/**
 * GET /audit/users/:userId/activity
 * Get user activity logs
 */
router.get(
  '/users/:userId/activity',
  [authorize('admin'), requirePermission('audit', 'read')],
  async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await auditService.getUserActivityLogs(req.params.userId, limit);

      res.json({
        success: true,
        data: logs.map((log) => ({
          ...log,
          id: log.id.toString(),
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user activity',
      });
    }
  }
);

/**
 * GET /audit/me/activity
 * Get authenticated user's activity logs
 */
router.get('/me/activity', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = await auditService.getUserActivityLogs(req.user.userId, limit);

    res.json({
      success: true,
      data: logs.map((log) => ({
        ...log,
        id: log.id.toString(),
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity logs',
    });
  }
});

/**
 * GET /audit/statistics
 * Get audit statistics
 */
router.get(
  '/statistics',
  [
    authorize('admin'),
    requirePermission('audit', 'read'),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const stats = await auditService.getAuditStatistics(
        req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        req.query.endDate ? new Date(req.query.endDate as string) : undefined
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit statistics',
      });
    }
  }
);

/**
 * POST /audit/export
 * Export audit logs
 */
router.post(
  '/export',
  [
    authorize('admin'),
    requirePermission('audit', 'read'),
    query('tableName').optional().trim(),
    query('operation').optional().isIn(['INSERT', 'UPDATE', 'DELETE', 'SELECT']),
    query('userId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const logs = await auditService.exportAuditLogs({
        tableName: req.query.tableName as string,
        operation: req.query.operation as string,
        userId: req.query.userId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      });

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to export audit logs',
      });
    }
  }
);

/**
 * DELETE /audit/cleanup
 * Delete old audit logs (admin only)
 */
router.delete(
  '/cleanup',
  [
    authorize('admin'),
    requirePermission('audit', 'read'),
    query('olderThanDays').isInt({ min: 90 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const result = await auditService.deleteOldAuditLogs(
        parseInt(req.query.olderThanDays as string)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to cleanup audit logs',
      });
    }
  }
);

export default router;
