import { AppConfigService } from './app-config.service';

const ORIGINAL_ENV = { ...process.env };

function setEnv(overrides: Record<string, string> = {}): void {
  const values: Record<string, string> = {
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
    JWT_EXPIRY: '7d',
    JWT_REFRESH_EXPIRY: '30d',
    OTP_EXPIRY_MINUTES: '5',
    OTP_LENGTH: '6',
    SMS_DEFAULT_COUNTRY: 'TZ',
    DEFAULT_CURRENCY: 'TZS',
    CORS_ORIGINS: 'http://localhost:3000',
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('AppConfigService', () => {
  it('exposes app config derived from the environment', () => {
    setEnv({ APP_ENV: 'production', APP_PORT: '8080' });
    const service = new AppConfigService();

    expect(service.app).toEqual({ port: 8080, name: 'afriMarket', env: 'production' });
  });

  it('exposes database config with the bootstrap, owner and runtime roles', () => {
    setEnv({});
    const service = new AppConfigService();

    expect(service.db).toEqual({
      host: 'db.internal',
      port: 5432,
      bootstrapUser: 'postgres',
      bootstrapPassword: 'bootstrap-secret',
      name: 'afri_market',
      ownerUser: 'afri_owner',
      ownerPassword: 'owner-secret',
      runtimeUser: 'afri_runtime',
      runtimePassword: 'runtime-secret',
    });
  });

  it('exposes jwt config', () => {
    setEnv({ JWT_SECRET: 'my-jwt-secret', JWT_EXPIRY: '2h', JWT_REFRESH_EXPIRY: '15d' });
    const service = new AppConfigService();

    expect(service.jwt).toEqual({ secret: 'my-jwt-secret', expiry: '2h', refreshExpiry: '15d' });
  });

  it('exposes sms, currency and otp config', () => {
    setEnv({
      SMS_DEFAULT_COUNTRY: 'KE',
      DEFAULT_CURRENCY: 'KES',
      OTP_EXPIRY_MINUTES: '10',
      OTP_LENGTH: '4',
    });
    const service = new AppConfigService();

    expect(service.sms).toEqual({ defaultCountry: 'KE' });
    expect(service.currency).toEqual({ defaultCurrency: 'KES' });
    expect(service.otp).toEqual({ expiryMinutes: 10, length: 4 });
  });

  it('splits CORS origins into a trimmed list', () => {
    setEnv({ CORS_ORIGINS: 'http://localhost:4200, https://app.example.com' });
    const service = new AppConfigService();

    expect(service.cors.origins).toEqual(['http://localhost:4200', 'https://app.example.com']);
  });

  it('exposes ussd config with callback secret and environment-default simulator toggle', () => {
    setEnv({ USSD_CALLBACK_SECRET: 'gw-secret', USSD_SIMULATE_ENABLED: 'true' });
    const service = new AppConfigService();

    expect(service.ussd).toEqual({ callbackSecret: 'gw-secret', simulateEnabled: true });
  });

  it('disables the ussd simulator in production unless explicitly enabled', () => {
    setEnv({ APP_ENV: 'production' });
    const service = new AppConfigService();

    expect(service.ussd).toEqual({ callbackSecret: '', simulateEnabled: false });
  });

  it('exposes beem config with default-empty credentials', () => {
    setEnv({});
    const service = new AppConfigService();

    expect(service.beem).toEqual({ apiKey: '', secretKey: '', ussdCode: '', callbackSecret: '' });
  });

  it('exposes beem config from the environment', () => {
    setEnv({
      BEEM_API_KEY: 'api-key',
      BEEM_SECRET_KEY: 'secret-key',
      BEEM_USSD_CODE: '*150*40#',
      BEEM_CALLBACK_SECRET: 'beem-secret',
    });
    const service = new AppConfigService();

    expect(service.beem).toEqual({
      apiKey: 'api-key',
      secretKey: 'secret-key',
      ussdCode: '*150*40#',
      callbackSecret: 'beem-secret',
    });
  });

  it('applies defaults for unset variables', () => {
    delete process.env['APP_PORT'];
    delete process.env['APP_NAME'];
    delete process.env['APP_ENV'];
    const service = new AppConfigService();

    expect(service.app).toEqual({ port: 3000, name: 'afriMarket', env: 'development' });
  });
});
