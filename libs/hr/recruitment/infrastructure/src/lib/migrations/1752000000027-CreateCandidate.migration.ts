import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCandidate1752000000027 implements MigrationInterface {
  public name = 'CreateCandidate1752000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "candidate" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "first_name" varchar(120) NOT NULL,
        "last_name" varchar(120) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(32),
        "resume_url" text,
        "source" varchar(80),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidate" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_candidate_tenant" ON "candidate" ("tenant_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'candidate');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'candidate');
    await queryRunner.query(`DROP TABLE "candidate"`);
  }
}
