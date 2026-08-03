import { enableRowLevelSecurity, disableRowLevelSecurity } from '@abms/database';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployeeDocument1752000000018 implements MigrationInterface {
  public name = 'CreateEmployeeDocument1752000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "employee_document" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "employee_id" uuid NOT NULL,
        "document_type" varchar(32) NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "file_url" text NOT NULL,
        "uploaded_by_user_id" uuid NOT NULL,
        "uploaded_at" timestamptz NOT NULL DEFAULT now(),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_employee_document" PRIMARY KEY ("id"),
        CONSTRAINT "FK_employee_document_employee" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IX_employee_document_tenant_employee" ON "employee_document" ("tenant_id", "employee_id")
    `);
    await enableRowLevelSecurity(queryRunner, 'employee_document');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await disableRowLevelSecurity(queryRunner, 'employee_document');
    await queryRunner.query(`DROP TABLE "employee_document"`);
  }
}
