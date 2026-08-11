import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import type { Advert, Category } from '../../types';

const PUBLIC_BASE_URL = (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined) || 'https://twenzetusokoni.com';

// ── Parent category IDs (kept in sync with the dashboard) ──
const PARENT_IDS = {
  USED:       'd0000000-0000-0000-0000-000000000018',
  FOOD:       'd0000000-0000-0000-0000-000000000030',
  FRESH:      'd0000000-0000-0000-0000-000000000031',
  HOME_GARDEN: 'd0000000-0000-0000-0000-000000000032',
  LAUNDRY:    'd0000000-0000-0000-0000-000000000033',
  TAILORING:  'd0000000-0000-0000-0000-000000000034',
  GENERAL:    'd0000000-0000-0000-0000-000000000035',
  CARGO:      'd0000000-0000-0000-0000-000000000036',
};

function categoryRoute(cat: Category): string {
  if (cat.id === PARENT_IDS.USED) return '/used-goods';
  if (cat.id === PARENT_IDS.TAILORING) return '/tailoring';
  if (cat.id === PARENT_IDS.CARGO) return '/cargo';
  if (cat.id === PARENT_IDS.GENERAL) return '/general-products';
  return `/vendors?category=${encodeURIComponent(cat.type)}&parentId=${cat.id}`;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default function MatangazoPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: ads, loading: adsLoading, error: adsError } = useApi<Advert[]>('/public/ads', []);
  const { data: categories, loading: catsLoading } = useApi<Category[]>('/public/categories', []);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const parents = (categories ?? [])
    .filter((c) => c.isActive && !c.parentId)
    .sort((a, b) => (a.emoji ? 0 : 1) - (b.emoji ? 0 : 1));

  const handleCopy = async (key: string, link: string) => {
    const ok = await copyText(`${PUBLIC_BASE_URL}${link}`);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 2000);
    } else {
      alert('Imeshindikana kunakili. Jaribu tena.');
    }
  };

  const goTo = (path: string | null) => {
    navigate(path || '/dashboard');
  };

  return (
    <div className="page">
      <PageHeader
        title={t('nav.promotions', 'Matangazo')}
        sub="Chagua tangazo au kategoria, nakili kiungo na ushiriki na marafiki zako"
      />

      {/* ── Adverts ── */}
      <section className="section">
        <div className="flex gap-2" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 className="card-title">Tangazo la Siku</h3>
        </div>
        {adsLoading && <LoadingSpinner />}
        {adsError && <ErrorMessage message={adsError} />}
        {!adsLoading && !adsError && (!ads || ads.length === 0) && (
          <EmptyState icon="📣" title="Hakuna matangazo kwa sasa" sub="Tazama tena baadaye" />
        )}
        {!adsLoading && ads && ads.length > 0 && (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {ads.map((ad) => {
              const shareLink = `${ad.ctaUrl || '/'}`;
              return (
                <div key={ad.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '2rem', lineHeight: 1 }}>{ad.emoji || '📣'}</span>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, flex: 1 }}>{ad.title}</h3>
                  </div>
                  {ad.body && <p style={{ color: 'var(--muted)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>{ad.body}</p>}
                  <div className="flex gap-2 wrap" style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => goTo(ad.ctaUrl)}>
                      {ad.ctaLabel || 'Fungua'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleCopy(`ad-${ad.id}`, shareLink)}>
                      {copiedKey === `ad-${ad.id}` ? '✓ Imekopiwa!' : '🔗 Nakili Kiungo'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Category share links ── */}
      <section className="section">
        <h3 className="card-title">Nakili Kiungo cha Kategoria</h3>
        {catsLoading && <LoadingSpinner />}
        {!catsLoading && parents.length === 0 && (
          <EmptyState icon="🗂️" title="Hakuna kategoria" sub="Kategoria zitakapokuwa zinaonyeshwa hapa" />
        )}
        {!catsLoading && parents.length > 0 && (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
            {parents.map((cat) => {
              const route = categoryRoute(cat);
              const key = `cat-${cat.id}`;
              return (
                <div key={cat.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{cat.emoji || '🛍️'}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{cat.name}</div>
                      {cat.tagline && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.3, marginTop: '0.15rem' }}>{cat.tagline}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 wrap">
                    <button className="btn btn-primary btn-sm" onClick={() => goTo(route)}>Fungua</button>
                    <button className="btn btn-outline btn-sm" onClick={() => handleCopy(key, route)}>
                      {copiedKey === key ? '✓ Imekopiwa!' : '🔗 Nakili'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── How to share ── */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 className="card-title">Jinsi ya Kushiriki</h3>
        <ol style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: '1.25rem', margin: 0 }}>
          <li>Bonyeza <b>Nakili Kiungo</b> kwenye kategoria au tangazo unalotaka.</li>
          <li>Fungua WhatsApp, Telegram au Mtandao wa Kijamii.</li>
          <li>Bandika (paste) kiungo na utume kwa marafiki na wateja wako.</li>
        </ol>
      </div>
    </div>
  );
}
