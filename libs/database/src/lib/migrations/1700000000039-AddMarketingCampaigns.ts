import { MigrationInterface, QueryRunner } from 'typeorm';

// MarketingCampaignOrmEntity maps the `marketing_campaigns` table used to
// schedule one-to-many promotional SMS sends against a tenant's customer base
// (marketing & growth L3). A campaign moves DRAFT -> ACTIVE on launch, records
// per-message send/failure counts, and settles COMPLETED or FAILED.
export class AddMarketingCampaigns1700000000039 implements MigrationInterface {
  name = 'AddMarketingCampaigns1700000000039';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "marketing_campaigns" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "name" VARCHAR(160) NOT NULL,
        "message" TEXT NOT NULL,
        "channel" VARCHAR(20) NOT NULL DEFAULT 'sms',
        "audience_type" VARCHAR(40) NOT NULL DEFAULT 'all_customers',
        "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        "sent_count" INTEGER NOT NULL DEFAULT 0,
        "failed_count" INTEGER NOT NULL DEFAULT 0,
        "total_audience" INTEGER NOT NULL DEFAULT 0,
        "scheduled_at" TIMESTAMPTZ,
        "started_at" TIMESTAMPTZ,
        "completed_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_marketing_campaigns_tenant"
      ON "marketing_campaigns" ("tenant_id", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "marketing_campaigns"`);
  }
}