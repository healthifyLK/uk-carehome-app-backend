import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../apps/audit/audit.service';

@Injectable()
export class GdprAuditInterceptor implements NestInterceptor {
  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;

    // Determine action type based on HTTP method
    let action = 'READ';
    if (method === 'POST') action = 'CREATE';
    if (method === 'PUT' || method === 'PATCH') action = 'UPDATE';
    if (method === 'DELETE') action = 'DELETE';

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;
        
        // Only log for sensitive endpoints
        if (url.includes('/patients') || url.includes('/users')) {
          await this.auditService.log({
            action,
            entityType: this.extractEntityType(url),
            entityId: request.params.id,
            userId: user?.id,
            ipAddress: ip,
            userAgent: headers['user-agent'],
            status: 'SUCCESS',
            metadata: { duration, method, url },
            purpose: request.headers['x-purpose'] || 'Standard care operations',
          });
        }
      }),
    );
  }

  private extractEntityType(url: string): string {
    if (url.includes('/patients')) return 'Patient';
    if (url.includes('/users')) return 'User';
    if (url.includes('/assignments')) return 'Assignment';
    return 'Unknown';
  }
}