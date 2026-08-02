import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adds pickup coordinates to vendors so delivery fares can be computed
 * Bolt-style (base + per-km from vendor pickup to customer drop-off).
 */
export class VendorPickupCoordinates1700000000015 implements MigrationInterface {
  public name = 'VendorPickupCoordinates1700000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vendors"
        ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10,7),
        ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(10,7)
    `);

    const coords: Array<[string, number, number]> = [
      ['c0000000-0000-0000-0000-000000000010', -6.8191, 39.2802],
      ['c0000000-0000-0000-0000-000000000011', -6.8204, 39.2837],
      ['c0000000-0000-0000-0000-000000000012', -6.7924, 39.2083],
      ['c0000000-0000-0000-0000-000000000013', -6.8124, 39.2561],
      ['c0000000-0000-0000-0000-000000000020', -6.8015, 39.2672],
      ['c0000000-0000-0000-0000-000000000021', -6.8084, 39.2391],
      ['c0000000-0000-0000-0000-000000000022', -6.8262, 39.2911],
      ['c0000000-0000-0000-0000-000000000023', -6.7861, 39.2874],
      ['c0000000-0000-0000-0000-000000000024', -6.7997, 39.2467],
    ];
    for (const [id, lat, lng] of coords) {
      await queryRunner.query(
        `UPDATE "vendors" SET "latitude" = $2, "longitude" = $3 WHERE "id" = $1`,
        [id, lat, lng],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vendors"
        DROP COLUMN IF EXISTS "longitude",
        DROP COLUMN IF EXISTS "latitude"
    `);
  }
}
