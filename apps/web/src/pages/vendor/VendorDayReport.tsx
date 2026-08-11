import { Fragment, useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { PosDayReport, PosSale } from '../../types';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  tigo_pesa: 'Tigo Pesa',
  tigo_money: 'Tigo Money',
  airtel_money: 'Airtel Money',
  halotel: 'Halotel',
  azampesa: 'Azam Pesa',
  card: 'Card',
  wallet: 'Wallet',
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 },
  dateRow: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  dateInput: { padding: '0.5rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  cardValue: { fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' },
  cardLabel: { fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginTop: '0.15rem' },
  panel: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.25rem', overflow: 'hidden' },
  panelHeader: { padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' },
  panelBody: { padding: '1rem' },
  breakdownRow: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #eef2f7', fontSize: '0.88rem', color: '#334155' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b', borderBottom: '1px solid #e2e8f0', fontWeight: 600, background: '#f8fafc' },
  td: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
  empty: { textAlign: 'center', color: '#94a3b8', padding: '2rem' },
  expando: { width: 26, height: 26, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', color: '#334155' },
};

export default function VendorDayReport() {
  const [date, setDate] = useState(today());
  const { data: raw, loading, error, refetch } = useApi<PosDayReport>(`/pos/report?date=${date}`, [date]);

  const report: PosDayReport | null = raw && typeof raw === 'object' && 'totalRevenue' in raw ? raw : null;

  const sortedBreakdown = useMemo(() => {
    if (!report) return [];
    return [...report.paymentBreakdown].sort((a, b) => b.amount - a.amount);
  }, [report]);

  const totalBreakdown = sortedBreakdown.reduce((sum, row) => sum + row.amount, 0);

  // simple expandable rows: track which sale numbers are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderSaleItems = (sale: PosSale) => (
    <tr>
      <td colSpan={5} style={{ padding: '0 1rem 0.8rem 3rem', background: '#fafbfc' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...styles.th, background: 'transparent' }}>Item</th>
              <th style={{ ...styles.th, background: 'transparent' }}>SKU/Barcode</th>
              <th style={{ ...styles.th, background: 'transparent', textAlign: 'right' }}>Qty</th>
              <th style={{ ...styles.th, background: 'transparent', textAlign: 'right' }}>Unit Price</th>
              <th style={{ ...styles.th, background: 'transparent', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, idx) => (
              <tr key={idx}>
                <td style={styles.td}>{item.productName}</td>
                <td style={styles.td}>{item.sku || item.barcode || '—'}</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{fmt(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>End of Day Report</h1>
          <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
            {report?.shopName ? report.shopName : 'Shop sales summary'}
          </div>
        </div>
        <div style={styles.dateRow}>
          <input
            style={styles.dateInput}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || today())}
          />
          <button style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => refetch()}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !report ? (
        <div style={styles.empty}>No data for {date}</div>
      ) : (
        <>
          <div style={styles.stats}>
            <div style={styles.card}>
              <div style={styles.cardValue}>{fmt(report.totalRevenue)} {report.currency}</div>
              <div style={styles.cardLabel}>Total Sales</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardValue}>{report.transactionCount}</div>
              <div style={styles.cardLabel}>Transactions</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardValue}>{report.itemCount}</div>
              <div style={styles.cardLabel}>Items Sold</div>
            </div>
            <div style={styles.card}>
              <div style={styles.cardValue}>{fmt(report.averageSale)}</div>
              <div style={styles.cardLabel}>Average Sale</div>
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>Payment Methods</div>
            <div style={styles.panelBody}>
              {sortedBreakdown.length === 0 && <div style={styles.empty}>No payments recorded</div>}
              {sortedBreakdown.map((row) => (
                <div key={row.method} style={styles.breakdownRow}>
                  <span>{PAYMENT_LABELS[row.method] ?? row.method}</span>
                  <span>
                    {fmt(row.amount)} {report.currency} — {totalBreakdown > 0 ? Math.round((row.amount / totalBreakdown) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>Sales ({report.sales.length})</div>
            {report.sales.length === 0 ? (
              <div style={styles.empty}>No sales on {report.date}</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}></th>
                    <th style={styles.th}>Receipt</th>
                    <th style={styles.th}>Time</th>
                    <th style={styles.th}>Payment</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sales.map((sale) => (
                    <Fragment key={sale.id}>
                      <tr>
                        <td style={styles.td}>
                          <button style={styles.expando} onClick={() => toggle(sale.id)}>
                            {expanded[sale.id] ? '−' : '+'}
                          </button>
                        </td>
                        <td style={styles.td}>{sale.saleNumber}</td>
                        <td style={styles.td}>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={styles.td}>{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</td>
                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>{fmt(sale.total)}</td>
                      </tr>
                      {expanded[sale.id] && renderSaleItems(sale)}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}