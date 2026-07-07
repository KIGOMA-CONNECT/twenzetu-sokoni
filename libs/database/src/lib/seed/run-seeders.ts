import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/build-data-source-options';
import { SEEDERS } from './seeders.registry';
import { SeederRunner } from './seeder-runner';

async function main(): Promise<void> {
  const config = new AppConfigService(process.env);
  const dataSource = new DataSource(
    buildDataSourceOptions(config.database, {
      username: config.database.ownerUser,
      password: config.database.ownerPassword,
    }),
  );

  await dataSource.initialize();
  try {
    const runner = new SeederRunner(SEEDERS);
    const { executed } = await runner.run(dataSource.manager);
    const summary =
      executed.length === 0
        ? '0 seeders executed.'
        : `${executed.length} seeders executed: ${executed.join(', ')}.`;
    console.log(summary);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
