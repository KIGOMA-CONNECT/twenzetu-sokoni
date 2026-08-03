import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTenant1752000000010 implements MigrationInterface {
  public name = 'CreateTenant1752000000010';

  // Deliberately NOT calling enableRowLevelSecurity(): Tenant is the owning row
  // for tenant_id everywhere else in the system, and tenant registration must
  // run before any tenant context exists — RLS filtering by
  // current_setting('app.tenant_id') would make this table impossible to read
  // or write pre-registration. This is a documented, accepted exception to the
  // "every tenant-scoped table gets RLS, no exception path" rule from ADR-0001.
  // See ADR-0005 for the full reasoning.
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tenant" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'ACTIVE',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tenant" PRIMARY KEY ("id"),
        CONSTRAINT "CK_tenant_status" CHECK ("status" IN ('ACTIVE', 'SUSPENDED'))
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tenant"`);
  }
}
