import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Record<string, unknown>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(async () => {
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
          try {
            await (this.cacheManager as { reset?: () => Promise<void> }).reset?.();
          } catch { /* cache invalidation is best-effort */ }
        }
      }),
    );
  }
}
