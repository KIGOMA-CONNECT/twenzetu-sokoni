import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Global-standard address fields for deliveries (region / city / district /
 * street / landmark / postal code / country) plus provider tracking on wallet
 * top-up requests (M-Pesa, Mixx by Yas, Airtel, Halotel, card, bank).
 */
export class AddressStandardFields1700000000014 implements MigrationInterface {
  public name = 'AddressStandardFields1700000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "addresses"
        ADD COLUMN IF NOT EXISTS "country" VARCHAR(2) NOT NULL DEFAULT 'TZ',
        ADD COLUMN IF NOT EXISTS "region" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "district" VARCHAR(100),
        ADD COLUMN IF NOT EXISTS "street" TEXT,
        ADD COLUMN IF NOT EXISTS "landmark" VARCHAR(255),
        ADD COLUMN IF NOT EXISTS "postal_code" VARCHAR(20),
        ADD COLUMN IF NOT EXISTS "notes" TEXT
    `);

    await queryRunner.query(`
      ALTER TABLE "wallet_topup_requests"
        ADD COLUMN IF NOT EXISTS "provider" VARCHAR(20) NOT NULL DEFAULT 'mpesa',
        ADD COLUMN IF NOT EXISTS "card_reference" VARCHAR(100)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "addresses"
        DROP COLUMN IF EXISTS "notes",
        DROP COLUMN IF EXISTS "postal_code",
        DROP COLUMN IF EXISTS "landmark",
        DROP COLUMN IF EXISTS "street",
        DROP COLUMN IF EXISTS "district",
        DROP COLUMN IF EXISTS "city",
        DROP COLUMN IF EXISTS "region",
        DROP COLUMN IF EXISTS "country"
    `);
    await queryRunner.query(`
      ALTER TABLE "wallet_topup_requests"
        DROP COLUMN IF EXISTS "card_reference",
        DROP COLUMN IF EXISTS "provider"
    `);
  }
}
