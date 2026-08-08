import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_DAR = 'a0000000-0000-0000-0000-000000000002';

// ── Existing IDs (from earlier migrations) ──
const EXISTING = {
  ELECTRONICS:       'd0000000-0000-0000-0000-000000000011',
  CHAKULA_TAYARI:    'd0000000-0000-0000-0000-000000000012',
  MBOGA_MATUNDA:     'd0000000-0000-0000-0000-000000000013',
  MCHELE_MAHARAGE:   'd0000000-0000-0000-0000-000000000014',
  LAUNDRY:           'd0000000-0000-0000-0000-000000000015',
  USAFI:             'd0000000-0000-0000-0000-000000000016',
  KUPIKIWA:          'd0000000-0000-0000-0000-000000000017',
  VITU_USED:         'd0000000-0000-0000-0000-000000000018',
  TAILORING:         'd0000000-0000-0000-0000-000000000021',
  USED_NGUO:         'd0000000-0000-0000-0000-000000000022',
  USED_ELECTRONICS:  'd0000000-0000-0000-0000-000000000023',
  USED_MITAMBO:      'd0000000-0000-0000-0000-000000000024',
  USED_TOOLS:        'd0000000-0000-0000-0000-000000000025',
  USED_FURNITURE:    'd0000000-0000-0000-0000-000000000026',
};

// ── New parent categories ──
const PARENTS = {
  FOOD_SERVICES:     'd0000000-0000-0000-0000-000000000030',
  FRESH_PRODUCE:     'd0000000-0000-0000-0000-000000000031',
  HOME_GARDEN:       'd0000000-0000-0000-0000-000000000032',
  LAUNDRY_PARENT:    'd0000000-0000-0000-0000-000000000033',
  TAILORING_PARENT:  'd0000000-0000-0000-0000-000000000034',
  GENERAL_PARENT:    'd0000000-0000-0000-0000-000000000035',
  CARGO_PARENT:      'd0000000-0000-0000-0000-000000000036',
};

// ── New subcategories ──
const FOOD_SUBS = [
  { id: 'd0000000-0000-0000-0000-000000000040', name: 'Wali na Nyama Choma',        type: 'food' },
  { id: 'd0000000-0000-0000-0000-000000000041', name: 'Ugali na Samaki',            type: 'food' },
  { id: 'd0000000-0000-0000-0000-000000000042', name: 'Mihogo na Kuku',             type: 'food' },
  { id: 'd0000000-0000-0000-0000-000000000043', name: 'Chipsi na Maji',             type: 'food' },
  { id: 'd0000000-0000-0000-0000-000000000044', name: 'Supu na Mboga',              type: 'food' },
  { id: 'd0000000-0000-0000-0000-000000000045', name: 'Pilau na Biryani',           type: 'food' },
];

const FRESH_SUBS = [
  { id: 'd0000000-0000-0000-0000-000000000050', name: 'Mboga',                      type: 'grocery' },
  { id: 'd0000000-0000-0000-0000-000000000051', name: 'Matunda',                    type: 'grocery' },
  { id: 'd0000000-0000-0000-0000-000000000052', name: 'Mchele na Maharage',          type: 'grocery' },
  { id: 'd0000000-0000-0000-0000-000000000053', name: 'Hoho na Karoti',             type: 'grocery' },
  { id: 'd0000000-0000-0000-0000-000000000054', name: 'Vitunguu na Mboga Kavu',     type: 'grocery' },
  { id: 'd0000000-0000-0000-0000-000000000055', name: 'Nyama na Samaki Fresh',      type: 'grocery' },
  { id: 'd0000000-0000-0000-0000-000000000056', name: 'Milk na Dairy Products',     type: 'grocery' },
];

const LAUNDRY_SUBS = [
  { id: 'd0000000-0000-0000-0000-000000000060', name: 'Mama Fua',                   type: 'laundry' },
  { id: 'd0000000-0000-0000-0000-000000000061', name: 'Kufuliwa Nyumbani',          type: 'laundry' },
];

const TAILORING_SUBS = [
  { id: 'd0000000-0000-0000-0000-000000000070', name: 'Nguo za Kiume',              type: 'tailoring' },
  { id: 'd0000000-0000-0000-0000-000000000071', name: 'Nguo za Kike',               type: 'tailoring' },
  { id: 'd0000000-0000-0000-0000-000000000072', name: 'Vazi la Harusi',             type: 'tailoring' },
  { id: 'd0000000-0000-0000-0000-000000000073', name: 'Uniforms na Workwear',       type: 'tailoring' },
];

const GENERAL_SUBS = [
  { id: 'd0000000-0000-0000-0000-000000000080', name: 'Electronics',                type: 'electronics' },
  { id: 'd0000000-0000-0000-0000-000000000081', name: 'Vifaa vya Nyumbani',         type: 'general' },
  { id: 'd0000000-0000-0000-0000-000000000082', name: 'Fanicha',                    type: 'general' },
  { id: 'd0000000-0000-0000-0000-000000000083', name: 'Vyombo vya Usafiri',         type: 'general' },
  { id: 'd0000000-0000-0000-0000-000000000084', name: 'Vifaa vya Ujenzi (Hardware)', type: 'general' },
  { id: 'd0000000-0000-0000-0000-000000000085', name: 'Mitandao na Simu',           type: 'electronics' },
  { id: 'd0000000-0000-0000-0000-000000000086', name: 'Vifaa vya Michezo',          type: 'general' },
  { id: 'd0000000-0000-0000-0000-000000000087', name: 'Vitabu na Vifaa vya Masomo', type: 'general' },
];

const CARGO_SUBS = [
  { id: 'd0000000-0000-0000-0000-000000000090', name: 'Cargo ya Ndani',              type: 'cargo' },
  { id: 'd0000000-0000-0000-0000-000000000091', name: 'Express Delivery',           type: 'cargo' },
  { id: 'd0000000-0000-0000-0000-000000000092', name: 'Logistics ya Biashara',      type: 'cargo' },
  { id: 'd0000000-0000-0000-0000-000000000093', name: 'Kukodisha Lori/Cherehe',     type: 'cargo' },
];

async function insertCategory(qr: QueryRunner, id: string, name: string, type: string, parentId: string | null) {
  await qr.query(
    `INSERT INTO "product_categories" (id, tenant_id, name, type, parent_id, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW()) ON CONFLICT (id) DO UPDATE SET name = $3, type = $4, parent_id = $5, is_active = true, updated_at = NOW()`,
    [id, TENANT_DAR, name, type, parentId],
  );
}

export class RestructureCategories1700000000028 implements MigrationInterface {
  name = 'RestructureCategories1700000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Create parent categories ──
    await insertCategory(queryRunner, PARENTS.FOOD_SERVICES,   'Chakula na Huduma za Chakula',  'food',       null);
    await insertCategory(queryRunner, PARENTS.FRESH_PRODUCE,   'Mboga, Matunda na Vya Fresh',   'grocery',    null);
    await insertCategory(queryRunner, PARENTS.HOME_GARDEN,     'Usafi wa Nyumba na Bustani',    'service',    null);
    await insertCategory(queryRunner, PARENTS.LAUNDRY_PARENT,  'Huduma za Ufuaaji',             'laundry',    null);
    await insertCategory(queryRunner, PARENTS.TAILORING_PARENT,'Ushonaji na Tailoring',          'tailoring',  null);
    await insertCategory(queryRunner, PARENTS.GENERAL_PARENT,  'Mahitaji ya Jumla',             'general',    null);
    await insertCategory(queryRunner, PARENTS.CARGO_PARENT,    'Cargo, Express & Logistics',    'cargo',      null);

    // ── 2. Move existing categories under new parents ──
    // Food Services children
    await queryRunner.query(`UPDATE "product_categories" SET parent_id = $1, updated_at = NOW() WHERE id = $2`, [PARENTS.FOOD_SERVICES, EXISTING.CHAKULA_TAYARI]);
    await queryRunner.query(`UPDATE "product_categories" SET parent_id = $1, updated_at = NOW() WHERE id = $2`, [PARENTS.FOOD_SERVICES, EXISTING.KUPIKIWA]);

    // Fresh Produce children
    await queryRunner.query(`UPDATE "product_categories" SET parent_id = $1, updated_at = NOW() WHERE id = $2`, [PARENTS.FRESH_PRODUCE, EXISTING.MBOGA_MATUNDA]);
    await queryRunner.query(`UPDATE "product_categories" SET parent_id = $1, updated_at = NOW() WHERE id = $2`, [PARENTS.FRESH_PRODUCE, EXISTING.MCHELE_MAHARAGE]);

    // Home & Garden — existing standalone
    await queryRunner.query(`UPDATE "product_categories" SET parent_id = $1, updated_at = NOW() WHERE id = $2`, [PARENTS.HOME_GARDEN, EXISTING.USAFI]);

    // Laundry parent
    await queryRunner.query(`UPDATE "product_categories" SET parent_id = $1, updated_at = NOW() WHERE id = $2`, [PARENTS.LAUNDRY_PARENT, EXISTING.LAUNDRY]);

    // Tailoring parent
    await queryRunner.query(`UPDATE "product_categories" SET parent_id = $1, updated_at = NOW() WHERE id = $2`, [PARENTS.TAILORING_PARENT, EXISTING.TAILORING]);

    // General parent — Electronics goes under General
    await queryRunner.query(`UPDATE "product_categories" SET parent_id = $1, updated_at = NOW() WHERE id = $2`, [PARENTS.GENERAL_PARENT, EXISTING.ELECTRONICS]);

    // Used goods stay under their existing parent (d...018)

    // ── 3. Insert food subcategories ──
    for (const c of FOOD_SUBS) {
      await insertCategory(queryRunner, c.id, c.name, c.type, PARENTS.FOOD_SERVICES);
    }

    // ── 4. Insert fresh produce subcategories ──
    for (const c of FRESH_SUBS) {
      await insertCategory(queryRunner, c.id, c.name, c.type, PARENTS.FRESH_PRODUCE);
    }

    // ── 5. Insert laundry subcategories ──
    for (const c of LAUNDRY_SUBS) {
      await insertCategory(queryRunner, c.id, c.name, c.type, PARENTS.LAUNDRY_PARENT);
    }

    // ── 6. Insert tailoring subcategories ──
    for (const c of TAILORING_SUBS) {
      await insertCategory(queryRunner, c.id, c.name, c.type, PARENTS.TAILORING_PARENT);
    }

    // ── 7. Insert general merchandise subcategories ──
    for (const c of GENERAL_SUBS) {
      await insertCategory(queryRunner, c.id, c.name, c.type, PARENTS.GENERAL_PARENT);
    }

    // ── 8. Insert cargo/logistics subcategories ──
    for (const c of CARGO_SUBS) {
      await insertCategory(queryRunner, c.id, c.name, c.type, PARENTS.CARGO_PARENT);
    }

    // ── 9. Remove duplicate "Services" category (if exists) ──
    await queryRunner.query(
      `UPDATE "product_categories" SET is_active = false, updated_at = NOW()
       WHERE name = 'Services' AND tenant_id = $1 AND parent_id IS NULL`,
      [TENANT_DAR],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all new subcategories
    const allNewSubs = [...FOOD_SUBS, ...FRESH_SUBS, ...LAUNDRY_SUBS, ...TAILORING_SUBS, ...GENERAL_SUBS, ...CARGO_SUBS];
    for (const c of allNewSubs) {
      await queryRunner.query(`DELETE FROM "product_categories" WHERE id = $1`, [c.id]);
    }

    // Remove parent categories
    for (const p of Object.values(PARENTS)) {
      await queryRunner.query(`DELETE FROM "product_categories" WHERE id = $1`, [p]);
    }

    // Reset parent_id of existing categories back to null
    for (const e of Object.values(EXISTING)) {
      await queryRunner.query(`UPDATE "product_categories" SET parent_id = NULL, updated_at = NOW() WHERE id = $1`, [e]);
    }
  }
}
