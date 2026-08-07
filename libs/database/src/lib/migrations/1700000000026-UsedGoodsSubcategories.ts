import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_DAR = 'a0000000-0000-0000-0000-000000000002';

// Duplicate category removed (kept inactive for historical product references).
const FRESH_PRODUCE_ID = 'd0000000-0000-0000-0000-000000000010';
const MBOGNA_MATUNDA_ID = 'd0000000-0000-0000-0000-000000000013';

// Subcategories of "Vitu vya Used" (d...018) — second-hand goods by type.
const USED_SUBCATEGORIES = [
  { id: 'd0000000-0000-0000-0000-000000000022', name: 'Nguo za Used', type: 'secondhand' },
  { id: 'd0000000-0000-0000-0000-000000000023', name: 'Electronics za Used', type: 'secondhand' },
  { id: 'd0000000-0000-0000-0000-000000000024', name: 'Mitambo na Machine', type: 'secondhand' },
  { id: 'd0000000-0000-0000-0000-000000000025', name: 'Tools na Zana', type: 'secondhand' },
  { id: 'd0000000-0000-0000-0000-000000000026', name: 'Fanicha za Used', type: 'secondhand' },
];

export class UsedGoodsSubcategories1700000000026 implements MigrationInterface {
  name = 'UsedGoodsSubcategories1700000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Move products from duplicate "Fresh Produce" into "Mboga na Matunda".
    await queryRunner.query(
      `UPDATE "products" SET category_id = $1, updated_at = NOW()
       WHERE category_id = $2 AND tenant_id = $3`,
      [MBOGNA_MATUNDA_ID, FRESH_PRODUCE_ID, TENANT_DAR],
    );
    await queryRunner.query(
      `UPDATE "product_categories" SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [FRESH_PRODUCE_ID, TENANT_DAR],
    );

    // Insert second-hand subcategories under "Vitu vya Used".
    const parentId = 'd0000000-0000-0000-0000-000000000018';
    for (const c of USED_SUBCATEGORIES) {
      await queryRunner.query(
        `INSERT INTO "product_categories" (id, tenant_id, name, type, parent_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [c.id, TENANT_DAR, c.name, c.type, parentId],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const c of USED_SUBCATEGORIES) {
      await queryRunner.query(`DELETE FROM "product_categories" WHERE id = $1`, [c.id]);
    }
    await queryRunner.query(
      `UPDATE "product_categories" SET is_active = true, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2`,
      [FRESH_PRODUCE_ID, TENANT_DAR],
    );
  }
}
