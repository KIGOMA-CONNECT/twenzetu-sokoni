import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';

const DEFAULT_PASSWORD = 'password123';

const TENANT_DAR = 'a0000000-0000-0000-0000-000000000002';

const USERS = [
  { id: 'b0000000-0000-0000-0000-000000000009', tenantId: TENANT_DAR, phone: '+255754100000', name: 'Super Admin', role: 'super_admin', status: 'ACTIVE', permissions: 'manage_admins,manage_vendors,manage_disputes,manage_drivers,manage_promotions,view_analytics,manage_orders,manage_finance,manage_settings' },
  { id: 'b0000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, phone: '+255754100001', name: 'Admin User', role: 'admin', status: 'ACTIVE', permissions: 'manage_vendors,manage_disputes,manage_drivers,manage_promotions,view_analytics,manage_orders,manage_finance,manage_settings' },
  { id: 'b0000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, phone: '+255754100002', name: 'Amina Vendor', role: 'vendor', status: 'ACTIVE', businessName: 'Dar Fresh Market', ninOrRegNo: 'TZ-REG-2019-0001', city: 'Dar es Salaam' },
  { id: 'b0000000-0000-0000-0000-000000000012', tenantId: TENANT_DAR, phone: '+255754100003', name: 'Hassan Customer', role: 'customer', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000013', tenantId: TENANT_DAR, phone: '+255754100004', name: 'Juma Driver', role: 'driver', status: 'ACTIVE', ninOrRegNo: 'NIN-19870912-5521', city: 'Dar es Salaam' },
  { id: 'b0000000-0000-0000-0000-000000000014', tenantId: TENANT_DAR, phone: '+255754100005', name: 'Bakari Vendor', role: 'vendor', status: 'ACTIVE', businessName: 'Kariakoo Electronics', ninOrRegNo: 'TZ-REG-2020-0042', city: 'Dar es Salaam' },
  { id: 'b0000000-0000-0000-0000-000000000015', tenantId: TENANT_DAR, phone: '+255754100006', name: 'Rehema Cleaning', role: 'vendor', status: 'ACTIVE', businessName: 'Mama Rehema Cleaning', ninOrRegNo: 'TZ-REG-2021-0078', city: 'Dar es Salaam' },
  { id: 'b0000000-0000-0000-0000-000000000016', tenantId: TENANT_DAR, phone: '+255754100007', name: 'Saada Fashion', role: 'vendor', status: 'ACTIVE', businessName: 'Saada Fashion Tailors', ninOrRegNo: 'TZ-REG-2021-0119', city: 'Dar es Salaam' },
  { id: 'b0000000-0000-0000-0000-000000000017', tenantId: TENANT_DAR, phone: '+254712345678', name: 'Wanjiku Customer', role: 'customer', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000018', tenantId: TENANT_DAR, phone: '+2348034567890', name: 'Chidi Customer', role: 'customer', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000019', tenantId: TENANT_DAR, phone: '+233201234567', name: 'Ama Customer', role: 'customer', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000020', tenantId: TENANT_DAR, phone: '+250788123456', name: 'Uwase Customer', role: 'customer', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000021', tenantId: TENANT_DAR, phone: '+27821234567', name: 'Thabo Customer', role: 'customer', status: 'ACTIVE' },
  { id: 'b0000000-0000-0000-0000-000000000022', tenantId: TENANT_DAR, phone: '+254711234567', name: 'Njeri Vendor', role: 'vendor', status: 'ACTIVE', businessName: 'Nairobi Fresh Market', ninOrRegNo: 'KE-BRN-2018-3341', city: 'Nairobi' },
  { id: 'b0000000-0000-0000-0000-000000000023', tenantId: TENANT_DAR, phone: '+2348098765432', name: 'Emeka Vendor', role: 'vendor', status: 'ACTIVE', businessName: 'Lagos Groceries Hub', ninOrRegNo: 'NG-RC-2017-8801', city: 'Lagos' },
  { id: 'b0000000-0000-0000-0000-000000000024', tenantId: TENANT_DAR, phone: '+233244567890', name: 'Kwame Vendor', role: 'vendor', status: 'ACTIVE', businessName: 'Accra Marketplace', ninOrRegNo: 'GH-RBD-2016-2203', city: 'Accra' },
  { id: 'b0000000-0000-0000-0000-000000000025', tenantId: TENANT_DAR, phone: '+250789654321', name: 'Jean Vendor', role: 'vendor', status: 'ACTIVE', businessName: 'Kigali Farm Produce', ninOrRegNo: 'RW-RDB-2019-5567', city: 'Kigali' },
  { id: 'b0000000-0000-0000-0000-000000000026', tenantId: TENANT_DAR, phone: '+27719876543', name: 'Naledi Vendor', role: 'vendor', status: 'ACTIVE', businessName: "Jo'burg Wholesale", ninOrRegNo: 'ZA-CIPC-2015-9912', city: 'Johannesburg' },
];

const VENDORS = [
  { id: 'c0000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, userId: 'b0000000-0000-0000-0000-000000000011', shopName: 'Dar Fresh Market', description: 'Fresh produce from local farms', category: 'food', commissionRate: 10, latitude: -6.8191, longitude: 39.2802 },
  { id: 'c0000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, userId: 'b0000000-0000-0000-0000-000000000014', shopName: 'Kariakoo Electronics', description: 'Phones, laptops, and accessories', category: 'electronics', commissionRate: 8, latitude: -6.8204, longitude: 39.2837 },
  { id: 'c0000000-0000-0000-0000-000000000012', tenantId: TENANT_DAR, userId: 'b0000000-0000-0000-0000-000000000015', shopName: 'Mama Rehema Cleaning', description: 'Usafi wa nyumbani, sabuni na huduma za kusafisha', category: 'cleaning', commissionRate: 10, latitude: -6.7924, longitude: 39.2083 },
  { id: 'c0000000-0000-0000-0000-000000000013', tenantId: TENANT_DAR, userId: 'b0000000-0000-0000-0000-000000000016', shopName: 'Saada Fashion Tailors', description: 'Ushonaji na ufuaji wa nguo', category: 'tailoring', commissionRate: 10, latitude: -6.8124, longitude: 39.2561 },
  { id: 'c0000000-0000-0000-0000-000000000020', tenantId: TENANT_DAR, userId: 'b0000000-0000-0000-0000-000000000022', shopName: 'Nairobi Fresh Market', description: 'Kenyan fresh produce and groceries', category: 'food', commissionRate: 10, latitude: -6.8015, longitude: 39.2672 },
  { id: 'c0000000-0000-0000-0000-000000000021', tenantId: TENANT_DAR, userId: 'b0000000-0000-0000-0000-000000000023', shopName: 'Lagos Groceries Hub', description: 'Nigerian staples and daily goods', category: 'grocery', commissionRate: 8, latitude: -6.8084, longitude: 39.2391 },
  { id: 'c0000000-0000-0000-0000-000000000022', tenantId: TENANT_DAR, userId: 'b0000000-0000-0000-0000-000000000024', shopName: 'Accra Marketplace', description: 'Ghanaian food and household essentials', category: 'food', commissionRate: 10, latitude: -6.8262, longitude: 39.2911 },
  { id: 'c0000000-0000-0000-0000-000000000023', tenantId: TENANT_DAR, userId: 'b0000000-0000-0000-0000-000000000025', shopName: 'Kigali Farm Produce', description: 'Rwandan farm-fresh produce', category: 'food', commissionRate: 10, latitude: -6.7861, longitude: 39.2874 },
  { id: 'c0000000-0000-0000-0000-000000000024', tenantId: TENANT_DAR, userId: 'b0000000-0000-0000-0000-000000000026', shopName: "Jo'burg Wholesale", description: 'South African groceries in bulk', category: 'grocery', commissionRate: 8, latitude: -6.7997, longitude: 39.2467 },
];

const CATEGORIES = [
  { id: 'd0000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, name: 'Electronics', type: 'electronics' },
  { id: 'd0000000-0000-0000-0000-000000000012', tenantId: TENANT_DAR, name: 'Chakula Kilicho Tayari', type: 'food' },
  { id: 'd0000000-0000-0000-0000-000000000013', tenantId: TENANT_DAR, name: 'Mboga na Matunda', type: 'food' },
  { id: 'd0000000-0000-0000-0000-000000000014', tenantId: TENANT_DAR, name: 'Mchele na Maharage', type: 'grocery' },
  { id: 'd0000000-0000-0000-0000-000000000015', tenantId: TENANT_DAR, name: 'Ufuaji na Usafishaji Nguo', type: 'general' },
  { id: 'd0000000-0000-0000-0000-000000000016', tenantId: TENANT_DAR, name: 'Usafi Nyumbani na Bustani', type: 'general' },
  { id: 'd0000000-0000-0000-0000-000000000017', tenantId: TENANT_DAR, name: 'Kupikiwa Nyumbani (Wapishi)', type: 'general' },
  { id: 'd0000000-0000-0000-0000-000000000018', tenantId: TENANT_DAR, name: 'Vitu vya Used', type: 'secondhand' },
  { id: 'd0000000-0000-0000-0000-000000000021', tenantId: TENANT_DAR, name: 'Ushonaji na Tailoring', type: 'tailoring' },
  { id: 'd0000000-0000-0000-0000-000000000022', tenantId: TENANT_DAR, name: 'Nguo za Used', type: 'secondhand', parentId: 'd0000000-0000-0000-0000-000000000018' },
  { id: 'd0000000-0000-0000-0000-000000000023', tenantId: TENANT_DAR, name: 'Electronics za Used', type: 'secondhand', parentId: 'd0000000-0000-0000-0000-000000000018' },
  { id: 'd0000000-0000-0000-0000-000000000024', tenantId: TENANT_DAR, name: 'Mitambo na Machine', type: 'secondhand', parentId: 'd0000000-0000-0000-0000-000000000018' },
  { id: 'd0000000-0000-0000-0000-000000000025', tenantId: TENANT_DAR, name: 'Tools na Zana', type: 'secondhand', parentId: 'd0000000-0000-0000-0000-000000000018' },
  { id: 'd0000000-0000-0000-0000-000000000026', tenantId: TENANT_DAR, name: 'Fanicha za Used', type: 'secondhand', parentId: 'd0000000-0000-0000-0000-000000000018' },
];

const PRODUCTS = [
  { id: 'e0000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Wali Wa Nazi (Coconut Rice)', price: 4000, categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 80 },
  { id: 'e0000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Nyama Choma (1kg)', price: 15000, categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 30 },
  { id: 'e0000000-0000-0000-0000-000000000012', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Mchicha (Spinach Bundle)', price: 1000, categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 150 },
  { id: 'e0000000-0000-0000-0000-000000000013', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000011', name: 'Samsung Galaxy A15', price: 450000, categoryId: 'd0000000-0000-0000-0000-000000000011', stock: 20 },
  { id: 'e0000000-0000-0000-0000-000000000014', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000011', name: 'Phone Charger USB-C', price: 8000, categoryId: 'd0000000-0000-0000-0000-000000000011', stock: 200 },
  { id: 'e0000000-0000-0000-0000-000000000015', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Nyanya (Tomatoes 1kg)', price: 1500, categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 100 },
  { id: 'e0000000-0000-0000-0000-000000000016', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Sukuma Wiki (Bundle)', price: 800, categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 150 },
  { id: 'e0000000-0000-0000-0000-000000000017', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Mayai (Tray ya 30)', price: 7000, categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 40 },
  { id: 'e0000000-0000-0000-0000-000000000018', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Mchele Pumba (1kg)', price: 3000, categoryId: 'd0000000-0000-0000-0000-000000000014', stock: 200 },
  { id: 'e0000000-0000-0000-0000-000000000019', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000010', name: 'Maharage Mbili (1kg)', price: 3500, categoryId: 'd0000000-0000-0000-0000-000000000014', stock: 100 },
  { id: 'e0000000-0000-0000-0000-000000000020', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000012', name: 'Sabuni ya Kufulia', price: 2000, categoryId: 'd0000000-0000-0000-0000-000000000016', stock: 120 },
  { id: 'e0000000-0000-0000-0000-000000000021', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000012', name: 'Usafi wa Nyumbani (kwa Saa)', price: 8000, categoryId: 'd0000000-0000-0000-0000-000000000016', stock: 100 },
  { id: 'e0000000-0000-0000-0000-000000000022', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000013', name: 'Ushonaji Nguo', price: 10000, categoryId: 'd0000000-0000-0000-0000-000000000015', stock: 100 },
  { id: 'e0000000-0000-0000-0000-000000000023', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000013', name: 'Kufua na Kubandika Nguo', price: 6000, categoryId: 'd0000000-0000-0000-0000-000000000015', stock: 100 },
  { id: 'e0000000-0000-0000-0000-000000000024', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000020', name: 'Kale (1kg)', price: 60, currency: 'KES', categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 200 },
  { id: 'e0000000-0000-0000-0000-000000000025', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000020', name: 'Beef (1kg)', price: 550, currency: 'KES', categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 50 },
  { id: 'e0000000-0000-0000-0000-000000000026', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000020', name: 'Avocado (each)', price: 40, currency: 'KES', categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 300 },
  { id: 'e0000000-0000-0000-0000-000000000027', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000021', name: 'Rice (1kg)', price: 1500, currency: 'NGN', categoryId: 'd0000000-0000-0000-0000-000000000014', stock: 250 },
  { id: 'e0000000-0000-0000-0000-000000000028', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000021', name: 'Tomatoes (1kg)', price: 1200, currency: 'NGN', categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 120 },
  { id: 'e0000000-0000-0000-0000-000000000029', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000021', name: 'Plantain (bunch)', price: 800, currency: 'NGN', categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 90 },
  { id: 'e0000000-0000-0000-0000-000000000030', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000022', name: 'Yam (1kg)', price: 15, currency: 'GHS', categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 150 },
  { id: 'e0000000-0000-0000-0000-000000000031', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000022', name: 'Kenkey (piece)', price: 8, currency: 'GHS', categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 100 },
  { id: 'e0000000-0000-0000-0000-000000000032', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000023', name: 'Irish Potatoes (1kg)', price: 900, currency: 'RWF', categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 180 },
  { id: 'e0000000-0000-0000-0000-000000000033', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000023', name: 'Cabbage (head)', price: 1200, currency: 'RWF', categoryId: 'd0000000-0000-0000-0000-000000000013', stock: 120 },
  { id: 'e0000000-0000-0000-0000-000000000034', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000024', name: 'Whole Wheat Bread (loaf)', price: 25, currency: 'ZAR', categoryId: 'd0000000-0000-0000-0000-000000000014', stock: 100 },
  { id: 'e0000000-0000-0000-0000-000000000035', tenantId: TENANT_DAR, vendorId: 'c0000000-0000-0000-0000-000000000024', name: 'Milk (1L)', price: 22, currency: 'ZAR', categoryId: 'd0000000-0000-0000-0000-000000000014', stock: 140 },
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
  { id: '0c000000-0000-0000-0000-000000000012', tenantId: TENANT_DAR, ownerId: 'b0000000-0000-0000-0000-000000000012', ownerType: 'customer', balance: 50000, pending: 5000, currency: 'TZS' },
  { id: '0c000000-0000-0000-0000-000000000013', tenantId: TENANT_DAR, ownerId: 'b0000000-0000-0000-0000-000000000014', ownerType: 'driver', balance: 3000, pending: 0, currency: 'TZS' },
];

const DELIVERIES = [
  { id: '0d000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, orderId: '0a000000-0000-0000-0000-000000000010', driverId: 'b0000000-0000-0000-0000-000000000013', vehicleType: 'boda', status: 'DELIVERED', pickup: 'Kariakoo Market', delivery: 'Morogoro Rd, Dar es Salaam', earnings: 3000 },
];

const SURGE_RULES = [
  { id: 'f0000000-0000-0000-0000-000000000010', tenantId: TENANT_DAR, name: 'Morning Rush', trigger: 'NIGHT_TIME', multiplier: 1.5, startHour: 7, endHour: 9 },
  { id: 'f0000000-0000-0000-0000-000000000011', tenantId: TENANT_DAR, name: 'Evening Rush', trigger: 'NIGHT_TIME', multiplier: 1.3, startHour: 17, endHour: 19 },
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
      `INSERT INTO tenants (id, name, status, is_default, created_at, updated_at)
       VALUES ($1, $2, 'ACTIVE', true, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_default = true`,
      [TENANT_DAR, 'afriMarket Global Hub'],
    );
    console.log('  Tenant seeded (default)');

    // Users
    for (const u of USERS) {
      await ds.query(
        `INSERT INTO users (id, tenant_id, phone_number, full_name, role, password_hash, status, permissions, business_name, nin_or_reg_no, city, verification_document_status, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'APPROVED', 1, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET permissions = EXCLUDED.permissions`,
        [u.id, u.tenantId, u.phone, u.name, u.role, passwordHash, u.status, u.permissions ?? null, u.businessName ?? null, u.ninOrRegNo ?? null, u.city ?? null],
      );
    }
    console.log('  Users seeded');

    // Vendors
    for (const v of VENDORS) {
      await ds.query(
        `INSERT INTO vendors (id, tenant_id, user_id, shop_name, description, category, commission_rate, status, version, latitude, longitude, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', 1, $8, $9, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET latitude = $8, longitude = $9`,
        [v.id, v.tenantId, v.userId, v.shopName, v.description, v.category, v.commissionRate, v.latitude, v.longitude],
      );
    }
    console.log('  Vendors seeded');

    // Categories
    for (const c of CATEGORIES) {
      await ds.query(
        `INSERT INTO product_categories (id, tenant_id, name, type, parent_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [c.id, c.tenantId, c.name, c.type, c.parentId ?? null],
      );
    }
    console.log('  Categories seeded');

    // Products
    for (const p of PRODUCTS) {
      await ds.query(
        `INSERT INTO products (id, tenant_id, vendor_id, name, description, price, currency, type, category_id, stock_quantity, unit, status, version, created_at, updated_at)
         VALUES ($1, $2, $3, $4::varchar, $4::text, $5, $8, 'PHYSICAL', $6, $7, 'pcs', 'ACTIVE', 1, NOW(), NOW()) ON CONFLICT DO NOTHING`,
        [p.id, p.tenantId, p.vendorId, p.name, p.price, p.categoryId, p.stock, p.currency ?? 'TZS'],
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
    console.log('Seed complete! (Pan-African / multi-currency)');
    console.log('========================================');
    if (process.env.SEED_VERBOSE === 'true') {
      console.log(`\nLogin password for ALL seeded users: "${DEFAULT_PASSWORD}"\n`);
      console.log('(seeded users — dev/test convenience only; never reuse in production)');
      console.log('Demo accounts:');
      console.log('  Super Admin: +255754100000');
      console.log('  Admin:       +255754100001');
      console.log('  Vendor:      +255754100002 (Dar Fresh Market, TZS)');
      console.log('  Customer:    +255754100003 (Hassan, TZS)');
      console.log('  Driver:      +255754100004 (Juma, TZS)');
      console.log('  Customer:    +254712345678 (Wanjiku, KES)');
      console.log('  Customer:    +2348034567890 (Chidi, NGN)');
      console.log('  Customer:    +233201234567 (Ama, GHS)');
      console.log('  Customer:    +250788123456 (Uwase, RWF)');
      console.log('  Customer:    +27821234567 (Thabo, ZAR)');
      console.log('  Vendor:      +254711234567 (Nairobi Fresh Market, KES)');
      console.log('  Vendor:      +2348098765432 (Lagos Groceries Hub, NGN)');
      console.log('  Vendor:      +233244567890 (Accra Marketplace, GHS)');
      console.log('  Vendor:      +250789654321 (Kigali Farm Produce, RWF)');
      console.log("  Vendor:      +27719876543 (Jo'burg Wholesale, ZAR)");
      console.log('\nAll data in single "afriMarket Global Hub" tenant (currency per phone country)');
    }
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await ds.destroy();
  }
}

seed();
