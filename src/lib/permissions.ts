import type { UserRole } from '@/types';

// Permission definitions
export const PERMISSIONS = {
  // Events
  'events:create': ['super_admin', 'coordinator', 'hermano', 'dance_leader'],
  'events:edit': ['super_admin', 'coordinator', 'hermano'],
  'events:delete': ['super_admin', 'coordinator'],
  'events:view_internal': ['super_admin', 'coordinator', 'hermano', 'dance_leader', 'sinulog_queen', 'dancer'],

  // Prayer Requests
  'requests:view_all': ['super_admin', 'coordinator', 'hermano'],
  'requests:assign': ['super_admin', 'coordinator', 'hermano'],
  'requests:respond': ['super_admin', 'coordinator', 'hermano'],

  // House Visits
  'visits:manage': ['super_admin', 'coordinator', 'hermano'],

  // Dance
  'dance:manage_schedule': ['super_admin', 'dance_leader'],
  'dance:take_attendance': ['super_admin', 'dance_leader'],
  'dance:view_group': ['super_admin', 'dance_leader', 'dancer'],

  // Users
  'users:manage': ['super_admin'],
  'users:view_all': ['super_admin', 'coordinator'],
  'users:assign_roles': ['super_admin', 'coordinator'],
  'users:view_contact': ['super_admin', 'coordinator', 'hermano'],

  // Announcements
  'announcements:create': ['super_admin', 'coordinator', 'hermano'],
  'announcements:edit': ['super_admin', 'coordinator'],
  'casting:manage': ['super_admin', 'coordinator'],

  // Areas
  'areas:manage': ['super_admin'],
  'areas:view_members': ['super_admin', 'coordinator', 'hermano'],

  // Admin
  'admin:access': ['super_admin', 'coordinator'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userRoles: string[],
  permission: Permission
): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly string[];
  return userRoles.some((role) => allowedRoles.includes(role));
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(userRoles: string[], roles: UserRole[]): boolean {
  return userRoles.some((role) => roles.includes(role as UserRole));
}

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(userRoles: string[]): boolean {
  return userRoles.includes('super_admin');
}

/**
 * Check if user is a coordinator
 */
export function isCoordinator(userRoles: string[]): boolean {
  return userRoles.includes('coordinator') || userRoles.includes('super_admin');
}

/**
 * Check if user is a hermano/hermana
 */
export function isHermano(userRoles: string[]): boolean {
  return (
    userRoles.includes('hermano') ||
    userRoles.includes('coordinator') ||
    userRoles.includes('super_admin')
  );
}

/**
 * Check if user can manage requests (prayer/visits)
 */
export function canManageRequests(userRoles: string[]): boolean {
  return hasPermission(userRoles, 'requests:view_all');
}

/**
 * Get user's active roles as array
 */
export function getActiveRoles(
  roles: { role: string; is_active: boolean }[]
): string[] {
  return roles.filter((r) => r.is_active).map((r) => r.role);
}

/**
 * Role display names
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  coordinator: 'Area Coordinator',
  hermano: 'Hermano/Hermana',
  dance_leader: 'Dance Leader',
  sinulog_queen: 'Sinulog Queen',
  dancer: 'Dancer',
  devotee: 'Devotee',
};

/**
 * Role colors for badges
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'red',
  coordinator: 'orange',
  hermano: 'gold',
  dance_leader: 'purple',
  sinulog_queen: 'magenta',
  dancer: 'blue',
  devotee: 'default',
};
