import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDevice } from '../../hooks/useDevice';
import { SectionTitle, ProductCard } from '../../components/ui';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { useApi } from '../../hooks/useApi';
import { useCart } from '../../context/CartContext';
import type { Product } from '../../types';

const GENERAL_SUBS = [
  { id: 'd0000000-0000-0000-0000-000000000080', name: 'Electronics', emoji: '📱', desc: 'Simu, Laptop, TV' },
  { id: 'd0000000-0000-0000-0000-000000000081', name: 'Vifaa vya Nyumbani', emoji: '🏠', desc: 'Jiko, Fridge, Blender' },
  { id: 'd0000000-0000-0000-0000-000000000082', name: 'Fanicha', emoji: '🛋️', desc: 'Kitanda, Kiti, Meza' },
  { id: 'd0000000-0000-0000-0000-000000000083', name: 'Vyombo vya Usafiri', emoji: '🚗', desc: 'Gari, Boda,-parts' },
  { id: 'd0000000-0000-0000-0000-000000000084', name: 'Vifaa vya Ujenzi', emoji: '🔨', desc: 'Cement, Mabati, Nails' },
  { id: 'd0000000-0000-0000-0000-000000000085', name: 'Mitandao na Simu', emoji: '📡', desc: 'Airtime, Data, POS' },
  { id: 'd0000000-0000-0000-0000-000000000086', name: 'Vifaa vya Michezo', emoji: '⚽', desc: 'Mpira, Gym, Games' },
  { id: 'd0000000-0000-0000-0000-000000000087', name: 'Vitabu na Vifaa vya Masomo', emoji: '📚', desc: 'Shule, University' },
];

export default function GeneralProductsPage() {
  const navigate = useNavigate();
  const device = useDevice();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSub, setActiveSub] = useState<(typeof GENERAL_SUBS)[number] | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const { setActiveVendor, addItem } = useCart();
  const isPhone = device.type === 'phone';
  const { data: products, loading, error } = useApi<Product[]>(
    activeSub ? `/public/products?categoryId=${activeSub.id}&limit=24` : null,
    [activeSub],
  );

  async function handleAdd(p: Product) {
    if (!localStorage.getItem('accessToken')) {
      navigate('/login');
      return;
    }
    setCartError(null);
    try {
      setActiveVendor(p.vendorId);
      await addItem(p.id);
    } catch (err: any) {
      setCartError(err?.response?.data?.message || err?.message || t('generalProducts.failedToAddToCart'));
    }
  }

  function handleSendMessage() {
    if (!query.trim()) return;
    const userMsg = query.trim();
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMsg);
      setChatMessages((prev) => [...prev, { role: 'ai', text: aiResponse }]);
      setIsTyping(false);
    }, 1200);
  }

  function generateAIResponse(msg: string): string {
    const lower = msg.toLowerCase();
    if (lower.includes('simu') || lower.includes('phone') || lower.includes('laptop')) {
      return 'Nakuelewa! Unatafuta vifaa vya tech. Je, una bajeti fulani? Ninapendekeza kuangalia category ya Electronics — kuna simu, laptop na TV kutoka kwa wauzaji wetu bora.';
    }
    if (lower.includes('jiko') || lower.includes('kitchen') || lower.includes('fridge')) {
      return 'Vifaa vya jiko! Nina orodha ya wauzaji wanaouza fridge, gas cooker, blender na vingine. Bonyeza "Vifaa vya Nyumbani" hapo chini au niambie zaidi.';
    }
    if (lower.includes('mchezo') || lower.includes('sport') || lower.includes('mpira')) {
      return 'Vifaa vya michezo! Kuna mpira wa miguu, gym equipment, na vifaa vya sports. Bonyeza "Vifaa vya Michezo" kuangalia.';
    }
    if (lower.includes('ujenzi') || lower.includes('cement') || lower.includes('mabati')) {
      return 'Vifaa vya ujenzi! Tuna cement, mabati, bricks, nails na vingine. Wauzaji wetu wako karibu nawe. Bonyeza "Vifaa vya Ujenzi".';
    }
    return 'Nakuelewa! Unachohitaji kina katika moja ya categories zetu. Chagua moja hapo chini au nieleze zaidi kuhusu unachotafuta — nitakusaidia kupata sahihi!';
  }

  return (
    <div className="page" style={{ paddingTop: device.safeAreaInsets.top || undefined }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer' }}>←</button>
        <div>
          <h1 style={{ fontSize: isPhone ? '1.2rem' : '1.5rem', fontWeight: 800 }}>🛍️ {t('generalProducts.title')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('generalProducts.subtitle')}</p>
        </div>
      </div>

      {/* AI Chat */}
      <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🤖</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t('generalProducts.smartAssistant')}</span>
        </div>

        {/* Chat messages */}
        <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: '0.75rem' }}>
          {chatMessages.length === 0 && (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
              {t('generalProducts.describeNeeds')}
            </p>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: '0.5rem',
            }}>
              <div style={{
                maxWidth: '80%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-lg)', fontSize: '0.85rem',
                background: msg.role === 'user' ? 'var(--brand)' : 'var(--bg)',
                color: msg.role === 'user' ? '#fff' : 'var(--ink)',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ display: 'flex', gap: '0.3rem', padding: '0.5rem' }}>
              <span style={{ animation: 'pulse 1s infinite' }}>●</span>
              <span style={{ animation: 'pulse 1s infinite 0.2s' }}>●</span>
              <span style={{ animation: 'pulse 1s infinite 0.4s' }}>●</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={t('generalProducts.describePlaceholder')}
            style={{ flex: 1, padding: '0.65rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)', fontSize: '0.85rem' }}
          />
          <button className="btn btn-primary" onClick={handleSendMessage} style={{ padding: '0.65rem 1rem' }}>
            {t('common.send')}
          </button>
        </div>
      </div>

      {/* Subcategories */}
      <SectionTitle title={t('common.categories')} emoji="📦" />
      <div style={{ display: 'grid', gridTemplateColumns: isPhone ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {GENERAL_SUBS.map((sub) => (
          <button
            key={sub.id}
            onClick={() => { setCartError(null); setActiveSub(sub); }}
            style={{
              padding: '1rem', borderRadius: 'var(--radius-lg)', border: activeSub?.id === sub.id ? '2px solid var(--brand)' : '1px solid var(--line)',
              background: activeSub?.id === sub.id ? 'color-mix(in srgb, var(--brand) 8%, var(--surface))' : 'var(--surface)', cursor: 'pointer', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{sub.emoji}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{sub.name}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{sub.desc}</div>
          </button>
        ))}
      </div>

      {/* Products for the selected subcategory */}
      {activeSub && (
        <>
          <SectionTitle title={`${activeSub.emoji} ${activeSub.name}`} emoji="" />
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage message={error} />}
          {!loading && !error && (
            products && products.length > 0 ? (
              <div className="grid grid-auto-sm" style={{ marginBottom: '1.5rem' }}>
                {products.map((p) => (
                  <ProductCard
                    key={p.id}
                    name={p.name}
                    price={p.price}
                    imageUrl={p.imageUrl}
                    stockQuantity={p.stockQuantity}
                    unit={p.unit}
                    actionLabel={p.stockQuantity <= 0 ? t('common.unavailable') : t('cart.addToCart')}
                    onClick={() => handleAdd(p)}
                  />
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem 0', marginBottom: '1.5rem' }}>
                {t('generalProducts.noProductsInCategory')}
              </div>
            )
          )}
        </>
      )}
      {cartError && (
        <div className="card" style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: '0.85rem', padding: '0.7rem 1rem', marginBottom: '1rem' }}>
          ⚠️ {cartError}
        </div>
      )}
    </div>
  );
}
