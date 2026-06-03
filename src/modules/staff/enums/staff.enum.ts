export enum StaffStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum OrgAccessType {
  NO_ACCESS = 'no_access',
  FULL_ACCESS = 'full_access',
  LIMITED = 'limited_access',
}

export enum StaffResource {
  ORGANIZATION = 'organization',
  TEAMS = 'teams',
  PLAYERS = 'players',
  LEAGUES = 'leagues',
}

export enum ResourcePermission {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  MANAGE = 'manage',
}
