import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { Wallet, WalletTransaction } from '../../types';
import { PageTitle } from '../../components/PageTitle';

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
};

type ProviderId = 'mpesa' | 'mixx_by_yas' | 'airtel_money' | 'halotel' | 'card' | 'bank';

type WithdrawProviderId = 'mpesa' | 'mixx_by_yas' | 'airtel_money' | 'halotel' | 'azampesa';

const paymentMethods: Array<{ id: ProviderId; icon: string; name: string; desc: string; group: string }> = [
  { id: 'mpesa', icon: '📱', name: 'M-Pesa', desc: 'Vodacom Tanzania', group: 'Mobile Money' },
  { id: 'mixx_by_yas', icon: '📱', name: 'Mixx by Yas', desc: 'Yas (Tigo) Tanzania', group: 'Mobile Money' },
  { id: 'airtel_money', icon: '📱', name: 'Airtel Money', desc: 'Airtel Tanzania', group: 'Mobile Money' },
  { id: 'halotel', icon: '📱', name: 'Halotel', desc: 'Halotel Money', group: 'Mobile Money' },
  { id: 'card', icon: '💳', name: 'Card / Virtual Card', desc: 'Visa, Mastercard or virtual card', group: 'Card' },
  { id: 'bank', icon: '🏦', name: 'Bank Transfer', desc: 'CRDB, NMB, NBC and more', group: 'Bank' },
];

const withdrawMethods: Array<{ id: WithdrawProviderId; icon: string; name: string }> = [
  { id: 'mpesa', icon: '📱', name: 'M-Pesa' },
  { id: 'mixx_by_yas', icon: '📱', name: 'Mixx by Yas' },
  { id: 'airtel_money', icon: '📱', name: 'Airtel Money' },
  { id: 'halotel', icon: '📱', name: 'Halotel' },
  { id: 'azampesa', icon: '📱', name: 'AzamPay' },
];

const quickAmounts = [5000, 10000, 20000, 50000, 100000, 200000];

export default function WalletPage() {
  const { t } = useTranslation();
  const { formatCurrency, currency } = useCurrency();
  const { user } = useAuth();
  const { data: wallet, loading, error, refetch: refetchWallet } = useApi<Wallet>('/wallets/me');
  const { data: transactions, loading: txLoading, error: txError, refetch: refetchTx } = useApi<WalletTransaction[]>('/wallets/transactions');

  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState(10000);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<ProviderId>('mpesa');
  const [submitting, setSubmitting] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState('');
  const [topupError, setTopupError] = useState('');
  const [bankReference, setBankReference] = useState('');

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(10000);
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [withdrawProvider, setWithdrawProvider] = useState<WithdrawProviderId>('mpesa');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState('');
  const [withdrawError, setWithdrawError] = useState('');

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState(10000);
  const [recipientIdentifier, setRecipientIdentifier] = useState('');
  const [recipientType, setRecipientType] = useState<'phone' | 'email' | 'userId'>('phone');
  const [transferDescription, setTransferDescription] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState('');
  const [transferError, setTransferError] = useState('');

  const [showBankWithdraw, setShowBankWithdraw] = useState(false);
  const [bankWithdrawAmount, setBankWithdrawAmount] = useState(10000);
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankWithdrawDescription, setBankWithdrawDescription] = useState('');
  const [bankWithdrawing, setBankWithdrawing] = useState(false);
  const [bankWithdrawSuccess, setBankWithdrawSuccess] = useState('');
  const [bankWithdrawError, setBankWithdrawError] = useState('');

  const groups = ['Mobile Money', 'Card', 'Bank'] as const;

  const canWithdraw = user?.role === 'vendor' || user?.role === 'driver';

  const handleTopup = async () => {
    setSubmitting(true);
    setTopupSuccess('');
    setTopupError('');
    try {
      const res = await api.post('/wallets/top-up', {
        amount: topupAmount,
        phoneNumber,
        provider: selectedMethod,
        bankReference: selectedMethod === 'bank' ? bankReference : undefined,
      });
      if (res.data?.data?.checkoutUrl) {
        window.location.href = res.data.data.checkoutUrl;
        return;
      }
      if (res.data?.data?.success) {
        setTopupSuccess(res.data.data.message || t('wallet.topUpSuccessDefault'));
        setTimeout(() => {
          setShowTopup(false);
          refetchWallet();
          refetchTx();
        }, 4000);
      } else {
        setTopupError(res.data?.data?.message || res.data?.message || t('wallet.topUpFailed'));
      }
    } catch (err: any) {
      setTopupError(err.response?.data?.error?.message || err.message || t('wallet.topUpInitFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawPhone.trim()) {
      setWithdrawError('Enter the mobile money number to receive your funds.');
      return;
    }
    setWithdrawing(true);
    setWithdrawSuccess('');
    setWithdrawError('');
    try {
      const res = await api.post('/wallets/withdraw', {
        amount: withdrawAmount,
        phoneNumber: withdrawPhone,
        provider: withdrawProvider,
      });
      if (res.data?.data?.success) {
        setWithdrawSuccess(res.data.data.message || t('wallet.withdrawSuccessDefault'));
        setTimeout(() => {
          setShowWithdraw(false);
          refetchWallet();
          refetchTx();
        }, 4000);
      } else {
        setWithdrawError(res.data?.data?.message || res.data?.message || t('wallet.withdrawFailed'));
      }
    } catch (err: any) {
      setWithdrawError(err.response?.data?.error?.message || err.message || t('wallet.withdrawInitFailed'));
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <div className="page"><LoadingSpinner /></div>;
  if (error) return <div className="page"><ErrorMessage message={error} /></div>;

  if (!wallet) {
    return (
      <div className="page">
        <PageHeader title={t('wallet.title')} />
        <EmptyState icon="💰" title={t('wallet.title')} sub={t('common.noData')} />
      </div>
    );
  }

  const isMobileMoney = selectedMethod === 'mpesa' || selectedMethod === 'mixx_by_yas' || selectedMethod === 'airtel_money' || selectedMethod === 'halotel';

  return (
    <div className="page">
      <PageTitle title={t('wallet.pageTitle')} />
      <PageHeader
        title={t('wallet.title')}
        action={
          <div className="flex gap-1 wrap">
            {canWithdraw && (
              <button className="btn btn-primary" onClick={() => { setWithdrawAmount(10000); setWithdrawPhone(user?.phoneNumber || ''); setWithdrawProvider('mpesa'); setWithdrawSuccess(''); setWithdrawError(''); setShowWithdraw(true); }}>
                {t('wallet.withdraw')}
              </button>
            )}
            <button className="btn btn-outline" onClick={() => { setBankWithdrawAmount(10000); setBankName(''); setBankAccountNumber(''); setBankAccountName(''); setBankWithdrawDescription(''); setBankWithdrawSuccess(''); setBankWithdrawError(''); setShowBankWithdraw(true); }}>
              🏦 {t('wallet.bankWithdraw')}
            </button>
            <button className="btn btn-outline" onClick={() => { setTransferAmount(10000); setRecipientIdentifier(''); setRecipientType('phone'); setTransferDescription(''); setTransferSuccess(''); setTransferError(''); setShowTransfer(true); }}>
              📤 {t('wallet.sendMoney')}
            </button>
            <button className="btn btn-accent" onClick={() => { setTopupAmount(10000); setPhoneNumber(user?.phoneNumber || ''); setTopupSuccess(''); setTopupError(''); setSelectedMethod('mpesa'); setBankReference(''); setShowTopup(true); }}>
              + {t('wallet.topUp')}
            </button>
          </div>
        }
      />

      <div className="grid grid-2 mb-3">
        <div className="stat-card">
          <div className="stat-label">{t('wallet.balance')}</div>
          <div className="stat-value">{formatCurrency(wallet.balance)}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-label">{t('wallet.pending')}</div>
          <div className="stat-value">{formatCurrency(wallet.pendingBalance)}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">{t('wallet.currencyLabel')}</div>
          <div className="stat-value">{wallet.currency || currency.code}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex justify-between items-center" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--line)' }}>
          <h2 className="section-title" style={{ margin: 0 }}>🧾 {t('wallet.transactions')}</h2>
        </div>
        {txLoading ? (
          <LoadingSpinner />
        ) : txError ? (
          <div style={{ padding: '1rem' }}><ErrorMessage message={txError} /></div>
        ) : !transactions || transactions.length === 0 ? (
          <EmptyState icon="🧾" title={t('wallet.noTransactions')} />
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('wallet.type')}</th>
                  <th>{t('wallet.amountLabel')}</th>
                  <th>{t('wallet.descriptionLabel')}</th>
                  <th>{t('wallet.balanceAfter')}</th>
                  <th>{t('wallet.dateLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span className={`badge ${tx.type === 'CREDIT' ? 'badge-green' : 'badge-red'}`}>{tx.type}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: tx.type === 'CREDIT' ? 'var(--success)' : 'var(--danger)' }}>
                      {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </td>
                    <td style={{ color: 'var(--text)' }}>{tx.description}</td>
                    <td style={{ color: 'var(--text)' }}>{formatCurrency(tx.balanceAfter)}</td>
                    <td style={{ color: 'var(--muted)' }}>{formatDate(tx.createdAt ?? '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showTopup && (
        <div className="modal-overlay" onClick={() => setShowTopup(false)} role="dialog" aria-modal="true" onKeyDown={(e) => { if (e.key === 'Escape') setShowTopup(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-title">💳 {t('wallet.topUpTitle')}</div>

            {topupSuccess && <div className="alert alert-success mb-1">✅ {topupSuccess}</div>}
            {topupError && <div className="alert alert-error mb-1">⚠️ {topupError}</div>}

            <div className="field">
              <label className="field-label">{t('wallet.amount')}</label>
              <input className="input" type="number" min="100" step="100" value={topupAmount} onChange={(e) => setTopupAmount(Number(e.target.value))} placeholder={t('wallet.enterAmount')} />
              <div className="flex gap-1 wrap mt-1">
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    className={`btn btn-sm ${topupAmount === a ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setTopupAmount(a)}
                  >
                    {formatCurrency(a)}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">{t('product.paymentMethod')}</label>
              {groups.map((group) => (
                <div key={group} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: '0.4rem' }}>{group}</div>
                  {paymentMethods.filter((m) => m.group === group).map((m) => (
                    <div
                      key={m.id}
                      onClick={() => { setSelectedMethod(m.id); setTopupError(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem',
                        border: selectedMethod === m.id ? '2px solid var(--brand)' : '2px solid var(--line)',
                        borderRadius: 'var(--radius)', cursor: 'pointer', marginBottom: '0.4rem',
                        background: selectedMethod === m.id ? 'var(--brand-soft)' : '#fff',
                      }}
                    >
                      <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{m.desc}</div>
                      </div>
                      {selectedMethod === m.id && <span style={{ marginLeft: 'auto', color: 'var(--brand)' }}>✓</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {isMobileMoney && (
              <div className="field">
                <label className="field-label">{t('wallet.phoneNumber')}</label>
                <input className="input" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder={t('wallet.phonePlaceholder')} />
                <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.35rem' }}>
                  📲 {t('wallet.mobileMoneyInfo')}
                </div>
              </div>
            )}

            {selectedMethod === 'card' && (
              <div className="field">
                <div className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', background: 'var(--brand-soft)', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
                  🔒 {t('wallet.cardPaymentInfo')}
                </div>
              </div>
            )}

            {selectedMethod === 'bank' && (
              <div className="field">
                <label className="field-label">{t('wallet.bank')}</label>
                <select className="select" value={bankReference} onChange={(e) => setBankReference(e.target.value)}>
                  <option value="">{t('wallet.selectYourBank')}</option>
                  <option value="CRDB">CRDB Bank</option>
                  <option value="NMB">NMB Bank</option>
                  <option value="NBC">NBC Bank</option>
                  <option value="Stanbic">Stanbic Bank</option>
                  <option value="Absa">Absa Bank</option>
                  <option value="Equity">Equity Bank</option>
                </select>
                <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.35rem' }}>
                  🏦 {t('wallet.bankTopUpInfo')}
                </div>
              </div>
            )}

            <div className="flex justify-between gap-2 mt-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowTopup(false)} disabled={submitting}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleTopup} disabled={submitting || !topupAmount || topupAmount < 100 || (isMobileMoney && !phoneNumber)}>
                {submitting ? t('wallet.processing') : t('wallet.topUpAmount', { amount: formatCurrency(topupAmount) })}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="modal-overlay" onClick={() => setShowWithdraw(false)} role="dialog" aria-modal="true" onKeyDown={(e) => { if (e.key === 'Escape') setShowWithdraw(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-title">🏦 {t('wallet.withdrawTitle')}</div>

            {withdrawSuccess && <div className="alert alert-success mb-1">✅ {withdrawSuccess}</div>}
            {withdrawError && <div className="alert alert-error mb-1">⚠️ {withdrawError}</div>}

            <div className="field">
              <label className="field-label">{t('wallet.amount')}</label>
              <input className="input" type="number" min="100" step="100" value={withdrawAmount} onChange={(e) => setWithdrawAmount(Number(e.target.value))} placeholder={t('wallet.enterAmount')} />
              <div className="flex gap-1 wrap mt-1">
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    className={`btn btn-sm ${withdrawAmount === a ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setWithdrawAmount(a)}
                  >
                    {formatCurrency(a)}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">{t('wallet.withdrawTo')}</label>
              <div className="flex gap-1 wrap mb-1">
                {withdrawMethods.map((m) => (
                  <button
                    key={m.id}
                    className={`btn btn-sm ${withdrawProvider === m.id ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setWithdrawProvider(m.id)}
                  >
                    {m.icon} {m.name}
                  </button>
                ))}
              </div>
              <input className="input" type="tel" value={withdrawPhone} onChange={(e) => setWithdrawPhone(e.target.value)} placeholder={t('wallet.phonePlaceholder')} />
              <div className="text-muted" style={{ fontSize: '0.78rem', marginTop: '0.35rem' }}>
                📲 {t('wallet.withdrawInfo')}
              </div>
            </div>

            <div className="flex justify-between gap-2 mt-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowWithdraw(false)} disabled={withdrawing}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={handleWithdraw} disabled={withdrawing || !withdrawAmount || withdrawAmount < 100 || !withdrawPhone}>
                {withdrawing ? t('wallet.processing') : `${t('wallet.withdraw')} ${formatCurrency(withdrawAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransfer && (
        <div className="modal-overlay" onClick={() => setShowTransfer(false)} role="dialog" aria-modal="true" onKeyDown={(e) => { if (e.key === 'Escape') setShowTransfer(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-title">📤 {t('wallet.sendMoneyTitle')}</div>

            {transferSuccess && <div className="alert alert-success mb-1">✅ {transferSuccess}</div>}
            {transferError && <div className="alert alert-error mb-1">⚠️ {transferError}</div>}

            <div className="field">
              <label className="field-label">{t('wallet.amount')}</label>
              <input className="input" type="number" min="100" step="100" value={transferAmount} onChange={(e) => setTransferAmount(Number(e.target.value))} placeholder={t('wallet.enterAmount')} />
              <div className="flex gap-1 wrap mt-1">
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    className={`btn btn-sm ${transferAmount === a ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setTransferAmount(a)}
                  >
                    {formatCurrency(a)}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">{t('wallet.recipientType')}</label>
              <div className="flex gap-1 wrap">
                {[
                  { id: 'phone' as const, icon: '📱', labelKey: 'wallet.phoneNumberLabel' },
                  { id: 'email' as const, icon: '✉️', labelKey: 'wallet.emailAddress' },
                  { id: 'userId' as const, icon: '👤', labelKey: 'wallet.userIdLabel' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    className={`btn btn-sm ${recipientType === opt.id ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => { setRecipientType(opt.id); setRecipientIdentifier(''); }}
                  >
                    {opt.icon} {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">
                {recipientType === 'phone' ? t('wallet.phoneNumberLabel') : recipientType === 'email' ? t('wallet.emailAddress') : t('wallet.userIdLabel')}
              </label>
              <input
                className="input"
                type={recipientType === 'email' ? 'email' : 'text'}
                value={recipientIdentifier}
                onChange={(e) => setRecipientIdentifier(e.target.value)}
                placeholder={
                  recipientType === 'phone' ? 'e.g. +255712345678' :
                  recipientType === 'email' ? 'e.g. recipient@email.com' :
                  'e.g. usr_abc123'
                }
              />
            </div>

            <div className="field">
              <label className="field-label">{t('wallet.descriptionOptional')}</label>
              <input className="input" type="text" value={transferDescription} onChange={(e) => setTransferDescription(e.target.value)} placeholder={t('wallet.descPlaceholder')} />
            </div>

            <div className="flex justify-between gap-2 mt-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowTransfer(false)} disabled={transferring}>{t('common.cancel')}</button>
              <button
                className="btn btn-primary"
                disabled={transferring || !transferAmount || transferAmount < 100 || !recipientIdentifier}
                onClick={async () => {
                  setTransferring(true);
                  setTransferSuccess('');
                  setTransferError('');
                  try {
                    const res = await api.post('/wallets/transfer', {
                      amount: transferAmount,
                      recipientIdentifier,
                      recipientType,
                      description: transferDescription || undefined,
                    });
                    if (res.data?.data?.success) {
                      setTransferSuccess(res.data.data.message || t('wallet.transferSuccessDefault'));
                      setTimeout(() => {
                        setShowTransfer(false);
                        refetchWallet();
                        refetchTx();
                      }, 3000);
                    } else {
                      setTransferError(res.data?.data?.message || res.data?.message || t('wallet.transferFailed'));
                    }
                  } catch (err: any) {
                    setTransferError(err.response?.data?.error?.message || err.message || t('wallet.transferInitFailed'));
                  } finally {
                    setTransferring(false);
                  }
                }}
              >
                {transferring ? t('wallet.sending') : t('wallet.sendAmount', { amount: formatCurrency(transferAmount) })}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBankWithdraw && (
        <div className="modal-overlay" onClick={() => setShowBankWithdraw(false)} role="dialog" aria-modal="true" onKeyDown={(e) => { if (e.key === 'Escape') setShowBankWithdraw(false); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-title">🏦 {t('wallet.withdrawToBank')}</div>

            {bankWithdrawSuccess && <div className="alert alert-success mb-1">✅ {bankWithdrawSuccess}</div>}
            {bankWithdrawError && <div className="alert alert-error mb-1">⚠️ {bankWithdrawError}</div>}

            <div className="field">
              <label className="field-label">{t('wallet.amount')}</label>
              <input className="input" type="number" min="1000" step="100" value={bankWithdrawAmount} onChange={(e) => setBankWithdrawAmount(Number(e.target.value))} placeholder={t('wallet.minimumAmount')} />
              <div className="flex gap-1 wrap mt-1">
                {[10000, 50000, 100000, 500000].map((a) => (
                  <button
                    key={a}
                    className={`btn btn-sm ${bankWithdrawAmount === a ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setBankWithdrawAmount(a)}
                  >
                    {formatCurrency(a)}
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">{t('wallet.bank')}</label>
              <select className="select" value={bankName} onChange={(e) => setBankName(e.target.value)}>
                <option value="">{t('wallet.selectBankPlaceholder')}</option>
                <option value="CRDB Bank">CRDB Bank</option>
                <option value="NMB Bank">NMB Bank</option>
                <option value="NBC Bank">NBC Bank</option>
                <option value="TIB Development Bank">TIB Development Bank</option>
                <option value="Stanbic Bank">Stanbic Bank</option>
                <option value="Absa Bank">Absa Bank</option>
                <option value="Equity Bank">Equity Bank</option>
                <option value="Azania Bank">Azania Bank</option>
                <option value="DCB Commercial Bank">DCB Commercial Bank</option>
                <option value="Exim Bank">Exim Bank</option>
                <option value="KCB Bank">KCB Bank</option>
                <option value="I&M Bank">I&M Bank</option>
              </select>
            </div>

            <div className="field">
              <label className="field-label">{t('wallet.bankAccountNumber')}</label>
              <input className="input" type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="e.g. 0150123456789" />
            </div>

            <div className="field">
              <label className="field-label">{t('wallet.accountHolderName')}</label>
              <input className="input" type="text" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="e.g. John Doe" />
            </div>

            <div className="field">
              <label className="field-label">{t('wallet.descriptionOptional')}</label>
              <input className="input" type="text" value={bankWithdrawDescription} onChange={(e) => setBankWithdrawDescription(e.target.value)} placeholder="e.g. Monthly savings" />
            </div>

            <div className="flex justify-between gap-2 mt-2" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowBankWithdraw(false)} disabled={bankWithdrawing}>{t('common.cancel')}</button>
              <button
                className="btn btn-primary"
                disabled={bankWithdrawing || !bankWithdrawAmount || bankWithdrawAmount < 1000 || !bankName || !bankAccountNumber || !bankAccountName}
                onClick={async () => {
                  setBankWithdrawing(true);
                  setBankWithdrawSuccess('');
                  setBankWithdrawError('');
                  try {
                    const res = await api.post('/wallets/withdraw-bank', {
                      amount: bankWithdrawAmount,
                      bankName,
                      bankAccountNumber,
                      bankAccountName,
                      description: bankWithdrawDescription || undefined,
                    });
                    if (res.data?.data?.success) {
                      setBankWithdrawSuccess(res.data.data.message || t('wallet.bankWithdrawSuccessDefault'));
                      setTimeout(() => {
                        setShowBankWithdraw(false);
                        refetchWallet();
                        refetchTx();
                      }, 4000);
                    } else {
                      setBankWithdrawError(res.data?.data?.message || res.data?.message || t('wallet.bankWithdrawFailed'));
                    }
                  } catch (err: any) {
                    setBankWithdrawError(err.response?.data?.error?.message || err.message || t('wallet.bankWithdrawInitFailed'));
                  } finally {
                    setBankWithdrawing(false);
                  }
                }}
              >
                {bankWithdrawing ? t('wallet.processing') : t('wallet.withdrawToBankAmount', { amount: formatCurrency(bankWithdrawAmount) })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
