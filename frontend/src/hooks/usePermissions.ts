import { useMemo } from 'react';
import type { OrgRole } from '@/types';

export type Permission =
  | 'org:read'
  | 'org:write'
  | 'org:delete'
  | 'org:manageMembers'
  | 'org:manageRoles'
  | 'team:read'
  | 'team:write'
  | 'team:delete'
  | 'team:manageMembers'
  | 'channel:read'
  | 'channel:write'
  | 'channel:delete'
  | 'channel:manageMembers'
  | 'message:write'
  | 'message:delete'
  | 'meeting:create'
  | 'meeting:manage'
  | 'kanban:write'
  | 'kanban:delete';

const rolePermissions: Record<OrgRole, Permission[]> = {
  OWNER: [
    'org:read',
    'org:write',
    'org:delete',
    'org:manageMembers',
    'org:manageRoles',
    'team:read',
    'team:write',
    'team:delete',
    'team:manageMembers',
    'channel:read',
    'channel:write',
    'channel:delete',
    'channel:manageMembers',
    'message:write',
    'message:delete',
    'meeting:create',
    'meeting:manage',
    'kanban:write',
    'kanban:delete',
  ],
  ADMIN: [
    'org:read',
    'org:write',
    'org:manageMembers',
    'team:read',
    'team:write',
    'team:delete',
    'team:manageMembers',
    'channel:read',
    'channel:write',
    'channel:delete',
    'channel:manageMembers',
    'message:write',
    'message:delete',
    'meeting:create',
    'meeting:manage',
    'kanban:write',
    'kanban:delete',
  ],
  MEMBER: ['org:read', 'team:read', 'channel:read', 'message:write', 'meeting:create'],
};

export const usePermissions = (role?: OrgRole | null) => {
  const permissions = useMemo(() => new Set(role ? rolePermissions[role] : []), [role]);
  const hasPermission = (permission: Permission) => permissions.has(permission);
  return { hasPermission };
};
