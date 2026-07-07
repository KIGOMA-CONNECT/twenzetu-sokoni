import { DatabaseConfig } from '@abms/core-config';
import { DataSourceOptions } from 'typeorm';

export interface DataSourceRoleCredentials {
  readonly username: string;
  readonly password: string;
}

export function buildDataSourceOptions(
  database: DatabaseConfig,
  credentials: DataSourceRoleCredentials,
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
    entities: [],
    migrations: ['libs/database/src/lib/migrations/*.migration.ts'],
    synchronize: false,
    migrationsRun: false,
    logging: false,
  };
}
