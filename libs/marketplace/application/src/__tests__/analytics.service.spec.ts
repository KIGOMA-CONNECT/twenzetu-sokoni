import { AnalyticsService } from '../lib/use-cases/analytics/analytics.service';
import {
  resolvePeriodRange,
  ACCOUNTING_PERIODS,
} from '../lib/use-cases/vendor-accounting/vendor-accounting-range';
import { METRIC_CATALOG } from '@afri-market/marketplace-domain';

const TENANT_ID = 'tenant-1';
const VENDOR_ID = 'vendor-1';

const summaryRow = {
  revenue: '1000000',
  commission: '100000',
  delivery_fee: '200000',
  order_count: '20',
  completed: '16',
  cancelled: '2',
  unique: '12',
};

function makeDataSource(opts: {
  summary?: unknown[];
  daily?: unknown[];
  funnel?: unknown[];
  unique?: unknown[];
  fresh?: unknown[];
  returning?: unknown[];
  deliveries?: unknown[];
  products?: unknown[];
  orderItems?: unknown[];
}) {
  const dataSource: any = {
    query: jest.fn((sql: string) => {
      if (sql.includes('to_char(o.created_at')) {
        return Promise.resolve(opts.daily ?? []);
      }
      if (sql.includes('GROUP BY o.status')) {
        return Promise.resolve(opts.funnel ?? []);
      }
      if (sql.includes('FROM deliveries d')) {
        return Promise.resolve(opts.deliveries ?? []);
      }
      if (sql.includes('HAVING COUNT(*) >= 2')) {
        return Promise.resolve(opts.returning ?? []);
      }
      if (sql.includes('MIN(o.created_at) AS first_order')) {
        return Promise.resolve(opts.fresh ?? []);
      }
      if (sql.includes('SUM(CASE WHEN')) {
        return Promise.resolve(opts.summary ?? []);
      }
      if (sql.includes('COUNT(DISTINCT o.customer_id)')) {
        return Promise.resolve(opts.unique ?? []);
      }
      if (sql.includes('FROM order_items oi')) {
        return Promise.resolve(opts.orderItems ?? []);
      }
      if (sql.includes('FROM products p')) {
        return Promise.resolve(opts.products ?? []);
      }
      return Promise.resolve([]);
    }),
  };
  return dataSource;
}

const emptyOverview = {
  summary: [],
  daily: [],
  funnel: [],
  unique: [],
  fresh: [],
  returning: [],
  deliveries: [],
};

describe('AnalyticsService.overview', () => {
  it('should aggregate sales, funnel, customers and deliveries into one report', async () => {
    const service = new AnalyticsService(
      makeDataSource({
        summary: [summaryRow],
        daily: [
          { date: '2026-01-01', orders: '10', revenue: '600000', commission: '60000' },
          { date: '2026-01-02', orders: '10', revenue: '400000', commission: '40000' },
        ],
        funnel: [
          { status: 'PLACED', count: '3', value: '150000' },
          { status: 'DELIVERED', count: '16', value: '800000' },
          { status: 'CANCELLED', count: '2', value: '100000' },
        ],
        unique: [{ unique: '12' }],
        fresh: [{ new: '8' }],
        returning: [{ returning: '4' }],
        deliveries: [
          { total: '18', completed: '15', active: '2', failed: '1', avg_distance: '3.5', avg_seconds: '5400', driver_earnings: '75000', delivery_fee: '300000' },
        ],
      }),
    );

    const result = await service.overview(TENANT_ID, VENDOR_ID, resolvePeriodRange('30d'));

    expect(result.summary.totalRevenue).toBe(1000000);
    expect(result.summary.commission).toBe(100000);
    expect(result.summary.netRevenue).toBe(900000);
    expect(result.summary.deliveryFeeRevenue).toBe(200000);
    expect(result.summary.orderCount).toBe(20);
    expect(result.summary.completedOrders).toBe(16);
    expect(result.summary.cancelledOrders).toBe(2);
    expect(result.summary.cancellationRate).toBe(0.1);
    expect(result.summary.averageOrderValue).toBe(62500);

    expect(result.daily).toHaveLength(2);
    expect(result.daily[0]).toEqual({ date: '2026-01-01', orders: 10, revenue: 600000, commission: 60000 });

    expect(result.funnel).toHaveLength(8);
    expect(result.funnel.find((f) => f.status === 'PLACED')?.count).toBe(3);
    expect(result.funnel.find((f) => f.status === 'DELIVERED')?.value).toBe(800000);
    expect(result.funnel.find((f) => f.status === 'REFUNDED')?.count).toBe(0);

    expect(result.customers).toEqual({
      uniqueCustomers: 12,
      newCustomers: 8,
      returningCustomers: 4,
      averageOrdersPerCustomer: 1.67,
    });

    expect(result.deliveries.total).toBe(18);
    expect(result.deliveries.completed).toBe(15);
    expect(result.deliveries.active).toBe(2);
    expect(result.deliveries.failed).toBe(1);
    expect(result.deliveries.averageDistanceKm).toBe(3.5);
    expect(result.deliveries.averageDurationMinutes).toBe(90);
    expect(result.deliveries.deliveryFeeRevenue).toBe(300000);
    expect(result.deliveries.driverEarnings).toBe(75000);
  });

  it('should return zeros and an empty funnel when there is no activity', async () => {
    const service = new AnalyticsService(makeDataSource(emptyOverview));
    const result = await service.overview(TENANT_ID, VENDOR_ID, resolvePeriodRange('30d'));

    expect(result.summary.totalRevenue).toBe(0);
    expect(result.summary.netRevenue).toBe(0);
    expect(result.summary.averageOrderValue).toBe(0);
    expect(result.daily).toHaveLength(0);
    expect(result.funnel.map((f) => f.status)).toEqual([
      'PLACED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED',
    ]);
    expect(result.funnel.every((f) => f.count === 0)).toBe(true);
    expect(result.customers.uniqueCustomers).toBe(0);
    expect(result.customers.averageOrdersPerCustomer).toBe(0);
    expect(result.deliveries.total).toBe(0);
    expect(result.deliveries.averageDurationMinutes).toBe(0);
  });
});

describe('AnalyticsService.topProducts', () => {
  it('should rank products by revenue and compute revenue share', async () => {
    const service = new AnalyticsService(
      makeDataSource({
        orderItems: [
          { product_id: 'p1', product_name: 'Rice 10kg', quantity: '50', revenue: '450000', order_count: '10', total: '1000000' },
          { product_id: 'p2', product_name: 'Cooking Oil 1L', quantity: '30', revenue: '150000', order_count: '8', total: '1000000' },
        ],
      }),
    );
    const result = await service.topProducts(TENANT_ID, VENDOR_ID, resolvePeriodRange('30d'), 10);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      productId: 'p1',
      productName: 'Rice 10kg',
      quantity: 50,
      revenue: 450000,
      orderCount: 10,
      share: 45,
    });
    expect(result[1].share).toBe(15);
  });
});

describe('AnalyticsService.inventory', () => {
  it('should classify low stock, out of stock and total inventory value', async () => {
    const service = new AnalyticsService(
      makeDataSource({
        products: [
          { id: 'a', name: 'Sugar', sku: 'SUG-1', unit: 'kg', status: 'ACTIVE', stock_quantity: '0', price: '3000', currency: 'TZS', stock_value: '0' },
          { id: 'b', name: 'Salt', sku: null, unit: 'pack', status: 'ACTIVE', stock_quantity: '3', price: '1000', currency: 'TZS', stock_value: '3000' },
          { id: 'c', name: 'Flour', sku: 'FLR-1', unit: 'kg', status: 'ACTIVE', stock_quantity: '40', price: '2500', currency: 'TZS', stock_value: '100000' },
          { id: 'd', name: 'Old item', sku: null, unit: 'piece', status: 'DELETED', stock_quantity: '2', price: '500', currency: 'TZS', stock_value: '1000' },
        ],
      }),
    );
    const result = await service.inventory(TENANT_ID, VENDOR_ID, 5);

    expect(result.items).toHaveLength(4);
    expect(result.lowStockCount).toBe(1);
    expect(result.outOfStockCount).toBe(1);
    expect(result.activeProductCount).toBe(3);
    expect(result.inventoryValue).toBe(104000);
    expect(result.threshold).toBe(5);
  });
});

describe('AnalyticsService tenant-wide reports', () => {
  it('should omit the vendor filter and pass null when vendorId is not scoped', async () => {
    const ds = makeDataSource({ summary: [summaryRow] });
    const service = new AnalyticsService(ds);
    const result = await service.overview(TENANT_ID, undefined, resolvePeriodRange('30d'));

    expect(result.summary.totalRevenue).toBe(1000000);
    const summaryCall = ds.query.mock.calls.find((c: unknown[]) => String(c[0]).includes('SUM(CASE WHEN'));
    const sql = String(summaryCall?.[0] ?? '');
    expect(sql).toContain('$2::uuid IS NULL OR o.vendor_id = $2');
    expect(summaryCall?.[1]).toEqual([TENANT_ID, null, expect.any(Date), expect.any(Date)]);
  });
});

describe('AnalyticsService.metricCatalog', () => {
  it('should expose the defined metric catalog', () => {
    const service = new AnalyticsService(makeDataSource([]));
    const catalog = service.metricCatalog();
    expect(catalog).toHaveLength(METRIC_CATALOG.length);
    expect(METRIC_CATALOG.some((m) => m.key === 'total_revenue')).toBe(true);
    expect(METRIC_CATALOG.every((m) => m.key && m.name && m.category && m.unit && m.source)).toBe(true);
    expect(ACCOUNTING_PERIODS).toContain('30d');
  });
});
