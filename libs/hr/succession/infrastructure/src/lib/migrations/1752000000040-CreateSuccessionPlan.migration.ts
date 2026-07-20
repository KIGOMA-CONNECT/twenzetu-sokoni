import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSuccessionPlan1752000000040 implements MigrationInterface {
  public name = 'CreateSuccessionPlan1752000000040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "succession_plan" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "position_id" uuid NOT NULL,
        "notes" text,
        "status" varchar(16) NOT NULL DEFAULT 'OPEN',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_succession_plan" PRIMARY KEY ("id"),
        CONSTRAINT "FK_succession_plan_position" FOREIGN KEY ("position_id") REFERENCES "position" ("id") ON DELETE RESTRICT,
        CONSTRAINT "CK_succession_plan_status" CHECK ("status" IN ('OPEN', 'CLOSED'))
      )
    `);
    // Partial unique index: only one OPEN plan per position at a time —
    // mirrors offboarding_case's "one active row" partial unique index
    // pattern (ADR-0013).
    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_succession_plan_tenant_position_open"
      ON "succession_plan" ("tenant_id", "position_id")
      WHERE "status" = 'OPEN'
    `);
    await enableRowLevelSecurity(queryRunner, 'succession_plan');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'succession_plan');
    await queryRunner.query(`DROP TABLE "succession_plan"`);
  }
}
