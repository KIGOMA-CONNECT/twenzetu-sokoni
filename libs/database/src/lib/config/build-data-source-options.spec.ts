import { DatabaseConfig } from '@abms/core-config';
import { buildDataSourceOptions } from './build-data-source-options';

function fakeDatabaseConfig(overrides: Partial<DatabaseConfig> = {}): DatabaseConfig {
  return {
    host: 'localhost',
    port: 5432,
    name: 'abms',
    ssl: false,
    poolMax: 20,
    ownerUser: 'abms_owner',
    ownerPassword: 'owner-secret',
    runtimeUser: 'abms_runtime',
    runtimePassword: 'runtime-secret',
    ...overrides,
  };
}

describe('buildDataSourceOptions', () => {
  it('builds postgres connection options from the given role credentials', () => {
    const options = buildDataSourceOptions(fakeDatabaseConfig(), {
      username: 'abms_runtime',
      password: 'runtime-secret',
    });

    expect(options).toMatchObject({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      database: 'abms',
      username: 'abms_runtime',
      password: 'runtime-secret',
      ssl: false,
      poolSize: 20,
      synchronize: false,
      migrationsRun: false,
    });
  });

  it('enables ssl with a relaxed CA check when the config requests it', () => {
    const options = buildDataSourceOptions(fakeDatabaseConfig({ ssl: true }), {
      username: 'abms_owner',
      password: 'owner-secret',
    });

    if (options.type !== 'postgres') {
      throw new Error('expected postgres data source options');
    }
    expect(options.ssl).toEqual({ rejectUnauthorized: false });
  });

  it('never enables synchronize, regardless of config', () => {
    const options = buildDataSourceOptions(fakeDatabaseConfig(), {
      username: 'abms_owner',
      password: 'owner-secret',
    });

    expect(options.synchronize).toBe(false);
  });

  it('defaults to no entities and the database library\'s own migrations glob', () => {
    const options = buildDataSourceOptions(fakeDatabaseConfig(), {
      username: 'abms_owner',
      password: 'owner-secret',
    });

    expect(options.entities).toEqual([]);
    expect(options.migrations).toEqual(['libs/database/src/lib/migrations/*.migration.ts']);
  });

  it('lets a composition root override entities and migrations', () => {
    class FakeEntity {}

    const options = buildDataSourceOptions(
      fakeDatabaseConfig(),
      { username: 'abms_owner', password: 'owner-secret' },
      { entities: [FakeEntity], migrations: ['libs/modules/organization/**/*.migration.ts'] },
    );

    expect(options.entities).toEqual([FakeEntity]);
    expect(options.migrations).toEqual(['libs/modules/organization/**/*.migration.ts']);
  });
});
