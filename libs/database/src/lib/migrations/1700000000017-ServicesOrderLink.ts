import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Services Marketplace: link an accepted service request to the order it
 * created, so the customer can track the service order and its payment status.
 */
export class ServicesOrderLink1700000000017 implements MigrationInterface {
  public name = 'ServicesOrderLink1700000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "service_requests" ADD COLUMN IF NOT EXISTS "order_id" uuid`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_requests_order" ON "service_requests" ("order_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_service_requests_order"`);
    await queryRunner.query(`ALTER TABLE "service_requests" DROP COLUMN IF EXISTS "order_id"`);
  }
}
