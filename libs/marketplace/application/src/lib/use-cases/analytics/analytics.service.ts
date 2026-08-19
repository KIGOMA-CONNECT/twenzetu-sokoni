import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { METRIC_CATALOG, MetricDefinition } from '@afri-market/marketplace-domain';
import { AccountingDateRange } from '../vendor-accounting/vendor-accounting-range';

export interface SalesSummary {
  currency: string;
  totalRevenue: number;
  commission: number;
  netRevenue: number;
  deliveryFeeRevenue: number;
  orderCount: number;
  completedOrders: number;
  cancelledOrders: number;
  cancellationRate: number;
  averageOrderValue: number;
}

export interface AnalyticsDailyRow {
  date: string;
  orders: number;
  revenue: number;
  commission: number;
}

export interface OrderFunnelRow {
  status: string;
  count: number;
  value: number;
}

export interface CustomerAcquisition {
  uniqueCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageOrdersPerCustomer: number;
}

export interface DeliveryPerformance {
  total: number;
  completed: number;
  active: number;
  failed: number;
  averageDistanceKm: number;
  averageDurationMinutes: number;
  deliveryFeeRevenue: number;
  driverEarnings: number;
}

export interface AnalyticsOverview {
  currency: string;
  summary: SalesSummary;
  daily: AnalyticsDailyRow[];
  funnel: OrderFunnelRow[];
  customers: CustomerAcquisition;
  deliveries: DeliveryPerformance;
}

export interface TopProductRow {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
  orderCount: number;
  share: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  status: string;
  stockQuantity: number;
  price: number;
  currency: string;
  stockValue: number;
}

export interface InventoryReport {
  threshold: number;
  lowStockCount: number;
  outOfStockCount: number;
  activeProductCount: number;
  inventoryValue: number;
  items: InventoryItem[];
}

const ORDER_FUNNEL_STATUSES = [
  'PLACED',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

const REVENUE_ORDERS = "o.status NOT IN ('CANCELLED', 'REFUNDED')";

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  public async overview(
    tenantId: string,
    vendorId: string | undefined,
    range: AccountingDateRange,
  ): Promise<AnalyticsOverview> {
    const [summary, daily, funnel, customers, deliveries] = await Promise.all([
      this.salesSummary(tenantId, vendorId, range),
      this.dailySeries(tenantId, vendorId, range),
      this.orderFunnel(tenantId, vendorId, range),
      this.customerAcquisition(tenantId, vendorId, range),
      this.deliveryPerformance(tenantId, vendorId, range),
    ]);
    return { currency: 'TZS', summary, daily, funnel, customers, deliveries };
  }

  private async salesSummary(
    tenantId: string,
    vendorId: string | undefined,
    range: AccountingDateRange,
  ): Promise<SalesSummary> {
    const rows: { revenue?: string; commission?: string; delivery_fee?: string; order_count?: string; completed?: string; cancelled?: string; unique?: string }[] =
      await this.dataSource.query(
        `SELECT
           COALESCE(SUM(CASE WHEN ${REVENUE_ORDERS} THEN o.total_amount ELSE 0 END), 0) AS "revenue",
           COALESCE(SUM(CASE WHEN ${REVENUE_ORDERS} THEN o.system_commission ELSE 0 END), 0) AS "commission",
           COALESCE(SUM(CASE WHEN ${REVENUE_ORDERS} THEN o.delivery_fee ELSE 0 END), 0) AS "delivery_fee",
           COUNT(*) AS "order_count",
           COUNT(*) FILTER (WHERE o.status = 'DELIVERED') AS "completed",
           COUNT(*) FILTER (WHERE o.status IN ('CANCELLED', 'REFUNDED')) AS "cancelled",
           COUNT(DISTINCT o.customer_id) AS "unique"
         FROM orders o
         WHERE o.tenant_id = $1 AND ($2::uuid IS NULL OR o.vendor_id = $2) AND o.created_at >= $3 AND o.created_at < $4`,
        [tenantId, vendorId ?? null, range.since, range.until],
      );
    const row = rows[0] ?? {};
    const totalRevenue = Number(row.revenue ?? 0);
    const commission = Number(row.commission ?? 0);
    const orderCount = Number(row.order_count ?? 0);
    const completedOrders = Number(row.completed ?? 0);
    const cancelledOrders = Number(row.cancelled ?? 0);
    return {
      currency: 'TZS',
      totalRevenue,
      commission,
      netRevenue: Math.round((totalRevenue - commission) * 100) / 100,
      deliveryFeeRevenue: Number(row.delivery_fee ?? 0),
      orderCount,
      completedOrders,
      cancelledOrders,
      cancellationRate: orderCount > 0 ? Math.round((cancelledOrders / orderCount) * 1000) / 1000 : 0,
      averageOrderValue: completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0,
    };
  }

  private async dailySeries(
    tenantId: string,
    vendorId: string | undefined,
    range: AccountingDateRange,
  ): Promise<AnalyticsDailyRow[]> {
    const rows: { date?: string; orders?: string; revenue?: string; commission?: string }[] =
      await this.dataSource.query(
        `SELECT
           to_char(o.created_at, 'YYYY-MM-DD') AS "date",
           COUNT(*) AS "orders",
           COALESCE(SUM(CASE WHEN ${REVENUE_ORDERS} THEN o.total_amount ELSE 0 END), 0) AS "revenue",
           COALESCE(SUM(CASE WHEN ${REVENUE_ORDERS} THEN o.system_commission ELSE 0 END), 0) AS "commission"
         FROM orders o
         WHERE o.tenant_id = $1 AND ($2::uuid IS NULL OR o.vendor_id = $2) AND o.created_at >= $3 AND o.created_at < $4
         GROUP BY 1
         ORDER BY 1 ASC`,
        [tenantId, vendorId ?? null, range.since, range.until],
      );
    return rows.map((r) => ({
      date: r.date ?? '',
      orders: Number(r.orders ?? 0),
      revenue: Number(r.revenue ?? 0),
      commission: Number(r.commission ?? 0),
    }));
  }

  private async orderFunnel(
    tenantId: string,
    vendorId: string | undefined,
    range: AccountingDateRange,
  ): Promise<OrderFunnelRow[]> {
    const rows: { status?: string; count?: string; value?: string }[] = await this.dataSource.query(
      `SELECT o.status AS "status", COUNT(*) AS "count", COALESCE(SUM(o.total_amount), 0) AS "value"
         FROM orders o
         WHERE o.tenant_id = $1 AND ($2::uuid IS NULL OR o.vendor_id = $2) AND o.created_at >= $3 AND o.created_at < $4
         GROUP BY o.status`,
      [tenantId, vendorId ?? null, range.since, range.until],
    );
    const byStatus = new Map<string, OrderFunnelRow>();
    for (const r of rows) {
      if (r.status) {
        byStatus.set(r.status, { status: r.status, count: Number(r.count ?? 0), value: Number(r.value ?? 0) });
      }
    }
    return ORDER_FUNNEL_STATUSES.map((status) => byStatus.get(status) ?? { status, count: 0, value: 0 });
  }

  private async customerAcquisition(
    tenantId: string,
    vendorId: string | undefined,
    range: AccountingDateRange,
  ): Promise<CustomerAcquisition> {
    const [uniqueRows, newRows, returningRows] = await Promise.all([
      this.dataSource.query(
        `SELECT COUNT(DISTINCT o.customer_id) AS "unique"
           FROM orders o
          WHERE o.tenant_id = $1 AND ($2::uuid IS NULL OR o.vendor_id = $2) AND ${REVENUE_ORDERS}
            AND o.created_at >= $3 AND o.created_at < $4`,
        [tenantId, vendorId ?? null, range.since, range.until],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS "new"
           FROM (
             SELECT o.customer_id, MIN(o.created_at) AS first_order
               FROM orders o
              WHERE o.tenant_id = $1 AND ($2::uuid IS NULL OR o.vendor_id = $2) AND ${REVENUE_ORDERS}
              GROUP BY o.customer_id
           ) t
          WHERE t.first_order >= $3 AND t.first_order < $4`,
        [tenantId, vendorId ?? null, range.since, range.until],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS "returning"
           FROM (
             SELECT o.customer_id
               FROM orders o
              WHERE o.tenant_id = $1 AND ($2::uuid IS NULL OR o.vendor_id = $2) AND ${REVENUE_ORDERS}
                AND o.created_at >= $3 AND o.created_at < $4
              GROUP BY o.customer_id
              HAVING COUNT(*) >= 2
           ) t`,
        [tenantId, vendorId ?? null, range.since, range.until],
      ),
    ]);
    const uniqueCustomers = Number(uniqueRows[0]?.unique ?? 0);
    const newCustomers = Number(newRows[0]?.new ?? 0);
    const returningCustomers = Number(returningRows[0]?.returning ?? 0);
    const summary = await this.salesSummary(tenantId, vendorId, range);
    return {
      uniqueCustomers,
      newCustomers,
      returningCustomers,
      averageOrdersPerCustomer: uniqueCustomers > 0 ? Math.round((summary.orderCount / uniqueCustomers) * 100) / 100 : 0,
    };
  }

  private async deliveryPerformance(
    tenantId: string,
    vendorId: string | undefined,
    range: AccountingDateRange,
  ): Promise<DeliveryPerformance> {
    const rows: { total?: string; completed?: string; active?: string; failed?: string; avg_distance?: string; avg_seconds?: string; driver_earnings?: string; delivery_fee?: string }[] =
      await this.dataSource.query(
        `SELECT
           COUNT(*) AS "total",
           COUNT(*) FILTER (WHERE d.status = 'DELIVERED') AS "completed",
           COUNT(*) FILTER (WHERE d.status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')) AS "active",
           COUNT(*) FILTER (WHERE d.status = 'FAILED') AS "failed",
           COALESCE(AVG(d.distance_km) FILTER (WHERE d.status = 'DELIVERED'), 0) AS "avg_distance",
           COALESCE(AVG(EXTRACT(EPOCH FROM (d.updated_at - d.created_at)) FILTER (WHERE d.status = 'DELIVERED')), 0) AS "avg_seconds",
           COALESCE(SUM(d.driver_earnings) FILTER (WHERE d.status = 'DELIVERED'), 0) AS "driver_earnings",
           COALESCE(SUM(o.delivery_fee) FILTER (WHERE o.status = 'DELIVERED'), 0) AS "delivery_fee"
         FROM deliveries d
         JOIN orders o ON o.id = d.order_id
         WHERE o.tenant_id = $1 AND ($2::uuid IS NULL OR o.vendor_id = $2) AND d.created_at >= $3 AND d.created_at < $4`,
        [tenantId, vendorId ?? null, range.since, range.until],
      );
    const row = rows[0] ?? {};
    const avgSeconds = Number(row.avg_seconds ?? 0);
    return {
      total: Number(row.total ?? 0),
      completed: Number(row.completed ?? 0),
      active: Number(row.active ?? 0),
      failed: Number(row.failed ?? 0),
      averageDistanceKm: Math.round(Number(row.avg_distance ?? 0) * 100) / 100,
      averageDurationMinutes: Math.round((avgSeconds / 60) * 10) / 10,
      deliveryFeeRevenue: Number(row.delivery_fee ?? 0),
      driverEarnings: Number(row.driver_earnings ?? 0),
    };
  }

  public async topProducts(
    tenantId: string,
    vendorId: string | undefined,
    range: AccountingDateRange,
    limit: number,
  ): Promise<TopProductRow[]> {
    const rows: { product_id?: string; product_name?: string; quantity?: string; revenue?: string; order_count?: string; total?: string }[] =
      await this.dataSource.query(
        `SELECT
           oi.product_id AS "product_id",
           oi.product_name AS "product_name",
           COALESCE(SUM(oi.quantity), 0) AS "quantity",
           COALESCE(SUM(oi.total_price), 0) AS "revenue",
           COUNT(DISTINCT oi.order_id) AS "order_count",
           COALESCE((SELECT SUM(o2.total_amount) FROM orders o2
              WHERE o2.tenant_id = $1 AND ($2::uuid IS NULL OR o2.vendor_id = $2)
                AND o2.created_at >= $3 AND o2.created_at < $4
                AND ${REVENUE_ORDERS.replace('o.', 'o2.')}), 0) AS "total"
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         WHERE oi.tenant_id = $1 AND ($2::uuid IS NULL OR o.vendor_id = $2) AND ${REVENUE_ORDERS}
           AND o.created_at >= $3 AND o.created_at < $4
         GROUP BY oi.product_id, oi.product_name
         ORDER BY "revenue" DESC
         LIMIT $5`,
        [tenantId, vendorId ?? null, range.since, range.until, limit],
      );
    const totalRevenue = Number(rows[0]?.total ?? 0);
    return (rows as { product_id?: string; product_name?: string; quantity?: string; revenue?: string; order_count?: string }[]).map((r) => ({
      productId: r.product_id ?? '',
      productName: r.product_name ?? '',
      quantity: Number(r.quantity ?? 0),
      revenue: Number(r.revenue ?? 0),
      orderCount: Number(r.order_count ?? 0),
      share: totalRevenue > 0 ? Math.round((Number(r.revenue ?? 0) / totalRevenue) * 1000) / 10 : 0,
    }));
  }

  public async inventory(
    tenantId: string,
    vendorId: string | undefined,
    threshold: number,
  ): Promise<InventoryReport> {
    const rows: { id?: string; name?: string; sku?: string | null; unit?: string; status?: string; stock_quantity?: string; price?: string; currency?: string; stock_value?: string }[] =
      await this.dataSource.query(
        `SELECT
           p.id AS "id",
           p.name AS "name",
           p.sku AS "sku",
           p.unit AS "unit",
           p.status AS "status",
           p.stock_quantity AS "stock_quantity",
           p.price AS "price",
           p.currency AS "currency",
           (p.stock_quantity * p.price) AS "stock_value"
         FROM products p
         WHERE p.tenant_id = $1 AND ($2::uuid IS NULL OR p.vendor_id = $2) AND p.status IS DISTINCT FROM 'DELETED'
         ORDER BY p.stock_quantity ASC, p.name ASC`,
        [tenantId, vendorId ?? null],
      );
    const items: InventoryItem[] = rows.map((r) => ({
      id: r.id ?? '',
      name: r.name ?? '',
      sku: r.sku ?? null,
      unit: r.unit ?? '',
      status: r.status ?? '',
      stockQuantity: Number(r.stock_quantity ?? 0),
      price: Number(r.price ?? 0),
      currency: r.currency ?? 'TZS',
      stockValue: Number(r.stock_value ?? 0),
    }));
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let activeProductCount = 0;
    let inventoryValue = 0;
    for (const item of items) {
      inventoryValue += item.stockValue;
      if (item.status !== 'ACTIVE') {
        continue;
      }
      activeProductCount += 1;
      if (item.stockQuantity <= 0) {
        outOfStockCount += 1;
      } else if (item.stockQuantity <= threshold) {
        lowStockCount += 1;
      }
    }
    return {
      threshold,
      lowStockCount,
      outOfStockCount,
      activeProductCount,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      items,
    };
  }

  public metricCatalog(): ReadonlyArray<MetricDefinition> {
    return METRIC_CATALOG;
  }
}
