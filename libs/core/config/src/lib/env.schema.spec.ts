import { parseEnv } from './env.schema';

function validSource(overrides: Partial<NodeJS.ProcessEnv> = {}): NodeJS.ProcessEnv {
  return {
    DB_HOST: 'localhost',
    DB_NAME: 'abms',
    DB_SSL: 'false',
    DB_OWNER_USER: 'abms_owner',
    DB_OWNER_PASSWORD: 'owner-secret',
    DB_RUNTIME_USER: 'abms_runtime',
    DB_RUNTIME_PASSWORD: 'runtime-secret',
    LOG_LEVEL: 'info',
    LOG_PRETTY: 'false',
    JWT_SECRET: 'a'.repeat(32),
    ...overrides,
  } as NodeJS.ProcessEnv;
}

describe('parseEnv', () => {
  it('parses a fully valid environment and applies defaults', () => {
    const env = parseEnv(validSource());

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.DB_PORT).toBe(5432);
    expect(env.DB_POOL_MAX).toBe(20);
    expect(env.DB_SSL).toBe(false);
    expect(env.JWT_EXPIRES_IN).toBe('1h');
  });

  it('throws when JWT_SECRET is shorter than 32 characters', () => {
    expect(() => parseEnv(validSource({ JWT_SECRET: 'too-short' }))).toThrow();
  });

  it('coerces numeric string env vars into numbers', () => {
    const env = parseEnv(validSource({ PORT: '4000', DB_PORT: '6543' }));

    expect(env.PORT).toBe(4000);
    expect(env.DB_PORT).toBe(6543);
  });

  it('transforms DB_SSL="true" into a boolean true', () => {
    const env = parseEnv(validSource({ DB_SSL: 'true' }));

    expect(env.DB_SSL).toBe(true);
  });

  it('throws with a readable message when required vars are missing', () => {
    expect(() => parseEnv({} as NodeJS.ProcessEnv)).toThrow(/Invalid environment configuration/);
  });

  it('throws when NODE_ENV has an invalid value', () => {
    expect(() => parseEnv(validSource({ NODE_ENV: 'staging' }))).toThrow();
  });
});
