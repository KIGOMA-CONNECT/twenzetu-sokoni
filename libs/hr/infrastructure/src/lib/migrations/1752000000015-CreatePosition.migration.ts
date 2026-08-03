import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePosition1752000000015 implements MigrationInterface {
  public name = 'CreatePosition1752000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "position" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "code" varchar(64) NOT NULL,
        "title" varchar(160) NOT NULL,
        "description" varchar(500),
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_position" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_position_tenant_code" ON "position" ("tenant_id", "code")
    `);
    await enableRowLevelSecurity(queryRunner, 'position');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'position');
    await queryRunner.query(`DROP TABLE "position"`);
  }
}
