import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReconcileSurgeTriggers1700000000010 implements MigrationInterface {
  name = 'ReconcileSurgeTriggers1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "surge_rules" SET "trigger" = 'NIGHT_TIME' WHERE "trigger" = 'time_based'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "surge_rules" SET "trigger" = 'time_based' WHERE "trigger" = 'NIGHT_TIME'`,
    );
  }
}
