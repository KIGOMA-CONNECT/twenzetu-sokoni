import { useState, useEffect } from 'react';
import api from '../../api/client';

type Tab = 'coupons' | 'flash-sales';

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { fontSize: '1.75rem', fontWeight: 700, color: 'var(--ink-soft)', margin: 0 },
  tabRow: { display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' },
  tab: { padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: '6px', border: '1px solid #cbd5e1', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' },
  tabActive: { background: '#1e40af', color: '#fff', border: '1px solid #1e40af' },
  card: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '8px', padding: '1.5rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: { textAlign: 'left', padding: '0.6rem 0.5rem', color: 'var(--muted)', fontWeight: 600, borderBottom: '1px solid var(--line)' },
  td: { padding: '0.6rem 0.5rem', borderBottom: '1px solid var(--line)', color: 'var(--text)' },
  btn: { padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', border: 'none', cursor: 'pointer', marginRight: '0.4rem' },
  primaryBtn: { background: '#1e40af', color: '#fff' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '2rem' },
  formRow: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as const, alignItems: 'flex-end' },
  input: { padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem' },
  label: { fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, marginBottom: '0.25rem', display: 'block' },
  fieldGroup: { display: 'flex', flexDirection: 'column' as const },
  error: { color: 'var(--danger)', fontSize: '0.85rem' },
  success: { color: 'var(--success)', fontSize: '0.85rem' },
};

export default function AdminPromotions() {
  const [tab, setTab] = useState<Tab>('coupons');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [flashSales, setFlashSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Coupon form
  const [cCode, setCCode] = useState('');
  const [cDiscountType, setCDiscountType] = useState('percentage');
  const [cDiscountValue, setCDiscountValue] = useState('');
  const [cMaxUsage, setCMaxUsage] = useState('');
  const [cExpiresAt, setCExpiresAt] = useState('');
  const [cResult, setCResult] = useState('');

  // Flash sale form
  const [fProductId, setFProductId] = useState('');
  const [fDiscountPercent, setFDiscountPercent] = useState('');
  const [fOriginalPrice, setFOriginalPrice] = useState('');
  const [fSalePrice, setFSalePrice] = useState('');
  const [fMaxQty, setFMaxQty] = useState('');
  const [fStartsAt, setFStartsAt] = useState('');
  const [fEndsAt, setFEndsAt] = useState('');
  const [fResult, setFResult] = useState('');

  const fetchCoupons = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/coupons');
      const list = res.data.data;
      setCoupons(Array.isArray(list) ? list : (Array.isArray(list?.data) ? list.data : []));
    } catch (err: any) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  const fetchFlashSales = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/flash-sales');
      const list = res.data.data;
      setFlashSales(Array.isArray(list) ? list : (Array.isArray(list?.data) ? list.data : []));
    } catch (err: any) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 'coupons') fetchCoupons(); else fetchFlashSales(); }, [tab]);

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault(); setCResult('');
    try {
      const payload: any = { code: cCode, discountType: cDiscountType, discountValue: Number(cDiscountValue) };
      if (cMaxUsage) payload.maxUsageCount = Number(cMaxUsage);
      if (cExpiresAt) payload.expiresAt = cExpiresAt;
      await api.post('/coupons', payload);
      setCResult('Coupon created');
      setCCode(''); setCDiscountValue(''); setCMaxUsage(''); setCExpiresAt('');
      fetchCoupons();
    } catch (err: any) { setCResult(err.response?.data?.message || err.message); }
  };

  const createFlashSale = async (e: React.FormEvent) => {
    e.preventDefault(); setFResult('');
    try {
      await api.post('/flash-sales', {
        productId: fProductId, discountPercent: Number(fDiscountPercent),
        originalPrice: Number(fOriginalPrice), salePrice: Number(fSalePrice),
        maxQuantity: Number(fMaxQty), startsAt: fStartsAt, endsAt: fEndsAt,
      });
      setFResult('Flash sale created');
      setFProductId(''); setFDiscountPercent(''); setFOriginalPrice('');
      setFSalePrice(''); setFMaxQty(''); setFStartsAt(''); setFEndsAt('');
      fetchFlashSales();
    } catch (err: any) { setFResult(err.response?.data?.message || err.message); }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Promotions</h1>
      <div style={styles.tabRow}>
        <button style={{ ...styles.tab, ...(tab === 'coupons' ? styles.tabActive : {}) }} onClick={() => setTab('coupons')}>Coupons</button>
        <button style={{ ...styles.tab, ...(tab === 'flash-sales' ? styles.tabActive : {}) }} onClick={() => setTab('flash-sales')}>Flash Sales</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {tab === 'coupons' && (
        <>
          <div style={styles.card}>
            <h3 style={{ margin: '0 0 1rem', color: 'var(--ink-soft)' }}>Create Coupon</h3>
            <form onSubmit={createCoupon}>
              <div style={styles.formRow}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Code</label>
                  <input style={styles.input} value={cCode} onChange={e => setCCode(e.target.value)} required />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Type</label>
                  <select style={styles.input} value={cDiscountType} onChange={e => setCDiscountType(e.target.value)}>
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Value</label>
                  <input style={styles.input} type="number" value={cDiscountValue} onChange={e => setCDiscountValue(e.target.value)} required />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Max Usage</label>
                  <input style={styles.input} type="number" value={cMaxUsage} onChange={e => setCMaxUsage(e.target.value)} />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Expires At</label>
                  <input style={styles.input} type="datetime-local" value={cExpiresAt} onChange={e => setCExpiresAt(e.target.value)} />
                </div>
                <button style={{ ...styles.btn, ...styles.primaryBtn, padding: '0.5rem 1rem' }} type="submit">Create</button>
              </div>
              {cResult && <div style={cResult === 'Coupon created' ? styles.success : styles.error}>{cResult}</div>}
            </form>
          </div>

          <div style={styles.card}>
            <h3 style={{ margin: '0 0 1rem', color: 'var(--ink-soft)' }}>All Coupons</h3>
            {loading ? <div style={styles.empty}>Loading...</div> : coupons.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Value</th>
                    <th style={styles.th}>Usage</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c: any) => (
                    <tr key={c.id}>
                      <td style={styles.td}>{c.code}</td>
                      <td style={styles.td}>{c.discountType}</td>
                      <td style={styles.td}>{c.discountValue}{c.discountType === 'percentage' ? '%' : ` ${c.currency}`}</td>
                      <td style={styles.td}>{c.usageCount}{c.maxUsageCount ? `/${c.maxUsageCount}` : ''}</td>
                      <td style={styles.td}>{c.status}</td>
                      <td style={styles.td}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div style={styles.empty}>No coupons found.</div>}
          </div>
        </>
      )}

      {tab === 'flash-sales' && (
        <>
          <div style={styles.card}>
            <h3 style={{ margin: '0 0 1rem', color: 'var(--ink-soft)' }}>Create Flash Sale</h3>
            <form onSubmit={createFlashSale}>
              <div style={styles.formRow}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Product ID</label>
                  <input style={styles.input} value={fProductId} onChange={e => setFProductId(e.target.value)} required />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Discount %</label>
                  <input style={styles.input} type="number" value={fDiscountPercent} onChange={e => setFDiscountPercent(e.target.value)} required />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Original Price</label>
                  <input style={styles.input} type="number" value={fOriginalPrice} onChange={e => setFOriginalPrice(e.target.value)} required />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Sale Price</label>
                  <input style={styles.input} type="number" value={fSalePrice} onChange={e => setFSalePrice(e.target.value)} required />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Max Quantity</label>
                  <input style={styles.input} type="number" value={fMaxQty} onChange={e => setFMaxQty(e.target.value)} required />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Starts At</label>
                  <input style={styles.input} type="datetime-local" value={fStartsAt} onChange={e => setFStartsAt(e.target.value)} required />
                </div>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Ends At</label>
                  <input style={styles.input} type="datetime-local" value={fEndsAt} onChange={e => setFEndsAt(e.target.value)} required />
                </div>
                <button style={{ ...styles.btn, ...styles.primaryBtn, padding: '0.5rem 1rem' }} type="submit">Create</button>
              </div>
              {fResult && <div style={styles.success}>{fResult}</div>}
            </form>
          </div>

          <div style={styles.card}>
            <h3 style={{ margin: '0 0 1rem', color: 'var(--ink-soft)' }}>All Flash Sales</h3>
            {loading ? <div style={styles.empty}>Loading...</div> : flashSales.length > 0 ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Product ID</th>
                    <th style={styles.th}>Discount</th>
                    <th style={styles.th}>Sale Price</th>
                    <th style={styles.th}>Sold</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Starts</th>
                    <th style={styles.th}>Ends</th>
                  </tr>
                </thead>
                <tbody>
                  {flashSales.map((s: any) => (
                    <tr key={s.id}>
                      <td style={styles.td}>{s.productId?.slice(0, 8)}...</td>
                      <td style={styles.td}>{s.discountPercent}%</td>
                      <td style={styles.td}>{s.salePrice} {s.currency}</td>
                      <td style={styles.td}>{s.soldQuantity}/{s.totalQuantity}</td>
                      <td style={styles.td}>{s.status}</td>
                      <td style={styles.td}>{new Date(s.startsAt).toLocaleDateString()}</td>
                      <td style={styles.td}>{new Date(s.endsAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div style={styles.empty}>No flash sales found.</div>}
          </div>
        </>
      )}
    </div>
  );
}
