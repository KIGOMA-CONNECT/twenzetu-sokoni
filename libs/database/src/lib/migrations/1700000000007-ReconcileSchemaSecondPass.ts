import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReconcileSchemaSecondPass1700000000007 implements MigrationInterface {
  name = 'ReconcileSchemaSecondPass1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Addresses: entity uses full_address, DB column is street_address ──
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'addresses' AND column_name = 'street_address')
           AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                           WHERE table_name = 'addresses' AND column_name = 'full_address') THEN
          ALTER TABLE "addresses" RENAME COLUMN "street_address" TO "full_address";
        END IF;
      END $$;
    `);

    // ── order_items: align with OrderItemOrmEntity ──
    await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "total_price" DECIMAL(12,2)`);
    await queryRunner.query(`UPDATE "order_items" SET "total_price" = "unit_price" * "quantity" WHERE "total_price" IS NULL`);
    await queryRunner.query(`ALTER TABLE "order_items" ALTER COLUMN "total_price" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS'`);

    // ── deliveries: align with DeliveryOrmEntity ──
    await queryRunner.query(`ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS'`);
    await queryRunner.query(`ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "current_latitude" DECIMAL(10,7)`);
    await queryRunner.query(`ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "current_longitude" DECIMAL(10,7)`);
    await queryRunner.query(`ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "last_location_update" TIMESTAMPTZ`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_deliveries_tenant_status" ON "deliveries" ("tenant_id", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_deliveries_tenant_driver" ON "deliveries" ("tenant_id", "driver_id")`);

    // ── micro_loans: align with MicroLoanOrmEntity ──
    await queryRunner.query(`ALTER TABLE "micro_loans" ADD COLUMN IF NOT EXISTS "approved_amount" DECIMAL(12,2)`);
    await queryRunner.query(`ALTER TABLE "micro_loans" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS'`);
    await queryRunner.query(`ALTER TABLE "micro_loans" ADD COLUMN IF NOT EXISTS "disbursed_at" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "micro_loans" ADD COLUMN IF NOT EXISTS "due_at" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "micro_loans" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1`);

    // ── credit_scores: align with CreditScoreOrmEntity ──
    await queryRunner.query(`ALTER TABLE "credit_scores" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "credit_scores" ALTER COLUMN "total_revenue" SET DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "credit_scores" ALTER COLUMN "average_daily_sales" SET DEFAULT 0`);

    // ── bulk_orders: align with BulkOrderOrmEntity ──
    await queryRunner.query(`ALTER TABLE "bulk_orders" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS'`);
    await queryRunner.query(`ALTER TABLE "bulk_orders" ADD COLUMN IF NOT EXISTS "delivered_at" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "bulk_orders" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1`);

    // ── field_agents: align with FieldAgentOrmEntity ──
    await queryRunner.query(`ALTER TABLE "field_agents" ADD COLUMN IF NOT EXISTS "total_onboarded" INTEGER NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "field_agents" ADD COLUMN IF NOT EXISTS "total_earnings" DECIMAL(12,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "field_agents" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS'`);
    await queryRunner.query(`ALTER TABLE "field_agents" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1`);

    // ── wallets / orders / payments / vendor_quotes / used_goods default currency TZS ──
    await queryRunner.query(`ALTER TABLE "wallets" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS'`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS'`);
    await queryRunner.query(`ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS'`);
    await queryRunner.query(`ALTER TABLE "vendor_quotes" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS'`);
    await queryRunner.query(`ALTER TABLE "used_goods" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS'`);
    await queryRunner.query(`ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) NOT NULL DEFAULT 'TZS'`);

    // ── order_messages table (ChatController) ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "order_messages" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "order_id" UUID NOT NULL,
        "sender_id" UUID NOT NULL,
        "sender_name" VARCHAR(100) NOT NULL DEFAULT 'User',
        "sender_role" VARCHAR(20) NOT NULL DEFAULT 'customer',
        "message" TEXT NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_order_messages_order" ON "order_messages" ("order_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_order_messages_tenant" ON "order_messages" ("tenant_id")`);

    // ── wallet_topup_requests table (WalletsController + WebhooksController) ──
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "wallet_topup_requests" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "amount" DECIMAL(12,2) NOT NULL,
        "phone_number" VARCHAR(20) NOT NULL,
        "checkout_request_id" VARCHAR(100),
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "receipt_number" VARCHAR(100),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_topup_requests_checkout" ON "wallet_topup_requests" ("checkout_request_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_topup_requests_tenant" ON "wallet_topup_requests" ("tenant_id")`);

    // ── Disable RLS enforcement ──
    // The app isolates tenants at the application layer (every query filters by
    // tenant_id). The DB RLS policies rely on the session variable app.tenant_id
    // which is only set inside TenantAwareUnitOfWork.withTransaction — a code path
    // that nothing calls, so the policies reject ALL reads/writes. Until the
    // unit-of-work retrofit lands, enforcement is disabled so the platform can
    // operate. Policies remain in place and can be re-enabled per table.
    const tenantTables = [
      'vendors', 'products', 'product_categories', 'orders', 'order_items',
      'deliveries', 'vehicles', 'payments', 'wallets', 'custom_procurements',
      'vendor_quotes', 'addresses', 'reviews', 'menus', 'disputes',
      'surge_rules', 'customer_points', 'cashback_rules', 'points_transactions',
      'partner_kyc', 'partner_kycs', 'hyperlocal_pois', 'micro_loans',
      'credit_scores', 'bulk_orders', 'field_agents', 'wallet_transactions',
      'used_goods', 'coupons', 'flash_sales', 'referrals', 'subscriptions',
    ];
    for (const table of tenantTables) {
      await queryRunner.query(`ALTER TABLE IF EXISTS "${table}" DISABLE ROW LEVEL SECURITY`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "wallet_topup_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "order_messages"`);

    await queryRunner.query(`ALTER TABLE "field_agents" DROP COLUMN IF EXISTS "version"`);
    await queryRunner.query(`ALTER TABLE "field_agents" DROP COLUMN IF EXISTS "currency"`);
    await queryRunner.query(`ALTER TABLE "field_agents" DROP COLUMN IF EXISTS "total_earnings"`);
    await queryRunner.query(`ALTER TABLE "field_agents" DROP COLUMN IF EXISTS "total_onboarded"`);
    await queryRunner.query(`ALTER TABLE "bulk_orders" DROP COLUMN IF EXISTS "version"`);
    await queryRunner.query(`ALTER TABLE "bulk_orders" DROP COLUMN IF EXISTS "delivered_at"`);
    await queryRunner.query(`ALTER TABLE "bulk_orders" DROP COLUMN IF EXISTS "currency"`);
    await queryRunner.query(`ALTER TABLE "credit_scores" DROP COLUMN IF EXISTS "version"`);
    await queryRunner.query(`ALTER TABLE "micro_loans" DROP COLUMN IF EXISTS "version"`);
    await queryRunner.query(`ALTER TABLE "micro_loans" DROP COLUMN IF EXISTS "due_at"`);
    await queryRunner.query(`ALTER TABLE "micro_loans" DROP COLUMN IF EXISTS "disbursed_at"`);
    await queryRunner.query(`ALTER TABLE "micro_loans" DROP COLUMN IF EXISTS "currency"`);
    await queryRunner.query(`ALTER TABLE "micro_loans" DROP COLUMN IF EXISTS "approved_amount"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "last_location_update"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "current_longitude"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "current_latitude"`);
    await queryRunner.query(`ALTER TABLE "deliveries" DROP COLUMN IF EXISTS "currency"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "currency"`);
    await queryRunner.query(`ALTER TABLE "order_items" DROP COLUMN IF EXISTS "total_price"`);
  }
}
