import { ISeeder } from '@abms/database';
import { OrgUnitTypeSeeder } from './seed/org-unit-type.seeder';

export const ORGANIZATION_SEEDERS: ReadonlyArray<ISeeder> = [new OrgUnitTypeSeeder()];
