import { DatabaseConfig } from '@abms/core-config';
import { DataSourceOptions } from 'typeorm';

export interface DataSourceRoleCredentials {
  readonly username: string;
  readonly password: string;
}

export interface DataSourceOptionsOverrides {
  readonly entities?: DataSourceOptions['entities'];
  readonly migrations?: DataSourceOptions['migrations'];
}

const DEFAULT_MIGRATIONS_GLOB = ['libs/database/src/lib/migrations/*.migration.ts'];

// entities/migrations default to database's own only; the composition root (apps/api) is
// the one place allowed to know about every module, so it passes the full aggregated
// arrays here rather than this library hardcoding awareness of any specific module.
export function buildDataSourceOptions(
  database: DatabaseConfig,
  credentials: DataSourceRoleCredentials,
  overrides: DataSourceOptionsOverrides = {},
): DataSourceOptions {
  return {
    type: 'postgres',
    host: database.host,
    port: database.port,
    database: database.name,
    username: credentials.username,
    password: credentials.password,
    ssl: database.ssl ? { rejectUnauthorized: false } : false,
    poolSize: database.poolMax,
    entities: overrides.entities ?? [],
    migrations: overrides.migrations ?? DEFAULT_MIGRATIONS_GLOB,
    synchronize: false,
    migrationsRun: false,
    logging: false,
  };
}
