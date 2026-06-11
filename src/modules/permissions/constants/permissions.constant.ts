export const RESOURCES = {
  USERS: 'users',
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  AUTH: 'auth',
  DASHBOARD: 'dashboard',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  AUDIT: 'audit',
  SPORTS: 'sports',
  TEAMS: 'teams',
  PLAYERS: 'players',
  MATCHES: 'matches',
  TOURNAMENTS: 'tournaments',
  SUBSCRIPTIONS: 'subscriptions',
  BILLING: 'billing',
} as const;

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  EXPORT: 'export',
  ASSIGN: 'assign',
  REVOKE: 'revoke',
  IMPERSONATE: 'impersonate',
} as const;

export interface PermissionDefinition {
  resource: string;
  action: string;
  name: string;
  description: string;
  group: string;
}

export const ALL_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // Users
  {
    resource: 'users',
    action: 'create',
    name: 'users:create',
    description: 'Create new users',
    group: 'Users',
  },
  {
    resource: 'users',
    action: 'read',
    name: 'users:read',
    description: 'View user list and profiles',
    group: 'Users',
  },
  {
    resource: 'users',
    action: 'update',
    name: 'users:update',
    description: 'Update user information',
    group: 'Users',
  },
  {
    resource: 'users',
    action: 'delete',
    name: 'users:delete',
    description: 'Delete / deactivate users',
    group: 'Users',
  },
  {
    resource: 'users',
    action: 'manage',
    name: 'users:manage',
    description: 'Full user management access',
    group: 'Users',
  },
  {
    resource: 'users',
    action: 'impersonate',
    name: 'users:impersonate',
    description: 'Login as another user',
    group: 'Users',
  },

  // Roles
  {
    resource: 'roles',
    action: 'create',
    name: 'roles:create',
    description: 'Create new roles',
    group: 'Roles',
  },
  {
    resource: 'roles',
    action: 'read',
    name: 'roles:read',
    description: 'View roles',
    group: 'Roles',
  },
  {
    resource: 'roles',
    action: 'update',
    name: 'roles:update',
    description: 'Update roles',
    group: 'Roles',
  },
  {
    resource: 'roles',
    action: 'delete',
    name: 'roles:delete',
    description: 'Delete roles',
    group: 'Roles',
  },
  {
    resource: 'roles',
    action: 'assign',
    name: 'roles:assign',
    description: 'Assign roles to users',
    group: 'Roles',
  },

  // Permissions
  {
    resource: 'permissions',
    action: 'create',
    name: 'permissions:create',
    description: 'Create permissions',
    group: 'Permissions',
  },
  {
    resource: 'permissions',
    action: 'read',
    name: 'permissions:read',
    description: 'View permissions',
    group: 'Permissions',
  },
  {
    resource: 'permissions',
    action: 'update',
    name: 'permissions:update',
    description: 'Update permissions',
    group: 'Permissions',
  },
  {
    resource: 'permissions',
    action: 'delete',
    name: 'permissions:delete',
    description: 'Delete permissions',
    group: 'Permissions',
  },
  {
    resource: 'permissions',
    action: 'assign',
    name: 'permissions:assign',
    description: 'Assign permissions to roles',
    group: 'Permissions',
  },

  // Auth
  {
    resource: 'auth',
    action: 'read',
    name: 'auth:read',
    description: 'View auth/session data',
    group: 'Auth',
  },
  {
    resource: 'auth',
    action: 'revoke',
    name: 'auth:revoke',
    description: 'Revoke user sessions',
    group: 'Auth',
  },
  {
    resource: 'auth',
    action: 'manage',
    name: 'auth:manage',
    description: 'Full auth management',
    group: 'Auth',
  },

  // Dashboard
  {
    resource: 'dashboard',
    action: 'read',
    name: 'dashboard:read',
    description: 'View dashboard',
    group: 'Dashboard',
  },
  {
    resource: 'dashboard',
    action: 'manage',
    name: 'dashboard:manage',
    description: 'Manage dashboard widgets',
    group: 'Dashboard',
  },

  // Reports
  {
    resource: 'reports',
    action: 'read',
    name: 'reports:read',
    description: 'View reports',
    group: 'Reports',
  },
  {
    resource: 'reports',
    action: 'create',
    name: 'reports:create',
    description: 'Generate reports',
    group: 'Reports',
  },
  {
    resource: 'reports',
    action: 'export',
    name: 'reports:export',
    description: 'Export reports',
    group: 'Reports',
  },
  {
    resource: 'reports',
    action: 'manage',
    name: 'reports:manage',
    description: 'Full reports access',
    group: 'Reports',
  },

  // Settings
  {
    resource: 'settings',
    action: 'read',
    name: 'settings:read',
    description: 'View settings',
    group: 'Settings',
  },
  {
    resource: 'settings',
    action: 'update',
    name: 'settings:update',
    description: 'Update settings',
    group: 'Settings',
  },
  {
    resource: 'settings',
    action: 'manage',
    name: 'settings:manage',
    description: 'Full settings access',
    group: 'Settings',
  },

  // Audit
  {
    resource: 'audit',
    action: 'read',
    name: 'audit:read',
    description: 'View audit logs',
    group: 'Audit',
  },
  {
    resource: 'audit',
    action: 'export',
    name: 'audit:export',
    description: 'Export audit logs',
    group: 'Audit',
  },

  // Sports
  {
    resource: 'sports',
    action: 'create',
    name: 'sports:create',
    description: 'Create sports',
    group: 'Sports',
  },
  {
    resource: 'sports',
    action: 'read',
    name: 'sports:read',
    description: 'View sports',
    group: 'Sports',
  },
  {
    resource: 'sports',
    action: 'update',
    name: 'sports:update',
    description: 'Update sports',
    group: 'Sports',
  },
  {
    resource: 'sports',
    action: 'delete',
    name: 'sports:delete',
    description: 'Delete sports',
    group: 'Sports',
  },

  // organizations
  {
    resource: 'organizations',
    action: 'create',
    name: 'organizations:create',
    description: 'Create organizations',
    group: 'Organizations',
  },
  {
    resource: 'organizations',
    action: 'read',
    name: 'organizations:read',
    description: 'View organizations',
    group: 'Organizations',
  },
  {
    resource: 'organizations',
    action: 'update',
    name: 'organizations:update',
    description: 'Update organizations',
    group: 'Organizations',
  },
  {
    resource: 'organizations',
    action: 'delete',
    name: 'organizations:delete',
    description: 'Delete organizations',
    group: 'Organizations',
  },

  // Teams
  {
    resource: 'teams',
    action: 'create',
    name: 'teams:create',
    description: 'Create teams',
    group: 'Teams',
  },
  {
    resource: 'teams',
    action: 'read',
    name: 'teams:read',
    description: 'View teams',
    group: 'Teams',
  },
  {
    resource: 'teams',
    action: 'update',
    name: 'teams:update',
    description: 'Update teams',
    group: 'Teams',
  },
  {
    resource: 'teams',
    action: 'delete',
    name: 'teams:delete',
    description: 'Delete teams',
    group: 'Teams',
  },

  // Players
  {
    resource: 'players',
    action: 'create',
    name: 'players:create',
    description: 'Create players',
    group: 'Players',
  },
  {
    resource: 'players',
    action: 'read',
    name: 'players:read',
    description: 'View players',
    group: 'Players',
  },
  {
    resource: 'players',
    action: 'update',
    name: 'players:update',
    description: 'Update players',
    group: 'Players',
  },
  {
    resource: 'players',
    action: 'delete',
    name: 'players:delete',
    description: 'Delete players',
    group: 'Players',
  },

  // Matches
  {
    resource: 'matches',
    action: 'create',
    name: 'matches:create',
    description: 'Create matches',
    group: 'Matches',
  },
  {
    resource: 'matches',
    action: 'read',
    name: 'matches:read',
    description: 'View matches',
    group: 'Matches',
  },
  {
    resource: 'matches',
    action: 'update',
    name: 'matches:update',
    description: 'Update matches',
    group: 'Matches',
  },
  {
    resource: 'matches',
    action: 'delete',
    name: 'matches:delete',
    description: 'Delete matches',
    group: 'Matches',
  },

  // Tournaments
  {
    resource: 'tournaments',
    action: 'create',
    name: 'tournaments:create',
    description: 'Create tournaments',
    group: 'Tournaments',
  },
  {
    resource: 'tournaments',
    action: 'read',
    name: 'tournaments:read',
    description: 'View tournaments',
    group: 'Tournaments',
  },
  {
    resource: 'tournaments',
    action: 'update',
    name: 'tournaments:update',
    description: 'Update tournaments',
    group: 'Tournaments',
  },
  {
    resource: 'tournaments',
    action: 'delete',
    name: 'tournaments:delete',
    description: 'Delete tournaments',
    group: 'Tournaments',
  },
  {
    resource: 'tournaments',
    action: 'manage',
    name: 'tournaments:manage',
    description: 'Full tournament management',
    group: 'Tournaments',
  },

  // Subscriptions
  {
    resource: 'subscriptions',
    action: 'create',
    name: 'subscriptions:create',
    description: 'Create subscriptions',
    group: 'Subscriptions',
  },
  {
    resource: 'subscriptions',
    action: 'read',
    name: 'subscriptions:read',
    description: 'View subscriptions',
    group: 'Subscriptions',
  },
  {
    resource: 'subscriptions',
    action: 'update',
    name: 'subscriptions:update',
    description: 'Update subscriptions',
    group: 'Subscriptions',
  },
  {
    resource: 'subscriptions',
    action: 'delete',
    name: 'subscriptions:delete',
    description: 'Delete subscriptions',
    group: 'Subscriptions',
  },

  // Billing
  {
    resource: 'billing',
    action: 'read',
    name: 'billing:read',
    description: 'View billing info',
    group: 'Billing',
  },
  {
    resource: 'billing',
    action: 'manage',
    name: 'billing:manage',
    description: 'Manage billing',
    group: 'Billing',
  },
];

export const ALL_PERMISSION_NAMES = ALL_PERMISSION_DEFINITIONS.map(
  (p) => p.name,
);

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ALL_PERMISSION_NAMES,

  admin: [
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'users:manage',
    'roles:read',
    'roles:assign',
    'permissions:read',
    'dashboard:read',
    'dashboard:manage',
    'reports:read',
    'reports:create',
    'reports:export',
    'settings:read',
    'settings:update',
    'audit:read',
    'sports:create',
    'sports:read',
    'sports:update',
    'sports:delete',
    'teams:create',
    'teams:read',
    'teams:update',
    'teams:delete',
    'organizations:create',
    'organizations:read',
    'organizations:update',
    'organizations:delete',
    'players:create',
    'players:read',
    'players:update',
    'players:delete',
    'leagues:create',
    'leagues:read',
    'leagues:update',
    'leagues:delete',
    'matches:create',
    'matches:read',
    'matches:update',
    'matches:delete',
    'tournaments:create',
    'tournaments:read',
    'tournaments:update',
    'tournaments:delete',
    'tournaments:manage',
    'subscriptions:read',
    'billing:read',
  ],

  manager: [
    'users:read',
    'dashboard:read',
    'reports:read',
    'reports:create',
    'sports:read',
    'sports:create',
    'sports:update',
    'teams:read',
    'teams:create',
    'teams:update',
    'players:read',
    'players:create',
    'players:update',
    'matches:read',
    'matches:create',
    'matches:update',
    'tournaments:read',
    'tournaments:create',
    'tournaments:update',
    'subscriptions:read',
  ],

  staff: [
    'users:read',
    'dashboard:read',
    'sports:read',
    'sports:create',
    'teams:read',
    'players:read',
    'matches:read',
    'matches:create',
    'tournaments:read',
  ],

  member: [
    'dashboard:read',
    'sports:read',
    'teams:read',
    'players:read',
    'matches:read',
    'tournaments:read',
  ],
};
