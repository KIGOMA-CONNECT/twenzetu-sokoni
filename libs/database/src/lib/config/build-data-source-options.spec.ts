import { buildDataSourceOptions } from './build-data-source-options';

describe('buildDataSourceOptions', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('defaults to localhost postgres with the afri_owner dev credentials', () => {
    delete process.env['DB_HOST'];
    delete process.env['DB_PORT'];
    delete process.env['DB_NAME'];
    delete process.env['DB_OWNER_USER'];
    delete process.env['DB_OWNER_PASSWORD'];

    const options = buildDataSourceOptions();

    expect(options).toMatchObject({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'afri_market',
      username: 'afri_owner',
      password: 'afri_owner_dev_password',
    });
  });

  it('reads connection settings from the environment when present', () => {
    process.env['DB_HOST'] = 'db.example.com';
    process.env['DB_PORT'] = '5433';
    process.env['DB_NAME'] = 'afri_market_prod';
    process.env['DB_OWNER_USER'] = 'prod_owner';
    process.env['DB_OWNER_PASSWORD'] = 'prod-secret';

    const options = buildDataSourceOptions();

    expect(options).toMatchObject({
      host: 'db.example.com',
      port: 5433,
      database: 'afri_market_prod',
      username: 'prod_owner',
      password: 'prod-secret',
    });
  });

  it('defaults to no entities and no migrations', () => {
    const options = buildDataSourceOptions();

    expect(options.entities).toEqual([]);
    expect(options.migrations).toEqual([]);
  });

  it('synchronizes only in development or when explicitly enabled', () => {
    process.env['APP_ENV'] = 'development';
    delete process.env['DB_SYNCHRONIZE'];

    expect(buildDataSourceOptions().synchronize).toBe(true);

    process.env['APP_ENV'] = 'production';
    delete process.env['DB_SYNCHRONIZE'];

    expect(buildDataSourceOptions().synchronize).toBe(false);

    process.env['APP_ENV'] = 'production';
    process.env['DB_SYNCHRONIZE'] = 'true';

    expect(buildDataSourceOptions().synchronize).toBe(true);
  });
});
