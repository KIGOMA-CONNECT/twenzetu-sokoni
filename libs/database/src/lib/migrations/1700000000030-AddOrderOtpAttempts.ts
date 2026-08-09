import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds delivery confirmation OTP attempt tracking so brute-force attempts on
 * the 4-digit code can be locked out before payment escrow is released.
 * Additive-only: nothing is dropped or type-changed.
 */
export class AddOrderOtpAttempts1700000000030 implements MigrationInterface {
  name = 'AddOrderOtpAttempts1700000000030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "otp_attempts" INTEGER NOT NULL DEFAULT 0`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "otp_attempts"`);
  }
}
