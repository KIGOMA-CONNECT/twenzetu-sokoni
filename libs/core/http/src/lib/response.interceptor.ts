import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { SKIP_RESPONSE_TRANSFORM } from './skip-response-transform.decorator';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  public intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const skip =
      Reflect.getMetadata(SKIP_RESPONSE_TRANSFORM, context.getHandler()) ??
      Reflect.getMetadata(SKIP_RESPONSE_TRANSFORM, context.getClass());
    if (skip) {
      return next.handle();
    }
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
