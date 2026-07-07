import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './config/build-data-source-options';

const config = new AppConfigService(process.env);

export default new DataSource(
  buildDataSourceOptions(config.database, {
    username: config.database.ownerUser,
    password: config.database.ownerPassword,
  }),
);
