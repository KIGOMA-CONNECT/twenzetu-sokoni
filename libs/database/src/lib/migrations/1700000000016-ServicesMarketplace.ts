import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Services Marketplace: vendor service listings with fixed base pricing
 * (per m² / hour / room / unit), customer service requests with photos,
 * vendor quotes, and in-app negotiation messages.
 */
export class ServicesMarketplace1700000000016 implements MigrationInterface {
  public name = 'ServicesMarketplace1700000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_listings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "vendor_id" uuid NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT NOT NULL DEFAULT '',
        "category" VARCHAR(50) NOT NULL,
        "pricing_model" VARCHAR(20) NOT NULL DEFAULT 'per_unit',
        "base_price" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS',
        "unit_label" VARCHAR(50) NOT NULL DEFAULT 'unit',
        "image_url" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_listings_vendor" ON "service_listings" ("tenant_id", "vendor_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_listings_category" ON "service_listings" ("tenant_id", "category")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "customer_id" uuid NOT NULL,
        "vendor_id" uuid NOT NULL,
        "listing_id" uuid,
        "title" VARCHAR(200) NOT NULL,
        "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
        "unit_label" VARCHAR(50) NOT NULL DEFAULT 'unit',
        "details" TEXT NOT NULL DEFAULT '',
        "photo_urls" JSONB NOT NULL DEFAULT '[]',
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "agreed_price" DECIMAL(12,2),
        "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS',
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_requests_customer" ON "service_requests" ("tenant_id", "customer_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_requests_vendor" ON "service_requests" ("tenant_id", "vendor_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_requests_status" ON "service_requests" ("status")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_quotes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "request_id" uuid NOT NULL,
        "vendor_id" uuid NOT NULL,
        "price" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS',
        "message" TEXT NOT NULL DEFAULT '',
        "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_quotes_request" ON "service_quotes" ("tenant_id", "request_id")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "service_request_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "request_id" uuid NOT NULL,
        "sender_id" uuid NOT NULL,
        "sender_name" VARCHAR(150) NOT NULL,
        "sender_role" VARCHAR(30) NOT NULL DEFAULT 'customer',
        "message" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_service_request_messages_request" ON "service_request_messages" ("tenant_id", "request_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "service_request_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_quotes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_listings"`);
  }
}
