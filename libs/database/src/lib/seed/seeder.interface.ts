import { EntityManager } from 'typeorm';

export interface ISeeder {
  readonly name: string;
  readonly order: number;
  shouldRun(manager: EntityManager): Promise<boolean>;
  run(manager: EntityManager): Promise<void>;
}
