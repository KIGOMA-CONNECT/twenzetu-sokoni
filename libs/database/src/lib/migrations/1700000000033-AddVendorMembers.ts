import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorMembers1700000000033 implements MigrationInterface {
  name = 'AddVendorMembers1700000000033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendor_members" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL REFERENCES "vendors"("id") ON DELETE CASCADE,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "role" varchar(20) NOT NULL,
        "permissions" jsonb NOT NULL DEFAULT '[]',
        "status" varchar(20) NOT NULL DEFAULT 'ACTIVE',
        "version" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_vendor_members_id" PRIMARY KEY ("id"),
        CONSTRAINT "CK_vendor_members_role" CHECK ("role" IN ('manager', 'cashier')),
        CONSTRAINT "UQ_vendor_members_vendor_user" UNIQUE ("vendor_id", "user_id")
      );
      CREATE INDEX IF NOT EXISTS "IDX_vendor_members_tenant_user"
        ON "vendor_members" ("tenant_id", "user_id");
      CREATE INDEX IF NOT EXISTS "IDX_vendor_members_tenant_vendor_status"
        ON "vendor_members" ("tenant_id", "vendor_id", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_members"`);
  }
}
