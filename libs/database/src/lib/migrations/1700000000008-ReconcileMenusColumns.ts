import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReconcileMenusColumns1700000000008 implements MigrationInterface {
  name = 'ReconcileMenusColumns1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "available_from" VARCHAR(10)`);
    await queryRunner.query(`ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "available_until" VARCHAR(10)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "menus" DROP COLUMN IF EXISTS "available_until"`);
    await queryRunner.query(`ALTER TABLE "menus" DROP COLUMN IF EXISTS "available_from"`);
  }
}
