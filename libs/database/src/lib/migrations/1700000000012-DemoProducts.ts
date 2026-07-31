import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_DAR = 'a0000000-0000-0000-0000-000000000002';
const DEFAULT_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$ur4hSPmJyHCKDMln6y73kg$QBH+Zmk7gydQ8SmfgOO0LsOuaC0RvpED09ds9OM13oY';

const USERS = [
  { id: 'b0000000-0000-0000-0000-000000000015', phone: '+255754100006', name: 'Rehema Cleaning', role: 'vendor' },
  { id: 'b0000000-0000-0000-0000-000000000016', phone: '+255754100007', name: 'Saada Fashion', role: 'vendor' },
];

const VENDORS = [
  { id: 'c0000000-0000-0000-0000-000000000012', userId: 'b0000000-0000-0000-0000-000000000015', shopName: 'Mama Rehema Cleaning', description: 'Usafi wa nyumbani, sabuni na huduma za kusafisha', category: 'cleaning', commissionRate: 10 },
  { id: 'c0000000-0000-0000-0000-000000000013', userId: 'b0000000-0000-0000-0000-000000000016', shopName: 'Saada Fashion Tailors', description: 'Ushonaji na ufuaji wa nguo', category: 'tailoring', commissionRate: 10 },
];

const PRODUCTS = [
  { id: 'e0000000-0000-0000-0000-000000000015', vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Nyanya (Tomatoes 1kg)', price: 1500, categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 100 },
  { id: 'e0000000-0000-0000-0000-000000000016', vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Sukuma Wiki (Bundle)', price: 800, categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 150 },
  { id: 'e0000000-0000-0000-0000-000000000017', vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Mayai (Tray ya 30)', price: 7000, categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 40 },
  { id: 'e0000000-0000-0000-0000-000000000018', vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Mchele Pumba (1kg)', price: 3000, categoryId: 'd0000000-0000-0000-0000-000000000014', stock: 200 },
  { id: 'e0000000-0000-0000-0000-000000000019', vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Maharage Mbili (1kg)', price: 3500, categoryId: 'd0000000-0000-0000-0000-000000000014', stock: 100 },
  { id: 'e0000000-0000-0000-0000-000000000020', vendorId: 'c0000000-0000-0000-0000-000000000012', name: 'Sabuni ya Kufulia', price: 2000, categoryId: 'd0000000-0000-0000-0000-000000000016', stock: 120 },
  { id: 'e0000000-0000-0000-0000-000000000021', vendorId: 'c0000000-0000-0000-0000-000000000012', name: 'Usafi wa Nyumbani (kwa Saa)', price: 8000, categoryId: 'd0000000-0000-0000-0000-000000000016', stock: 100 },
  { id: 'e0000000-0000-0000-0000-000000000022', vendorId: 'c0000000-0000-0000-0000-000000000013', name: 'Ushonaji Nguo', price: 10000, categoryId: 'd0000000-0000-0000-0000-000000000015', stock: 100 },
  { id: 'e0000000-0000-0000-0000-000000000023', vendorId: 'c0000000-0000-0000-0000-000000000013', name: 'Kufua na Kubandika Nguo', price: 6000, categoryId: 'd0000000-0000-0000-0000-000000000015', stock: 100 },
];

export class DemoProducts1700000000012 implements MigrationInterface {
  name = 'DemoProducts1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const u of USERS) {
      await queryRunner.query(
        `INSERT INTO "users" (id, tenant_id, phone_number, full_name, role, password_hash, status, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE', 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [u.id, TENANT_DAR, u.phone, u.name, u.role, DEFAULT_PASSWORD_HASH],
      );
    }
    for (const v of VENDORS) {
      await queryRunner.query(
        `INSERT INTO "vendors" (id, tenant_id, user_id, shop_name, description, category, commission_rate, status, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [v.id, TENANT_DAR, v.userId, v.shopName, v.description, v.category, v.commissionRate],
      );
    }
    for (const p of PRODUCTS) {
      await queryRunner.query(
        `INSERT INTO "products" (id, tenant_id, vendor_id, name, description, price, currency, type, category_id, stock_quantity, unit, status, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4::varchar, $4::text, $5, 'TZS', 'PHYSICAL', $6, $7, 'pcs', 'ACTIVE', 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [p.id, TENANT_DAR, p.vendorId, p.name, p.price, p.categoryId, p.stock],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const p of PRODUCTS) {
      await queryRunner.query(`DELETE FROM "products" WHERE id = $1`, [p.id]);
    }
    for (const v of VENDORS) {
      await queryRunner.query(`DELETE FROM "vendors" WHERE id = $1`, [v.id]);
    }
    for (const u of USERS) {
      await queryRunner.query(`DELETE FROM "users" WHERE id = $1`, [u.id]);
    }
  }
}
