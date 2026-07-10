import { runSeeders, SEEDERS } from '@abms/database';
import { ORGANIZATION_SEEDERS } from '@abms/organization-infrastructure';

// The composition root for `seed:run`: the one place allowed to aggregate every
// module's seeders into one ordered list.
async function main(): Promise<void> {
  await runSeeders([...SEEDERS, ...ORGANIZATION_SEEDERS]);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
