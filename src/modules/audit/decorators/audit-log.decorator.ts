import { SetMetadata } from '@nestjs/common';
import { AuditAction, AuditSeverity } from '../enums/audit.enum';

export const AUDIT_KEY = 'audit_log';

export interface AuditMetadata {
  action: AuditAction;
  resource: string;
  severity?: AuditSeverity;
  captureBody?: boolean;
  captureResponse?: boolean;
}

// Usage
// @AuditLog({
//   action: AuditAction.USER_CREATED,
//   resource: 'User',
//   severity: AuditSeverity.MEDIUM,
//   captureBody: true,
// })
// @Post()
// create(@Body() dto: CreateUserDto) { ... }

export const AuditLog = (meta: AuditMetadata) => SetMetadata(AUDIT_KEY, meta);
