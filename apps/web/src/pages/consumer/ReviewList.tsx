import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader, EmptyState } from '../../components/ui';
import type { Vendor } from '../../types';

interface Review {
  id: string;
  vendorId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

function renderStars(rating: number) {
  const full = Math.min(Math.max(Math.round(rating), 0), 5);
  let stars = '';
  for (let i = 0; i < 5; i++) {
    stars += i < full ? '★' : '☆';
  }
  return stars;
}

export default function ReviewList() {
  const { data: vendors, loading: vendorsLoading, error: vendorsError } = useApi<Vendor[]>('/vendors');
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const vendorList: Vendor[] = Array.isArray(vendors) ? vendors : [];

  useEffect(() => {
    if (!selectedVendorId) {
      setReviews([]);
      return;
    }
    let cancelled = false;
    setReviewsLoading(true);
    setReviewsError(null);
    api.get(`/reviews/vendor/${selectedVendorId}`)
      .then((res) => {
        if (!cancelled) {
          const payload = res.data?.data?.data ?? res.data?.data ?? res.data;
          setReviews(Array.isArray(payload) ? payload : []);
        }
      })
      .catch((err: any) => {
        if (!cancelled) setReviewsError(err.response?.data?.message || err.message || 'Failed to load reviews.');
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedVendorId]);

  return (
    <div className="page">
      <PageHeader title="Vendor Reviews" sub="See what other customers say about a vendor" />

      <div className="field" style={{ maxWidth: 440 }}>
        <label className="field-label">Select a vendor</label>
        {vendorsLoading ? (
          <LoadingSpinner />
        ) : vendorsError ? (
          <ErrorMessage message={vendorsError} />
        ) : (
          <select
            className="select"
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
          >
            <option value="">— Choose a vendor —</option>
            {vendorList.map((v) => (
              <option key={v.id} value={v.id}>{v.shopName}</option>
            ))}
          </select>
        )}
      </div>

      {selectedVendorId && (
        <>
          {reviewsLoading && <LoadingSpinner />}
          {reviewsError && <ErrorMessage message={reviewsError} />}

          {!reviewsLoading && !reviewsError && (
            <div className="stack">
              {reviews.length === 0 ? (
                <EmptyState icon="💬" title="No reviews yet" sub="This vendor has no reviews." />
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="card">
                    <div className="stars">{renderStars(review.rating)}</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.4rem' }}>{review.comment}</div>
                    <div className="text-muted">{formatDate(review.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
