import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { rbacService } from '../services/rbac.service';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// All RBAC routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

/**
 * POST /rbac/roles
 * Create a new role
 */
router.post(
  '/roles',
  [
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
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

      const role = await rbacService.createRole(req.body);

      res.status(201).json({
        success: true,
        data: role,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create role',
      });
    }
  }
);

/**
 * GET /rbac/roles
 * Get all roles
 */
router.get('/roles', async (req, res) => {
  try {
    const roles = await rbacService.getRoles();

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch roles',
    });
  }
});

/**
 * GET /rbac/roles/:name
 * Get role by name
 */
router.get('/roles/:name', async (req, res) => {
  try {
    const role = await rbacService.getRoleByName(req.params.name);

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch role',
    });
  }
});

/**
 * POST /rbac/permissions
 * Create a new permission
 */
router.post(
  '/permissions',
  [
    body('resource').trim().notEmpty(),
    body('action').trim().notEmpty(),
    body('description').optional().trim(),
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

      const permission = await rbacService.createPermission(req.body);

      res.status(201).json({
        success: true,
        data: permission,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create permission',
      });
    }
  }
);

/**
 * GET /rbac/permissions
 * Get all permissions
 */
router.get('/permissions', async (req, res) => {
  try {
    const permissions = await rbacService.getPermissions();

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions',
    });
  }
});

/**
 * POST /rbac/roles/:roleName/permissions
 * Assign permission to role
 */
router.post(
  '/roles/:roleName/permissions',
  [body('permissionId').isUUID()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const result = await rbacService.assignPermissionToRole(
        req.params.roleName,
        req.body.permissionId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign permission',
      });
    }
  }
);

/**
 * DELETE /rbac/roles/:roleName/permissions/:permissionId
 * Remove permission from role
 */
router.delete('/roles/:roleName/permissions/:permissionId', async (req, res) => {
  try {
    const result = await rbacService.removePermissionFromRole(
      req.params.roleName,
      req.params.permissionId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove permission',
    });
  }
});

/**
 * POST /rbac/users/:userId/permissions
 * Assign permission directly to user
 */
router.post(
  '/users/:userId/permissions',
  [body('permissionId').isUUID()],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const result = await rbacService.assignPermissionToUser(
        req.params.userId,
        req.body.permissionId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign permission',
      });
    }
  }
);

/**
 * DELETE /rbac/users/:userId/permissions/:permissionId
 * Remove permission from user
 */
router.delete('/users/:userId/permissions/:permissionId', async (req, res) => {
  try {
    const result = await rbacService.removePermissionFromUser(
      req.params.userId,
      req.params.permissionId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove permission',
    });
  }
});

/**
 * GET /rbac/users/:userId/permissions
 * Get all permissions for a user
 */
router.get('/users/:userId/permissions', async (req, res) => {
  try {
    const permissions = await rbacService.getUserPermissions(req.params.userId);

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user permissions',
    });
  }
});

/**
 * GET /rbac/me/permissions
 * Get permissions for authenticated user
 */
router.get('/me/permissions', async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    const permissions = await rbacService.getUserPermissions(req.user.userId);

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions',
    });
  }
});

/**
 * POST /rbac/initialize
 * Initialize default roles and permissions
 */
router.post('/initialize', async (req, res) => {
  try {
    const result = await rbacService.initializeDefaultRolesAndPermissions();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to initialize roles and permissions',
    });
  }
});

export default router;
