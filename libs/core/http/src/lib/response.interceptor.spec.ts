import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  it('wraps the handler result in a success envelope', async () => {
    const interceptor = new ResponseInterceptor<{ id: number }>();
    const handler: CallHandler<{ id: number }> = {
      handle: () => of({ id: 42 }),
    };

    const result = await firstValueFrom(
      interceptor.intercept({} as ExecutionContext, handler),
    );

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 42 });
    expect(result.meta.timestamp).toEqual(expect.any(String));
  });
});
