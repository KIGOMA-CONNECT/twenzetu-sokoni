import { envSchema } from './env.schema';

function validSource(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    APP_PORT: '8080',
    APP_NAME: 'afriMarket',
    APP_ENV: 'production',
    DB_HOST: 'db.internal',
    DB_PORT: '5432',
    DB_NAME: 'afri_market',
    DB_BOOTSTRAP_USER: 'postgres',
    DB_BOOTSTRAP_PASSWORD: 'bootstrap-secret',
    DB_OWNER_USER: 'afri_owner',
    DB_OWNER_PASSWORD: 'owner-secret',
    DB_RUNTIME_USER: 'afri_runtime',
    DB_RUNTIME_PASSWORD: 'runtime-secret',
    JWT_SECRET: 'my-jwt-secret',
    JWT_EXPIRY: '2h',
    JWT_REFRESH_EXPIRY: '15d',
    OTP_EXPIRY_MINUTES: '10',
    OTP_LENGTH: '4',
    SMS_DEFAULT_COUNTRY: 'KE',
    DEFAULT_CURRENCY: 'KES',
    CORS_ORIGINS: 'http://localhost:4200,https://app.example.com',
    ...overrides,
  };
}

describe('envSchema', () => {
  it('parses a fully valid environment', () => {
    const env = envSchema.parse(validSource());

    expect(env.APP_PORT).toBe(8080);
    expect(env.APP_NAME).toBe('afriMarket');
    expect(env.APP_ENV).toBe('production');
    expect(env.DB_HOST).toBe('db.internal');
    expect(env.DB_PORT).toBe(5432);
    expect(env.DB_OWNER_USER).toBe('afri_owner');
    expect(env.DB_RUNTIME_USER).toBe('afri_runtime');
    expect(env.JWT_SECRET).toBe('my-jwt-secret');
    expect(env.JWT_EXPIRY).toBe('2h');
    expect(env.JWT_REFRESH_EXPIRY).toBe('15d');
    expect(env.OTP_EXPIRY_MINUTES).toBe(10);
    expect(env.OTP_LENGTH).toBe(4);
    expect(env.SMS_DEFAULT_COUNTRY).toBe('KE');
    expect(env.DEFAULT_CURRENCY).toBe('KES');
    expect(env.USSD_CALLBACK_SECRET).toBe('');
    expect(env.USSD_SIMULATE_ENABLED).toBe('');
    expect(env.BEEM_API_KEY).toBe('');
    expect(env.BEEM_SECRET_KEY).toBe('');
    expect(env.BEEM_USSD_CODE).toBe('');
    expect(env.BEEM_PAYMENT_API_KEY).toBe('');
    expect(env.BEEM_PAYMENT_SECRET_KEY).toBe('');
  });

  it('applies defaults for unset variables', () => {
    const env = envSchema.parse({});

    expect(env.APP_PORT).toBe(3000);
    expect(env.APP_NAME).toBe('afriMarket');
    expect(env.APP_ENV).toBe('development');
    expect(env.DB_HOST).toBe('localhost');
    expect(env.DB_PORT).toBe(5432);
    expect(env.JWT_SECRET).toBe('dev-jwt-secret');
    expect(env.JWT_EXPIRY).toBe('7d');
    expect(env.JWT_REFRESH_EXPIRY).toBe('30d');
    expect(env.OTP_EXPIRY_MINUTES).toBe(5);
    expect(env.OTP_LENGTH).toBe(6);
    expect(env.SMS_DEFAULT_COUNTRY).toBe('TZ');
    expect(env.DEFAULT_CURRENCY).toBe('TZS');
    expect(env.CORS_ORIGINS).toBe('http://localhost:3000');
  });

  it('parses USSD callback secret and simulator toggle', () => {
    const env = envSchema.parse(validSource({ USSD_CALLBACK_SECRET: 'gw-secret', USSD_SIMULATE_ENABLED: 'true' }));

    expect(env.USSD_CALLBACK_SECRET).toBe('gw-secret');
    expect(env.USSD_SIMULATE_ENABLED).toBe('true');
  });

  it('parses Beem integration credentials', () => {
    const env = envSchema.parse(
      validSource({
        BEEM_API_KEY: 'api-key',
        BEEM_SECRET_KEY: 'secret-key',
        BEEM_USSD_CODE: '*150*40#',
        BEEM_CALLBACK_SECRET: 'beem-secret',
        BEEM_PAYMENT_API_KEY: 'pay-api-key',
        BEEM_PAYMENT_SECRET_KEY: 'pay-secret-key',
      }),
    );

    expect(env.BEEM_API_KEY).toBe('api-key');
    expect(env.BEEM_SECRET_KEY).toBe('secret-key');
    expect(env.BEEM_USSD_CODE).toBe('*150*40#');
    expect(env.BEEM_CALLBACK_SECRET).toBe('beem-secret');
    expect(env.BEEM_PAYMENT_API_KEY).toBe('pay-api-key');
    expect(env.BEEM_PAYMENT_SECRET_KEY).toBe('pay-secret-key');
  });

  it('coerces numeric string env vars into numbers', () => {
    const env = envSchema.parse(validSource({ APP_PORT: '4000', DB_PORT: '6543' }));

    expect(env.APP_PORT).toBe(4000);
    expect(env.DB_PORT).toBe(6543);
  });

  it('throws when APP_ENV has an invalid value', () => {
    expect(() => envSchema.parse(validSource({ APP_ENV: 'staging' }))).toThrow();
  });

  it('throws when OTP_EXPIRY_MINUTES is not numeric', () => {
    expect(() => envSchema.parse(validSource({ OTP_EXPIRY_MINUTES: 'abc' }))).toThrow();
  });
});
