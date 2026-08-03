import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviewCycle1752000000031 implements MigrationInterface {
  public name = 'CreateReviewCycle1752000000031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "review_cycle" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "name" varchar(160) NOT NULL,
        "start_date" date NOT NULL,
        "end_date" date NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'OPEN',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_review_cycle" PRIMARY KEY ("id"),
        CONSTRAINT "CK_review_cycle_status" CHECK ("status" IN ('OPEN', 'CLOSED'))
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_review_cycle_tenant_name" ON "review_cycle" ("tenant_id", "name")
    `);
    await enableRowLevelSecurity(queryRunner, 'review_cycle');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'review_cycle');
    await queryRunner.query(`DROP TABLE "review_cycle"`);
  }
}
