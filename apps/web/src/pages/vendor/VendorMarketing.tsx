import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import AiAssistant from '../../components/AiAssistant';
import type { Advert, Category, CampaignAnalytics, MarketingCampaign } from '../../types';

interface VariantForm {
  label: string;
  message: string;
}

interface CampaignForm {
  name: string;
  message: string;
  scheduledAt: string;
  minOrders: string;
  lastOrderWithinDays: string;
  testEnabled: boolean;
  variants: VariantForm[];
}

interface AdvertForm {
  title: string;
  body: string;
  emoji: string;
  ctaLabel: string;
  ctaUrl: string;
  sortOrder: string;
}

interface CategoryForm {
  tagline: string;
  benefits: string;
  emoji: string;
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  subtitle: { color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' },
  section: { marginTop: '2rem' },
  sectionTitle: { fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', margin: '0 0 0.25rem' },
  sectionSub: { color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.75rem' },
  card: {
    background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.7rem 1rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', borderBottom: '1px solid var(--line)', fontWeight: 600, background: 'var(--bg)' },
  td: { padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--ink-soft)', borderBottom: '1px solid var(--line)', verticalAlign: 'top' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '2rem' },
  addButton: { background: '#1e40af', color: '#fff', border: 'none', padding: '0.6rem 1.1rem', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' },
  launchBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: 'none', background: 'var(--success)', color: '#fff', cursor: 'pointer' },
  editBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'var(--surface)', cursor: 'pointer', color: 'var(--text)' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '480px', maxWidth: '92vw', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  modalTitle: { fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' },
  field: { marginBottom: '0.85rem' },
  label: { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginBottom: '0.3rem' },
  input: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  textarea: { width: '100%', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.875rem', boxSizing: 'border-box', fontFamily: 'inherit', minHeight: '90px', resize: 'vertical' },
  hint: { fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' },
  cancelBtn: { padding: '0.5rem 1rem', border: '1px solid #cbd5e1', background: 'var(--surface)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text)' },
  saveBtn: { padding: '0.5rem 1rem', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 },
  saveBtnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  smallError: { color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' },
  notice: { background: 'var(--info-soft)', border: '1px solid #bfdbfe', color: '#1e40af', padding: '0.9rem 1.1rem', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '1rem' },
  banner: { background: 'linear-gradient(135deg, #1e40af, #4f46e5)', color: '#fff', borderRadius: '12px', padding: '1.2rem 1.4rem', marginBottom: '1.5rem' },
  bannerTitle: { fontSize: '1.2rem', fontWeight: 700, margin: 0 },
  bannerSub: { fontSize: '0.85rem', opacity: 0.9, margin: '0.25rem 0 0' },
  abToggleRow: { display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.85rem 0' },
  abCheckbox: { width: '16px', height: '16px', cursor: 'pointer' },
  abLabel: { fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' },
  variantBox: { border: '1px solid var(--line)', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.6rem', background: 'var(--bg)' },
  variantHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' },
  variantTitle: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--ink)' },
  removeVariantBtn: { border: 'none', background: 'transparent', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 },
  addVariantBtn: { border: '1px dashed #94a3b8', background: 'transparent', color: '#1e40af', padding: '0.45rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, width: '100%' },
  analyticsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '1rem' },
  statCard: { background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: '8px', padding: '0.7rem 0.9rem' },
  statValue: { fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' },
  statLabel: { fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', marginTop: '0.15rem' },
  winnerBadge: { display: 'inline-block', background: 'var(--success-soft)', color: '#166534', fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '999px', marginLeft: '0.4rem' },
  abBadge: { display: 'inline-block', background: '#ede9fe', color: '#5b21b6', fontSize: '0.68rem', fontWeight: 700, padding: '0.12rem 0.45rem', borderRadius: '999px', marginLeft: '0.35rem' },
  analyticsBtn: { padding: '0.35rem 0.7rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'var(--surface)', cursor: 'pointer', color: 'var(--text)', marginRight: '0.35rem' },
};

export default function VendorMarketing() {
  const { t } = useTranslation();
  const m = 'vendor.marketingPage.';
  const { data: ads, loading: adsLoading, error: adsError, refetch: refetchAds } = useApi<Advert[]>('/ads');
  const { data: campaigns, loading: campaignsLoading, error: campaignsError, refetch: refetchCampaigns } = useApi<MarketingCampaign[]>('/marketing/campaigns');
  const { data: categories, loading: catsLoading, error: catsError, refetch: refetchCats } = useApi<Category[]>('/categories');

  const [advertModal, setAdvertModal] = useState(false);
  const [campaignModal, setCampaignModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState<Category | null>(null);
  const [analyticsFor, setAnalyticsFor] = useState<CampaignAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);

  const [advertForm, setAdvertForm] = useState<AdvertForm>({ title: '', body: '', emoji: '', ctaLabel: '', ctaUrl: '', sortOrder: '' });
  const [campaignForm, setCampaignForm] = useState<CampaignForm>({ name: '', message: '', scheduledAt: '', minOrders: '', lastOrderWithinDays: '', testEnabled: false, variants: [] });
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({ tagline: '', benefits: '', emoji: '' });

  const marketingContext = useMemo(() => {
    const facts: Record<string, unknown> = {
      campaignCount: campaigns?.length ?? 0,
      advertCount: ads?.length ?? 0,
      categoryCount: categories?.length ?? 0,
      draftCampaigns: campaigns?.filter((c) => c.status === 'DRAFT').length ?? 0,
      activeCampaigns: campaigns?.filter((c) => c.status === 'ACTIVE').length ?? 0,
      avgSent: campaigns?.length ? Math.round((campaigns.reduce((s, c) => s + (c.sentCount ?? 0), 0) / campaigns.length) * 10) / 10 : 0,
    };
    const rows = [
      ...(campaigns ?? []).slice(0, 15).map((c) => ({ kind: 'campaign', name: c.name, status: c.status, sentCount: c.sentCount, failedCount: c.failedCount, message: c.message.slice(0, 80) })),
      ...(ads ?? []).slice(0, 10).map((a) => ({ kind: 'advert', title: a.title, sortOrder: a.sortOrder, isActive: a.isActive })),
    ];
    return { summary: `Marketing — ${campaigns?.length ?? 0} campaigns, ${ads?.length ?? 0} adverts`, facts, rows, constraints: ['Ground in campaign/advert rows.'] };
  }, [campaigns, ads, categories]);

  const openAdvert = () => {
    setAdvertForm({ title: '', body: '', emoji: '', ctaLabel: '', ctaUrl: '', sortOrder: '' });
    setFormError(null);
    setAdvertModal(true);
  };

  const submitAdvert = async () => {
    const title = advertForm.title.trim();
    if (!title) { setFormError(t(m + 'titleRequired')); return; }
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/ads', {
        title,
        body: advertForm.body.trim() || undefined,
        emoji: advertForm.emoji.trim() || undefined,
        ctaLabel: advertForm.ctaLabel.trim() || undefined,
        ctaUrl: advertForm.ctaUrl.trim() || undefined,
        sortOrder: advertForm.sortOrder ? Number(advertForm.sortOrder) : undefined,
      });
      setAdvertModal(false);
      await refetchAds();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || t(m + 'failedCreateAdvert'));
    } finally {
      setSaving(false);
    }
  };

  const openCampaign = () => {
    setCampaignForm({ name: '', message: '', scheduledAt: '', minOrders: '', lastOrderWithinDays: '', testEnabled: false, variants: [] });
    setFormError(null);
    setCampaignModal(true);
  };

  const submitCampaign = async () => {
    const name = campaignForm.name.trim();
    const message = campaignForm.message.trim();
    if (!name || !message) { setFormError(t(m + 'campaignRequired')); return; }
    const variants = campaignForm.variants
      .map((v) => ({ label: v.label.trim() || undefined, message: v.message.trim() }))
      .filter((v) => v.message);
    if (campaignForm.testEnabled && variants.length < 2) {
      setFormError(t(m + 'abNeedsTwo'));
      return;
    }
    const minOrders = campaignForm.minOrders ? Math.floor(Number(campaignForm.minOrders)) : 0;
    const lastOrderWithinDays = campaignForm.lastOrderWithinDays ? Math.floor(Number(campaignForm.lastOrderWithinDays)) : 0;
    setSaving(true);
    setFormError(null);
    try {
      await api.post('/marketing/campaigns', {
        name,
        message,
        channel: 'sms',
        scheduledAt: campaignForm.scheduledAt ? new Date(campaignForm.scheduledAt).toISOString() : undefined,
        segment: minOrders > 0 || lastOrderWithinDays > 0
          ? { minOrders: minOrders > 0 ? minOrders : undefined, lastOrderWithinDays: lastOrderWithinDays > 0 ? lastOrderWithinDays : undefined }
          : undefined,
        testEnabled: campaignForm.testEnabled || undefined,
        variants: campaignForm.testEnabled ? variants : undefined,
      });
      setCampaignModal(false);
      await refetchCampaigns();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || t(m + 'failedCreateCampaign'));
    } finally {
      setSaving(false);
    }
  };

  const launchCampaign = async (c: MarketingCampaign) => {
    if (!window.confirm(`${t(m + 'launchConfirmPrefix')}${c.message.substring(0, 60)}…${t(m + 'launchConfirmSuffix')}`)) return;
    try {
      setLaunchError(null);
      await api.post(`/marketing/campaigns/${c.id}/launch`);
      await refetchCampaigns();
    } catch (err: any) {
      setLaunchError(err.response?.data?.message || err.message || t(m + 'failedLaunchCampaign'));
    }
  };

  const openAnalytics = async (c: MarketingCampaign) => {
    setAnalyticsLoading(true);
    setAnalyticsFor(null);
    try {
      const res = await api.get<CampaignAnalytics>(`/marketing/campaigns/${c.id}/analytics`);
      setAnalyticsFor(res.data);
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || t(m + 'failedLoadAnalytics'));
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const openCategory = (cat: Category) => {
    setCategoryForm({
      tagline: cat.tagline || '',
      benefits: (cat.benefits || []).join(', '),
      emoji: cat.emoji || '',
    });
    setFormError(null);
    setCategoryModal(cat);
  };

  const submitCategory = async () => {
    if (!categoryModal) return;
    setSaving(true);
    setFormError(null);
    try {
      await api.patch(`/categories/${categoryModal.id}/marketing`, {
        tagline: categoryForm.tagline.trim() || undefined,
        benefits: categoryForm.benefits.split(',').map((b) => b.trim()).filter(Boolean),
        emoji: categoryForm.emoji.trim() || undefined,
      });
      setCategoryModal(null);
      await refetchCats();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || t(m + 'failedUpdateCategory'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>{t(m + 'title')}</h1>
          <div style={styles.subtitle}>{t(m + 'subtitle')}</div>
        </div>
      </div>

      <div style={styles.banner}>
        <p style={styles.bannerTitle}>📣 {t(m + 'bannerTitle')}</p>
        <p style={styles.bannerSub}>{t(m + 'bannerSub')}</p>
      </div>

      {/* Campaigns */}
      <div style={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={styles.sectionTitle}>{t(m + 'smsCampaignsTitle')}</div>
            <div style={styles.sectionSub}>{t(m + 'smsCampaignsSub')}</div>
          </div>
          <button style={styles.addButton} onClick={openCampaign}>{t(m + 'newCampaign')}</button>
        </div>
        <div style={styles.card}>
          {launchError && <div style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '0.75rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>{launchError}</div>}
          {campaignsLoading ? <LoadingSpinner /> : campaignsError ? (
            <div style={{ padding: '1rem' }}><ErrorMessage message={campaignsError} /></div>
          ) : !campaigns || campaigns.length === 0 ? (
            <div style={styles.empty}>{t(m + 'noCampaigns')}</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t(m + 'name')}</th>
                  <th style={styles.th}>{t(m + 'message')}</th>
                  <th style={styles.th}>{t(m + 'status')}</th>
                  <th style={styles.th}>{t(m + 'scheduleLabel')}</th>
                  <th style={styles.th}>{t(m + 'audience')}</th>
                  <th style={styles.th}>{t(m + 'sent')}</th>
                  <th style={styles.th}>{t(m + 'delivered')}</th>
                  <th style={styles.th}>{t(m + 'failed')}</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>{t(m + 'actions')}</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td style={{ ...styles.td, fontWeight: 600 }}>
                      {c.name}
                      {c.testEnabled && <span style={styles.abBadge}>A/B</span>}
                    </td>
                    <td style={{ ...styles.td, maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.message}</td>
                    <td style={styles.td}><StatusBadge status={c.status} /></td>
                    <td style={styles.td}>
                      {c.scheduledAt ? (
                        <span>
                          {new Date(c.scheduledAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          <div style={styles.hint}>{t(m + 'autoLaunches')}</div>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--faint)' }}>—</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      {c.segment ? [
                        c.segment.minOrders ? t(m + 'minOrdersSegment', { count: c.segment.minOrders }) : null,
                        c.segment.lastOrderWithinDays ? t(m + 'lastDaysSegment', { count: c.segment.lastOrderWithinDays }) : null,
                      ].filter(Boolean).join(', ') : t(m + 'allCustomers')}
                    </td>
                    <td style={styles.td}>{c.sentCount}</td>
                    <td style={styles.td}>{c.deliveredCount ?? 0}</td>
                    <td style={styles.td}>{c.failedCount}</td>
                    <td style={{ ...styles.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {(c.status === 'COMPLETED' || c.status === 'ACTIVE') && (
                        <button style={styles.analyticsBtn} onClick={() => openAnalytics(c)}>{t(m + 'analytics')}</button>
                      )}
                      {c.status === 'DRAFT' && !c.scheduledAt && (
                        <button style={styles.launchBtn} onClick={() => launchCampaign(c)}>{t(m + 'launch')}</button>
                      )}
                      {c.status === 'DRAFT' && c.scheduledAt && (
                        <span style={styles.hint}>{t(m + 'queued')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Adverts */}
      <div style={styles.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={styles.sectionTitle}>{t(m + 'advertsTitle')}</div>
            <div style={styles.sectionSub}>{t(m + 'advertsSub')}</div>
          </div>
          <button style={styles.addButton} onClick={openAdvert}>{t(m + 'newAdvert')}</button>
        </div>
        <div style={styles.card}>
          {adsLoading ? <LoadingSpinner /> : adsError ? (
            <div style={{ padding: '1rem' }}><ErrorMessage message={adsError} /></div>
          ) : !ads || ads.length === 0 ? (
            <div style={styles.empty}>{t(m + 'noAdverts')}</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t(m + 'advert')}</th>
                  <th style={styles.th}>{t(m + 'callToAction')}</th>
                  <th style={styles.th}>{t(m + 'sortOrderLabel')}</th>
                  <th style={styles.th}>{t(m + 'status')}</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((a) => (
                  <tr key={a.id}>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 600 }}>{a.emoji ? `${a.emoji} ` : ''}{a.title}</div>
                      {a.body && <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{a.body}</div>}
                    </td>
                    <td style={styles.td}>{a.ctaLabel ? `${a.ctaLabel} → ${a.ctaUrl || ''}` : '—'}</td>
                    <td style={styles.td}>{a.sortOrder}</td>
                    <td style={styles.td}><StatusBadge status={a.isActive ? 'ACTIVE' : 'INACTIVE'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Category marketing copy */}
      <div style={styles.section}>
        <div>
          <div style={styles.sectionTitle}>{t(m + 'categoryMarketing')}</div>
          <div style={styles.sectionSub}>{t(m + 'categoryMarketingSub')}</div>
        </div>
        <div style={styles.card}>
          {catsLoading ? <LoadingSpinner /> : catsError ? (
            <div style={{ padding: '1rem' }}><ErrorMessage message={catsError} /></div>
          ) : !categories || categories.length === 0 ? (
            <div style={styles.empty}>{t(m + 'noCategories')}</div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>{t(m + 'categoryLabel')}</th>
                  <th style={styles.th}>{t(m + 'tagline')}</th>
                  <th style={styles.th}>{t(m + 'benefits')}</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>{t(m + 'actions')}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{cat.emoji ? `${cat.emoji} ` : ''}{cat.name}</td>
                    <td style={styles.td}>{cat.tagline || '—'}</td>
                    <td style={styles.td}>{(cat.benefits || []).slice(0, 3).join(', ') || '—'}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button style={styles.editBtn} onClick={() => openCategory(cat)}>{t(m + 'editCopy')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Campaign modal */}
      {campaignModal && (
        <div style={styles.overlay} onClick={() => !saving && setCampaignModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>{t(m + 'newSmsCampaign')}</div>
            <div style={styles.field}>
              <label style={styles.label}>{t(m + 'campaignName')}</label>
              <input style={styles.input} value={campaignForm.name} placeholder={t(m + 'campaignNamePlaceholder')} onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t(m + 'message')}</label>
              <textarea style={styles.textarea} value={campaignForm.message} placeholder={t(m + 'messagePlaceholder')} onChange={(e) => setCampaignForm((f) => ({ ...f, message: e.target.value }))} />
              <div style={styles.hint}>{t(m + 'smsHint')}</div>
            </div>
            <div style={styles.abToggleRow}>
              <input
                type="checkbox"
                id="ab-test-toggle"
                style={styles.abCheckbox}
                checked={campaignForm.testEnabled}
                onChange={(e) =>
                  setCampaignForm((f) => ({
                    ...f,
                    testEnabled: e.target.checked,
                    variants: e.target.checked && f.variants.length === 0
                      ? [{ label: 'Variant A', message: '' }, { label: 'Variant B', message: '' }]
                      : f.variants,
                  }))
                }
              />
              <label htmlFor="ab-test-toggle" style={styles.abLabel}>{t(m + 'abTestToggle')}</label>
            </div>
            {campaignForm.testEnabled && (
              <div style={{ marginBottom: '0.85rem' }}>
                <label style={styles.label}>{t(m + 'messageVariants')}</label>
                <div style={{ ...styles.hint, marginTop: 0, marginBottom: '0.5rem' }}>
                  {t(m + 'variantsHint')}
                </div>
                {campaignForm.variants.map((v, i) => (
                  <div key={i} style={styles.variantBox}>
                    <div style={styles.variantHeader}>
                      <span style={styles.variantTitle}>{v.label || `Variant ${String.fromCharCode(65 + i)}`}</span>
                      {campaignForm.variants.length > 2 && (
                        <button
                          type="button"
                          style={styles.removeVariantBtn}
                          onClick={() => setCampaignForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }))}
                        >
                          {t(m + 'remove')}
                        </button>
                      )}
                    </div>
                    <input
                      style={{ ...styles.input, marginBottom: '0.4rem' }}
                      value={v.label}
                      placeholder={`${t(m + 'variantLabelPlaceholder')} ${i + 1}`}
                      onChange={(e) =>
                        setCampaignForm((f) => ({
                          ...f,
                          variants: f.variants.map((vv, idx) => (idx === i ? { ...vv, label: e.target.value } : vv)),
                        }))
                      }
                    />
                    <textarea
                      style={{ ...styles.textarea, minHeight: '60px' }}
                      value={v.message}
                      placeholder={`${t(m + 'smsBodyFor')} ${v.label || String.fromCharCode(65 + i)}`}
                      onChange={(e) =>
                        setCampaignForm((f) => ({
                          ...f,
                          variants: f.variants.map((vv, idx) => (idx === i ? { ...vv, message: e.target.value } : vv)),
                        }))
                      }
                    />
                  </div>
                ))}
                {campaignForm.variants.length < 4 && (
                  <button type="button" style={styles.addVariantBtn} onClick={() => setCampaignForm((f) => ({ ...f, variants: [...f.variants, { label: `Variant ${String.fromCharCode(65 + f.variants.length)}`, message: '' }] }))}>
                    {t(m + 'addVariant')}
                  </button>
                )}
              </div>
            )}
            <div style={styles.field}>
              <label style={styles.label}>{t(m + 'schedule')}</label>
              <input type="datetime-local" style={styles.input} value={campaignForm.scheduledAt} onChange={(e) => setCampaignForm((f) => ({ ...f, scheduledAt: e.target.value }))} />
              <div style={styles.hint}>{t(m + 'scheduleHint')}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>{t(m + 'minOrders')}</label>
                <input type="number" min={1} style={styles.input} value={campaignForm.minOrders} placeholder="e.g. 3" onChange={(e) => setCampaignForm((f) => ({ ...f, minOrders: e.target.value }))} />
                <div style={styles.hint}>{t(m + 'minOrdersHint')}</div>
              </div>
              <div style={{ ...styles.field, flex: 1 }}>
                <label style={styles.label}>{t(m + 'orderedWithin')}</label>
                <input type="number" min={1} style={styles.input} value={campaignForm.lastOrderWithinDays} placeholder="e.g. 30" onChange={(e) => setCampaignForm((f) => ({ ...f, lastOrderWithinDays: e.target.value }))} />
                <div style={styles.hint}>{t(m + 'orderedWithinHint')}</div>
              </div>
            </div>
            <div style={styles.hint}>{t(m + 'segmentHint')}</div>
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setCampaignModal(false)} disabled={saving}>{t(m + 'cancel')}</button>
              <button style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }} onClick={submitCampaign} disabled={saving}>
                {saving ? t(m + 'saving') : t(m + 'saveDraft')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advert modal */}
      {advertModal && (
        <div style={styles.overlay} onClick={() => !saving && setAdvertModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>{t(m + 'newAdvertTitle')}</div>
            <div style={styles.field}>
              <label style={styles.label}>{t(m + 'titleLabel')}</label>
              <input style={styles.input} value={advertForm.title} placeholder={t(m + 'titlePlaceholder')} onChange={(e) => setAdvertForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t(m + 'body')}</label>
              <textarea style={styles.textarea} value={advertForm.body} placeholder={t(m + 'bodyPlaceholder')} onChange={(e) => setAdvertForm((f) => ({ ...f, body: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t(m + 'emoji')}</label>
              <input style={styles.input} value={advertForm.emoji} placeholder="🚚" onChange={(e) => setAdvertForm((f) => ({ ...f, emoji: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t(m + 'ctaLabel')}</label>
              <input style={styles.input} value={advertForm.ctaLabel} placeholder={t(m + 'ctaLabelPlaceholder')} onChange={(e) => setAdvertForm((f) => ({ ...f, ctaLabel: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t(m + 'ctaUrl')}</label>
              <input style={styles.input} value={advertForm.ctaUrl} placeholder={t(m + 'ctaUrlPlaceholder')} onChange={(e) => setAdvertForm((f) => ({ ...f, ctaUrl: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t(m + 'sortOrder')}</label>
              <input style={styles.input} value={advertForm.sortOrder} placeholder={t(m + 'sortOrderPlaceholder')} onChange={(e) => setAdvertForm((f) => ({ ...f, sortOrder: e.target.value }))} />
            </div>
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setAdvertModal(false)} disabled={saving}>{t(m + 'cancel')}</button>
              <button style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }} onClick={submitAdvert} disabled={saving}>
                {saving ? t(m + 'saving') : t(m + 'createAdvert')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category copy modal */}
      {categoryModal && (
        <div style={styles.overlay} onClick={() => !saving && setCategoryModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalTitle}>{t(m + 'editCopyTitle')} — {categoryModal.emoji ? `${categoryModal.emoji} ` : ''}{categoryModal.name}</div>
            <div style={styles.field}>
              <label style={styles.label}>{t(m + 'tagline')}</label>
              <input style={styles.input} value={categoryForm.tagline} placeholder={t(m + 'taglinePlaceholder')} onChange={(e) => setCategoryForm((f) => ({ ...f, tagline: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t(m + 'benefits')}</label>
              <input style={styles.input} value={categoryForm.benefits} placeholder={t(m + 'benefitsPlaceholder')} onChange={(e) => setCategoryForm((f) => ({ ...f, benefits: e.target.value }))} />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>{t(m + 'emoji')}</label>
              <input style={styles.input} value={categoryForm.emoji} placeholder="🍎" onChange={(e) => setCategoryForm((f) => ({ ...f, emoji: e.target.value }))} />
            </div>
            {formError && <div style={styles.smallError}>{formError}</div>}
            <div style={styles.footer}>
              <button style={styles.cancelBtn} onClick={() => setCategoryModal(null)} disabled={saving}>{t(m + 'cancel')}</button>
              <button style={{ ...styles.saveBtn, ...(saving ? styles.saveBtnDisabled : {}) }} onClick={submitCategory} disabled={saving}>
                {saving ? t(m + 'saving') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Campaign analytics modal */}
      {(analyticsLoading || analyticsFor) && (
        <div style={styles.overlay} onClick={() => setAnalyticsFor(null)}>
          <div style={{ ...styles.modal, width: '560px' }} onClick={(e) => e.stopPropagation()}>
            {analyticsLoading || !analyticsFor ? (
              <LoadingSpinner />
            ) : (
              <>
                <div style={styles.modalTitle}>
                  {t(m + 'analytics')} — {analyticsFor.name}
                  {analyticsFor.testEnabled && <span style={styles.abBadge}>A/B</span>}
                </div>
                <div style={styles.analyticsGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>{analyticsFor.deliveredCount}</div>
                    <div style={styles.statLabel}>{t(m + 'delivered')}</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>{Math.round(analyticsFor.deliveryRate * 100)}%</div>
                    <div style={styles.statLabel}>{t(m + 'deliveryRate')}</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statValue}>{analyticsFor.conversionCount}</div>
                    <div style={styles.statLabel}>{t(m + 'conversions')}</div>
                  </div>
                </div>
                {analyticsFor.variants.length === 0 ? (
                  <div style={styles.empty}>{t(m + 'noAnalyticsData')}</div>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>{t(m + 'variant')}</th>
                        <th style={styles.th}>{t(m + 'sent')}</th>
                        <th style={styles.th}>{t(m + 'failed')}</th>
                        <th style={styles.th}>{t(m + 'conversions')}</th>
                        <th style={styles.th}>{t(m + 'convRate')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsFor.variants.map((v) => (
                        <tr key={v.variantIndex}>
                          <td style={{ ...styles.td, fontWeight: 600 }}>
                            {v.label}
                            {v.winner && <span style={styles.winnerBadge}>{t(m + 'winner')}</span>}
                          </td>
                          <td style={styles.td}>{v.sent}</td>
                          <td style={styles.td}>{v.failed}</td>
                          <td style={styles.td}>{v.converted}</td>
                          <td style={styles.td}>{(v.conversionRate * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <div style={styles.hint}>
                  {t(m + 'conversionHint')}
                </div>
                <div style={styles.footer}>
                  <button style={styles.cancelBtn} onClick={() => setAnalyticsFor(null)}>{t(m + 'close')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <AiAssistant
          module="vendor-catalog"
          feature="draft"
          features={['assistant', 'draft', 'recommend', 'analyze', 'summarize']}
          context={marketingContext}
          title="AI · Marketing"
          description={`Ask about ${campaigns?.length ?? 0} campaigns and ${ads?.length ?? 0} adverts — AI sees the same marketing data.`}
          placeholder="e.g. Draft a campaign SMS, improve this advert, analyze campaign performance…"
          suggestedPrompts={['Draft a campaign SMS for lapsed customers', 'Analyze campaign performance — what worked?', 'Improve advert copy for conversion', 'Recommend next marketing action']}
        />
      </div>
    </div>
  );
}
