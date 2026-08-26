import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface SmsBalance {
  totalCredits: number;
  usedCredits: number;
  availableCredits: number;
  totalSpent: number;
  currency: string;
}

interface SmsBundle {
  credits: number;
  price: number;
  savingsPercent?: number;
}

interface SmsLog {
  id: string;
  recipientPhone: string;
  message: string;
  creditsUsed: number;
  status: string;
  createdAt: string;
}

const BUNDLES: SmsBundle[] = [
  { credits: 100, price: 1500 },
  { credits: 500, price: 6500, savingsPercent: 13 },
  { credits: 1000, price: 12000, savingsPercent: 20 },
  { credits: 5000, price: 55000, savingsPercent: 27 },
];

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1100px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  subtitle: { color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.15rem' },
  card: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '10px', padding: '1.25rem' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  statCard: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '10px', padding: '1rem 1.25rem' },
  statLabel: { fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: '0.25rem' },
  statValue: { fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)' },
  sectionTitle: { fontSize: '1.05rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 0.85rem' },
  bundleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' },
  bundleCard: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '10px', padding: '1.25rem', textAlign: 'center' as const },
  bundleCredits: { fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)' },
  bundlePrice: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--muted)', marginTop: '0.3rem' },
  bundleSavings: { fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#dcfce7', borderRadius: '999px', padding: '0.15rem 0.5rem', display: 'inline-block', marginTop: '0.4rem' },
  buyBtn: { marginTop: '0.85rem', background: '#1e40af', color: '#fff', border: 'none', padding: '0.55rem 1.2rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', width: '100%' },
  field: { marginBottom: '0.85rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' as const, minHeight: '80px' },
  charCount: { fontSize: '0.72rem', color: 'var(--muted)', textAlign: 'right' as const, marginTop: '0.2rem' },
  creditInfo: { fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.3rem' },
  sendBtn: { background: '#059669', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer' },
  phoneBtn: { background: 'none', border: '1px solid #cbd5e1', color: 'var(--text)', padding: '0.6rem 1.5rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
  buttons: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { textAlign: 'left', padding: '0.7rem 1rem', background: 'var(--bg)', color: 'var(--muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid var(--line)' },
  td: { padding: '0.7rem 1rem', borderBottom: '1px solid var(--line)', color: 'var(--ink-soft)', verticalAlign: 'top' },
  empty: { padding: '2.5rem', textAlign: 'center', color: 'var(--faint)' },
  smallError: { color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' },
  tabs: { display: 'flex', gap: '0', marginBottom: '1.25rem', borderBottom: '2px solid var(--line)' },
  tab: { padding: '0.6rem 1.2rem', background: 'none', border: 'none', borderBottom: '2px solid transparent', marginBottom: '-2px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' },
  tabActive: { color: '#1e40af', borderBottomColor: '#1e40af' },
};

export default function VendorSms() {
  const { t } = useTranslation();
  const s = 'vendor.smsPage.';
  const { formatCurrency } = useCurrency();
  const { data: balanceRaw, refetch: refetchBalance } = useApi<SmsBalance>('/sms/credits');
  const { data: logsRaw, loading: logsLoading } = useApi<SmsLog[]>('/sms/logs');

  const balance: SmsBalance = balanceRaw ?? { totalCredits: 0, usedCredits: 0, availableCredits: 0, totalSpent: 0, currency: 'TZS' };
  const logs: SmsLog[] = Array.isArray(logsRaw) ? logsRaw : [];

  const [tab, setTab] = useState<'buy' | 'send' | 'history'>('send');
  const [buyLoading, setBuyLoading] = useState<number | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);

  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientType, setRecipientType] = useState('supplier');
  const [message, setMessage] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const msgSegments = message.length === 0 ? 0 : Math.ceil(message.length / 160);
  const noCredits = balance.availableCredits <= 0;

  const handleBuy = async (bundle: SmsBundle) => {
    setBuyLoading(bundle.credits);
    setBuyError(null);
    try {
      await api.post('/sms/credits/purchase', { credits: bundle.credits, amount: bundle.price });
      await refetchBalance();
    } catch (err: any) {
      setBuyError(err.response?.data?.message || err.message || t(s + 'failedPurchase'));
    } finally {
      setBuyLoading(null);
    }
  };

  const handleSend = async () => {
    if (!recipientPhone.trim()) { setSendError(t(s + 'enterPhoneError')); return; }
    if (!message.trim()) { setSendError(t(s + 'enterMessageError')); return; }
    setSendLoading(true);
    setSendError(null);
    setSendSuccess(false);
    try {
      await api.post('/sms/send', { recipientPhone: recipientPhone.trim(), message: message.trim(), recipientType });
      setSendSuccess(true);
      setRecipientPhone('');
      setMessage('');
      await refetchBalance();
    } catch (err: any) {
      setSendError(err.response?.data?.message || err.message || t(s + 'failedSend'));
    } finally {
      setSendLoading(false);
    }
  };

  const handleUsePhone = () => {
    const phone = recipientPhone.trim();
    const body = encodeURIComponent(message.trim());
    window.open(`sms:${phone}?body=${body}`, '_self');
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>{t(s + 'title')}</h1>
          <div style={styles.subtitle}>{t(s + 'subtitle')}</div>
        </div>
      </div>

      <div style={styles.statGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>{t(s + 'availableCredits')}</div>
          <div style={{ ...styles.statValue, color: '#059669' }}>{balance.availableCredits.toLocaleString()}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>{t(s + 'usedCredits')}</div>
          <div style={styles.statValue}>{balance.usedCredits.toLocaleString()}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>{t(s + 'totalPurchased')}</div>
          <div style={styles.statValue}>{balance.totalCredits.toLocaleString()}</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>{t(s + 'totalSpent')}</div>
          <div style={styles.statValue}>{formatCurrency(balance.totalSpent)}</div>
        </div>
      </div>

      <div style={styles.tabs}>
        <button style={{ ...styles.tab, ...(tab === 'send' ? styles.tabActive : {}) }} onClick={() => setTab('send')}>{t(s + 'sendSms')}</button>
        <button style={{ ...styles.tab, ...(tab === 'buy' ? styles.tabActive : {}) }} onClick={() => setTab('buy')}>{t(s + 'buyBundles')}</button>
        <button style={{ ...styles.tab, ...(tab === 'history' ? styles.tabActive : {}) }} onClick={() => setTab('history')}>{t(s + 'history')}</button>
      </div>

      {tab === 'buy' && (
        <>
          <div style={styles.sectionTitle}>{t(s + 'purchaseBundles')}</div>
          {buyError && <div style={{ ...styles.smallError, marginBottom: '0.75rem' }}>{buyError}</div>}
          <div style={styles.bundleGrid}>
            {BUNDLES.map((b) => (
              <div key={b.credits} style={styles.bundleCard}>
                <div style={styles.bundleCredits}>{b.credits.toLocaleString()} SMS</div>
                <div style={styles.bundlePrice}>{formatCurrency(b.price)}</div>
                {b.savingsPercent && <div style={styles.bundleSavings}>{b.savingsPercent}% {t(s + 'savings')}</div>}
                <button
                  style={{ ...styles.buyBtn, ...(buyLoading === b.credits ? { opacity: 0.6 } : {}) }}
                  onClick={() => handleBuy(b)}
                  disabled={buyLoading !== null}
                >
                  {buyLoading === b.credits ? t(s + 'buying') : t(s + 'buyNow')}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'send' && (
        <div style={styles.card}>
          <div style={styles.sectionTitle}>{t(s + 'sendSms')}</div>
          {sendSuccess && (
            <div style={{ color: '#059669', fontSize: '0.82rem', marginBottom: '0.75rem', padding: '0.5rem', background: '#f0fdf4', borderRadius: '6px' }}>
              {t(s + 'smsSentSuccess')}
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>{t(s + 'recipientPhone')}</label>
            <input
              style={styles.input}
              type="tel"
              placeholder={t(s + 'phonePlaceholder')}
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>{t(s + 'recipientType')}</label>
            <select style={styles.input} value={recipientType} onChange={(e) => setRecipientType(e.target.value)}>
              <option value="supplier">{t(s + 'supplier')}</option>
              <option value="customer">{t(s + 'customer')}</option>
              <option value="other">{t(s + 'other')}</option>
            </select>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>{t(s + 'message')}</label>
            <textarea
              style={styles.textarea}
              placeholder={t(s + 'messagePlaceholder')}
              maxLength={800}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div style={styles.charCount}>
              {message.length} / 160 {t(s + 'chars')}{msgSegments > 0 ? ` · ${msgSegments} ${msgSegments > 1 ? t(s + 'smsSegments') : t(s + 'smsSegment')}` : ''}
            </div>
            {msgSegments > 0 && (
              <div style={styles.creditInfo}>
                {noCredits
                  ? t(s + 'noCreditsAvailable')
                  : `${t(s + 'willUse')} ${msgSegments} ${msgSegments > 1 ? t(s + 'credits') : t(s + 'credit')} (${balance.availableCredits} ${t(s + 'available')})`}
              </div>
            )}
          </div>
          {sendError && <div style={styles.smallError}>{sendError}</div>}
          <div style={styles.buttons}>
            {noCredits && (
              <button style={styles.phoneBtn} onClick={handleUsePhone}>{t(s + 'usePhoneInstead')}</button>
            )}
            <button
              style={{ ...styles.sendBtn, ...(sendLoading ? { opacity: 0.6 } : {}) }}
              onClick={handleSend}
              disabled={sendLoading || noCredits}
            >
              {sendLoading ? t(s + 'sending') : t(s + 'sendSmsButton')}
            </button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div style={styles.card}>
          <div style={styles.sectionTitle}>{t(s + 'smsHistory')}</div>
          {logsLoading ? (
            <LoadingSpinner />
          ) : logs.length === 0 ? (
            <div style={styles.empty}>{t(s + 'noSmsSent')}</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>{t(s + 'recipient')}</th>
                    <th style={styles.th}>{t(s + 'messageCol')}</th>
                    <th style={styles.th}>{t(s + 'creditsCol')}</th>
                    <th style={styles.th}>{t(s + 'statusCol')}</th>
                    <th style={styles.th}>{t(s + 'dateCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={styles.td}>{log.recipientPhone}</td>
                      <td style={styles.td}>
                        <div style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {log.message}
                        </div>
                      </td>
                      <td style={styles.td}>{log.creditsUsed}</td>
                      <td style={styles.td}>
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.55rem', borderRadius: '999px',
                          fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                          background: log.status === 'SENT' || log.status === 'DELIVERED' ? '#dcfce7' : '#fef2f2',
                          color: log.status === 'SENT' || log.status === 'DELIVERED' ? '#166534' : '#991b1b',
                        }}>{log.status}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontSize: '0.78rem' }}>{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--faint)' }}>{new Date(log.createdAt).toLocaleTimeString()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
