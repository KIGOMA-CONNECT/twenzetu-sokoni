import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { EmptyState } from '../../components/ui';
import api from '../../api/client';

interface LoanProduct {
  id: string;
  code: string;
  name: string;
  description?: string;
  borrowerType: string;
  loanType: string;
  minAmount: number;
  maxAmount: number;
  minTermMonths: number;
  maxTermMonths: number;
  annualInterestRate: number;
  processingFeeRate: number;
  insuranceRate: number;
  liquidationAmount: number;
  requiredAttachments: Array<{ type: string; label: string; required: boolean }>;
  isActive: boolean;
}

interface Loan {
  id: string;
  borrowerType: string;
  principal: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  remainingBalance: number;
  status: string;
  dueDate?: string;
  createdAt: string;
  applicationNumber?: string;
  productId?: string;
  mobileNumber?: string;
  netAmount?: number;
  interestAmount?: number;
  insuranceAmount?: number;
  processingFeeAmount?: number;
  liquidationAmount?: number;
  totalAmountToPay?: number;
  deductibleAmount?: number;
  fspName?: string;
  fspCode?: string;
  branchName?: string;
  accountNumber?: string;
  repaymentCode?: string;
  workflowState?: string;
  rejectionReason?: string;
}

interface LoanDetail {
  loan: Loan;
  product?: LoanProduct | null;
  workflow: Array<{ id: string; step: string; actorRole: string; actorName?: string; note?: string; createdAt: string }>;
  documents: Array<{ id: string; documentType: string; documentLabel: string; fileUrl: string; fileName?: string }>;
  repayments: Array<{ id: string; amount: number; principalPortion: number; interestPortion: number; remainingBalance: number; paidAt: string }>;
  schedule: Array<{ month: number; payment: number; principal: number; interest: number; balance: number; dueDate: string }>;
}

const WORKFLOW_STEPS = ['SUBMITTED_TO_FSP', 'FSP_ACCEPTED', 'SUBMITTED_TO_MARKETPLACE', 'MARKETPLACE_APPROVED', 'FSP_DISBURSED'];

const STEP_LABELS: Record<string, string> = {
  SUBMITTED_TO_FSP: 'Imewasilishwa kwa FSP',
  FSP_ACCEPTED: 'FSP imekubali',
  SUBMITTED_TO_MARKETPLACE: 'Imewasilishwa kwa AfriMarket',
  MARKETPLACE_APPROVED: 'AfriMarket imethibitisha',
  FSP_DISBURSED: 'FSP imetoa fedha',
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED_TO_FSP: 'Submitted to FSP',
  FSP_ACCEPTED: 'Accepted by FSP',
  SUBMITTED_TO_MARKETPLACE: 'Submitted to AfriMarket',
  MARKETPLACE_APPROVED: 'AfriMarket Approved',
  FSP_DISBURSED: 'FSP Disbursed',
  pending: 'Pending',
  approved: 'Approved',
  active: 'Active',
  paid: 'Paid',
  rejected: 'Rejected',
};

const formatDate = (iso?: string) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

type LoansView = 'catalog' | 'applied' | 'existing';

export default function LoanManagement() {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const [view, setView] = useState<LoansView>('catalog');
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const { data: myLoans, loading, error, refetch } = useApi<Loan[]>('/fintech/loans/me');

  const isVendor = user?.role === 'vendor';
  const isDriver = user?.role === 'driver';
  const borrowerType = isVendor ? 'vendor' : isDriver ? 'driver' : 'customer';

  const applied = (myLoans ?? []).filter((l) => ['pending', 'approved', 'rejected'].includes(l.status));
  const existing = (myLoans ?? []).filter((l) => ['active', 'paid'].includes(l.status));

  const views: Array<{ id: LoansView; label: string; show: boolean }> = [
    { id: 'catalog', label: '📚 Loan Products', show: true },
    { id: 'applied', label: `📝 Applied (${applied.length})`, show: true },
    { id: 'existing', label: `✅ Existing (${existing.length})`, show: true },
  ];

  if (selectedLoanId) {
    return (
      <LoanDetailView
        loanId={selectedLoanId}
        onBack={() => setSelectedLoanId(null)}
        onRefresh={refetch}
      />
    );
  }

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 className="section-title">Loan Management</h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            {borrowerType === 'vendor' ? 'Mikopo ya Biashara' : borrowerType === 'driver' ? 'Mikopo ya Dereva' : 'Mikopo ya Kibinafsi'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {views.map((v) => (
            <button
              key={v.id}
              className={`tab-btn ${view === v.id ? 'active' : ''}`}
              onClick={() => setView(v.id)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius)',
                border: view === v.id ? '2px solid var(--brand)' : '1px solid var(--line)',
                background: view === v.id ? 'var(--brand-soft)' : 'transparent',
                color: view === v.id ? 'var(--brand)' : 'var(--muted)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'catalog' && <CatalogSection borrowerType={borrowerType} onLoanCreated={refetch} />}

      {view === 'applied' && (
        <div>
          <h3 className="section-title">Applied Loans</h3>
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : applied.length === 0 ? (
            <EmptyState icon="📝" title="Hakuna maombi ya mkopo" sub="Chagua loan product kutoka katalogi na uombe" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Application No</th>
                    <th>FSP</th>
                    <th>Requested</th>
                    <th>Total to Pay</th>
                    <th>Deduction/mo</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {applied.map((loan) => (
                    <tr key={loan.id}>
                      <td><strong style={{ color: 'var(--brand)' }}>{loan.applicationNumber ?? loan.id.slice(0, 8)}</strong></td>
                      <td>{loan.fspName ?? '-'}</td>
                      <td>{formatCurrency(loan.principal)}</td>
                      <td>{loan.totalAmountToPay != null ? formatCurrency(loan.totalAmountToPay) : '-'}</td>
                      <td>{loan.deductibleAmount != null ? formatCurrency(loan.deductibleAmount) : '-'}</td>
                      <td><span className={`badge ${loan.status === 'rejected' ? 'badge-red' : 'badge-amber'}`}>{STATUS_LABEL[loan.status] ?? loan.status}</span></td>
                      <td>{formatDate(loan.createdAt)}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => setSelectedLoanId(loan.id)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === 'existing' && (
        <div>
          <h3 className="section-title">Existing Loans</h3>
          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorMessage message={error} />
          ) : existing.length === 0 ? (
            <EmptyState icon="✅" title="Hakuna mkopo hai" sub="Mikopo uliyo nayo itaonekana hapa" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Application No</th>
                    <th>Deduction Code</th>
                    <th>Collector</th>
                    <th>Principal</th>
                    <th>Amount/Month</th>
                    <th>Balance</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {existing.map((loan) => (
                    <tr key={loan.id}>
                      <td><strong style={{ color: 'var(--brand)' }}>{loan.applicationNumber ?? loan.id.slice(0, 8)}</strong></td>
                       <td>{loan.repaymentCode ?? '-'}</td>
                      <td>{loan.fspName ?? '-'}</td>
                      <td>{formatCurrency(loan.principal)}</td>
                      <td>{formatCurrency(loan.deductibleAmount ?? loan.monthlyPayment)}</td>
                      <td><strong>{formatCurrency(loan.remainingBalance)}</strong></td>
                      <td><span className={`badge ${loan.status === 'active' ? 'badge-green' : 'badge-blue'}`}>{STATUS_LABEL[loan.status] ?? loan.status}</span></td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => setSelectedLoanId(loan.id)}>Manage</button>
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

// ---- Catalog + Apply --------------------------------------------------------

function CatalogSection({ borrowerType, onLoanCreated }: { borrowerType: string; onLoanCreated: () => void }) {
  const { data: products, loading, error } = useApi<LoanProduct[]>('/fintech/loans/products');
  const { formatCurrency } = useCurrency();
  const [selected, setSelected] = useState<LoanProduct | null>(null);

  const eligible = (products ?? []).filter((p) => p.borrowerType === borrowerType && p.isActive);

  if (selected) {
    return (
      <ApplyForm
        product={selected}
        borrowerType={borrowerType}
        onCancel={() => setSelected(null)}
        onSubmitted={() => { setSelected(null); onLoanCreated(); }}
      />
    );
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (eligible.length === 0) return <EmptyState icon="📚" title="No loan products available" sub="Check back soon" />;

  return (
    <div>
      <h3 className="section-title">Loan Product Catalog</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {eligible.map((p) => (
          <div key={p.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{p.name}</div>
              <span className="badge badge-blue">{p.code}</span>
            </div>
            {p.description && <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{p.description}</div>}
            <div style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>
              {formatCurrency(p.minAmount)} – {formatCurrency(p.maxAmount)}
              <span style={{ color: 'var(--muted)' }}> · {p.minTermMonths}–{p.maxTermMonths} mo</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Interest {(p.annualInterestRate * 100).toFixed(0)}% · Fee {(p.processingFeeRate * 100).toFixed(1)}%
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {(p.requiredAttachments ?? []).map((a) => (
                <span key={a.type} className={`badge ${a.required ? 'badge-amber' : ''}`} style={{ fontSize: '0.7rem' }}>
                  {a.label} {a.required ? '*' : ''}
                </span>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => setSelected(p)}>Apply</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplyForm({ product, borrowerType, onCancel, onSubmitted }: {
  product: LoanProduct;
  borrowerType: string;
  onCancel: () => void;
  onSubmitted: () => void;
}) {
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const [principal, setPrincipal] = useState(product.minAmount);
  const [term, setTerm] = useState(product.minTermMonths);
  const [purpose, setPurpose] = useState('');
  const [files, setFiles] = useState<Record<string, { fileUrl: string; fileName: string; mimeType: string }>>({});
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [walletInfo, setWalletInfo] = useState<{ walletBalance: number; maxLoanAmount: number } | null>(null);

  useEffect(() => {
    api.get('/fintech/loans/wallet-info')
      .then((res) => setWalletInfo(res.data?.data ?? res.data))
      .catch(() => {});
  }, []);

  const required = (product.requiredAttachments ?? []).filter((a) => a.required);
  const optional = (product.requiredAttachments ?? []).filter((a) => !a.required);
  const allAttachments = [...required, ...optional];
  const missing = required.filter((a) => !files[a.type]);

  const monthlyRate = product.annualInterestRate / 12;
  const breakdown = useMemo(() => {
    const monthly =
      Math.round(((principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1)) * 100) / 100;
    const interest = Math.round((monthly * term - principal) * 100) / 100;
    const processing = Math.round((principal * product.processingFeeRate) * 100) / 100;
    const insurance = Math.round((principal * product.insuranceRate) * 100) / 100;
    const liquidation = product.liquidationAmount;
    const total = Math.round((principal + interest + processing + insurance + liquidation) * 100) / 100;
    const deductible = Math.round((total / term) * 100) / 100;
    return { monthly, interest, processing, insurance, liquidation, total, deductible };
  }, [principal, term, product, monthlyRate]);

  const canSubmit = busy || principal < product.minAmount || principal > product.maxAmount || term < product.minTermMonths || term > product.maxTermMonths || missing.length > 0;

  const handleUpload = async (type: string, file: File) => {
    setUploadingType(type);
    setErr('');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/uploads/loan-document', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const payload = res.data?.data ?? res.data;
      setFiles((prev) => ({ ...prev, [type]: { fileUrl: payload.url, fileName: file.name, mimeType: file.type } }));
    } catch (e: any) {
      setErr(e.response?.data?.message || e.response?.data?.error?.message || e.message || 'Upload failed');
    } finally {
      setUploadingType(null);
    }
  };

  const handleSubmit = async () => {
    if (missing.length > 0) { setErr('Upload all required attachments first'); return; }
    setBusy(true); setMsg(''); setErr('');
    try {
      await api.post('/fintech/loans', {
        principal,
        termMonths: term,
        productId: product.id,
        mobileNumber: user?.phoneNumber,
        purpose: purpose || undefined,
        documents: allAttachments.filter((a) => files[a.type]).map((a) => ({
          type: a.type,
          fileUrl: files[a.type].fileUrl,
          fileName: files[a.type].fileName,
          mimeType: files[a.type].mimeType,
        })),
      });
      setMsg('Loan application submitted. Follow the progress in "Applied Loans".');
      setTimeout(onSubmitted, 1200);
    } catch (e: any) {
      setErr(e.response?.data?.message || e.response?.data?.error?.message || e.message || 'Failed to apply');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 className="section-title" style={{ marginBottom: 0 }}>{product.name}</h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{product.code} · {borrowerType}</div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onCancel} disabled={busy}>← Back to catalog</button>
      </div>

      {walletInfo && walletInfo.maxLoanAmount > 0 && (
        <div className="card" style={{ padding: '1rem', background: 'var(--brand-soft)', border: '1px solid var(--brand)', borderRadius: 'var(--radius)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>💰 Wallet Balance</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--ink)' }}>{formatCurrency(walletInfo.walletBalance)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Max Loan (3x)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand)' }}>{formatCurrency(walletInfo.maxLoanAmount)}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
            Unaweza kukopa hadi {formatCurrency(walletInfo.maxLoanAmount)} TZS kulingana na salio la wallet yako. Weka pesa kwenye wallet yako kuongeza kikomo.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label className="field-label">Amount ({formatCurrency(product.minAmount)} – {formatCurrency(product.maxAmount)})</label>
          <input type="number" className="input" value={principal} min={product.minAmount} max={product.maxAmount} onChange={(e) => setPrincipal(Number(e.target.value))} />
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {[product.minAmount, Math.round((product.minAmount + product.maxAmount) / 2), product.maxAmount].map((a) => (
              <button key={a} className="btn btn-outline btn-sm" onClick={() => setPrincipal(a)}>{formatCurrency(a)}</button>
            ))}
          </div>
          {walletInfo && principal > walletInfo.maxLoanAmount && walletInfo.maxLoanAmount > 0 && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Kiwango kilichochaguliwa kimezidi kikomo chako cha mkopo ({formatCurrency(walletInfo.maxLoanAmount)}). Weka pesa kwenye wallet yako kuongeza kikomo.
            </div>
          )}
          <label className="field-label" style={{ marginTop: '0.5rem' }}>Tenure ({product.minTermMonths}–{product.maxTermMonths} months)</label>
          <select className="input" value={term} onChange={(e) => setTerm(Number(e.target.value))}>
            {Array.from({ length: product.maxTermMonths - product.minTermMonths + 1 }, (_, i) => product.minTermMonths + i).map((m) => (
              <option key={m} value={m}>{m} months</option>
            ))}
          </select>
          <label className="field-label" style={{ marginTop: '0.5rem' }}>Purpose (optional)</label>
          <input type="text" className="input" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. stock, repairs" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
          <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Cost Breakdown</div>
          <Row label="Net Amount" value={formatCurrency(principal)} />
          <Row label="Interest" value={formatCurrency(breakdown.interest)} />
          <Row label="Insurance" value={formatCurrency(breakdown.insurance)} />
          <Row label="Processing Fee" value={formatCurrency(breakdown.processing)} />
          <Row label="Liquidation Amount" value={formatCurrency(breakdown.liquidation)} />
          <div style={{ borderTop: '1px solid var(--line)', margin: '0.25rem 0' }} />
          <Row label="Total to Pay" value={formatCurrency(breakdown.total)} bold />
          <Row label="Deductible / month" value={formatCurrency(breakdown.deductible)} bold />
          <Row label="Installment / month" value={formatCurrency(breakdown.monthly)} />
        </div>
      </div>

      <div>
        <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Attachments ({missing.length > 0 ? `${missing.length} required remaining` : 'complete ✓'})</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {allAttachments.map((a) => (
            <div key={a.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)', background: 'var(--surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`badge ${a.required ? 'badge-amber' : ''}`}>{a.required ? 'Required' : 'Optional'}</span>
                <span style={{ fontSize: '0.85rem' }}>{a.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {files[a.type] && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>✓ {files[a.type].fileName}</span>
                )}
                <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', marginBottom: 0 }}>
                  {uploadingType === a.type ? 'Uploading…' : files[a.type] ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    style={{ display: 'none' }}
                    disabled={uploadingType !== null}
                    onChange={(e) => { if (e.target.files?.[0]) handleUpload(a.type, e.target.files[0]); }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {msg && <div style={{ color: 'var(--success)', fontSize: '0.9rem' }}>{msg}</div>}
      {err && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{err}</div>}

      <button
        className="btn btn-primary"
        disabled={canSubmit}
        onClick={handleSubmit}
        style={{ alignSelf: 'flex-start' }}
      >
        {missing.length > 0 ? `Upload ${missing.length} required attachment${missing.length > 1 ? 's' : ''} to apply` : 'Submit Loan Application'}
      </button>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{label}</span>
      <span style={{ fontWeight: bold ? 800 : 600, color: bold ? 'var(--brand)' : 'var(--ink)' }}>{value}</span>
    </div>
  );
}

// ---- Detail view -------------------------------------------------------------

function LoanDetailView({ loanId, onBack, onRefresh }: { loanId: string; onBack: () => void; onRefresh: () => void }) {
  const { data, loading, error, refetch } = useApi<LoanDetail>(`/fintech/loans/${loanId}`);
  const { formatCurrency } = useCurrency();
  const [repayAmt, setRepayAmt] = useState<string>('');
  const [topUpAmt, setTopUpAmt] = useState<string>('');
  const [takeover, setTakeover] = useState(false);
  const [takeoverFsp, setTakeoverFsp] = useState('');
  const [takeoverAcct, setTakeoverAcct] = useState('');
  const [takeoverCode, setTakeoverCode] = useState('');
  const [restructure, setRestructure] = useState(false);
  const [restructureTerm, setRestructureTerm] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const loan = data?.loan;
  const product = data?.product ?? null;
  const workflow = data?.workflow ?? [];
  const documents = data?.documents ?? [];
  const schedule = data?.schedule ?? [];

  const active = loan?.status === 'active';

  const run = async (fn: () => Promise<unknown>, successMsg: string) => {
    setBusy(true); setMsg(''); setErr('');
    try {
      await fn();
      setMsg(successMsg);
      refetch(); onRefresh();
    } catch (e: any) {
      setErr(e.response?.data?.message || e.response?.data?.error?.message || e.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!loan) return <ErrorMessage message="Loan not found" />;

  const workflowIndex = WORKFLOW_STEPS.indexOf(loan.workflowState ?? '');

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 className="section-title" style={{ marginBottom: 0 }}>
            {product?.name ?? 'Loan'} <span className="badge badge-blue">{loan.applicationNumber}</span>
          </h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            Applied {formatDate(loan.createdAt)} · Status: <strong>{STATUS_LABEL[loan.status] ?? loan.status}</strong>
            {loan.rejectionReason && <span style={{ color: 'var(--danger)' }}> · {loan.rejectionReason}</span>}
          </div>
        </div>
        <button className="btn btn-outline btn-sm" onClick={onBack}>← Back</button>
      </div>

      {/* 5-step workflow timeline */}
      <div>
        <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Application Workflow</div>
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {WORKFLOW_STEPS.map((step, i) => {
            const reached = workflowIndex >= i;
            const isCurrent = workflowIndex === i;
            return (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.4rem 0.7rem', borderRadius: 'var(--radius)',
                  border: reached ? '2px solid var(--brand)' : '1px solid var(--line)',
                  background: isCurrent ? 'var(--brand-soft)' : reached ? 'rgba(0,0,0,0.03)' : 'transparent',
                  fontSize: '0.8rem', fontWeight: reached ? 700 : 400,
                  color: reached ? 'var(--brand)' : 'var(--muted)',
                }}>
                  <span>{reached ? '✓' : '○'}</span>
                  <span>{STEP_LABELS[step]}</span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && <span style={{ color: 'var(--muted)' }}>→</span>}
              </div>
            );
          })}
        </div>
        {workflow.length > 0 && (
          <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {workflow.map((ev) => (
              <div key={ev.id} style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge">{ev.step}</span>
                <span>{ev.actorRole}</span>
                <span>· {formatDate(ev.createdAt)}</span>
                {ev.note && <span>· {ev.note}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {/* Amounts & FSP */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>Amounts</div>
          <Row label="Requested (Net)" value={formatCurrency(loan.netAmount ?? loan.principal)} />
          <Row label="Interest" value={formatCurrency(loan.interestAmount ?? 0)} />
          <Row label="Insurance" value={formatCurrency(loan.insuranceAmount ?? 0)} />
          <Row label="Processing Fee" value={formatCurrency(loan.processingFeeAmount ?? 0)} />
          <Row label="Liquidation Amount" value={formatCurrency(loan.liquidationAmount ?? 0)} />
          <div style={{ borderTop: '1px solid var(--line)', margin: '0.25rem 0' }} />
          <Row label="Total to Pay" value={formatCurrency(loan.totalAmountToPay ?? loan.principal)} bold />
          <Row label="Deductible / month" value={formatCurrency(loan.deductibleAmount ?? loan.monthlyPayment)} bold />
          <Row label="Tenure" value={`${loan.termMonths} months`} />
          <Row label="Interest Rate" value={`${(loan.interestRate * 100).toFixed(1)}% / yr`} />
        </div>

        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>FSP Details</div>
          <Row label="FSP Name" value={loan.fspName ?? '-'} />
          <Row label="FSP Code" value={loan.fspCode ?? '-'} />
          <Row label="Branch" value={loan.branchName ?? '-'} />
          <Row label="Account Number" value={loan.accountNumber ?? '-'} />
          <Row label="Repayment Code" value={loan.repaymentCode ?? '-'} />
          {loan.mobileNumber && <Row label="Mobile" value={loan.mobileNumber} />}
          {loan.purpose && <Row label="Purpose" value={loan.purpose} />}
        </div>
      </div>

      {/* Actions */}
      {active && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontWeight: 800 }}>Actions</div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label className="field-label">Repay (TZS)</label>
              <input type="number" className="input" value={repayAmt} min={1} onChange={(e) => setRepayAmt(e.target.value)} style={{ width: 140 }} />
            </div>
            <button className="btn btn-primary" disabled={busy || !repayAmt} onClick={() => run(() => api.post(`/fintech/loans/${loan.id}/repay`, { amount: Number(repayAmt) }), 'Repayment recorded')}>Repay</button>

            <div>
              <label className="field-label">Top-up (TZS)</label>
              <input type="number" className="input" value={topUpAmt} min={1} onChange={(e) => setTopUpAmt(e.target.value)} style={{ width: 140 }} />
            </div>
            <button className="btn btn-outline" disabled={busy || !topUpAmt} onClick={() => run(() => api.post(`/fintech/loans/${loan.id}/topup`, { extraAmount: Number(topUpAmt) }), 'Top-up applied')}>Top-up</button>

            <button className="btn btn-outline" disabled={busy} onClick={() => setRestructure((v) => !v)}>Restructure</button>
            <button className="btn btn-outline" disabled={busy} onClick={() => setTakeover((v) => !v)}>Takeover</button>
          </div>

          {restructure && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div>
                <label className="field-label">New Term (months)</label>
                <input type="number" className="input" value={restructureTerm} min={1} onChange={(e) => setRestructureTerm(e.target.value)} style={{ width: 140 }} />
              </div>
              <button className="btn btn-primary" disabled={busy || !restructureTerm} onClick={() => run(() => api.post(`/fintech/loans/${loan.id}/restructure`, { newTermMonths: Number(restructureTerm) }), 'Loan restructured')}>Confirm Restructure</button>
            </div>
          )}

          {takeover && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div><label className="field-label">New FSP Name</label><input className="input" value={takeoverFsp} onChange={(e) => setTakeoverFsp(e.target.value)} style={{ width: 180 }} /></div>
              <div><label className="field-label">Account Number</label><input className="input" value={takeoverAcct} onChange={(e) => setTakeoverAcct(e.target.value)} style={{ width: 160 }} /></div>
              <div><label className="field-label">Deduction Code</label><input className="input" value={takeoverCode} onChange={(e) => setTakeoverCode(e.target.value)} style={{ width: 140 }} /></div>
              <button className="btn btn-primary" disabled={busy || !takeoverFsp || !takeoverAcct || !takeoverCode} onClick={() => run(() => api.post(`/fintech/loans/${loan.id}/takeover`, { fspName: takeoverFsp, accountNumber: takeoverAcct, repaymentCode: takeoverCode }), 'Loan taken over')}>Confirm Takeover</button>
            </div>
          )}
        </div>
      )}

      {msg && <div style={{ color: 'var(--success)', fontSize: '0.9rem' }}>{msg}</div>}
      {err && <div style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{err}</div>}

      {/* Documents */}
      <div>
        <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Attachments</div>
        {documents.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>No attachments uploaded.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {documents.map((d) => (
              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
                <div>
                  <span className="badge">{d.documentType}</span> <span style={{ fontSize: '0.85rem' }}>{d.documentLabel}</span>
                </div>
                <a href={d.fileUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">View</a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Amortization schedule */}
      <div>
        <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Amortization Schedule ({loan.termMonths} months)</div>
        {schedule.length === 0 ? (
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Schedule will appear once the loan is disbursed.</div>
        ) : (
          <div className="table-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Payment</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Balance</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row) => (
                  <tr key={row.month}>
                    <td>{row.month}</td>
                    <td>{formatCurrency(row.payment)}</td>
                    <td>{formatCurrency(row.principal)}</td>
                    <td>{formatCurrency(row.interest)}</td>
                    <td><strong>{formatCurrency(row.balance)}</strong></td>
                    <td>{formatDate(row.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Repayments */}
      {data?.repayments && data.repayments.length > 0 && (
        <div>
          <div style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Repayment History</div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Amount</th><th>Principal</th><th>Interest</th><th>Balance</th></tr>
              </thead>
              <tbody>
                {data.repayments.map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.paidAt)}</td>
                    <td>{formatCurrency(r.amount)}</td>
                    <td>{formatCurrency(r.principalPortion)}</td>
                    <td>{formatCurrency(r.interestPortion)}</td>
                    <td>{formatCurrency(r.remainingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}