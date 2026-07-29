import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReferralsAndSubscriptions1700000000005 implements MigrationInterface {
  name = 'AddReferralsAndSubscriptions1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "referrals" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "referrer_id" uuid NOT NULL,
        "referral_code" character varying(20) NOT NULL,
        "referred_phone" character varying(15),
        "referred_id" uuid,
        "status" character varying(20) NOT NULL DEFAULT 'PENDING',
        "reward_amount" numeric(12,2) NOT NULL DEFAULT 0,
        "reward_claimed" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_referrals" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_referrals_referrer_id" ON "referrals" ("referrer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_referrals_referral_code" ON "referrals" ("referral_code")`);
    await queryRunner.query(`CREATE INDEX "IDX_referrals_status" ON "referrals" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tenant_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "vendor_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "quantity" integer NOT NULL DEFAULT 1,
        "frequency" character varying(20) NOT NULL DEFAULT 'weekly',
        "day_of_week" integer,
        "day_of_month" integer,
        "next_order_date" date NOT NULL,
        "status" character varying(20) NOT NULL DEFAULT 'ACTIVE',
        "delivery_address_id" uuid,
        "notes" text,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_user_id" ON "subscriptions" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_vendor_id" ON "subscriptions" ("vendor_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_status" ON "subscriptions" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_subscriptions_next_order" ON "subscriptions" ("next_order_date")`);

    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "referral_code" character varying(20)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_referral_code" ON "users" ("referral_code")
    `);

    await queryRunner.query(`
      ALTER TABLE "referrals" ADD CONSTRAINT "FK_referrals_referrer" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "referrals" ADD CONSTRAINT "FK_referrals_referred" FOREIGN KEY ("referred_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_vendor" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_subscriptions_address" FOREIGN KEY ("delivery_address_id") REFERENCES "addresses"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK_subscriptions_address"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK_subscriptions_product"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK_subscriptions_vendor"`);
    await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "FK_subscriptions_user"`);
    await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "FK_referrals_referred"`);
    await queryRunner.query(`ALTER TABLE "referrals" DROP CONSTRAINT IF EXISTS "FK_referrals_referrer"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_referral_code"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "referral_code"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "referrals"`);
  }
}
