import type { UserRole } from '../../users/enums/user.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: UserRole;
  isSuperAdmin: boolean;
  permissions: string[];
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  email: string;
  type: 'refresh';
}

export interface RequestUser {
  _id: string;
  email: string;
  username: string;
  role: UserRole;
  isSuperAdmin: boolean;
  permissions: string[];
}
