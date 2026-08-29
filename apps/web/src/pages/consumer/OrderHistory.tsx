import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useCurrency } from '../../context/CurrencyContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { StatusBadge } from '../../components/StatusBadge';
import AiAssistant from '../../components/AiAssistant';
import { PageHeader, EmptyState } from '../../components/ui';
import type { Order, Vendor, OrderItem } from '../../types';
import { PageTitle } from '../../components/PageTitle';

interface OrderReviewTarget {
  orderId: string;
  vendorId: string;
  vendorName: string;
}

function OrderHistory() {
  const { t } = useTranslation();
  const PAGE_SIZE = 10;
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const { data: orders, loading, error } = useApi<Order[]>('/orders', []);
  const { data: vendors } = useApi<Vendor[]>('/vendors', []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[] | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [reviewedOrders, setReviewedOrders] = useState<Record<string, boolean>>({});
  const [reviewTarget, setReviewTarget] = useState<OrderReviewTarget | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [driverReviewedOrders, setDriverReviewedOrders] = useState<Record<string, boolean>>({});
  const [driverReviewOrderId, setDriverReviewOrderId] = useState<string | null>(null);
  const [driverReviewRating, setDriverReviewRating] = useState(5);
  const [driverReviewComment, setDriverReviewComment] = useState('');
  const [driverReviewBusy, setDriverReviewBusy] = useState(false);
  const [driverReviewError, setDriverReviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!orders) return;
    let cancelled = false;
    api.get('/reviews/me/orders')
      .then((res) => {
        if (cancelled) return;
        const orderIds = res.data?.data?.orderIds ?? res.data?.orderIds ?? [];
        setReviewedOrders((m) => {
          const next = { ...m };
          (orderIds as string[]).forEach((id) => { next[id] = true; });
          return next;
        });
      })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, [orders]);

  const allOrders = orders || [];
  const totalPages = Math.ceil(allOrders.length / PAGE_SIZE);
  const paged = allOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const consumerOrdersContext = useMemo(() => {
    const facts: Record<string, unknown> = {
      totalOrders: allOrders.length,
      pagedCount: paged.length,
      page,
      totalPages,
      pendingReview: allOrders.filter((o) => o.status === 'DELIVERED' && !reviewedOrders[o.id]).length,
      delivered: allOrders.filter((o) => o.status === 'DELIVERED').length,
    };
    const rows = paged.slice(0, 15).map((o) => ({ kind: 'order', status: o.status, totalAmount: o.totalAmount, vendorId: o.vendorId }));
    return { summary: `Orders — ${allOrders.length} total — page ${page}/${totalPages}`, facts, rows, constraints: ['Ground in order rows.'] };
  }, [allOrders, paged, page, totalPages, reviewedOrders]);

  const vendorName = (vendorId: string): string => {
    const v = (vendors || []).find((x) => x.id === vendorId);
    return v ? v.shopName : 'Unknown vendor';
  };

  const formatDate = (iso: string): string => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const trackableStatuses = ['OUT_FOR_DELIVERY', 'IN_TRANSIT', 'PICKED_UP', 'DELIVERED'];

  const openReview = (o: Order) => {
    setReviewTarget({ orderId: o.id, vendorId: o.vendorId, vendorName: vendorName(o.vendorId) });
    setReviewRating(5);
    setReviewComment('');
    setReviewError(null);
  };

  const submitReview = async () => {
    if (!reviewTarget) return;
    setReviewBusy(true);
    setReviewError(null);
    try {
      await api.post('/reviews', {
        vendorId: reviewTarget.vendorId,
        orderId: reviewTarget.orderId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewedOrders((m) => ({ ...m, [reviewTarget.orderId]: true }));
      setReviewTarget(null);
    } catch (err: any) {
      setReviewError(err.response?.data?.message || err.message || 'Failed to submit review');
    } finally {
      setReviewBusy(false);
    }
  };

  const openDriverReview = (o: Order) => {
    setDriverReviewOrderId(o.id);
    setDriverReviewRating(5);
    setDriverReviewComment('');
    setDriverReviewError(null);
  };

  const submitDriverReview = async () => {
    if (!driverReviewOrderId) return;
    setDriverReviewBusy(true);
    setDriverReviewError(null);
    try {
      await api.post('/driver-reviews', {
        orderId: driverReviewOrderId,
        rating: driverReviewRating,
        comment: driverReviewComment.trim() || undefined,
      });
      setDriverReviewedOrders((m) => ({ ...m, [driverReviewOrderId]: true }));
      setDriverReviewOrderId(null);
    } catch (err: any) {
      setDriverReviewError(err.response?.data?.message || err.message || 'Failed to rate driver');
    } finally {
      setDriverReviewBusy(false);
    }
  };

  const toggleRow = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(orderId);
    setItems(null);
    setItemsError(null);
    setItemsLoading(true);
    try {
      const res = await api.get(`/orders/${orderId}/items`);
      const payload = res.data;
      setItems(payload?.data?.data || payload?.data || []);
    } catch (err: any) {
      setItemsError(err.response?.data?.message || err.message || 'Failed to load items');
    } finally {
      setItemsLoading(false);
    }
  };

  return (
    <div className="page">
      <PageTitle title={t('orders.history.myOrders')} />
      <PageHeader title={t('orders.history.title')} subtitle={t('orders.history.subtitle')} />

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {!loading && !error && (
        !orders || orders.length === 0 ? (
          <EmptyState icon="📦" title={t('orders.history.noOrders')} sub={t('orders.history.browseVendors')} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('orders.history.vendor')}</th>
                  <th>{t('orders.history.status')}</th>
                  <th>{t('orders.history.total')}</th>
                  <th>{t('orders.history.date')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paged.map((o) => {
                  const isExpanded = expandedId === o.id;
                  return (
                    <>
                      <tr
                        key={o.id}
                        onClick={() => toggleRow(o.id)}
                        style={{ cursor: 'pointer', background: isExpanded ? 'var(--line-soft)' : 'transparent' }}
                      >
                        <td style={{ fontWeight: 700, color: 'var(--ink)' }}>{vendorName(o.vendorId)}</td>
                        <td><StatusBadge status={o.status} /></td>
                        <td style={{ fontWeight: 800, color: 'var(--brand-strong)' }}>{formatCurrency(o.totalAmount || 0)}</td>
                        <td style={{ color: 'var(--muted)' }}>{formatDate(o.createdAt)}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            {trackableStatuses.includes(o.status) && (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={(e) => { e.stopPropagation(); navigate(`/orders/${o.id}/tracking`); }}
                              >{t('orders.history.track')}</button>
                            )}
                            {o.status === 'DELIVERED' && (
                              reviewedOrders[o.id] ? (
                                <span className="btn btn-sm" style={{ background: 'var(--success-soft)', color: '#166534', border: 'none', cursor: 'default' }}>{t('orders.history.reviewed')}</span>
                              ) : (
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={(e) => { e.stopPropagation(); openReview(o); }}
                                >{t('orders.history.rateReview')}</button>
                              )
                            )}
                            {o.status === 'DELIVERED' && (
                              driverReviewedOrders[o.id] ? (
                                <span className="btn btn-sm" style={{ background: '#e0f2fe', color: '#075985', border: 'none', cursor: 'default' }}>{t('orders.history.driverRated')}</span>
                              ) : (
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={(e) => { e.stopPropagation(); openDriverReview(o); }}
                                >{t('orders.history.rateDriver')}</button>
                              )
                            )}
                            <span style={{ fontSize: '0.75rem', color: 'var(--faint)', fontStyle: 'italic' }}>
                              {isExpanded ? t('orders.history.hide') : t('orders.history.details')}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${o.id}-items`}>
                          <td colSpan={5} style={{ padding: '0 1rem 1rem', background: 'var(--surface)' }}>
                            <div className="card card-flat" style={{ marginTop: '0.5rem' }}>
                              <div style={{ fontWeight: 800, color: 'var(--ink)', marginBottom: '0.5rem', fontSize: '0.85rem' }}>{t('orders.history.orderItems', { id: o.id })}</div>
                              {itemsLoading && <div style={{ color: 'var(--faint)', fontSize: '0.85rem' }}>{t('orders.history.loadingItems')}</div>}
                              {itemsError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{itemsError}</div>}
                              {!itemsLoading && !itemsError && items && (
                                <>
                                  {items.length === 0 ? (
                                    <div style={{ color: 'var(--faint)', fontSize: '0.85rem' }}>{t('orders.history.itemsUnavailable')}</div>
                                  ) : (
                                    items.map((it, idx) => (
                                      <div key={idx} className="flex justify-between" style={{ fontSize: '0.85rem', padding: '0.25rem 0', color: 'var(--text)' }}>
                                        <span>{it.productName} × {it.quantity}</span>
                                        <span>{formatCurrency(it.unitPrice * it.quantity)}</span>
                                      </div>
                                    ))
                                  )}
                                </>
                              )}
                              <div className="flex justify-between mt-1" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', borderTop: '1px solid var(--line)', paddingTop: '0.5rem' }}>
                                <span>{t('orders.history.deliveryFee')}</span>
                                <span>{formatCurrency(o.deliveryFee || 0)}</span>
                              </div>
                              <div className="flex justify-between" style={{ fontWeight: 800, color: 'var(--ink)' }}>
                                <span>{t('orders.history.total')}</span>
                                <span className="text-brand">{formatCurrency(o.totalAmount || 0)}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1" style={{ padding: '1rem' }}>
                <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('orders.history.prev')}</button>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t('orders.history.pageOf', { current: page, total: totalPages })}</span>
                <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t('orders.history.next')}</button>
              </div>
            )}
          </div>
        )
      )}

      {driverReviewOrderId && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => !driverReviewBusy && setDriverReviewOrderId(null)}
        >
          <div
            style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '480px', maxWidth: '92vw', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>
              {t('orders.history.rateYourDriver')}
            </div>
            <div className="field">
              <label className="field-label">{t('orders.history.driverRating')}</label>
              <div className="flex" style={{ gap: '0.4rem' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setDriverReviewRating(n)}
                    style={{
                      fontSize: '1.6rem', border: 'none', background: 'transparent', cursor: 'pointer',
                      opacity: n <= driverReviewRating ? 1 : 0.3,
                    }}
                    aria-label={`${n} stars`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="field-label">{t('orders.history.commentOptional')}</label>
              <textarea
                className="input"
                style={{ minHeight: '80px' }}
                value={driverReviewComment}
                onChange={(e) => setDriverReviewComment(e.target.value)}
                placeholder={t('orders.history.howWasDeliveryExp')}
              />
            </div>
            {driverReviewError && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{driverReviewError}</div>}
            <div className="flex" style={{ justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setDriverReviewOrderId(null)} disabled={driverReviewBusy}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={submitDriverReview} disabled={driverReviewBusy}>
                {driverReviewBusy ? t('orders.tracking.submitting') : t('orders.history.submitRating')}
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewTarget && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => !reviewBusy && setReviewTarget(null)}
        >
          <div
            style={{ background: 'var(--surface)', borderRadius: '12px', padding: '1.5rem', width: '480px', maxWidth: '92vw', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1rem' }}>
              {t('orders.history.rateAndReview', { vendor: reviewTarget.vendorName })}
            </div>
            <div className="field">
              <label className="field-label">{t('orders.history.yourRating')}</label>
              <div className="flex" style={{ gap: '0.4rem' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setReviewRating(n)}
                    style={{
                      fontSize: '1.6rem', border: 'none', background: 'transparent', cursor: 'pointer',
                      opacity: n <= reviewRating ? 1 : 0.3,
                    }}
                    aria-label={`${n} stars`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="field-label">{t('orders.history.commentOptional')}</label>
              <textarea
                className="input"
                style={{ minHeight: '80px' }}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={t('orders.history.howWasOrder')}
              />
            </div>
            {reviewError && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{reviewError}</div>}
            <div className="flex" style={{ justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-outline" onClick={() => setReviewTarget(null)} disabled={reviewBusy}>{t('common.cancel')}</button>
              <button className="btn btn-primary" onClick={submitReview} disabled={reviewBusy}>
                {reviewBusy ? t('orders.tracking.submitting') : t('orders.history.submitReview')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem' }}>
        <AiAssistant
          module="consumer"
          feature="analyze"
          features={['assistant', 'analyze', 'summarize', 'recommend']}
          context={consumerOrdersContext}
          title="AI · Orders"
          description={`Ask about your ${allOrders.length} orders — AI sees the same order history.`}
          placeholder="e.g. Which orders can I track? Summarize my orders…"
          suggestedPrompts={['Summarize my orders', 'Which orders need review?', 'Analyze my spending', 'What should I reorder?']}
        />
      </div>
    </div>
  );
}

export default OrderHistory;
