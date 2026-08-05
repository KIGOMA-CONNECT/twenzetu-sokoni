import type { QueryRunner } from 'typeorm';
import { enableRowLevelSecurity } from './rls-helper';

function fakeQueryRunner(): jest.Mocked<Pick<QueryRunner, 'query'>> {
  return { query: jest.fn().mockResolvedValue(undefined) };
}

describe('enableRowLevelSecurity', () => {
  it('enables, forces, drops a stale policy, then creates a tenant isolation policy', async () => {
    const queryRunner = fakeQueryRunner();

    await enableRowLevelSecurity(queryRunner as unknown as QueryRunner, 'invoices');

    const statements = queryRunner.query.mock.calls.map((call) => call[0] as string);

    expect(statements[0]).toBe('ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY');
    expect(statements[1]).toBe('ALTER TABLE "invoices" FORCE ROW LEVEL SECURITY');
    expect(statements[2]).toContain('DROP POLICY IF EXISTS "tenant_isolation_invoices" ON "invoices"');
    expect(statements[3]).toContain('CREATE POLICY "tenant_isolation_invoices" ON "invoices"');
    expect(statements[3]).toContain("NULLIF(current_setting('app.tenant_id', true), '')::text");
  });
});
