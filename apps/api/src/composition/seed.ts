import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';

const DEFAULT_PASSWORD = 'password123';

const TENANT_DAR = 'a0000000-0000-0000-0000-000000000002';

const USERS = [
  { id: 'b0000000-0000-0000-0000-000000000009', tenantId: TENANT_DAR, phone: '+255754100000', name: 'Super Admin', role: 'super_admin', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, phone: '+255754100001', name: 'Admin User', role: 'admin', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, phone: '+255754100002', name: 'Amina Vendor', role: 'vendor', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000012', tenantId: TENANT_DAR, phone: '+255754100003', name: 'Hassan Customer', role: 'customer', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000013', tenantId: TENANT_DAR, phone: '+255754100004', name: 'Juma Driver', role: 'driver', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000014', tenantId: TENANT_DAR, phone: '+255754100005', name: 'Bakari Vendor', role: 'vendor', status: 'ACTIVE' },
];

const VENDORS = [
  { id: 'c0000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, userId: 'b0000000-0000-0000-0000-000000000011', shopName: 'Dar Fresh Market', description: 'Fresh produce from local farms', category: 'food', commissionRate: 10 },
  { id: 'c0000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, userId: 'b0000000-0000-0000-0000-000000000014', shopName: 'Kariakoo Electronics', description: 'Phones, laptops, and accessories', category: 'electronics', commissionRate: 8 },
];

const CATEGORIES = [
  { id: 'd0000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, name: 'Fresh Produce', type: 'food' },
  { id: 'd0000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, name: 'Electronics', type: 'electronics' },
];

const PRODUCTS = [
  { id: 'e0000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Wali Wa Nazi (Coconut Rice)', price: 4000, categoryId: 'd0000000-0000-0000-0000-000000000010', stock: 80 },
  { id: 'e0000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Nyama Choma (1kg)', price: 15000, categoryId: 'd0000000-0000-0000-0000-000000000010', stock: 30 },
  { id: 'e0000000-0000-0000-0000-000000000012', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Mchicha (Spinach Bundle)', price: 1000, categoryId: 'd0000000-0000-0000-0000-000000000010', stock: 150 },
  { id: 'e0000000-0000-0000-0000-000000000013', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000011', name: 'Samsung Galaxy A15', price: 450000, categoryId: 'd0000000-0000-0000-0000-000000000011', stock: 20 },
  { id: 'e0000000-0000-0000-0000-000000000014', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000011', name: 'Phone Charger USB-C', price: 8000, categoryId: 'd0000000-0000-0000-0000-000000000011', stock: 200 },
];

const ORDERS = [
  { id: '0a000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, customerId: 'b0000000-0000-0000-0000-000000000012', vendorId: 'c0000000-0000-0000-0000-000000000010', status: 'DELIVERED', subtotal: 19000, deliveryFee: 3000, commission: 1900, total: 22000, currency: 'TZS', address: 'Morogoro Rd, Dar es Salaam' },
  { id: '0a000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, customerId: 'b0000000-0000-0000-0000-000000000012', vendorId: 'c0000000-0000-0000-0000-000000000011', status: 'CONFIRMED', subtotal: 450000, deliveryFee: 5000, commission: 36000, total: 455000, currency: 'TZS', address: 'Kariakoo Market, Dar es Salaam' },
  { id: '0a000000-0000-0000-0000-000000000012', tenantId: TENANT_DAR, customerId: 'b0000000-0000-0000-0000-000000000012', vendorId: 'c0000000-0000-0000-0000-000000000010', status: 'PLACED', subtotal: 5000, deliveryFee: 2000, commission: 500, total: 7000, currency: 'TZS', address: 'Posta, Dar es Salaam' },
];

const PAYMENTS = [
  { id: '0b000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, orderId: '0a000000-0000-0000-0000-000000000010', customerId: 'b0000000-0000-0000-0000-000000000012', vendorId: 'c0000000-0000-0000-0000-000000000010', amount: 22000, currency: 'TZS', method: 'mpesa', status: 'RELEASED', commission: 1900, vendorNet: 17100, driverNet: 3000 },
  { id: '0b000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, orderId: '0a000000-0000-0000-0000-000000000011', customerId: 'b0000000-0000-0000-0000-000000000012', vendorId: 'c0000000-0000-0000-0000-000000000011', amount: 455000, currency: 'TZS', method: 'tigo_money', status: 'ESCROW_HELD', commission: 36000, vendorNet: 414000, driverNet: 5000 },
  { id: '0b000000-0000-0000-0000-000000000012', tenantId: TENANT_DAR, orderId: '0a000000-0000-0000-0000-000000000012', customerId: 'b0000000-0000-0000-0000-000000000012', vendorId: 'c0000000-0000-0000-0000-000000000010', amount: 7000, currency: 'TZS', method: 'cash', status: 'ESCROW_HELD', commission: 500, vendorNet: 4500, driverNet: 2000 },
];

const WALLETS = [
  { id: '0c000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, ownerId: 'c0000000-0000-0000-0000-000000000010', ownerType: 'vendor', balance: 17100, pending: 0, currency: 'TZS' },
  { id: '0c000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, ownerId: 'c0000000-0000-0000-0000-000000000011', ownerType: 'vendor', balance: 0, pending: 0, currency: 'TZS' },
];

const DELIVERIES = [
  { id: '0d000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, orderId: '0a000000-0000-0000-0000-000000000010', driverId: 'b0000000-0000-0000-0000-000000000013', vehicleType: 'boda', status: 'DELIVERED', pickup: 'Kariakoo Market', delivery: 'Morogoro Rd, Dar es Salaam', earnings: 3000 },
];

const SURGE_RULES = [
  { id: 'f0000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, name: 'Morning Rush', trigger: 'time_based', multiplier: 1.5, startHour: 7, endHour: 9 },
  { id: 'f0000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, name: 'Evening Rush', trigger: 'time_based', multiplier: 1.3, startHour: 17, endHour: 19 },
];

async function seed(): Promise<void> {
  const options = {
    type: 'postgres' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    username: process.env.DB_OWNER_USER || 'postgres',
    password: process.env.DB_OWNER_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'afri_market',
    entities: [],
    migrations: [],
    synchronize: false,
  };
  const ds = new DataSource(options);

  try {
    await ds.initialize();
    console.log('Connected to database. Seeding...');

    const passwordHash = await argon2.hash(DEFAULT_PASSWORD);
    console.log(`  Generated Argon2 hash for "${DEFAULT_PASSWORD}"`);

    // Tenant
    await ds.query(
      `INSERT INTO tenants (id, name, status, created_at, updated_at)
       VALUES ($1, $2, 'ACTIVE', NOW(), NOW()) ON CONFLICT DO NOTHING`,
      [TENANT_DAR, 'Dar es Salaam Hub'],
    );
    console.log('  Tenant seeded');

    // Users
    for (const u of USERS) {
      await ds.query(
        `INSERT INTO users (id, tenant_id, phone_number, full_name, role, password_hash, status, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [u.id, u.tenantId, u.phone, u.name, u.role, passwordHash, u.status],
      );
    }
    console.log('  Users seeded');

    // Vendors
    for (const v of VENDORS) {
      await ds.query(
        `INSERT INTO vendors (id, tenant_id, user_id, shop_name, description, category, commission_rate, status, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [v.id, v.tenantId, v.userId, v.shopName, v.description, v.category, v.commissionRate],
      );
    }
    console.log('  Vendors seeded');

    // Categories
    for (const c of CATEGORIES) {
      await ds.query(
        `INSERT INTO product_categories (id, tenant_id, name, type, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [c.id, c.tenantId, c.name, c.type],
      );
    }
    console.log('  Categories seeded');

    // Products
    for (const p of PRODUCTS) {
      await ds.query(
        `INSERT INTO products (id, tenant_id, vendor_id, name, description, price, currency, type, category_id, stock_quantity, unit, status, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4::varchar, $4::text, $5, 'TZS', 'PHYSICAL', $6, $7, 'pcs', 'ACTIVE', 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [p.id, p.tenantId, p.vendorId, p.name, p.price, p.categoryId, p.stock],
      );
    }
    console.log('  Products seeded');

    // Surge rules
    for (const s of SURGE_RULES) {
      await ds.query(
        `INSERT INTO surge_rules (id, tenant_id, name, trigger, multiplier, min_orders, max_drivers, start_hour, end_hour, is_active, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 0, 0, $6, $7, true, 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [s.id, s.tenantId, s.name, s.trigger, s.multiplier, s.startHour, s.endHour],
      );
    }
    console.log('  Surge rules seeded');

    // Orders
    for (const o of ORDERS) {
      await ds.query(
        `INSERT INTO orders (id, tenant_id, customer_id, vendor_id, type, status, subtotal, delivery_fee, system_commission, total_amount, currency, delivery_address, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'food', $5, $6, $7, $8, $9, $10, $11, 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [o.id, o.tenantId, o.customerId, o.vendorId, o.status, o.subtotal, o.deliveryFee, o.commission, o.total, o.currency, o.address],
      );
    }
    console.log('  Orders seeded');

    // Order Items
    const ORDER_ITEMS = [
      { orderId: '0a000000-0000-0000-0000-000000000010', productId: 'e0000000-0000-0000-0000-000000000010', name: 'Wali Wa Nazi (Coconut Rice)', qty: 2, unitPrice: 4000, currency: 'TZS' },
      { orderId: '0a000000-0000-0000-0000-000000000010', productId: 'e0000000-0000-0000-0000-000000000011', name: 'Nyama Choma (1kg)', qty: 1, unitPrice: 15000, currency: 'TZS' },
      { orderId: '0a000000-0000-0000-0000-000000000011', productId: 'e0000000-0000-0000-0000-000000000013', name: 'Samsung Galaxy A15', qty: 1, unitPrice: 450000, currency: 'TZS' },
      { orderId: '0a000000-0000-0000-0000-000000000012', productId: 'e0000000-0000-0000-0000-000000000010', name: 'Wali Wa Nazi (Coconut Rice)', qty: 1, unitPrice: 4000, currency: 'TZS' },
      { orderId: '0a000000-0000-0000-0000-000000000012', productId: 'e0000000-0000-0000-0000-000000000012', name: 'Mchicha (Spinach Bundle)', qty: 1, unitPrice: 1000, currency: 'TZS' },
    ];
    for (const oi of ORDER_ITEMS) {
      await ds.query(
        `INSERT INTO order_items (id, tenant_id, order_id, product_id, product_name, quantity, unit_price, total_price, currency, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [TENANT_DAR, oi.orderId, oi.productId, oi.name, oi.qty, oi.unitPrice, oi.unitPrice * oi.qty, oi.currency],
      );
    }
    console.log('  Order items seeded');

    // Payments
    for (const p of PAYMENTS) {
      await ds.query(
        `INSERT INTO payments (id, tenant_id, order_id, customer_id, vendor_id, amount, currency, method, status, system_commission, vendor_net, driver_net, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [p.id, p.tenantId, p.orderId, p.customerId, p.vendorId, p.amount, p.currency, p.method, p.status, p.commission, p.vendorNet, p.driverNet],
      );
    }
    console.log('  Payments seeded');

    // Wallets
    for (const w of WALLETS) {
      await ds.query(
        `INSERT INTO wallets (id, tenant_id, owner_id, owner_type, balance, pending_balance, currency, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [w.id, w.tenantId, w.ownerId, w.ownerType, w.balance, w.pending, w.currency],
      );
    }
    console.log('  Wallets seeded');

    // Deliveries
    for (const d of DELIVERIES) {
      await ds.query(
        `INSERT INTO deliveries (id, tenant_id, order_id, driver_id, vehicle_type, status, pickup_address, delivery_address, driver_earnings, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [d.id, d.tenantId, d.orderId, d.driverId, d.vehicleType, d.status, d.pickup, d.delivery, d.earnings],
      );
    }
    console.log('  Deliveries seeded');

    // Wallet transactions
    const walletTxData = [
      { tenantId: TENANT_DAR, ownerId: 'c0000000-0000-0000-0000-000000000010', type: 'CREDIT', amount: 17100, desc: 'Payment release for order', refId: '0b000000-0000-0000-0000-000000000010', refType: 'payment' },
      { tenantId: TENANT_DAR, ownerId: 'b0000000-0000-0000-0000-000000000013', type: 'CREDIT', amount: 3000, desc: 'Driver earnings for delivery', refId: '0d000000-0000-0000-0000-000000000010', refType: 'delivery' },
    ];
    for (const tx of walletTxData) {
      await ds.query(
        `INSERT INTO wallet_transactions (id, tenant_id, owner_id, owner_type, type, amount, currency, balance_before, balance_after, description, reference_id, reference_type, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'vendor', $3, $4, 'TZS', 0, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [tx.tenantId, tx.ownerId, tx.type, tx.amount, tx.desc, tx.refId, tx.refType],
      );
    }
    console.log('  Wallet transactions seeded');

    // Reviews
    const reviewsData = [
      { tenantId: TENANT_DAR, customerId: 'b0000000-0000-0000-0000-000000000012', vendorId: 'c0000000-0000-0000-0000-000000000010', orderId: '0a000000-0000-0000-0000-000000000010', rating: 5, comment: 'Fresh wali wa nazi, delivered on time!' },
      { tenantId: TENANT_DAR, customerId: 'b0000000-0000-0000-0000-000000000012', vendorId: 'c0000000-0000-0000-0000-000000000011', orderId: '0a000000-0000-0000-0000-000000000011', rating: 4, comment: 'Good phone, fast delivery' },
    ];
    for (const r of reviewsData) {
      await ds.query(
        `INSERT INTO reviews (id, tenant_id, customer_id, vendor_id, order_id, rating, comment, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [r.tenantId, r.customerId, r.vendorId, r.orderId, r.rating, r.comment],
      );
    }
    console.log('  Reviews seeded');

    // Customer loyalty points
    await ds.query(
      `INSERT INTO customer_points (id, tenant_id, customer_id, total_points, redeemable_points, lifetime_points, tier, version, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 40, 40, 40, 'BRONZE', 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
      [TENANT_DAR, 'b0000000-0000-0000-0000-000000000012'],
    );
    console.log('  Customer loyalty points seeded');

    // Vehicles
    await ds.query(
      `INSERT INTO vehicles (id, tenant_id, driver_id, vehicle_type, plate_number, capacity_kg, is_available, version, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'boda', 'T 123 ABC', 100, true, 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
      [TENANT_DAR, 'b0000000-0000-0000-0000-000000000013'],
    );
    console.log('  Vehicles seeded');

    console.log('\n========================================');
    console.log('Seed complete! (Tanzania / TZS)');
    console.log('========================================');
    console.log(`\nLogin password for ALL users: "${DEFAULT_PASSWORD}"\n`);
    console.log('Demo accounts:');
    console.log('  Super Admin: +255754100000');
    console.log('  Admin:       +255754100001');
    console.log('  Vendor:      +255754100002 (Dar Fresh Market)');
    console.log('  Customer:    +255754100003 (Hassan)');
    console.log('  Driver:      +255754100004 (Juma)');
    console.log('  Vendor:      +255754100005 (Kariakoo Electronics)');
    console.log('\nAll data in Dar es Salaam tenant (TZS)');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await ds.destroy();
  }
}

seed();
