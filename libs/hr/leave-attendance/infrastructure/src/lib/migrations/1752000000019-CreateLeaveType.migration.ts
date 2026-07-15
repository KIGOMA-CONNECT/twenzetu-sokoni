import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLeaveType1752000000019 implements MigrationInterface {
  public name = 'CreateLeaveType1752000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "leave_type" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(64) NOT NULL,
        "name" varchar(160) NOT NULL,
        "default_days_per_year" numeric(5,1) NOT NULL,
        "requires_approval" boolean NOT NULL DEFAULT true,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_leave_type" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_leave_type_tenant_code" ON "leave_type" ("tenant_id", "code")
    `);
    await enableRowLevelSecurity(queryRunner, 'leave_type');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'leave_type');
    await queryRunner.query(`DROP TABLE "leave_type"`);
  }
}
