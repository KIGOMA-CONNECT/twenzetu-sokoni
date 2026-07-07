import { EntityManager } from 'typeorm';
import { ISeeder } from './seeder.interface';

export interface SeederRunSummary {
  readonly executed: ReadonlyArray<string>;
}

export class SeederRunner {
  private readonly seeders: ReadonlyArray<ISeeder>;

  public constructor(seeders: ReadonlyArray<ISeeder>) {
    this.seeders = [...seeders].sort((a, b) => a.order - b.order);
  }

  public async run(manager: EntityManager): Promise<SeederRunSummary> {
    const executed: string[] = [];

    for (const seeder of this.seeders) {
      const shouldRun = await seeder.shouldRun(manager);
      if (shouldRun) {
        await seeder.run(manager);
        executed.push(seeder.name);
      }
    }

    return { executed };
  }
}
