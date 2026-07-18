import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { buildDataSourceOptions } from '@abms/database';
import { DataSource } from 'typeorm';

// The composition root for the TypeORM CLI (migration:generate/create/run/revert):
// the one place allowed to know about every module's migrations glob. Migrations here
// are hand-written raw-SQL MigrationInterface classes, never entity-diff-generated, so
// no entity classes are registered against this DataSource.
const config = new AppConfigService(process.env);

export default new DataSource(
  buildDataSourceOptions(
    config.database,
    { username: config.database.ownerUser, password: config.database.ownerPassword },
    {
      migrations: [
        'libs/database/src/lib/migrations/*.migration.ts',
        'libs/audit/src/lib/migrations/*.migration.ts',
        'libs/workflow/infrastructure/src/lib/migrations/*.migration.ts',
        'libs/organization/infrastructure/src/lib/migrations/*.migration.ts',
        'libs/identity/infrastructure/src/lib/migrations/*.migration.ts',
        'libs/hr/infrastructure/src/lib/migrations/*.migration.ts',
        'libs/hr/leave-attendance/infrastructure/src/lib/migrations/*.migration.ts',
        'libs/hr/payroll/infrastructure/src/lib/migrations/*.migration.ts',
        'libs/hr/recruitment/infrastructure/src/lib/migrations/*.migration.ts',
      ],
    },
  ),
);
