import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '@afri-market/database';
import { IDENTITY_ENTITIES } from '@afri-market/identity-infrastructure';
import { MARKETPLACE_ENTITIES } from '@afri-market/marketplace-infrastructure';
import { UBR_ENTITIES } from '@abms/ubr-infrastructure';
import { METADATA_ENTITIES } from '@abms/metadata-infrastructure';
import { CONFIG_ENTITIES } from '@abms/configuration-infrastructure';
import { WORKFLOW_ENTITIES } from '@abms/workflow-infrastructure';
import { NOTIFICATION_ENTITIES } from '@abms/notification-infrastructure';

const options = { ...buildDataSourceOptions() };
options.entities = [
  ...IDENTITY_ENTITIES,
  ...MARKETPLACE_ENTITIES,
  ...UBR_ENTITIES,
  ...METADATA_ENTITIES,
  ...CONFIG_ENTITIES,
  ...WORKFLOW_ENTITIES,
  ...NOTIFICATION_ENTITIES,
];
options.migrations = ['libs/database/src/lib/migrations/*.ts'];
options.synchronize = false;

export default new DataSource(options);
