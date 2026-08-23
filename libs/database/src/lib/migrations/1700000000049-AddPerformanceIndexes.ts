import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1700000000049 implements MigrationInterface {
  name = 'AddPerformanceIndexes1700000000049';

  public async up(qr: QueryRunner): Promise<void> {
    // wallet_topup_requests: queried by checkout_request_id in webhooks
    await qr.query(
      `CREATE INDEX IF NOT EXISTS idx_wallet_topup_checkout_req_id
       ON wallet_topup_requests (checkout_request_id)`,
    );
    // wallet_topup_requests: status filter for pending claims
    await qr.query(
      `CREATE INDEX IF NOT EXISTS idx_wallet_topup_status
       ON wallet_topup_requests (status)`,
    );
    // product_sales: findByVendorBetween uses vendor_id + created_at range
    await qr.query(
      `CREATE INDEX IF NOT EXISTS idx_product_sales_vendor_created
       ON product_sales (vendor_id, created_at)`,
    );
    // orders: status filter for vendor pending orders
    await qr.query(
      `CREATE INDEX IF NOT EXISTS idx_orders_status
       ON orders (status)`,
    );
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP INDEX IF EXISTS idx_wallet_topup_checkout_req_id`);
    await qr.query(`DROP INDEX IF EXISTS idx_wallet_topup_status`);
    await qr.query(`DROP INDEX IF EXISTS idx_product_sales_vendor_created`);
    await qr.query(`DROP INDEX IF EXISTS idx_orders_status`);
  }
}
