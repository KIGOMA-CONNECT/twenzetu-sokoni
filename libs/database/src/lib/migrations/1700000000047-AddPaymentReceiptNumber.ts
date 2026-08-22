import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentReceiptNumber1700000000047 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number varchar(100)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE payments DROP COLUMN IF EXISTS receipt_number`);
  }
}
