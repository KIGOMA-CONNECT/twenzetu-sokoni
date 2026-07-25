import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { buildDataSourceOptions } from '@afri-market/database';
import { IDENTITY_ENTITIES } from '@afri-market/identity-infrastructure';
import { MARKETPLACE_ENTITIES } from '@afri-market/marketplace-infrastructure';

const DEFAULT_PASSWORD = 'password123';

const TENANT_KIGALI = 'a0000000-0000-0000-0000-000000000001';
const TENANT_DAR = 'a0000000-0000-0000-0000-000000000002';

const USERS = [
  { id: 'b0000000-0000-0000-0000-000000000001', tenantId: TENANT_KIGALI, phone: '+250788100001', name: 'Admin User', role: 'admin', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000002', tenantId: TENANT_KIGALI, phone: '+250788100002', name: 'Jean Vendor', role: 'vendor', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000003', tenantId: TENANT_KIGALI, phone: '+250788100003', name: 'Marie Customer', role: 'customer', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000004', tenantId: TENANT_KIGALI, phone: '+250788100004', name: 'Paul Driver', role: 'driver', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000005', tenantId: TENANT_DAR, phone: '+255754100001', name: 'Amina Vendor', role: 'vendor', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000006', tenantId: TENANT_DAR, phone: '+255754100002', name: 'Hassan Customer', role: 'customer', status: 'ACTIVE' },
];

const VENDORS = [
  { id: 'c0000000-0000-0000-0000-000000000001', tenantId: TENANT_KIGALI, userId: 'b0000000-0000-0000-0000-000000000002', shopName: 'Kigali Fresh Market', description: 'Fresh produce from local farms', category: 'food', commissionRate: 10 },
  { id: 'c0000000-0000-0000-0000-000000000002', tenantId: TENANT_KIGALI, userId: 'b0000000-0000-0000-0000-000000000002', shopName: 'Nyamirambo Electronics', description: 'Phones, laptops, and accessories', category: 'electronics', commissionRate: 8 },
  { id: 'c0000000-0000-0000-0000-000000000003', tenantId: TENANT_DAR, userId: 'b0000000-0000-0000-0000-000000000005', shopName: 'Dar Food Hub', description: 'Tanzanian food essentials', category: 'food', commissionRate: 12 },
];

const CATEGORIES = [
  { id: 'd0000000-0000-0000-0000-000000000001', tenantId: TENANT_KIGALI, name: 'Fresh Produce', type: 'food' },
  { id: 'd0000000-0000-0000-0000-000000000002', tenantId: TENANT_KIGALI, name: 'Electronics', type: 'electronics' },
  { id: 'd0000000-0000-0000-0000-000000000003', tenantId: TENANT_DAR, name: 'Food & Groceries', type: 'food' },
];

const PRODUCTS = [
  { id: 'e0000000-0000-0000-0000-000000000001', tenantId: TENANT_KIGALI, vendorId: 'c0000000-0000-0000-0000-000000000001', name: 'Matooke (Bananas)', price: 2500, categoryId: 'd0000000-0000-0000-0000-000000000001', stock: 100 },
  { id: 'e0000000-0000-0000-0000-000000000002', tenantId: TENANT_KIGALI, vendorId: 'c0000000-0000-0000-0000-000000000001', name: 'Isombe (Cassava Leaves)', price: 3000, categoryId: 'd0000000-0000-0000-0000-000000000001', stock: 50 },
  { id: 'e0000000-0000-0000-0000-000000000003', tenantId: TENANT_KIGALI, vendorId: 'c0000000-0000-0000-0000-000000000002', name: 'Samsung Galaxy A15', price: 185000, categoryId: 'd0000000-0000-0000-0000-000000000002', stock: 20 },
  { id: 'e0000000-0000-0000-0000-000000000004', tenantId: TENANT_KIGALI, vendorId: 'c0000000-0000-0000-0000-000000000002', name: 'Phone Charger USB-C', price: 5000, categoryId: 'd0000000-0000-0000-0000-000000000002', stock: 200 },
  { id: 'e0000000-0000-0000-0000-000000000005', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000003', name: 'Wali Wa Nazi (Coconut Rice)', price: 4000, categoryId: 'd0000000-0000-0000-0000-000000000003', stock: 80 },
  { id: 'e0000000-0000-0000-0000-000000000006', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000003', name: 'Nyama Choma (1kg)', price: 15000, categoryId: 'd0000000-0000-0000-0000-000000000003', stock: 30 },
];

const ORDERS = [
  { id: 'g0000000-0000-0000-0000-000000000001', tenantId: TENANT_KIGALI, customerId: 'b0000000-0000-0000-0000-000000000003', vendorId: 'c0000000-0000-0000-0000-000000000001', status: 'DELIVERED', subtotal: 5500, deliveryFee: 1000, commission: 550, total: 6500, currency: 'RWF', address: 'KN 5 Rd, Kigali' },
  { id: 'g0000000-0000-0000-0000-000000000002', tenantId: TENANT_KIGALI, customerId: 'b0000000-0000-0000-0000-000000000003', vendorId: 'c0000000-0000-0000-0000-000000000002', status: 'CONFIRMED', subtotal: 185000, deliveryFee: 2000, commission: 14800, total: 187000, currency: 'RWF', address: 'KG 7 Ave, Kigali' },
  { id: 'g0000000-0000-0000-0000-000000000003', tenantId: TENANT_DAR, customerId: 'b0000000-0000-0000-0000-000000000006', vendorId: 'c0000000-0000-0000-0000-000000000003', status: 'PLACED', subtotal: 19000, deliveryFee: 3000, commission: 2280, total: 22000, currency: 'TZS', address: 'Morogoro Rd, Dar' },
];

const PAYMENTS = [
  { id: 'h0000000-0000-0000-0000-000000000001', tenantId: TENANT_KIGALI, orderId: 'g0000000-0000-0000-0000-000000000001', customerId: 'b0000000-0000-0000-0000-000000000003', vendorId: 'c0000000-0000-0000-0000-000000000001', amount: 6500, currency: 'RWF', method: 'mpesa', status: 'RELEASED', commission: 550, vendorNet: 4950, driverNet: 1000 },
  { id: 'h0000000-0000-0000-0000-000000000002', tenantId: TENANT_KIGALI, orderId: 'g0000000-0000-0000-0000-000000000002', customerId: 'b0000000-0000-0000-0000-000000000003', vendorId: 'c0000000-0000-0000-0000-000000000002', amount: 187000, currency: 'RWF', method: 'tigo_money', status: 'ESCROW_HELD', commission: 14800, vendorNet: 170200, driverNet: 2000 },
  { id: 'h0000000-0000-0000-0000-000000000003', tenantId: TENANT_DAR, orderId: 'g0000000-0000-0000-0000-000000000003', customerId: 'b0000000-0000-0000-0000-000000000006', vendorId: 'c0000000-0000-0000-0000-000000000003', amount: 22000, currency: 'TZS', method: 'cash', status: 'ESCROW_HELD', commission: 2280, vendorNet: 16720, driverNet: 3000 },
];

const WALLETS = [
  { id: 'w0000000-0000-0000-0000-000000000001', tenantId: TENANT_KIGALI, ownerId: 'c0000000-0000-0000-0000-000000000001', ownerType: 'vendor', balance: 4950, pending: 0, currency: 'RWF' },
  { id: 'w0000000-0000-0000-0000-000000000002', tenantId: TENANT_KIGALI, ownerId: 'c0000000-0000-0000-0000-000000000002', ownerType: 'vendor', balance: 0, pending: 0, currency: 'RWF' },
  { id: 'w0000000-0000-0000-0000-000000000003', tenantId: TENANT_DAR, ownerId: 'c0000000-0000-0000-0000-000000000003', ownerType: 'vendor', balance: 0, pending: 0, currency: 'TZS' },
];

const DELIVERIES = [
  { id: 'i0000000-0000-0000-0000-000000000001', tenantId: TENANT_KIGALI, orderId: 'g0000000-0000-0000-0000-000000000001', driverId: 'b0000000-0000-0000-0000-000000000004', vehicleType: 'boda', status: 'DELIVERED', pickup: 'Nyabugogo Market', delivery: 'KN 5 Rd, Kigali', earnings: 1000 },
];

const SURGE_RULES = [
  { id: 'f0000000-0000-0000-0000-000000000001', tenantId: TENANT_KIGALI, name: 'Morning Rush', trigger: 'time_based', multiplier: 1.5, startHour: 7, endHour: 9 },
  { id: 'f0000000-0000-0000-0000-000000000002', tenantId: TENANT_KIGALI, name: 'Evening Rush', trigger: 'time_based', multiplier: 1.3, startHour: 17, endHour: 19 },
  { id: 'f0000000-0000-0000-0000-000000000003', tenantId: TENANT_KIGALI, name: 'High Demand', trigger: 'demand', multiplier: 1.2, startHour: null, endHour: null },
];

async function seed(): Promise<void> {
  const options = { ...buildDataSourceOptions() };
  options.entities = [...IDENTITY_ENTITIES, ...MARKETPLACE_ENTITIES];
  const ds = new DataSource(options);

  try {
    await ds.initialize();
    console.log('Connected to database. Seeding...');

    const passwordHash = await argon2.hash(DEFAULT_PASSWORD);
    console.log(`  Generated Argon2 hash for "${DEFAULT_PASSWORD}"`);

    // Tenants
    for (const t of [
      { id: TENANT_KIGALI, name: 'Kigali Fresh Market' },
      { id: TENANT_DAR, name: 'Dar es Salaam Hub' },
    ]) {
      await ds.query(
        `INSERT INTO tenants (id, name, status, created_at, updated_at)
         VALUES ($1, $2, 'ACTIVE', NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
        [t.id, t.name],
      );
    }
    console.log('  Tenants seeded');

    // Users
    for (const u of USERS) {
      await ds.query(
        `INSERT INTO users (id, tenant_id, phone_number, full_name, role, password_hash, status, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
        [u.id, u.tenantId, u.phone, u.name, u.role, passwordHash, u.status],
      );
    }
    console.log('  Users seeded');

    // Vendors
    for (const v of VENDORS) {
      await ds.query(
        `INSERT INTO vendors (id, tenant_id, user_id, shop_name, description, category, commission_rate, status, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', 1, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
        [v.id, v.tenantId, v.userId, v.shopName, v.description, v.category, v.commissionRate],
      );
    }
    console.log('  Vendors seeded');

    // Categories
    for (const c of CATEGORIES) {
      await ds.query(
        `INSERT INTO product_categories (id, tenant_id, name, type, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, true, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
        [c.id, c.tenantId, c.name, c.type],
      );
    }
    console.log('  Categories seeded');

    // Products
    for (const p of PRODUCTS) {
      await ds.query(
        `INSERT INTO products (id, tenant_id, vendor_id, name, description, price, currency, type, category_id, stock_quantity, unit, status, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $4, $5, 'RWF', 'PHYSICAL', $6, $7, 'pcs', 'ACTIVE', 1, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
        [p.id, p.tenantId, p.vendorId, p.name, p.price, p.categoryId, p.stock],
      );
    }
    console.log('  Products seeded');

    // Surge rules
    for (const s of SURGE_RULES) {
      await ds.query(
        `INSERT INTO surge_rules (id, tenant_id, name, trigger, multiplier, min_orders, max_drivers, start_hour, end_hour, is_active, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 0, 0, $6, $7, true, 1, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
        [s.id, s.tenantId, s.name, s.trigger, s.multiplier, s.startHour, s.endHour],
      );
    }
    console.log('  Surge rules seeded');

    // Orders
    for (const o of ORDERS) {
      await ds.query(
        `INSERT INTO orders (id, tenant_id, customer_id, vendor_id, type, status, subtotal, delivery_fee, system_commission, total_amount, currency, delivery_address, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'food', $5, $6, $7, $8, $9, $10, $11, 1, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
        [o.id, o.tenantId, o.customerId, o.vendorId, o.status, o.subtotal, o.deliveryFee, o.commission, o.total, o.currency, o.address],
      );
    }
    console.log('  Orders seeded');

    // Payments
    for (const p of PAYMENTS) {
      await ds.query(
        `INSERT INTO payments (id, tenant_id, order_id, customer_id, vendor_id, amount, currency, method, status, system_commission, vendor_net, driver_net, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
        [p.id, p.tenantId, p.orderId, p.customerId, p.vendorId, p.amount, p.currency, p.method, p.status, p.commission, p.vendorNet, p.driverNet],
      );
    }
    console.log('  Payments seeded');

    // Wallets
    for (const w of WALLETS) {
      await ds.query(
        `INSERT INTO wallets (id, tenant_id, owner_id, owner_type, balance, pending_balance, currency, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
        [w.id, w.tenantId, w.ownerId, w.ownerType, w.balance, w.pending, w.currency],
      );
    }
    console.log('  Wallets seeded');

    // Deliveries
    for (const d of DELIVERIES) {
      await ds.query(
        `INSERT INTO deliveries (id, tenant_id, order_id, driver_id, vehicle_type, status, pickup_address, delivery_address, driver_earnings, currency, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'RWF', 1, NOW(), NOW()) ON CONFLICT (id) DO NOTHING`,
        [d.id, d.tenantId, d.orderId, d.driverId, d.vehicleType, d.status, d.pickup, d.delivery, d.earnings],
      );
    }
    console.log('  Deliveries seeded');

    // Wallet transactions
    const walletTxData = [
      { tenantId: TENANT_KIGALI, ownerId: 'c0000000-0000-0000-0000-000000000001', type: 'CREDIT', amount: 4950, desc: 'Payment release for order g0000000-0000-0000-0000-000000000001', refId: 'h0000000-0000-0000-0000-000000000001', refType: 'payment' },
      { tenantId: TENANT_KIGALI, ownerId: 'b0000000-0000-0000-0000-000000000004', type: 'CREDIT', amount: 1000, desc: 'Driver earnings for delivery i0000000-0000-0000-0000-000000000001', refId: 'i0000000-0000-0000-0000-000000000001', refType: 'delivery' },
    ];
    for (const tx of walletTxData) {
      await ds.query(
        `INSERT INTO wallet_transactions (id, tenant_id, owner_id, owner_type, type, amount, currency, balance_before, balance_after, description, reference_id, reference_type, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'vendor', $3, $4, 'RWF', 0, $4, $5, $6, $7, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        [tx.tenantId, tx.ownerId, tx.type, tx.amount, tx.desc, tx.refId, tx.refType],
      );
    }
    console.log('  Wallet transactions seeded');

    // Used goods listings
    const usedGoodsData = [
      { tenantId: TENANT_KIGALI, sellerId: 'b0000000-0000-0000-0000-000000000003', sellerName: 'Marie Customer', sellerPhone: '+250788100003', title: 'Used Samsung Phone Case', description: 'Compatible with Galaxy A15, black leather', category: 'electronics', price: 2000, condition: 'good', location: 'Kigali City Center' },
      { tenantId: TENANT_KIGALI, sellerId: 'b0000000-0000-0000-0000-000000000004', sellerName: 'Paul Driver', sellerPhone: '+250788100004', title: 'Boda Boda Helmet', description: 'Safety certified, slightly used', category: 'automotive', price: 8000, condition: 'good', location: 'Nyabugogo' },
      { tenantId: TENANT_DAR, sellerId: 'b0000000-0000-0000-0000-000000000006', sellerName: 'Hassan Customer', sellerPhone: '+255754100002', title: 'Standing Fan', description: 'LG brand, works perfectly, moving abroad', category: 'home', price: 25000, condition: 'excellent', location: 'Posta, Dar' },
    ];
    for (const ug of usedGoodsData) {
      await ds.query(
        `INSERT INTO used_goods (id, tenant_id, seller_id, seller_name, seller_phone, title, description, category, asking_price, currency, status, condition, views, location, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, 'RWF', 'AVAILABLE', $9, 0, $10, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [ug.tenantId, ug.sellerId, ug.sellerName, ug.sellerPhone, ug.title, ug.description, ug.category, ug.price, ug.condition, ug.location],
      );
    }
    console.log('  Used goods listings seeded');

    // Reviews
    const reviewsData = [
      { tenantId: TENANT_KIGALI, customerId: 'b0000000-0000-0000-0000-000000000003', vendorId: 'c0000000-0000-0000-0000-000000000001', orderId: 'g0000000-0000-0000-0000-000000000001', rating: 5, comment: 'Fresh matooke, delivered on time!' },
      { tenantId: TENANT_KIGALI, customerId: 'b0000000-0000-0000-0000-000000000003', vendorId: 'c0000000-0000-0000-0000-000000000002', orderId: 'g0000000-0000-0000-0000-000000000002', rating: 4, comment: 'Good phone, fast delivery' },
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
    const loyaltyData = [
      { tenantId: TENANT_KIGALI, customerId: 'b0000000-0000-0000-0000-000000000003', totalPoints: 60, redeemablePoints: 60, lifetimePoints: 60, tier: 'BRONZE' },
      { tenantId: TENANT_DAR, customerId: 'b0000000-0000-0000-0000-000000000006', totalPoints: 20, redeemablePoints: 20, lifetimePoints: 20, tier: 'BRONZE' },
    ];
    for (const l of loyaltyData) {
      await ds.query(
        `INSERT INTO customer_points (id, tenant_id, customer_id, total_points, redeemable_points, lifetime_points, tier, version, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [l.tenantId, l.customerId, l.totalPoints, l.redeemablePoints, l.lifetimePoints, l.tier],
      );
    }
    console.log('  Customer loyalty points seeded');

    // KYC records
    const kycData = [
      { tenantId: TENANT_KIGALI, partnerId: 'c0000000-0000-0000-0000-000000000001', partnerType: 'vendor', phone: '+250788100002', nida: '1234567890123456', status: 'VERIFIED' },
      { tenantId: TENANT_DAR, partnerId: 'c0000000-0000-0000-0000-000000000003', partnerType: 'vendor', phone: '+255754100001', nida: '9876543210987654', status: 'PENDING' },
    ];
    for (const k of kycData) {
      await ds.query(
        `INSERT INTO partner_kyc (id, tenant_id, partner_id, partner_type, phone_number, nida_number, status, version, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [k.tenantId, k.partnerId, k.partnerType, k.phone, k.nida, k.status],
      );
    }
    console.log('  KYC records seeded');

    // Field agents
    const agentsData = [
      { tenantId: TENANT_KIGALI, userId: 'b0000000-0000-0000-0000-000000000004', agentType: 'VENDOR_ONBOARDER', agentCode: 'AGT001', coverageArea: 'Kigali City', commissionRate: 5, status: 'ACTIVE' },
    ];
    for (const a of agentsData) {
      await ds.query(
        `INSERT INTO field_agents (id, tenant_id, user_id, agent_type, agent_code, coverage_area, commission_rate, total_onboarded, total_earnings, currency, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 3, 15000, 'RWF', $7, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [a.tenantId, a.userId, a.agentType, a.agentCode, a.coverageArea, a.commissionRate, a.status],
      );
    }
    console.log('  Field agents seeded');

    // Micro loans
    const loansData = [
      { tenantId: TENANT_KIGALI, borrowerId: 'c0000000-0000-0000-0000-000000000001', borrowerType: 'vendor', loanType: 'WORKING_CAPITAL', requestedAmount: 100000, approvedAmount: 100000, interestRate: 10, dailyRepayment: 3667, totalDays: 30, repaidDays: 10, outstandingBalance: 63330, status: 'ACTIVE' },
    ];
    for (const l of loansData) {
      await ds.query(
        `INSERT INTO micro_loans (id, tenant_id, borrower_id, borrower_type, loan_type, requested_amount, approved_amount, interest_rate, daily_repayment_amount, total_days, repaid_days, outstanding_balance, status, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [l.tenantId, l.borrowerId, l.borrowerType, l.loanType, l.requestedAmount, l.approvedAmount, l.interestRate, l.dailyRepayment, l.totalDays, l.repaidDays, l.outstandingBalance, l.status],
      );
    }
    console.log('  Micro loans seeded');

    // Credit scores
    const creditData = [
      { tenantId: TENANT_KIGALI, userId: 'c0000000-0000-0000-0000-000000000001', score: 750, totalTransactions: 15, totalRevenue: 350000, avgDailySales: 12000, accountAgeDays: 90, missedDeliveries: 0, disputeCount: 0 },
      { tenantId: TENANT_DAR, userId: 'c0000000-0000-0000-0000-000000000003', score: 680, totalTransactions: 8, totalRevenue: 180000, avgDailySales: 8000, accountAgeDays: 45, missedDeliveries: 1, disputeCount: 0 },
    ];
    for (const c of creditData) {
      await ds.query(
        `INSERT INTO credit_scores (id, tenant_id, user_id, score, total_transactions, total_revenue, average_daily_sales, account_age_days, missed_deliveries, dispute_count, last_calculated_at, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [c.tenantId, c.userId, c.score, c.totalTransactions, c.totalRevenue, c.avgDailySales, c.accountAgeDays, c.missedDeliveries, c.disputeCount],
      );
    }
    console.log('  Credit scores seeded');

    // Bulk orders
    const bulkOrdersData = [
      { tenantId: TENANT_KIGALI, sourceType: 'vendor', sourceName: 'Kigali Vendors Collective', sourcePhone: '+250788100002', productName: 'Rice (25kg bags)', totalQuantity: 100, unit: 'bag', totalAmount: 500000, status: 'OPEN' },
    ];
    for (const b of bulkOrdersData) {
      await ds.query(
        `INSERT INTO bulk_orders (id, tenant_id, source_type, source_name, source_phone, product_name, total_quantity, unit, total_amount, status, participant_vendor_ids, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, '[]', NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [b.tenantId, b.sourceType, b.sourceName, b.sourcePhone, b.productName, b.totalQuantity, b.unit, b.totalAmount, b.status],
      );
    }
    console.log('  Bulk orders seeded');

    console.log('\n========================================');
    console.log('Seed complete!');
    console.log('========================================');
    console.log(`\nLogin password for ALL users: "${DEFAULT_PASSWORD}"\n`);
    console.log('Demo accounts:');
    console.log('  Admin:    +250788100001 (Kigali)');
    console.log('  Vendor:   +250788100002 (Kigali)');
    console.log('  Customer: +250788100003 (Kigali)');
    console.log('  Driver:   +250788100004 (Kigali)');
    console.log('  Vendor:   +255754100001 (Dar)');
    console.log('  Customer: +255754100002 (Dar)');
    console.log('\nDemo data:');
    console.log('  3 vendors across 2 tenants');
    console.log('  6 products (food + electronics)');
    console.log('  3 orders (DELIVERED, CONFIRMED, PLACED)');
    console.log('  3 payments (1 RELEASED, 2 ESCROW_HELD)');
    console.log('  3 wallets');
    console.log('  1 completed delivery');
    console.log('  3 used goods listings');
    console.log('  3 surge rules');
    console.log('  2 reviews');
    console.log('  2 customer loyalty records');
    console.log('  2 KYC records');
    console.log('  1 field agent');
    console.log('  1 micro loan');
    console.log('  2 credit scores');
    console.log('  1 bulk order');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await ds.destroy();
  }
}

seed();
