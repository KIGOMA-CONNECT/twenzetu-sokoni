import { MigrationInterface, QueryRunner } from 'typeorm';

// DriverReviewOrmEntity maps the `driver_reviews` table used to record customer
// ratings of delivery drivers after an order is delivered (cargo/express L4).
// Stored separately from `reviews` so a customer can rate both the vendor and
// the driver on the same order without clashing on the `reviews.order_id`
// unique index. Built with CREATE TABLE IF NOT EXISTS so it is safe everywhere.
export class AddDriverReviews1700000000038 implements MigrationInterface {
  name = 'AddDriverReviews1700000000038';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "driver_reviews" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "order_id" UUID NOT NULL,
        "delivery_id" UUID NOT NULL,
        "driver_id" UUID NOT NULL,
        "customer_id" UUID NOT NULL,
        "rating" INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        "comment" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "uq_driver_reviews_delivery" UNIQUE ("delivery_id")
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_driver_reviews_driver"
      ON "driver_reviews" ("tenant_id", "driver_id")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_driver_reviews_customer"
      ON "driver_reviews" ("tenant_id", "customer_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "driver_reviews"`);
  }
}
