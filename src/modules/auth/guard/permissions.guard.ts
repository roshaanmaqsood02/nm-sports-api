import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RequestUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const { user }: { user: RequestUser } = context.switchToHttp().getRequest();

    if (user?.isSuperAdmin) return true;

    const userPermissions = new Set(user?.permissions ?? []);

    const hasAll = requiredPermissions.every((perm) =>
      userPermissions.has(perm),
    );

    if (!hasAll) {
      const missing = requiredPermissions.filter(
        (p) => !userPermissions.has(p),
      );
      throw new ForbiddenException(
        `Access denied. Missing permissions: [${missing.join(', ')}]`,
      );
    }

    return true;
  }
}
