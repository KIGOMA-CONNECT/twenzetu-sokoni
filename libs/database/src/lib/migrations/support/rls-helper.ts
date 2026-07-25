import { QueryRunner } from 'typeorm';

export async function enableRowLevelSecurity(
  queryRunner: QueryRunner,
  tableName: string,
): Promise<void> {
  await queryRunner.query(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY`);
  await queryRunner.query(`ALTER TABLE "${tableName}" FORCE ROW LEVEL SECURITY`);

  const policyName = `tenant_isolation_${tableName}`;
  await queryRunner.query(`
    DROP POLICY IF EXISTS "${policyName}" ON "${tableName}"
  `);
  await queryRunner.query(`
    CREATE POLICY "${policyName}" ON "${tableName}"
    USING (tenant_id::text = NULLIF(current_setting('app.tenant_id', true), '')::text)
    WITH CHECK (tenant_id::text = NULLIF(current_setting('app.tenant_id', true), '')::text)
  `);
}
