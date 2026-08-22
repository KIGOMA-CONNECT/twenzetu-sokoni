import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds A/B testing + delivery analytics to marketing campaigns:
//  - `test_enabled` / `variants`: when enabled, the audience is split into
//    deterministic buckets (hash of phone number) and each bucket receives a
//    different message variant.
//  - `delivered_count` / `click_count` / `conversion_count`: aggregate outcome
//    counters maintained alongside sent/failed.
//  - `campaign_recipients`: per-recipient tracking rows so per-variant
//    conversion rates can be computed by joining to orders placed after send.
export class AddCampaignAbTesting1700000000045 implements MigrationInterface {
  name = 'AddCampaignAbTesting1700000000045';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "marketing_campaigns"
      ADD COLUMN IF NOT EXISTS "test_enabled" BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS "variants" JSONB,
      ADD COLUMN IF NOT EXISTS "delivered_count" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "click_count" INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "conversion_count" INTEGER NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "campaign_recipients" (
        "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "campaign_id" UUID NOT NULL,
        "phone_number" VARCHAR NOT NULL,
        "variant_index" INTEGER NOT NULL DEFAULT 0,
        "status" VARCHAR(20) NOT NULL DEFAULT 'SENT',
        "sent_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "pk_campaign_recipients" PRIMARY KEY ("id"),
        CONSTRAINT "fk_campaign_recipients_campaign" FOREIGN KEY ("campaign_id")
          REFERENCES "marketing_campaigns" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_campaign_recipients_unique"
      ON "campaign_recipients" ("campaign_id", "phone_number")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_campaign_recipients_variant"
      ON "campaign_recipients" ("campaign_id", "variant_index")
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_campaign_recipients_tenant_phone"
      ON "campaign_recipients" ("tenant_id", "phone_number")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_campaign_recipients_tenant_phone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_campaign_recipients_variant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_campaign_recipients_unique"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campaign_recipients"`);
    await queryRunner.query(`
      ALTER TABLE "marketing_campaigns"
      DROP COLUMN IF EXISTS "conversion_count",
      DROP COLUMN IF EXISTS "click_count",
      DROP COLUMN IF EXISTS "delivered_count",
      DROP COLUMN IF EXISTS "variants",
      DROP COLUMN IF EXISTS "test_enabled"
    `);
  }
}
