import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUser1752000000011 implements MigrationInterface {
  public name = 'CreateUser1752000000011';

  // Deliberately NOT calling enableRowLevelSecurity(): login must find a user
  // by email before any tenant is known, which RLS filtering by
  // current_setting('app.tenant_id') would make structurally impossible. See
  // ADR-0005. "tenant_id" is a plain column (no FK to "tenant" this sprint —
  // mirrors the codebase's existing opaque-UUID tenant_id posture everywhere
  // else, e.g. ADR-0004's own deferred-FK precedent), used only after a
  // verified JWT establishes tenant context.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "email" varchar(254) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "role" varchar(32) NOT NULL,
        "is_active" boolean NOT NULL DEFAULT true,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user" PRIMARY KEY ("id"),
        CONSTRAINT "CK_user_role" CHECK ("role" IN ('CEO', 'PROJECT_MANAGER', 'FINANCIAL_OFFICER', 'TEAM_MEMBER'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_user_email" ON "user" ("email")
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_user_tenant_id" ON "user" ("tenant_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
