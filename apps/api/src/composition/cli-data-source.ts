import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '@afri-market/database';
import { IDENTITY_ENTITIES } from '@afri-market/identity-infrastructure';
import { MARKETPLACE_ENTITIES } from '@afri-market/marketplace-infrastructure';

const options = { ...buildDataSourceOptions() };
options.entities = [...IDENTITY_ENTITIES, ...MARKETPLACE_ENTITIES];
options.migrations = ['libs/database/src/lib/migrations/*.ts'];
options.synchronize = false;

export default new DataSource(options);
