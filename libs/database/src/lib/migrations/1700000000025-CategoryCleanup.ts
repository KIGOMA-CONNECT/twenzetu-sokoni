import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_DAR = 'a0000000-0000-0000-0000-000000000002';

// Removed categories (kept inactive for historical product references).
const DEACTIVATE = [
  { id: 'd0000000-0000-0000-0000-000000000019', name: 'Electronics na Bidhaa Nyingine' },
  { id: 'd0000000-0000-0000-0000-000000000020', name: 'Groceries' },
];

// New category covering tailoring and apparel design.
const TAILORING = { id: 'd0000000-0000-0000-0000-000000000021', name: 'Ushonaji na Tailoring', type: 'tailoring' };

export class CategoryCleanup1700000000025 implements MigrationInterface {
  name = 'CategoryCleanup1700000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const c of DEACTIVATE) {
      await queryRunner.query(
        `UPDATE "product_categories" SET is_active = false, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
        [c.id, TENANT_DAR],
      );
    }
    await queryRunner.query(
      `INSERT INTO "product_categories" (id, tenant_id, name, type, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW()) ON CONFLICT DO NOTHING`,
      [TAILORING.id, TENANT_DAR, TAILORING.name, TAILORING.type],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "product_categories" WHERE id = $1`, [TAILORING.id]);
    for (const c of DEACTIVATE) {
      await queryRunner.query(
        `UPDATE "product_categories" SET is_active = true, updated_at = NOW() WHERE id = $1 AND tenant_id = $2`,
        [c.id, TENANT_DAR],
      );
    }
  }
}
