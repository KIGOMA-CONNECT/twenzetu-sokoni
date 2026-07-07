import { QueryRunner } from 'typeorm';

function policyName(tableName: string): string {
  return `tenant_isolation_${tableName}`;
}

export async function enableRowLevelSecurity(
  queryRunner: QueryRunner,
  tableName: string,
): Promise<void> {
  await queryRunner.query(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY`);
  await queryRunner.query(`ALTER TABLE "${tableName}" FORCE ROW LEVEL SECURITY`);
  // NULLIF guards against a real Postgres quirk: once a custom GUC has been SET LOCAL in a session, it reverts to '' (not NULL) after that transaction ends, and ''::uuid throws instead of failing closed.
  await queryRunner.query(
    `CREATE POLICY "${policyName(tableName)}" ON "${tableName}"
       USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
       WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)`,
  );
}

export async function disableRowLevelSecurity(
  queryRunner: QueryRunner,
  tableName: string,
): Promise<void> {
  await queryRunner.query(`DROP POLICY IF EXISTS "${policyName(tableName)}" ON "${tableName}"`);
  await queryRunner.query(`ALTER TABLE "${tableName}" NO FORCE ROW LEVEL SECURITY`);
  await queryRunner.query(`ALTER TABLE "${tableName}" DISABLE ROW LEVEL SECURITY`);
}
