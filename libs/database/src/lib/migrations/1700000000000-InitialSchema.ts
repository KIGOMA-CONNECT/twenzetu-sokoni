import { MigrationInterface, QueryRunner } from 'typeorm';
import { enableRowLevelSecurity } from './support/rls-helper';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Identity Tables (Global) ──────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" VARCHAR(200) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "email" VARCHAR(255),
        "phone_number" VARCHAR(20) NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "full_name" VARCHAR(100) NOT NULL,
        "role" VARCHAR(20) NOT NULL DEFAULT 'customer',
        "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION',
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_users_phone_number" ON "users" ("phone_number")`);

    await queryRunner.query(`
      CREATE TABLE "otps" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone_number" VARCHAR(15) NOT NULL,
        "code" VARCHAR(10) NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "is_used" BOOLEAN NOT NULL DEFAULT false,
        "tenant_id" UUID,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_otps_phone_code" ON "otps" ("phone_number", "code")`);

    // ── Marketplace Tables (Tenant-Aware) ─────────────────────────
    const tenantTables = [
      `CREATE TABLE "vendors" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "shop_name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "category" VARCHAR(50) NOT NULL,
        "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "average_rating" DECIMAL(3,1) NOT NULL DEFAULT 0,
        "total_orders" INTEGER NOT NULL DEFAULT 0,
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE UNIQUE INDEX "IDX_vendors_user_id" ON "vendors" ("user_id")`,
      `CREATE INDEX "IDX_vendors_tenant_id" ON "vendors" ("tenant_id")`,

      `CREATE TABLE "products" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT NOT NULL,
        "price" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(5) NOT NULL DEFAULT 'RWF',
        "type" VARCHAR(30) NOT NULL,
        "category_id" UUID,
        "image_url" TEXT,
        "stock_quantity" INTEGER NOT NULL DEFAULT 0,
        "unit" VARCHAR(20) NOT NULL DEFAULT 'pcs',
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX "IDX_products_tenant_id" ON "products" ("tenant_id")`,
      `CREATE INDEX "IDX_products_vendor_id" ON "products" ("vendor_id")`,

      `CREATE TABLE "product_categories" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "name" VARCHAR(100) NOT NULL,
        "type" VARCHAR(50) NOT NULL,
        "parent_id" UUID,
        "image_url" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "orders" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "customer_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL,
        "driver_id" UUID,
        "type" VARCHAR(20) NOT NULL,
        "status" VARCHAR(30) NOT NULL DEFAULT 'PLACED',
        "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "delivery_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "system_commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "currency" VARCHAR(5) NOT NULL DEFAULT 'RWF',
        "delivery_address" TEXT NOT NULL,
        "delivery_latitude" DECIMAL(10,7),
        "delivery_longitude" DECIMAL(10,7),
        "special_instructions" TEXT,
        "otp_code" VARCHAR(10),
        "otp_verified" BOOLEAN NOT NULL DEFAULT false,
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX "IDX_orders_tenant_id" ON "orders" ("tenant_id")`,
      `CREATE INDEX "IDX_orders_customer_id" ON "orders" ("customer_id")`,
      `CREATE INDEX "IDX_orders_vendor_id" ON "orders" ("vendor_id")`,
      `CREATE INDEX "IDX_orders_status" ON "orders" ("status")`,

      `CREATE TABLE "order_items" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "order_id" UUID NOT NULL,
        "product_id" UUID NOT NULL,
        "product_name" VARCHAR(200) NOT NULL,
        "quantity" INTEGER NOT NULL,
        "unit_price" DECIMAL(12,2) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX "IDX_order_items_order_id" ON "order_items" ("order_id")`,

      `CREATE TABLE "deliveries" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "order_id" UUID NOT NULL,
        "driver_id" UUID NOT NULL,
        "vehicle_type" VARCHAR(20) NOT NULL,
        "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        "pickup_address" TEXT NOT NULL,
        "delivery_address" TEXT NOT NULL,
        "pickup_latitude" DECIMAL(10,7),
        "pickup_longitude" DECIMAL(10,7),
        "delivery_latitude" DECIMAL(10,7),
        "delivery_longitude" DECIMAL(10,7),
        "distance_km" DECIMAL(8,2),
        "estimated_time_minutes" INTEGER,
        "driver_earnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX "IDX_deliveries_order_id" ON "deliveries" ("order_id")`,
      `CREATE INDEX "IDX_deliveries_driver_id" ON "deliveries" ("driver_id")`,

      `CREATE TABLE "vehicles" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "driver_id" UUID NOT NULL,
        "type" VARCHAR(20) NOT NULL,
        "plate_number" VARCHAR(20),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "payments" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "order_id" UUID NOT NULL,
        "customer_id" UUID NOT NULL,
        "vendor_id" UUID,
        "amount" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(5) NOT NULL DEFAULT 'RWF',
        "method" VARCHAR(20) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'ESCROW_HELD',
        "system_commission" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "vendor_net" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "driver_net" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "transaction_ref" VARCHAR(100),
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX "IDX_payments_order_id" ON "payments" ("order_id")`,

      `CREATE TABLE "wallets" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "owner_id" UUID NOT NULL,
        "owner_type" VARCHAR(10) NOT NULL,
        "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "pending_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'RWF',
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE UNIQUE INDEX "IDX_wallets_owner_id" ON "wallets" ("owner_id")`,

      `CREATE TABLE "custom_procurements" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "customer_id" UUID NOT NULL,
        "product_query" TEXT NOT NULL,
        "specifications" JSONB,
        "status" VARCHAR(30) NOT NULL DEFAULT 'searching',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "vendor_quotes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "procurement_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL,
        "price" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(5) NOT NULL DEFAULT 'RWF',
        "item_condition" VARCHAR(30) NOT NULL,
        "warranty_period_days" INTEGER NOT NULL DEFAULT 0,
        "status" VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "addresses" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "label" VARCHAR(50) NOT NULL,
        "street_address" TEXT NOT NULL,
        "latitude" DECIMAL(10,7),
        "longitude" DECIMAL(10,7),
        "is_default" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "reviews" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "customer_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL,
        "order_id" UUID NOT NULL,
        "rating" INTEGER NOT NULL,
        "comment" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX "IDX_reviews_order_id" ON "reviews" ("order_id")`,

      `CREATE TABLE "menus" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "disputes" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "order_id" UUID NOT NULL,
        "customer_id" UUID NOT NULL,
        "vendor_id" UUID NOT NULL,
        "reason" VARCHAR(50) NOT NULL,
        "description" TEXT NOT NULL,
        "claim_amount" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(5) NOT NULL DEFAULT 'RWF',
        "status" VARCHAR(30) NOT NULL DEFAULT 'OPEN',
        "severity" VARCHAR(20) NOT NULL DEFAULT 'LOW',
        "fraud_score" DECIMAL(5,2),
        "assigned_agent_id" UUID,
        "resolution_type" VARCHAR(30),
        "resolved_amount" DECIMAL(12,2),
        "resolution_notes" TEXT,
        "pickup_photo_url" TEXT,
        "delivery_photo_url" TEXT,
        "dispute_photo_url" TEXT,
        "geolocation_lat" DECIMAL(10,7),
        "geolocation_lng" DECIMAL(10,7),
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX "IDX_disputes_order_id" ON "disputes" ("order_id")`,

      `CREATE TABLE "surge_rules" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "trigger" VARCHAR(20) NOT NULL DEFAULT 'demand',
        "multiplier" DECIMAL(4,2) NOT NULL DEFAULT 1.0,
        "min_orders" INTEGER NOT NULL DEFAULT 0,
        "max_drivers" INTEGER NOT NULL DEFAULT 0,
        "start_hour" INTEGER,
        "end_hour" INTEGER,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "customer_points" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "customer_id" UUID NOT NULL,
        "total_points" INTEGER NOT NULL DEFAULT 0,
        "redeemable_points" INTEGER NOT NULL DEFAULT 0,
        "lifetime_points" INTEGER NOT NULL DEFAULT 0,
        "tier" VARCHAR(20) NOT NULL DEFAULT 'BRONZE',
        "referral_code" VARCHAR(20),
        "referred_by" UUID,
        "total_referrals" INTEGER NOT NULL DEFAULT 0,
        "free_deliveries_remaining" INTEGER NOT NULL DEFAULT 0,
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "cashback_rules" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "percentage" DECIMAL(5,2) NOT NULL,
        "min_order_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "max_cashback" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "points_transactions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "customer_id" UUID NOT NULL,
        "points" INTEGER NOT NULL,
        "type" VARCHAR(20) NOT NULL,
        "reason" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX "IDX_points_transactions_customer_id" ON "points_transactions" ("customer_id")`,

      `CREATE TABLE "partner_kyc" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "partner_id" UUID NOT NULL,
        "partner_type" VARCHAR(30) NOT NULL,
        "phone_number" VARCHAR(20) NOT NULL,
        "nida_number" VARCHAR(30),
        "tin_number" VARCHAR(30),
        "license_number" VARCHAR(30),
        "nida_photo_url" TEXT,
        "selfie_photo_url" TEXT,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "rejection_reason" TEXT,
        "verified_at" TIMESTAMPTZ,
        "gps_latitude" DECIMAL(10,7),
        "gps_longitude" DECIMAL(10,7),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "hyperlocal_pois" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "name" VARCHAR(200) NOT NULL,
        "local_name" VARCHAR(200),
        "description" TEXT,
        "type" VARCHAR(30) NOT NULL,
        "latitude" DECIMAL(10,7) NOT NULL,
        "longitude" DECIMAL(10,7) NOT NULL,
        "street_address" TEXT,
        "landmark_description" TEXT,
        "submitted_by" UUID NOT NULL,
        "source" VARCHAR(30) NOT NULL,
        "verification_count" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX "IDX_hyperlocal_pois_type" ON "hyperlocal_pois" ("type")`,

      `CREATE TABLE "micro_loans" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "borrower_id" UUID NOT NULL,
        "borrower_type" VARCHAR(20) NOT NULL,
        "loan_type" VARCHAR(30) NOT NULL,
        "requested_amount" DECIMAL(12,2) NOT NULL,
        "interest_rate" DECIMAL(5,2) NOT NULL,
        "daily_repayment_amount" DECIMAL(12,2) NOT NULL,
        "total_days" INTEGER NOT NULL,
        "repaid_days" INTEGER NOT NULL DEFAULT 0,
        "outstanding_balance" DECIMAL(12,2) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "credit_scores" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "score" INTEGER NOT NULL DEFAULT 0,
        "total_transactions" INTEGER NOT NULL DEFAULT 0,
        "total_revenue" DECIMAL(14,2),
        "average_daily_sales" DECIMAL(12,2),
        "account_age_days" INTEGER NOT NULL DEFAULT 0,
        "missed_deliveries" INTEGER NOT NULL DEFAULT 0,
        "dispute_count" INTEGER NOT NULL DEFAULT 0,
        "last_calculated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "bulk_orders" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "source_type" VARCHAR(30) NOT NULL,
        "source_name" VARCHAR(200) NOT NULL,
        "source_phone" VARCHAR(20) NOT NULL,
        "product_name" VARCHAR(200) NOT NULL,
        "total_quantity" INTEGER NOT NULL,
        "unit" VARCHAR(20) NOT NULL,
        "total_amount" DECIMAL(12,2) NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'OPEN',
        "expected_delivery_date" TIMESTAMPTZ,
        "participant_vendor_ids" JSONB NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "field_agents" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "user_id" UUID NOT NULL,
        "agent_type" VARCHAR(30) NOT NULL,
        "agent_code" VARCHAR(50) NOT NULL UNIQUE,
        "coverage_area" TEXT NOT NULL,
        "commission_rate" DECIMAL(5,2),
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "country_configs" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "country_code" VARCHAR(2) NOT NULL UNIQUE,
        "country_name" VARCHAR(100) NOT NULL,
        "currency" VARCHAR(10) NOT NULL,
        "currency_symbol" VARCHAR(5) NOT NULL DEFAULT '',
        "timezone" VARCHAR(50) NOT NULL DEFAULT 'Africa/Kigali',
        "telecoms" JSONB NOT NULL DEFAULT '[]',
        "tax_config" JSONB NOT NULL DEFAULT '{}',
        "supported_payment_methods" JSONB NOT NULL DEFAULT '[]',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,

      `CREATE TABLE "wallet_transactions" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "owner_id" UUID NOT NULL,
        "owner_type" VARCHAR(10) NOT NULL DEFAULT 'vendor',
        "type" VARCHAR(20) NOT NULL,
        "amount" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'RWF',
        "balance_before" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "balance_after" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "description" VARCHAR(255),
        "reference_id" VARCHAR(100),
        "reference_type" VARCHAR(50),
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
      `CREATE INDEX "IDX_wallet_transactions_owner_id" ON "wallet_transactions" ("owner_id")`,

      `CREATE TABLE "used_goods" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" UUID NOT NULL,
        "seller_id" UUID NOT NULL,
        "title" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "category" VARCHAR(50) NOT NULL,
        "asking_price" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'RWF',
        "location" TEXT NOT NULL,
        "latitude" DECIMAL(10,7),
        "longitude" DECIMAL(10,7),
        "condition" VARCHAR(20) NOT NULL,
        "photo_urls" JSONB DEFAULT '[]',
        "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        "seller_name" VARCHAR(100) NOT NULL,
        "seller_phone" VARCHAR(15) NOT NULL,
        "views" INTEGER NOT NULL DEFAULT 0,
        "escrow_id" VARCHAR(100),
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )`,
    ];

    for (const sql of tenantTables) {
      await queryRunner.query(sql);
    }

    // ── Enable RLS on all tenant-aware tables ─────────────────────
    const rlsTables = [
      'vendors', 'products', 'product_categories', 'orders', 'order_items',
      'deliveries', 'vehicles', 'payments', 'wallets', 'custom_procurements',
      'vendor_quotes', 'addresses', 'reviews', 'menus', 'disputes',
      'surge_rules', 'customer_points', 'cashback_rules', 'points_transactions',
      'partner_kyc', 'hyperlocal_pois', 'micro_loans', 'credit_scores',
      'bulk_orders', 'field_agents', 'wallet_transactions', 'used_goods',
    ];

    for (const table of rlsTables) {
      await enableRowLevelSecurity(queryRunner, table);
    }

    // ── Seed default country configs ──────────────────────────────
    await queryRunner.query(`
      INSERT INTO "country_configs" ("country_code", "country_name", "currency", "currency_symbol", "timezone", "telecoms", "tax_config", "supported_payment_methods")
      VALUES
        ('RW', 'Rwanda', 'RWF', 'RF', 'Africa/Kigali', '[{"name":"MTN","apiType":"ussd"},{"name":"Airtel","apiType":"ussd"}]', '{"vatRate":18,"withholdingTaxRate":5}', '["mobile_money","cash","card"]'),
        ('TZ', 'Tanzania', 'TZS', 'TSh', 'Africa/Dar_es_Salaam', '[{"name":"Vodacom","apiType":"ussd"},{"name":"Airtel","apiType":"ussd"},{"name":"Tigo","apiType":"ussd"}]', '{"vatRate":18,"withholdingTaxRate":10}', '["mobile_money","cash","card"]')
      ON CONFLICT ("country_code") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'field_agents', 'wallet_transactions', 'used_goods', 'bulk_orders', 'credit_scores', 'micro_loans',
      'hyperlocal_pois', 'partner_kyc', 'points_transactions', 'cashback_rules',
      'customer_points', 'surge_rules', 'disputes', 'menus', 'reviews',
      'addresses', 'vendor_quotes', 'custom_procurements', 'wallets',
      'payments', 'vehicles', 'deliveries', 'order_items', 'orders',
      'product_categories', 'products', 'vendors', 'country_configs',
      'otps', 'users', 'tenants',
    ];
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
  }
}
