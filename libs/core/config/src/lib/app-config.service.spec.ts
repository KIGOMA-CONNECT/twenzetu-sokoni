import { AppConfigService } from './app-config.service';

function validSource(overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'production',
    PORT: '8080',
    DB_HOST: 'db.internal',
    DB_PORT: '5432',
    DB_NAME: 'abms',
    DB_SSL: 'true',
    DB_POOL_MAX: '50',
    DB_OWNER_USER: 'abms_owner',
    DB_OWNER_PASSWORD: 'owner-secret',
    DB_RUNTIME_USER: 'abms_runtime',
    DB_RUNTIME_PASSWORD: 'runtime-secret',
    LOG_LEVEL: 'warn',
    LOG_PRETTY: 'false',
    JWT_SECRET: 'b'.repeat(32),
    JWT_EXPIRES_IN: '2h',
    ...overrides,
  } as NodeJS.ProcessEnv;
}

describe('AppConfigService', () => {
  it('exposes app config derived from the environment', () => {
    const service = new AppConfigService(validSource());

    expect(service.app).toEqual({
      nodeEnv: 'production',
      port: 8080,
      isProduction: true,
    });
  });

  it('exposes database config with both the owner and runtime roles', () => {
    const service = new AppConfigService(validSource());

    expect(service.database).toEqual({
      host: 'db.internal',
      port: 5432,
      name: 'abms',
      ssl: true,
      poolMax: 50,
      ownerUser: 'abms_owner',
      ownerPassword: 'owner-secret',
      runtimeUser: 'abms_runtime',
      runtimePassword: 'runtime-secret',
    });
  });

  it('exposes logging config', () => {
    const service = new AppConfigService(validSource());

    expect(service.logging).toEqual({ level: 'warn', pretty: false });
  });

  it('exposes auth config', () => {
    const service = new AppConfigService(validSource());

    expect(service.auth).toEqual({ jwtSecret: 'b'.repeat(32), jwtExpiresIn: '2h' });
  });

  it('throws at construction time when the environment is invalid', () => {
    expect(() => new AppConfigService({} as NodeJS.ProcessEnv)).toThrow();
  });
});
