import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type {
  AccountingPeriod,
  AnalyticsOverview,
  AnalyticsTopProduct,
  AnalyticsInventoryReport,
  MetricDefinition,
} from '../../types';

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const PERIODS: { value: AccountingPeriod; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'all_time', label: 'All Time' },
];

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Top Products' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'catalog', label: 'Metric Catalog' },
] as const;

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1080px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  subtitle: { color: 'var(--muted)', fontSize: '0.85rem' },
  controls: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  periodBtn: { padding: '0.45rem 0.85rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' },
  periodBtnActive: { padding: '0.45rem 0.85rem', border: '1px solid #2563eb', background: 'var(--info)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit' },
  refreshBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  exportBtn: { padding: '0.5rem 1rem', border: '1px solid #047857', background: 'var(--success)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  tabs: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' },
  tab: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', color: 'var(--text)' },
  tabActive: { padding: '0.5rem 1rem', border: '1px solid #2563eb', background: 'var(--info-soft)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'inherit', color: '#1d4ed8' },
  panel: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.25rem', overflow: 'hidden' },
  panelHeader: { padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', background: 'var(--bg)', fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', borderBottom: '1px solid #e2e8f0', fontWeight: 600, background: 'var(--bg)' },
  td: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink-soft)', borderBottom: '1px solid #f1f5f9' },
  tdRight: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink-soft)', borderBottom: '1px solid #f1f5f9', textAlign: 'right' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '0.9rem 1rem' },
  cardLabel: { fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', fontWeight: 600 },
  cardValue: { fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', marginTop: '0.3rem' },
  cardSub: { fontSize: '0.75rem', color: 'var(--faint)', marginTop: '0.15rem' },
  empty: { textAlign: 'center', color: 'var(--faint)', padding: '2rem' },
  pos: { color: 'var(--success)' },
  neg: { color: 'var(--danger)' },
  warn: { color: '#b45309' },
  bad: { color: 'var(--danger)' },
  barTrack: { background: 'var(--line)', borderRadius: '999px', height: '6px', width: '100%', overflow: 'hidden' },
  barFill: { background: 'var(--info)', height: '100%', borderRadius: '999px' },
  input: { padding: '0.45rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', width: '90px', fontFamily: 'inherit' },
};

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function VendorAnalytics() {
  const [period, setPeriod] = useState<AccountingPeriod>('30d');
  const [tab, setTab] = useState<string>('overview');
  const [threshold, setThreshold] = useState<number>(5);

  const overviewQuery = `/vendor/analytics/overview?period=${period}`;
  const { data: overviewRaw, loading: overviewLoading, error: overviewError, refetch } = useApi<AnalyticsOverview>(overviewQuery, [overviewQuery]);
  const overview: AnalyticsOverview | null = overviewRaw && typeof overviewRaw === 'object' && 'summary' in overviewRaw ? overviewRaw : null;

  const productsQuery = `/vendor/analytics/top-products?period=${period}&limit=10`;
  const { data: productsRaw, loading: productsLoading, error: productsError } = useApi<AnalyticsTopProduct[]>(productsQuery, [productsQuery]);
  const products: AnalyticsTopProduct[] = Array.isArray(productsRaw) ? productsRaw : [];

  const inventoryQuery = `/vendor/analytics/inventory?threshold=${threshold}`;
  const { data: inventoryRaw, loading: inventoryLoading, error: inventoryError, refetch: refetchInventory } = useApi<AnalyticsInventoryReport>(inventoryQuery, [inventoryQuery]);
  const inventory: AnalyticsInventoryReport | null = inventoryRaw && typeof inventoryRaw === 'object' && 'items' in inventoryRaw ? inventoryRaw : null;

  const { data: catalogRaw, loading: catalogLoading, error: catalogError } = useApi<MetricDefinition[]>('/vendor/analytics/metric-catalog');
  const catalog: MetricDefinition[] = Array.isArray(catalogRaw) ? catalogRaw : [];

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    if (tab === 'overview' && overview) {
      const s = overview.summary;
      downloadCsv(`analytics-overview-${period}-${stamp}.csv`, [
        ['Metric', 'Value'],
        ['Total Revenue', s.totalRevenue],
        ['Platform Commission', s.commission],
        ['Net Revenue', s.netRevenue],
        ['Delivery Fee Revenue', s.deliveryFeeRevenue],
        ['Orders', s.orderCount],
        ['Completed Orders', s.completedOrders],
        ['Cancelled / Refunded', s.cancelledOrders],
        ['Cancellation Rate', s.cancellationRate],
        ['Average Order Value', s.averageOrderValue],
        ['Unique Customers', overview.customers.uniqueCustomers],
        ['New Customers', overview.customers.newCustomers],
        ['Returning Customers', overview.customers.returningCustomers],
        ['Deliveries Completed', overview.deliveries.completed],
        ['Deliveries Active', overview.deliveries.active],
        ['Deliveries Failed', overview.deliveries.failed],
        ['Driver Earnings', overview.deliveries.driverEarnings],
      ]);
    } else if (tab === 'products') {
      downloadCsv(`analytics-top-products-${period}-${stamp}.csv`, [
        ['Product', 'Quantity', 'Revenue', 'Orders', 'Revenue Share %'],
        ...products.map((p) => [p.productName, p.quantity, p.revenue, p.orderCount, p.share]),
      ]);
    } else if (tab === 'inventory' && inventory) {
      downloadCsv(`analytics-inventory-${stamp}.csv`, [
        ['Name', 'SKU', 'Stock', 'Unit', 'Price', 'Stock Value'],
        ...inventory.items.map((i) => [i.name, i.sku ?? '', i.stockQuantity, i.unit, i.price, i.stockValue]),
      ]);
    } else if (tab === 'catalog') {
      downloadCsv(`metric-catalog-${stamp}.csv`, [
        ['Key', 'Name', 'Category', 'Unit', 'Source', 'Description'],
        ...catalog.map((m) => [m.key, m.name, m.category, m.unit, m.source, m.description]),
      ]);
    }
  };

  const renderStatCard = (label: string, value: string, sub?: string) => (
    <div style={styles.card}>
      <div style={styles.cardLabel}>{label}</div>
      <div style={styles.cardValue}>{value}</div>
      {sub ? <div style={styles.cardSub}>{sub}</div> : null}
    </div>
  );

  const statusColor = (status: string) => {
    if (status === 'CANCELLED' || status === 'REFUNDED') return styles.neg;
    if (status === 'DELIVERED') return styles.pos;
    return undefined;
  };

  const stockColor = (n: number) => (n <= 0 ? styles.bad : n <= threshold ? styles.warn : undefined);

  const funnelTotal = overview?.funnel.reduce((sum, f) => sum + f.count, 0) ?? 0;
  const invTotalStock = inventory ? inventory.items.reduce((sum, i) => sum + i.stockQuantity, 0) : 0;
  const maxRevenue = products.reduce((max, p) => Math.max(max, p.revenue), 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Business Analytics</h1>
          <div style={styles.subtitle}>
            {overview?.shopName ? `${overview.shopName} — ` : ''}tenant-facing reports with a defined metric catalog
          </div>
        </div>
        <div style={styles.controls}>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              style={period === p.value ? styles.periodBtnActive : styles.periodBtn}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
          {tab === 'inventory' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text)' }}>
              Low stock ≤
              <input
                style={styles.input}
                type="number"
                min={0}
                value={threshold}
                onChange={(e) => setThreshold(Math.max(0, Number(e.target.value) || 0))}
              />
              units
            </label>
          )}
          <button style={styles.refreshBtn} onClick={() => { refetch(); refetchInventory(); }}>Refresh</button>
          <button style={styles.exportBtn} onClick={exportCsv}>CSV</button>
        </div>
      </div>

      <div style={styles.tabs}>
        {TABS.map((t) => (
          <button key={t.key} style={tab === t.key ? styles.tabActive : styles.tab} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (overviewLoading ? (
        <LoadingSpinner />
      ) : overviewError ? (
        <ErrorMessage message={overviewError} />
      ) : !overview ? (
        <div style={styles.empty}>No data for the selected period</div>
      ) : (
        <>
          <div style={styles.cards}>
            {renderStatCard('Revenue', fmt(overview.summary.totalRevenue))}
            {renderStatCard('Commission', fmt(overview.summary.commission), 'platform cut')}
            {renderStatCard('Net Revenue', fmt(overview.summary.netRevenue), overview.summary.currency)}
            {renderStatCard('Delivery Fees', fmt(overview.summary.deliveryFeeRevenue))}
            {renderStatCard('Orders', String(overview.summary.orderCount), `${overview.summary.completedOrders} completed`)}
            {renderStatCard('Avg Order Value', fmt(overview.summary.averageOrderValue))}
            {renderStatCard('Cancellation', `${(overview.summary.cancellationRate * 100).toFixed(1)}%`, `${overview.summary.cancelledOrders} orders`)}
            {renderStatCard('Customers', String(overview.customers.uniqueCustomers), `${overview.customers.newCustomers} new · ${overview.customers.returningCustomers} returning`)}
            {renderStatCard('Deliveries', String(overview.deliveries.completed), `${overview.deliveries.active} active · ${overview.deliveries.failed} failed`)}
            {renderStatCard('Avg Delivery', `${fmt(overview.deliveries.averageDistanceKm)} km`, `${fmt(overview.deliveries.averageDurationMinutes)} min avg`)}
            {renderStatCard('Driver Earnings', fmt(overview.deliveries.driverEarnings))}
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <span>Order Funnel</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>{funnelTotal} orders</span>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Orders</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Share</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Value (TZS)</th>
                </tr>
              </thead>
              <tbody>
                {overview.funnel.map((f) => (
                  <tr key={f.status}>
                    <td style={{ ...styles.td, fontWeight: 600, ...statusColor(f.status) }}>{f.status.replace(/_/g, ' ')}</td>
                    <td style={styles.tdRight}>{f.count}</td>
                    <td style={styles.tdRight}>{funnelTotal > 0 ? `${((f.count / funnelTotal) * 100).toFixed(1)}%` : '—'}</td>
                    <td style={styles.tdRight}>{fmt(f.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <span>Daily Revenue</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>date · orders · revenue · commission</span>
            </div>
            {overview.daily.length === 0 ? (
              <div style={styles.empty}>No orders in this period</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Orders</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Revenue</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.daily.map((d) => (
                    <tr key={d.date}>
                      <td style={styles.td}>{d.date}</td>
                      <td style={styles.tdRight}>{d.orders}</td>
                      <td style={{ ...styles.tdRight, ...styles.pos }}>{fmt(d.revenue)}</td>
                      <td style={styles.tdRight}>{fmt(d.commission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ))}

      {tab === 'products' && (productsLoading ? (
        <LoadingSpinner />
      ) : productsError ? (
        <ErrorMessage message={productsError} />
      ) : products.length === 0 ? (
        <div style={styles.empty}>No product sales in this period</div>
      ) : (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span>Top Products by Revenue</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>period: {period === 'all_time' ? 'all time' : `last ${period}`}</span>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Product</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Quantity</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Orders</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Revenue</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Share</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.productId}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{p.productName}</td>
                  <td style={styles.tdRight}>{p.quantity}</td>
                  <td style={styles.tdRight}>{p.orderCount}</td>
                  <td style={{ ...styles.tdRight, ...styles.pos }}>{fmt(p.revenue)}</td>
                  <td style={{ ...styles.tdRight, width: '18%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.8rem', minWidth: '3.5rem' }}>{p.share}%</span>
                      <div style={{ ...styles.barTrack, width: '70px' }}>
                        <div style={{ ...styles.barFill, width: `${maxRevenue > 0 ? Math.max(2, (p.revenue / maxRevenue) * 100) : 0}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {tab === 'inventory' && (inventoryLoading ? (
        <LoadingSpinner />
      ) : inventoryError ? (
        <ErrorMessage message={inventoryError} />
      ) : !inventory ? (
        <div style={styles.empty}>No products found</div>
      ) : (
        <>
          <div style={styles.cards}>
            {renderStatCard('Products', String(inventory.activeProductCount), 'active')}
            {renderStatCard('Total Stock Units', fmt(invTotalStock))}
            {renderStatCard('Inventory Value', fmt(inventory.inventoryValue))}
            {renderStatCard('Low Stock', String(inventory.lowStockCount), `≤ ${inventory.threshold} units`)}
            {renderStatCard('Out of Stock', String(inventory.outOfStockCount))}
          </div>
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <span>Stock by Product</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>
                low stock ≤ {inventory.threshold} units · {inventory.items.length} products
              </span>
            </div>
            {inventory.items.length === 0 ? (
              <div style={styles.empty}>No products yet</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>SKU</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Stock</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Price</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Stock Value</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.items.map((i) => (
                    <tr key={i.id}>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{i.name}</td>
                      <td style={styles.td}>{i.sku || '—'}</td>
                      <td style={{ ...styles.tdRight, fontWeight: 700, ...stockColor(i.stockQuantity) }}>
                        {i.stockQuantity} {i.unit}
                      </td>
                      <td style={styles.tdRight}>{fmt(i.price)} {i.currency}</td>
                      <td style={styles.tdRight}>{fmt(i.stockValue)}</td>
                      <td style={styles.td}>
                        <span style={i.status === 'ACTIVE' ? styles.pos : styles.neg}>{i.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ))}

      {tab === 'catalog' && (catalogLoading ? (
        <LoadingSpinner />
      ) : catalogError ? (
        <ErrorMessage message={catalogError} />
      ) : (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span>Defined Metric Catalog</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>{catalog.length} metrics</span>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Metric</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Unit</th>
                <th style={styles.th}>Source</th>
                <th style={styles.th}>Definition</th>
              </tr>
            </thead>
            <tbody>
              {catalog.map((m) => (
                <tr key={m.key}>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{m.name}</td>
                  <td style={styles.td}>{m.category}</td>
                  <td style={styles.td}>{m.unit}</td>
                  <td style={{ ...styles.td, fontSize: '0.78rem', color: 'var(--muted)' }}>{m.source}</td>
                  <td style={{ ...styles.td, fontSize: '0.78rem', color: 'var(--muted)' }}>{m.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
