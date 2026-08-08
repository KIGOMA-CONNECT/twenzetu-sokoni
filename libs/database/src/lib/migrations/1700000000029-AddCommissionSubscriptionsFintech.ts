import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCommissionSubscriptionsFintech1700000000029 implements MigrationInterface {
  name = 'AddCommissionSubscriptionsFintech1700000000029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Commission logs — tracks 10% deduction per transaction ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "commission_logs" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "order_id" UUID NOT NULL,
        "payer_type" VARCHAR(20) NOT NULL CHECK (payer_type IN ('vendor', 'driver')),
        "payer_id" UUID NOT NULL,
        "order_amount" NUMERIC(12,2) NOT NULL,
        "commission_rate" NUMERIC(5,4) NOT NULL DEFAULT 0.10,
        "commission_amount" NUMERIC(12,2) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'deducted', 'refunded')),
        "deducted_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_commission_order" ON "commission_logs" ("order_id");
      CREATE INDEX IF NOT EXISTS "idx_commission_payer" ON "commission_logs" ("payer_type", "payer_id");
    `);

    // ── 2. Vendor subscription tiers ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendor_subscription_tiers" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(100) NOT NULL,
        "monthly_price" NUMERIC(10,2) NOT NULL,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'TZS',
        "max_products" INTEGER NOT NULL DEFAULT 50,
        "max_images_per_product" INTEGER NOT NULL DEFAULT 5,
        "commission_rate_override" NUMERIC(5,4),
        "features" JSONB DEFAULT '[]',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── 3. Vendor subscriptions ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "vendor_subscriptions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "tenant_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL,
        "tier_id" UUID NOT NULL REFERENCES "vendor_subscription_tiers"("id"),
        "status" VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trial')),
        "current_period_start" TIMESTAMPTZ NOT NULL,
        "current_period_end" TIMESTAMPTZ NOT NULL,
        "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
        "trial_end" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_vendor_sub_vendor" ON "vendor_subscriptions" ("vendor_id");
    `);

    // ── 4. Subscription invoices ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscription_invoices" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "subscription_id" UUID NOT NULL REFERENCES "vendor_subscriptions"("id"),
        "amount" NUMERIC(10,2) NOT NULL,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'TZS',
        "status" VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
        "paid_at" TIMESTAMPTZ,
        "due_date" TIMESTAMPTZ NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // ── 5. Savings accounts ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "savings_accounts" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "owner_id" UUID NOT NULL,
        "owner_type" VARCHAR(20) NOT NULL CHECK (owner_type IN ('customer', 'vendor', 'driver')),
        "balance" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'TZS',
        "interest_rate" NUMERIC(5,4) NOT NULL DEFAULT 0.05,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_savings_owner" ON "savings_accounts" ("owner_id", "owner_type");
    `);

    // ── 6. Savings transactions ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "savings_transactions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "account_id" UUID NOT NULL REFERENCES "savings_accounts"("id"),
        "type" VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'interest', 'loan_disbursement', 'loan_repayment')),
        "amount" NUMERIC(14,2) NOT NULL,
        "balance_after" NUMERIC(14,2) NOT NULL,
        "reference" VARCHAR(200),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_savings_tx_account" ON "savings_transactions" ("account_id");
    `);

    // ── 7. Fixed deposits ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "fixed_deposits" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "account_id" UUID NOT NULL REFERENCES "savings_accounts"("id"),
        "principal" NUMERIC(14,2) NOT NULL,
        "interest_rate" NUMERIC(5,4) NOT NULL,
        "duration_months" INTEGER NOT NULL,
        "maturity_date" TIMESTAMPTZ NOT NULL,
        "maturity_amount" NUMERIC(14,2) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matured', 'withdrawn', 'cancelled')),
        "matured_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_fd_account" ON "fixed_deposits" ("account_id");
    `);

    // ── 8. Loans ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "loans" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "borrower_id" UUID NOT NULL,
        "borrower_type" VARCHAR(20) NOT NULL CHECK (borrower_type IN ('customer', 'vendor', 'driver')),
        "principal" NUMERIC(14,2) NOT NULL,
        "interest_rate" NUMERIC(5,4) NOT NULL,
        "term_months" INTEGER NOT NULL,
        "monthly_payment" NUMERIC(12,2) NOT NULL,
        "total_repaid" NUMERIC(14,2) NOT NULL DEFAULT 0,
        "remaining_balance" NUMERIC(14,2) NOT NULL,
        "collateral" TEXT,
        "purpose" TEXT,
        "status" VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'paid', 'defaulted', 'rejected')),
        "approved_at" TIMESTAMPTZ,
        "disbursed_at" TIMESTAMPTZ,
        "due_date" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_loans_borrower" ON "loans" ("borrower_id", "borrower_type");
    `);

    // ── 9. Loan repayments ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "loan_repayments" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "loan_id" UUID NOT NULL REFERENCES "loans"("id"),
        "amount" NUMERIC(12,2) NOT NULL,
        "principal_portion" NUMERIC(12,2) NOT NULL,
        "interest_portion" NUMERIC(12,2) NOT NULL,
        "remaining_balance" NUMERIC(14,2) NOT NULL,
        "paid_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "reference" VARCHAR(200)
      );
      CREATE INDEX IF NOT EXISTS "idx_repayment_loan" ON "loan_repayments" ("loan_id");
    `);

    // ── 10. Wallet: add savings-related columns ──
    await queryRunner.query(`
      ALTER TABLE "wallets"
      ADD COLUMN IF NOT EXISTS "savings_balance" NUMERIC(14,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "frozen_balance" NUMERIC(14,2) DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN IF EXISTS "savings_balance", DROP COLUMN IF EXISTS "frozen_balance"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "loan_repayments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "loans"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "fixed_deposits"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "savings_transactions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "savings_accounts"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscription_invoices"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_subscriptions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vendor_subscription_tiers"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "commission_logs"`);
  }
}
