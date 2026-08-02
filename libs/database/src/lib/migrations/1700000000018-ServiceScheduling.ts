import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Services Marketplace: customers can pick a preferred service date/time when
 * creating a request, so vendors see when the service is wanted.
 */
export class ServiceScheduling1700000000018 implements MigrationInterface {
  public name = 'ServiceScheduling1700000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMPTZ`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_requests_scheduled" ON "service_requests" ("scheduled_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_requests_scheduled"`);
    await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN IF EXISTS "scheduled_at"`);
  }
}
