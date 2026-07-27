import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import type { Vendor } from '../../types';

interface Review {
  id: string;
  vendorId: string;
  orderId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 1.5rem 0' },
  selectRow: { marginBottom: '1.5rem' },
  selectLabel: { fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'block' },
  select: { width: '100%', maxWidth: '400px', padding: '0.6rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', background: '#fff' },
  reviewCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '1.25rem',
    marginBottom: '0.75rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  stars: { fontSize: '1.25rem', color: '#f59e0b', marginBottom: '0.5rem' },
  starEmpty: { color: '#e2e8f0' },
  comment: { fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, marginBottom: '0.5rem' },
  date: { fontSize: '0.75rem', color: '#64748b' },
  empty: { textAlign: 'center', color: '#64748b', padding: '3rem' },
  list: { display: 'flex', flexDirection: 'column' as const },
};

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
          const payload = res.data;
          setReviews(Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : []);
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
    <div style={styles.container}>
      <h1 style={styles.title}>Vendor Reviews</h1>

      <div style={styles.selectRow}>
        <label style={styles.selectLabel}>Select a vendor</label>
        {vendorsLoading ? (
          <LoadingSpinner />
        ) : vendorsError ? (
          <ErrorMessage message={vendorsError} />
        ) : (
          <select
            style={styles.select}
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
            <div style={styles.list}>
              {reviews.length === 0 ? (
                <div style={styles.empty}>No reviews for this vendor yet.</div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} style={styles.reviewCard}>
                    <div style={styles.stars}>{renderStars(review.rating)}</div>
                    <div style={styles.comment}>{review.comment}</div>
                    <div style={styles.date}>{formatDate(review.createdAt)}</div>
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
