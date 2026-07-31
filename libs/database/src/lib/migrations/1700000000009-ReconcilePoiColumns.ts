import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReconcilePoiColumns1700000000009 implements MigrationInterface {
  name = 'ReconcilePoiColumns1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hyperlocal_pois" ADD COLUMN IF NOT EXISTS "verified_by" UUID`);
    await queryRunner.query(`ALTER TABLE "hyperlocal_pois" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "hyperlocal_pois" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hyperlocal_pois" DROP COLUMN IF EXISTS "version"`);
    await queryRunner.query(`ALTER TABLE "hyperlocal_pois" DROP COLUMN IF EXISTS "is_active"`);
    await queryRunner.query(`ALTER TABLE "hyperlocal_pois" DROP COLUMN IF EXISTS "verified_by"`);
  }
}
