import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateRoleInput {
  name: string;
  description?: string;
}

export interface CreatePermissionInput {
  resource: string;
  action: string;
  description?: string;
}

export class RBACService {
  /**
   * Create a new role
   */
  async createRole(input: CreateRoleInput) {
    const existingRole = await prisma.role.findUnique({
      where: { name: input.name },
    });

    if (existingRole) {
      throw new Error('Role already exists');
    }

    return prisma.role.create({
      data: input,
    });
  }

  /**
   * Get all roles
   */
  async getRoles() {
    return prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Get role by name
   */
  async getRoleByName(name: string) {
    return prisma.role.findUnique({
      where: { name },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Create a new permission
   */
  async createPermission(input: CreatePermissionInput) {
    const existingPermission = await prisma.permission.findUnique({
      where: {
        resource_action: {
          resource: input.resource,
          action: input.action,
        },
      },
    });

    if (existingPermission) {
      throw new Error('Permission already exists');
    }

    return prisma.permission.create({
      data: input,
    });
  }

  /**
   * Get all permissions
   */
  async getPermissions() {
    return prisma.permission.findMany();
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(roleName: string, permissionId: string) {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    // Check if already assigned
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permission.id,
        },
      },
    });

    if (existing) {
      throw new Error('Permission already assigned to role');
    }

    return prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: permission.id,
      },
    });
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(roleName: string, permissionId: string) {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId: role.id,
          permissionId: permissionId,
        },
      },
    });

    return { message: 'Permission removed from role' };
  }

  /**
   * Assign permission directly to user (for special cases)
   */
  async assignPermissionToUser(userId: string, permissionId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    // Check if already assigned
    const existing = await prisma.userPermission.findUnique({
      where: {
        userId_permissionId: {
          userId: user.id,
          permissionId: permission.id,
        },
      },
    });

    if (existing) {
      throw new Error('Permission already assigned to user');
    }

    return prisma.userPermission.create({
      data: {
        userId: user.id,
        permissionId: permission.id,
      },
    });
  }

  /**
   * Remove permission from user
   */
  async removePermissionFromUser(userId: string, permissionId: string) {
    await prisma.userPermission.delete({
      where: {
        userId_permissionId: {
          userId: userId,
          permissionId: permissionId,
        },
      },
    });

    return { message: 'Permission removed from user' };
  }

  /**
   * Check if user has permission
   */
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Check direct user permissions
    const hasDirectPermission = user.permissions.some(
      (up) => up.permission.resource === resource && up.permission.action === action
    );

    if (hasDirectPermission) {
      return true;
    }

    // Check role-based permissions
    const role = await prisma.role.findUnique({
      where: { name: user.role },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      return false;
    }

    const hasRolePermission = role.permissions.some(
      (rp) => rp.permission.resource === resource && rp.permission.action === action
    );

    return hasRolePermission;
  }

  /**
   * Get all permissions for a user (role + direct)
   */
  async getUserPermissions(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get role permissions
    const role = await prisma.role.findUnique({
      where: { name: user.role },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    const rolePermissions = role?.permissions.map((rp) => rp.permission) || [];
    const directPermissions = user.permissions.map((up) => up.permission);

    // Combine and deduplicate
    const allPermissions = [...rolePermissions, ...directPermissions];
    const uniquePermissions = Array.from(
      new Map(allPermissions.map((p) => [p.id, p])).values()
    );

    return uniquePermissions;
  }

  /**
   * Initialize default roles and permissions
   */
  async initializeDefaultRolesAndPermissions() {
    // Define default permissions
    const defaultPermissions = [
      // Patient permissions
      { resource: 'patients', action: 'read', description: 'View patient records' },
      { resource: 'patients', action: 'update', description: 'Update patient records' },
      { resource: 'appointments', action: 'create', description: 'Create appointments' },
      { resource: 'appointments', action: 'read', description: 'View appointments' },
      { resource: 'appointments', action: 'update', description: 'Update appointments' },
      { resource: 'appointments', action: 'delete', description: 'Cancel appointments' },
      { resource: 'medications', action: 'read', description: 'View medications' },
      { resource: 'reports', action: 'read', description: 'View diagnostic reports' },
      
      // Doctor permissions
      { resource: 'encounters', action: 'create', description: 'Create clinical encounters' },
      { resource: 'encounters', action: 'read', description: 'View clinical encounters' },
      { resource: 'encounters', action: 'update', description: 'Update clinical encounters' },
      { resource: 'prescriptions', action: 'create', description: 'Create prescriptions' },
      { resource: 'prescriptions', action: 'read', description: 'View prescriptions' },
      { resource: 'prescriptions', action: 'update', description: 'Update prescriptions' },
      { resource: 'diagnostics', action: 'create', description: 'Order diagnostic tests' },
      { resource: 'diagnostics', action: 'read', description: 'View diagnostic results' },
      
      // Nurse permissions
      { resource: 'vitals', action: 'create', description: 'Record vital signs' },
      { resource: 'vitals', action: 'read', description: 'View vital signs' },
      { resource: 'medications', action: 'administer', description: 'Administer medications' },
      { resource: 'tasks', action: 'read', description: 'View assigned tasks' },
      { resource: 'tasks', action: 'update', description: 'Update task status' },
      
      // Admin permissions
      { resource: 'users', action: 'create', description: 'Create users' },
      { resource: 'users', action: 'read', description: 'View users' },
      { resource: 'users', action: 'update', description: 'Update users' },
      { resource: 'users', action: 'delete', description: 'Delete users' },
      { resource: 'facilities', action: 'create', description: 'Create facilities' },
      { resource: 'facilities', action: 'read', description: 'View facilities' },
      { resource: 'facilities', action: 'update', description: 'Update facilities' },
      { resource: 'facilities', action: 'delete', description: 'Delete facilities' },
      { resource: 'reports', action: 'create', description: 'Generate reports' },
      { resource: 'audit', action: 'read', description: 'View audit logs' },
      
      // Public health permissions
      { resource: 'surveillance', action: 'read', description: 'View disease surveillance data' },
      { resource: 'surveillance', action: 'create', description: 'Create surveillance reports' },
      { resource: 'outbreaks', action: 'read', description: 'View outbreak data' },
      { resource: 'outbreaks', action: 'update', description: 'Update outbreak status' },
      { resource: 'analytics', action: 'read', description: 'View analytics dashboards' },
    ];

    // Create permissions
    const createdPermissions: any[] = [];
    for (const perm of defaultPermissions) {
      try {
        const permission = await prisma.permission.upsert({
          where: {
            resource_action: {
              resource: perm.resource,
              action: perm.action,
            },
          },
          update: {},
          create: perm,
        });
        createdPermissions.push(permission);
      } catch (error) {
        console.error(`Failed to create permission ${perm.resource}:${perm.action}`, error);
      }
    }

    // Define default roles
    const defaultRoles = [
      {
        name: 'patient',
        description: 'Patient role with access to personal health records',
        permissions: ['patients:read', 'patients:update', 'appointments:create', 'appointments:read', 
                     'appointments:update', 'appointments:delete', 'medications:read', 'reports:read'],
      },
      {
        name: 'doctor',
        description: 'Doctor role with full clinical access',
        permissions: ['patients:read', 'encounters:create', 'encounters:read', 'encounters:update',
                     'prescriptions:create', 'prescriptions:read', 'prescriptions:update',
                     'diagnostics:create', 'diagnostics:read', 'reports:read', 'vitals:read'],
      },
      {
        name: 'nurse',
        description: 'Nurse role with care delivery access',
        permissions: ['patients:read', 'encounters:read', 'vitals:create', 'vitals:read',
                     'medications:read', 'medications:administer', 'tasks:read', 'tasks:update',
                     'prescriptions:read'],
      },
      {
        name: 'admin',
        description: 'Administrator role with full system access',
        permissions: ['users:create', 'users:read', 'users:update', 'users:delete',
                     'facilities:create', 'facilities:read', 'facilities:update', 'facilities:delete',
                     'reports:create', 'reports:read', 'audit:read', 'patients:read', 'encounters:read'],
      },
      {
        name: 'public_health',
        description: 'Public health official role with surveillance access',
        permissions: ['surveillance:read', 'surveillance:create', 'outbreaks:read', 'outbreaks:update',
                     'analytics:read', 'reports:read'],
      },
    ];

    // Create roles and assign permissions
    for (const roleData of defaultRoles) {
      try {
        const role = await prisma.role.upsert({
          where: { name: roleData.name },
          update: { description: roleData.description },
          create: {
            name: roleData.name,
            description: roleData.description,
          },
        });

        // Assign permissions to role
        for (const permString of roleData.permissions) {
          const [resource, action] = permString.split(':');
          const permission = createdPermissions.find(
            (p) => p.resource === resource && p.action === action
          );

          if (permission) {
            await prisma.rolePermission.upsert({
              where: {
                roleId_permissionId: {
                  roleId: role.id,
                  permissionId: permission.id,
                },
              },
              update: {},
              create: {
                roleId: role.id,
                permissionId: permission.id,
              },
            });
          }
        }
      } catch (error) {
        console.error(`Failed to create role ${roleData.name}`, error);
      }
    }

    return { message: 'Default roles and permissions initialized' };
  }
}

export const rbacService = new RBACService();
