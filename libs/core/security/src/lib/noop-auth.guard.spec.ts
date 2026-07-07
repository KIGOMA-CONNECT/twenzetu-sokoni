import { NoopAuthGuard } from './noop-auth.guard';

describe('NoopAuthGuard', () => {
  it('always allows the request through', () => {
    const guard = new NoopAuthGuard();

    expect(guard.canActivate()).toBe(true);
  });
});
