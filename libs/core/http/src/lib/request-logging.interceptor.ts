import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AppLoggerService } from '@afri-market/core-logger';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const userId = req.user?.sub ?? 'anonymous';
    const tenantId = req.user?.tenantId ?? '-';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        const res = context.switchToHttp().getResponse();
        this.logger.debug(
          `${method} ${url} ${res.statusCode} ${ms}ms [user=${userId} tenant=${tenantId}]`,
          'HTTP',
        );
      }),
    );
  }
}
