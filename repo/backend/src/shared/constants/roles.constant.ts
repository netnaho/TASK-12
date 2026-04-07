export const ROLES = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  LEASING_OPS_MANAGER: 'LEASING_OPS_MANAGER',
  TEST_PROCTOR: 'TEST_PROCTOR',
  ANALYST: 'ANALYST',
  STANDARD_USER: 'STANDARD_USER',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const PERMISSIONS = {
  // Users
  'users:create': 'users:create',
  'users:read': 'users:read',
  'users:update': 'users:update',
  'users:deactivate': 'users:deactivate',
  'users:assign-role': 'users:assign-role',

  // Listings
  'listings:create': 'listings:create',
  'listings:read': 'listings:read',
  'listings:update': 'listings:update',
  'listings:delete': 'listings:delete',

  // Properties
  'properties:create': 'properties:create',
  'properties:read': 'properties:read',
  'properties:update': 'properties:update',

  // Communities
  'communities:create': 'communities:create',
  'communities:read': 'communities:read',
  'communities:update': 'communities:update',

  // Metrics
  'metrics:read': 'metrics:read',
  'metrics:create-version': 'metrics:create-version',
  'metrics:lock-version': 'metrics:lock-version',
  'metrics:trigger-calc': 'metrics:trigger-calc',

  // Reports
  'reports:create': 'reports:create',
  'reports:read': 'reports:read',
  'reports:publish': 'reports:publish',
  'reports:share': 'reports:share',
  'reports:export': 'reports:export',

  // Test Center
  'test-sessions:create': 'test-sessions:create',
  'test-sessions:read': 'test-sessions:read',
  'test-sessions:update': 'test-sessions:update',
  'test-sessions:cancel': 'test-sessions:cancel',
  'test-registrations:create': 'test-registrations:create',
  'test-registrations:read': 'test-registrations:read',
  'seat-allocations:create': 'seat-allocations:create',
  'seat-allocations:read': 'seat-allocations:read',
  'seat-allocations:update': 'seat-allocations:update',

  // Notifications
  'notifications:read': 'notifications:read',
  'notifications:manage-templates': 'notifications:manage-templates',

  // Audit
  'audit:read': 'audit:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
