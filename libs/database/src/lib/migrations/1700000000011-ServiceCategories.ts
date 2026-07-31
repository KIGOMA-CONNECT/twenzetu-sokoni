import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_DAR = 'a0000000-0000-0000-0000-000000000002';

const CATEGORIES = [
  { id: 'd0000000-0000-0000-0000-000000000012', name: 'Chakula Kilicho Tayari', type: 'food' },
  { id: 'd0000000-0000-0000-0000-000000000013', name: 'Mboga na Matunda', type: 'food' },
  { id: 'd0000000-0000-0000-0000-000000000014', name: 'Mchele na Maharage', type: 'grocery' },
  { id: 'd0000000-0000-0000-0000-000000000015', name: 'Ufuaji na Usafishaji Nguo', type: 'general' },
  { id: 'd0000000-0000-0000-0000-000000000016', name: 'Usafi Nyumbani na Bustani', type: 'general' },
  { id: 'd0000000-0000-0000-0000-000000000017', name: 'Kupikiwa Nyumbani (Wapishi)', type: 'general' },
  { id: 'd0000000-0000-0000-0000-000000000018', name: 'Vitu vya Used', type: 'secondhand' },
  { id: 'd0000000-0000-0000-0000-000000000019', name: 'Electronics na Bidhaa Nyingine', type: 'electronics' },
];

export class ServiceCategories1700000000011 implements MigrationInterface {
  name = 'ServiceCategories1700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const c of CATEGORIES) {
      await queryRunner.query(
        `INSERT INTO "product_categories" (id, tenant_id, name, type, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [c.id, TENANT_DAR, c.name, c.type],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const c of CATEGORIES) {
      await queryRunner.query(`DELETE FROM "product_categories" WHERE id = $1`, [c.id]);
    }
  }
}
