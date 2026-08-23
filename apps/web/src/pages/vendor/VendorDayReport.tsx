import { Fragment, useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { PosDayReport, PosSale, PosShift } from '../../types';

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

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
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  controls: { display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' },
  dateInput: { padding: '0.5rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit' },
  select: { padding: '0.5rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', minWidth: '220px' },
  printBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
  cardValue: { fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)' },
  cardLabel: { fontSize: '0.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, marginTop: '0.15rem' },
  panel: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.25rem', overflow: 'hidden' },
  panelHeader: { padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', background: 'var(--bg)', fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' },
  panelBody: { padding: '1rem' },
  breakdownRow: { display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dashed #eef2f7', fontSize: '0.88rem', color: 'var(--text)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 1rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', borderBottom: '1px solid #e2e8f0', fontWeight: 600, background: 'var(--bg)' },
  td: { padding: '0.6rem 1rem', fontSize: '0.85rem', color: 'var(--ink-soft)', borderBottom: '1px solid #f1f5f9' },
  empty: { textAlign: 'center', color: 'var(--faint)', padding: '2rem' },
  expando: { width: 26, height: 26, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', color: 'var(--text)' },
  compareBtn: { padding: '0.5rem 1rem', border: '1px solid #2563eb', background: '#eff6ff', color: '#1e40af', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600 },
  compareBtnActive: { padding: '0.5rem 1rem', border: '1px solid #1e40af', background: '#1e40af', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'inherit', fontWeight: 600 },
  compTable: { width: '100%', borderCollapse: 'collapse' },
  compTh: { padding: '0.6rem 0.8rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', borderBottom: '2px solid #e2e8f0', fontWeight: 600, background: 'var(--bg)', textAlign: 'center' },
  compTd: { padding: '0.55rem 0.8rem', fontSize: '0.85rem', color: 'var(--ink-soft)', borderBottom: '1px solid #f1f5f9', textAlign: 'center' },
  compLabel: { padding: '0.55rem 0.8rem', fontSize: '0.85rem', color: 'var(--ink)', borderBottom: '1px solid #f1f5f9', fontWeight: 600, textAlign: 'left' },
};

export default function VendorDayReport() {
  const { formatCurrency } = useCurrency();
  const [date, setDate] = useState(today());
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  const shiftsQuery = `/pos/shifts?date=${date}`;
  const { data: shiftsRaw, loading: shiftsLoading } = useApi<{ data: PosShift[] }>(shiftsQuery, [shiftsQuery]);
  const shifts: PosShift[] = Array.isArray(shiftsRaw?.data) ? shiftsRaw!.data : [];

  const reportQuery = `/pos/report?date=${date}${selectedShiftId ? `&shiftId=${selectedShiftId}` : ''}`;
  const { data: raw, loading, error, refetch } = useApi<PosDayReport>(reportQuery, [reportQuery]);

  const report: PosDayReport | null = raw && typeof raw === 'object' && 'totalRevenue' in raw ? raw : null;

  const reportAQuery = compareA ? `/pos/report?date=${date}&shiftId=${compareA}` : '';
  const { data: rawA, loading: loadingA } = useApi<PosDayReport>(reportAQuery, [reportAQuery]);
  const reportA: PosDayReport | null = rawA && typeof rawA === 'object' && 'totalRevenue' in rawA ? rawA : null;

  const reportBQuery = compareB ? `/pos/report?date=${date}&shiftId=${compareB}` : '';
  const { data: rawB, loading: loadingB } = useApi<PosDayReport>(reportBQuery, [reportBQuery]);
  const reportB: PosDayReport | null = rawB && typeof rawB === 'object' && 'totalRevenue' in rawB ? rawB : null;

  const sortedBreakdown = useMemo(() => {
    if (!report) return [];
    return [...report.paymentBreakdown].sort((a, b) => b.amount - a.amount);
  }, [report]);

  const totalBreakdown = sortedBreakdown.reduce((sum, row) => sum + row.amount, 0);

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
                <td style={styles.td}>{item.sku || item.barcode || '\u2014'}</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ ...styles.td, textAlign: 'right' }}>{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );

  const selectedShift = shifts.find((s) => s.id === selectedShiftId);

  const shiftA = shifts.find((s) => s.id === compareA);
  const shiftB = shifts.find((s) => s.id === compareB);

  const delta = (a: number, b: number) => {
    if (b === 0) return a > 0 ? 100 : 0;
    return Math.round(((a - b) / b) * 100);
  };

  return (
    <div style={styles.container}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #day-report-print, #day-report-print * { visibility: visible; }
          #day-report-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div id="day-report-print">
        <div style={styles.header} className="no-print">
        <div>
          <h1 style={styles.title}>{compareMode ? 'Shift Comparison' : 'End of Day Report'}</h1>
          <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
            {report?.shopName ? report.shopName : 'Shop sales summary'}
            {!compareMode && selectedShift && <span> &mdash; Shift {selectedShift.shiftNumber}</span>}
          </div>
        </div>
        <div style={styles.controls}>
          <input
            style={styles.dateInput}
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value || today()); setSelectedShiftId(''); }}
          />
          {!compareMode && (
            <select
              style={styles.select}
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              disabled={shiftsLoading}
            >
              <option value="">All shifts (full day)</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shiftNumber} &mdash; {s.status === 'OPEN' ? 'OPEN' : 'CLOSED'} ({s.salesCount} sales)
                </option>
              ))}
            </select>
          )}
          {compareMode && (
            <>
              <select
                style={styles.select}
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                disabled={shiftsLoading}
              >
                <option value="">Shift A</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shiftNumber} &mdash; {s.status === 'OPEN' ? 'OPEN' : 'CLOSED'} ({s.salesCount} sales)
                  </option>
                ))}
              </select>
              <select
                style={styles.select}
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                disabled={shiftsLoading}
              >
                <option value="">Shift B</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.shiftNumber} &mdash; {s.status === 'OPEN' ? 'OPEN' : 'CLOSED'} ({s.salesCount} sales)
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            style={compareMode ? styles.compareBtnActive : styles.compareBtn}
            onClick={() => {
              setCompareMode(!compareMode);
              setSelectedShiftId('');
              setCompareA('');
              setCompareB('');
            }}
          >
            Compare Shifts
          </button>
          <button style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => refetch()}>
            Refresh
          </button>
          {!compareMode && report && (
            <button style={styles.printBtn} onClick={() => window.print()}>
              Export PDF
            </button>
          )}
        </div>
      </div>

      {compareMode ? (
        <>
          {loadingA || loadingB ? (
            <LoadingSpinner />
          ) : reportA && reportB ? (
            <>
              <div style={styles.panel}>
                <div style={styles.panelHeader}>Comparison Overview</div>
                <div style={styles.panelBody}>
                  <table style={styles.compTable}>
                    <thead>
                      <tr>
                        <th style={styles.compTh}>Metric</th>
                        <th style={styles.compTh}>Shift A{shiftA ? ` (${shiftA.shiftNumber})` : ''}</th>
                        <th style={styles.compTh}>Shift B{shiftB ? ` (${shiftB.shiftNumber})` : ''}</th>
                        <th style={styles.compTh}>Delta %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={styles.compLabel}>Total Sales</td>
                        <td style={styles.compTd}>{formatCurrency(reportA.totalRevenue)} {reportA.currency}</td>
                        <td style={styles.compTd}>{formatCurrency(reportB.totalRevenue)} {reportB.currency}</td>
                        <td style={{ ...styles.compTd, color: delta(reportA.totalRevenue, reportB.totalRevenue) > 0 ? '#16a34a' : delta(reportA.totalRevenue, reportB.totalRevenue) < 0 ? '#dc2626' : 'var(--muted)', fontWeight: 600 }}>
                          {delta(reportA.totalRevenue, reportB.totalRevenue) > 0 ? '+' : ''}{delta(reportA.totalRevenue, reportB.totalRevenue)}%
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.compLabel}>Transactions</td>
                        <td style={styles.compTd}>{reportA.transactionCount}</td>
                        <td style={styles.compTd}>{reportB.transactionCount}</td>
                        <td style={{ ...styles.compTd, color: delta(reportA.transactionCount, reportB.transactionCount) > 0 ? '#16a34a' : delta(reportA.transactionCount, reportB.transactionCount) < 0 ? '#dc2626' : 'var(--muted)', fontWeight: 600 }}>
                          {delta(reportA.transactionCount, reportB.transactionCount) > 0 ? '+' : ''}{delta(reportA.transactionCount, reportB.transactionCount)}%
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.compLabel}>Items Sold</td>
                        <td style={styles.compTd}>{reportA.itemCount}</td>
                        <td style={styles.compTd}>{reportB.itemCount}</td>
                        <td style={{ ...styles.compTd, color: delta(reportA.itemCount, reportB.itemCount) > 0 ? '#16a34a' : delta(reportA.itemCount, reportB.itemCount) < 0 ? '#dc2626' : 'var(--muted)', fontWeight: 600 }}>
                          {delta(reportA.itemCount, reportB.itemCount) > 0 ? '+' : ''}{delta(reportA.itemCount, reportB.itemCount)}%
                        </td>
                      </tr>
                      <tr>
                        <td style={styles.compLabel}>Average Sale</td>
                        <td style={styles.compTd}>{formatCurrency(reportA.averageSale)}</td>
                        <td style={styles.compTd}>{formatCurrency(reportB.averageSale)}</td>
                        <td style={{ ...styles.compTd, color: delta(reportA.averageSale, reportB.averageSale) > 0 ? '#16a34a' : delta(reportA.averageSale, reportB.averageSale) < 0 ? '#dc2626' : 'var(--muted)', fontWeight: 600 }}>
                          {delta(reportA.averageSale, reportB.averageSale) > 0 ? '+' : ''}{delta(reportA.averageSale, reportB.averageSale)}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div style={styles.panel}>
                  <div style={styles.panelHeader}>Shift A &mdash; Payment Methods</div>
                  <div style={styles.panelBody}>
                    {[...reportA.paymentBreakdown].sort((a, b) => b.amount - a.amount).map((row) => {
                      const totalA = [...reportA.paymentBreakdown].reduce((s, r) => s + r.amount, 0);
                      return (
                        <div key={row.method} style={styles.breakdownRow}>
                          <span>{PAYMENT_LABELS[row.method] ?? row.method}</span>
                          <span>
                            {formatCurrency(row.amount)} {reportA.currency} &mdash; {totalA > 0 ? Math.round((row.amount / totalA) * 100) : 0}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={styles.panel}>
                  <div style={styles.panelHeader}>Shift B &mdash; Payment Methods</div>
                  <div style={styles.panelBody}>
                    {[...reportB.paymentBreakdown].sort((a, b) => b.amount - a.amount).map((row) => {
                      const totalB = [...reportB.paymentBreakdown].reduce((s, r) => s + r.amount, 0);
                      return (
                        <div key={row.method} style={styles.breakdownRow}>
                          <span>{PAYMENT_LABELS[row.method] ?? row.method}</span>
                          <span>
                            {formatCurrency(row.amount)} {reportB.currency} &mdash; {totalB > 0 ? Math.round((row.amount / totalB) * 100) : 0}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : reportA || reportB ? (
            <div style={{ ...styles.empty, color: 'var(--muted)' }}>Select both shifts to see comparison.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', maxWidth: '600px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--ink)' }}>Shift A</label>
                <select
                  style={styles.select}
                  value={compareA}
                  onChange={(e) => setCompareA(e.target.value)}
                  disabled={shiftsLoading}
                >
                  <option value="">Select shift...</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shiftNumber} &mdash; {s.status === 'OPEN' ? 'OPEN' : 'CLOSED'} ({s.salesCount} sales)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--ink)' }}>Shift B</label>
                <select
                  style={styles.select}
                  value={compareB}
                  onChange={(e) => setCompareB(e.target.value)}
                  disabled={shiftsLoading}
                >
                  <option value="">Select shift...</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.shiftNumber} &mdash; {s.status === 'OPEN' ? 'OPEN' : 'CLOSED'} ({s.salesCount} sales)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </>
      ) : loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !report ? (
        <div style={styles.empty}>No data for {date}</div>
      ) : (
        <>
          <div style={styles.stats}>
            <div style={styles.card}>
              <div style={styles.cardValue}>{formatCurrency(report.totalRevenue)} {report.currency}</div>
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
              <div style={styles.cardValue}>{formatCurrency(report.averageSale)}</div>
              <div style={styles.cardLabel}>Average Sale</div>
            </div>
          </div>

          {selectedShift && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <span><strong>Shift:</strong> {selectedShift.shiftNumber}</span>
              <span><strong>Opened:</strong> {new Date(selectedShift.openedAt).toLocaleTimeString()}</span>
              {selectedShift.closedAt && <span><strong>Closed:</strong> {new Date(selectedShift.closedAt).toLocaleTimeString()}</span>}
              <span><strong>Status:</strong> {selectedShift.status}</span>
            </div>
          )}

          <div style={styles.panel}>
            <div style={styles.panelHeader}>Payment Methods</div>
            <div style={styles.panelBody}>
              {sortedBreakdown.length === 0 && <div style={styles.empty}>No payments recorded</div>}
              {sortedBreakdown.map((row) => (
                <div key={row.method} style={styles.breakdownRow}>
                  <span>{PAYMENT_LABELS[row.method] ?? row.method}</span>
                  <span>
                    {formatCurrency(row.amount)} {report.currency} &mdash; {totalBreakdown > 0 ? Math.round((row.amount / totalBreakdown) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.panel}>
            <div style={styles.panelHeader}>Sales ({report.sales.length})</div>
            {report.sales.length === 0 ? (
              <div style={styles.empty}>No sales on {date}{selectedShift ? ` for shift ${selectedShift.shiftNumber}` : ''}</div>
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
                            {expanded[sale.id] ? '\u2212' : '+'}
                          </button>
                        </td>
                        <td style={styles.td}>{sale.saleNumber}</td>
                        <td style={styles.td}>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={styles.td}>{PAYMENT_LABELS[sale.paymentMethod] ?? sale.paymentMethod}</td>
                        <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>{formatCurrency(sale.total)}</td>
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
    </div>
  );
}
