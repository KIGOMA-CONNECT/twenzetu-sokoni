import { MigrationInterface, QueryRunner } from 'typeorm';

// The actual runtime role name (see docker/postgres/init-db.sh, DB_RUNTIME_USER
// default) — hardcoded here since no existing migration parameterizes role
// names, and this project treats "abms_runtime" as a fixed name, not an
// arbitrary-per-deployment value. Flagged explicitly per house style.
const RUNTIME_ROLE = 'abms_runtime';

export class CreateAuditLog1752000000012 implements MigrationInterface {
  public name = 'CreateAuditLog1752000000012';

  // Deliberately NOT calling enableRowLevelSecurity(): some audited actions
  // (tenant registration, a failed login against an unknown email) happen
  // before any tenant context exists — mirrors Tenant/User's own ADR-0005
  // precedent. True immutability (WORM) instead comes from explicitly
  // revoking UPDATE/DELETE from the runtime role below — INSERT/SELECT
  // remain via the blanket default-privileges grant from init-db.sh, but
  // this table gets no UPDATE/DELETE path at all, for anyone, ever. See
  // ADR-0006.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid,
        "user_id" uuid,
        "command_name" varchar(200) NOT NULL,
        "correlation_id" uuid NOT NULL,
        "outcome" varchar(16) NOT NULL,
        "error_message" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_log" PRIMARY KEY ("id"),
        CONSTRAINT "CK_audit_log_outcome" CHECK ("outcome" IN ('SUCCESS', 'FAILURE'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_audit_log_tenant_id" ON "audit_log" ("tenant_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_audit_log_correlation_id" ON "audit_log" ("correlation_id")
    `);
    await queryRunner.query(`REVOKE UPDATE, DELETE ON "audit_log" FROM "${RUNTIME_ROLE}"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "audit_log"`);
  }
}
