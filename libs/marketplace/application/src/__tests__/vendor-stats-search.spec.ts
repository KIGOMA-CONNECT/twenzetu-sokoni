import { GetVendorStatsUseCase } from '../lib/use-cases/vendor/get-vendor-stats.use-case';
import { SearchVendorsUseCase } from '../lib/use-cases/vendor/search-vendors.use-case';
import { EntityId, Money, TenantId } from '@afri-market/kernel';
import { Order, OrderStatus, Vendor } from '@afri-market/marketplace-domain';

describe('GetVendorStatsUseCase', () => {
  let useCase: GetVendorStatsUseCase;
  let mockOrderRepo: Record<string, jest.Mock>;
  let mockPaymentRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';
  const VENDOR_ID = 'vendor-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderRepo = { findByTenantAndVendor: jest.fn() };
    mockPaymentRepo = { sumRevenue: jest.fn() };
    useCase = new GetVendorStatsUseCase(mockOrderRepo, mockPaymentRepo);
  });

  function makeOrder(status: string, amount: number, commission: number, createdAt?: Date): Order {
    return Order.reconstitute({
      id: EntityId.from(`order-${Math.random().toString(36).slice(2)}`),
      tenantId: TenantId.create(TENANT_ID),
      customerId: EntityId.from('cust-1'),
      vendorId: EntityId.from(VENDOR_ID),
      type: 'FOOD_DELIVERY',
      status: status as OrderStatus,
      subtotal: Money.create(amount),
      deliveryFee: Money.create(500),
      systemCommission: Money.create(commission),
      totalAmount: Money.create(amount + 500),
      deliveryAddress: '123 Main St',
      version: 1,
      createdAt: createdAt ?? new Date('2025-01-15T10:00:00Z'),
    });
  }

  it('should return zero stats when no orders exist', async () => {
    mockOrderRepo.findByTenantAndVendor.mockResolvedValue({ data: [], total: 0 });

    const stats = await useCase.execute(TENANT_ID, VENDOR_ID);

    expect(stats.totalOrders).toBe(0);
    expect(stats.pendingOrders).toBe(0);
    expect(stats.completedOrders).toBe(0);
    expect(stats.totalRevenue).toBe(0);
    expect(stats.totalCommission).toBe(0);
    expect(stats.netEarnings).toBe(0);
    expect(stats.averageOrderValue).toBe(0);
  });

  it('should calculate correct stats from mixed orders', async () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 86400000);

    const orders = [
      makeOrder('DELIVERED', 5000, 500, yesterday),
      makeOrder('DELIVERED', 3000, 300, today),
      makeOrder('PLACED', 2000, 200, yesterday),
      makeOrder('CONFIRMED', 1000, 100, today),
    ];
    mockOrderRepo.findByTenantAndVendor.mockResolvedValue({ data: orders, total: 4 });

    const stats = await useCase.execute(TENANT_ID, VENDOR_ID);

    expect(stats.totalOrders).toBe(4);
    expect(stats.completedOrders).toBe(2);
    expect(stats.pendingOrders).toBe(2);
    expect(stats.totalRevenue).toBe(8000 + 2 * 500);
    expect(stats.totalCommission).toBe(800);
    expect(stats.netEarnings).toBe(8000 + 1000 - 800);
    expect(stats.averageOrderValue).toBe(Math.round((5500 + 3500) / 2));
  });

  it('should calculate today-specific stats', async () => {
    const today = new Date();
    const todayOrder = makeOrder('DELIVERED', 4000, 400, today);
    mockOrderRepo.findByTenantAndVendor.mockResolvedValue({ data: [todayOrder], total: 1 });

    const stats = await useCase.execute(TENANT_ID, VENDOR_ID);

    expect(stats.todayOrders).toBe(1);
    expect(stats.todayRevenue).toBe(4500);
  });
});

describe('SearchVendorsUseCase', () => {
  let useCase: SearchVendorsUseCase;
  let mockVendorRepo: Record<string, jest.Mock>;

  const TENANT_ID = 'test-tenant';

  beforeEach(() => {
    jest.clearAllMocks();
    mockVendorRepo = { search: jest.fn().mockResolvedValue({ data: [], total: 0 }) };
    useCase = new SearchVendorsUseCase(mockVendorRepo);
  });

  it('should search vendors with default options', async () => {
    await useCase.execute(TENANT_ID);

    expect(mockVendorRepo.search).toHaveBeenCalledWith(TENANT_ID, {});
  });

  it('should search vendors with category filter', async () => {
    const vendor = Vendor.reconstitute({
      id: EntityId.from('v1'),
      tenantId: TenantId.create(TENANT_ID),
      userId: EntityId.from('u1'),
      shopName: 'Fresh Food',
      category: 'food',
      commissionRate: 10,
      status: 'ACTIVE',
      averageRating: 4.5,
      totalOrders: 50,
      version: 1,
    });
    mockVendorRepo.search.mockResolvedValue({ data: [vendor], total: 1 });

    const result = await useCase.execute(TENANT_ID, { category: 'food' });

    expect(mockVendorRepo.search).toHaveBeenCalledWith(TENANT_ID, { category: 'food' });
    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it('should search vendors with text search', async () => {
    await useCase.execute(TENANT_ID, { search: 'pizza', minRating: 4 });

    expect(mockVendorRepo.search).toHaveBeenCalledWith(TENANT_ID, {
      search: 'pizza',
      minRating: 4,
    });
  });
});
