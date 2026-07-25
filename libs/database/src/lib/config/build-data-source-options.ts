import { DataSourceOptions } from 'typeorm';

export function buildDataSourceOptions(): DataSourceOptions {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_OWNER_USER || 'afri_owner',
    password: process.env.DB_OWNER_PASSWORD || 'afri_owner_dev_password',
    database: process.env.DB_NAME || 'afri_market',
    entities: [],
    migrations: [],
    synchronize: process.env.DB_SYNCHRONIZE === 'true' || process.env.APP_ENV === 'development',
  };
}
