import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds audience segmentation criteria to `marketing_campaigns` so a campaign
// can target a subset of ACTIVE customers (minimum delivered orders and/or
// recency) instead of always broadcasting to the whole customer base. The
// `segment` JSONB column is indexed via a partial expression-free index in the
// ORM entity; the dispatch scheduler relies on `status` + `scheduled_at`.
export class AddCampaignSegments1700000000041 implements MigrationInterface {
  name = 'AddCampaignSegments1700000000041';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "marketing_campaigns"
      ADD COLUMN IF NOT EXISTS "segment" JSONB
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_marketing_campaigns_due"
      ON "marketing_campaigns" ("status", "scheduled_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_marketing_campaigns_due"
    `);
    await queryRunner.query(`
      ALTER TABLE "marketing_campaigns"
      DROP COLUMN IF EXISTS "segment"
    `);
  }
}