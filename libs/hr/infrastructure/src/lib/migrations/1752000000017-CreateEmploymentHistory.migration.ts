import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

// See libs/audit's CreateAuditLog migration for the same pattern/reasoning.
const RUNTIME_ROLE = 'abms_runtime';

export class CreateEmploymentHistory1752000000017 implements MigrationInterface {
  public name = 'CreateEmploymentHistory1752000000017';

  // Unlike audit_log, every employment_history row always has a tenant
  // context (Employee mutations only ever happen inside TenantAwareUnitOfWork),
  // so RLS tenant isolation and WORM immutability are both safe to enable
  // together here — they are independent properties (RLS governs row
  // visibility per role; the REVOKE below removes the UPDATE/DELETE grant
  // entirely, for anyone). See ADR-0008.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "employment_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "event_type" varchar(32) NOT NULL,
        "effective_date" date NOT NULL,
        "details" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employment_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_employment_history_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_employment_history_tenant_employee" ON "employment_history" ("tenant_id", "employee_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'employment_history');
    await queryRunner.query(`REVOKE UPDATE, DELETE ON "employment_history" FROM "${RUNTIME_ROLE}"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'employment_history');
    await queryRunner.query(`DROP TABLE "employment_history"`);
  }
}
