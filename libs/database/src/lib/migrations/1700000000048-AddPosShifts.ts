import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPosShifts1700000000048 implements MigrationInterface {
  name = 'AddPosShifts1700000000048';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "pos_shifts" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL REFERENCES "vendors"("id") ON DELETE CASCADE,
        "operator_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "shift_number" varchar(32) NOT NULL,
        "opened_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "closed_at" TIMESTAMP WITH TIME ZONE,
        "opening_float" decimal(12,2) NOT NULL DEFAULT 0,
        "closing_cash" decimal(12,2),
        "expected_cash" decimal(12,2),
        "cash_variance" decimal(12,2),
        "total_sales" decimal(12,2) NOT NULL DEFAULT 0,
        "total_refunds" decimal(12,2) NOT NULL DEFAULT 0,
        "sales_count" integer NOT NULL DEFAULT 0,
        "payment_breakdown" jsonb NOT NULL DEFAULT '{}',
        "status" varchar(20) NOT NULL DEFAULT 'OPEN',
        "closed_by" UUID,
        "notes" text,
        "version" integer NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_pos_shifts_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_pos_shifts_vendor" ON "pos_shifts" ("vendor_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_pos_shifts_tenant_vendor" ON "pos_shifts" ("tenant_id", "vendor_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_pos_shifts_tenant_vendor_status" ON "pos_shifts" ("tenant_id", "vendor_id", "status")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_pos_shifts_open_per_vendor" ON "pos_shifts" ("vendor_id") WHERE "status" = 'OPEN'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_pos_shifts_open_per_vendor"`);
    await queryRunner.query(`DROP INDEX "IDX_pos_shifts_tenant_vendor_status"`);
    await queryRunner.query(`DROP INDEX "IDX_pos_shifts_tenant_vendor"`);
    await queryRunner.query(`DROP INDEX "IDX_pos_shifts_vendor"`);
    await queryRunner.query(`DROP TABLE "pos_shifts"`);
  }
}