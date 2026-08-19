import { MigrationInterface, QueryRunner } from 'typeorm';

// Adds a pickup confirmation code to `orders`. Generated when a driver accepts a
// delivery (ASSIGNED) and shared verbally by the vendor with the driver at the
// handoff point. The driver enters it to confirm the goods were actually picked
// up, closing the cargo/express "pickup/delivery OTP" loop (delivery OTP is the
// existing `otp_code` column verified by the customer at drop-off).
export class AddPickupCodeToOrders1700000000040 implements MigrationInterface {
  name = 'AddPickupCodeToOrders1700000000040';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      ADD COLUMN IF NOT EXISTS "pickup_code" VARCHAR(10)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orders"
      DROP COLUMN IF EXISTS "pickup_code"
    `);
  }
}