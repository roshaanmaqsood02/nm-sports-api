import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap, catchError, throwError, from, switchMap } from 'rxjs';
import { Request } from 'express';
import { AUDIT_KEY, AuditMetadata } from '../decorators/audit-log.decorator';
import { AuditService } from '../audit.service';
import { AuditSeverity, AuditStatus } from '../enums/audit.enum';
import { RequestUser } from '../../auth/interfaces/jwt-payload.interface';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const meta = this.reflector.get<AuditMetadata>(
      AUDIT_KEY,
      context.getHandler(),
    );

    if (!meta) return next.handle();

    const req: Request = context.switchToHttp().getRequest();
    const user: RequestUser | undefined = (req as any).user;
    const start = Date.now();

    const baseAudit = {
      action: meta.action,
      resource: meta.resource,
      severity: meta.severity ?? AuditSeverity.LOW,
      userId: user?._id,
      userEmail: user?.email,
      username: user?.username,
      userRole: user?.role,
      ipAddress:
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] ??
        req.socket?.remoteAddress ??
        'unknown',
      userAgent: req.headers['user-agent'] ?? 'unknown',
      httpMethod: req.method,
      endpoint: req.originalUrl,
      newValue: meta.captureBody ? this.sanitizeBody(req.body) : undefined,
    };

    return next.handle().pipe(
      // ✅ Use switchMap to handle async audit logging while passing data through
      switchMap((responseData) =>
        from(
          this.auditService.record({
            ...baseAudit,
            status: AuditStatus.SUCCESS,
            duration: Date.now() - start,
            resourceId: this.extractResourceId(responseData),
            metadata: meta.captureResponse
              ? { response: this.sanitizeResponse(responseData) }
              : undefined,
          }),
        ).pipe(
          // ✅ Always return the original responseData, not the audit result
          tap(() => {}),
          switchMap(() => [responseData]),
        ),
      ),

      // ✅ catchError must return an Observable synchronously
      catchError((err) => {
        // Fire-and-forget the audit log — don't await it in the chain
        this.auditService
          .record({
            ...baseAudit,
            status: AuditStatus.FAILURE,
            duration: Date.now() - start,
            reason: err?.message ?? 'Unknown error',
            severity: AuditSeverity.HIGH,
          })
          .catch(console.error);

        return throwError(() => err);
      }),
    );
  }

  private sanitizeBody(body: Record<string, any>): Record<string, any> {
    if (!body) return {};
    const { password, confirmPassword, refreshToken, token, ...safe } = body;
    return safe;
  }

  private extractResourceId(response: any): string | undefined {
    return (
      response?._id?.toString() ??
      response?.id?.toString() ??
      response?.data?._id?.toString() ??
      undefined
    );
  }

  private sanitizeResponse(response: any): any {
    if (!response) return null;
    const str = JSON.stringify(response);
    return str.length > 2048
      ? { truncated: true, preview: str.slice(0, 200) }
      : response;
  }
}
