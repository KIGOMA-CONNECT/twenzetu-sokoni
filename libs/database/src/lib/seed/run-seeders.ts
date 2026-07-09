import 'reflect-metadata';
import { AppConfigService } from '@abms/core-config';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../config/build-data-source-options';
import { ISeeder } from './seeder.interface';
import { SeederRunner } from './seeder-runner';

// A reusable runner, not a self-contained CLI script: the composition root (apps/api)
// aggregates every module's seeders and calls this with the full list, so this library
// stays ignorant of any specific module.
export async function runSeeders(seeders: ReadonlyArray<ISeeder>): Promise<void> {
  const config = new AppConfigService(process.env);
  const dataSource = new DataSource(
    buildDataSourceOptions(config.database, {
      username: config.database.ownerUser,
      password: config.database.ownerPassword,
    }),
  );

  await dataSource.initialize();
  try {
    const runner = new SeederRunner(seeders);
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
