import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppLoggerService } from '@afri-market/core-logger';

const NOISY_PREFIXES = ['/health', '/metrics'];

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const userId = req.user?.sub ?? 'anonymous';
    const tenantId = req.user?.tenantId ?? '-';
    const start = Date.now();
    // Health/metrics probes are polled every few seconds by monitor.sh and
    // uptime checks — keep them at DEBUG so INFO stays a useful request trail.
    const isProbe = NOISY_PREFIXES.some((p) => url === p || url.startsWith(`${p}?`) || url.startsWith(`${p}/`));

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        const res = context.switchToHttp().getResponse();
        const line = `${method} ${url} ${res.statusCode} ${ms}ms [user=${userId} tenant=${tenantId}]`;
        if (isProbe) {
          this.logger.debug(line, 'HTTP');
        } else {
          this.logger.log(line, 'HTTP');
        }
      }),
    );
  }
}
