import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageTitle } from '../../components/PageTitle';

interface Insights {
  total: number;
  byModule: Array<{ module: string; count: number; avgLatencyMs: number | null; feedbackUp: number; feedbackDown: number }>;
  byFeature: Array<{ feature: string; count: number }>;
  recentFeedbackLow: Array<{ module: string; feature: string | null; message: string; feedback: string }>;
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '1.5rem', maxWidth: '1080px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 },
  controls: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  select: { padding: '0.45rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.8rem', background: 'var(--surface)' },
  card: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem' },
  cardTitle: { fontWeight: 700, color: 'var(--ink)', marginBottom: '0.75rem', fontSize: '0.95rem' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', borderBottom: '1px solid var(--line)', fontWeight: 600, background: 'var(--bg)' },
  td: { padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--line-soft)', color: 'var(--ink-soft)' },
  badgeDown: { display: 'inline-block', padding: '0.15rem 0.45rem', borderRadius: '999px', background: '#fee2e2', color: '#991b1b', fontSize: '0.7rem', fontWeight: 700 },
  badgeUp: { display: 'inline-block', padding: '0.15rem 0.45rem', borderRadius: '999px', background: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 700 },
  empty: { textAlign: 'center', color: 'var(--faint)', padding: '1.5rem', fontSize: '0.85rem' },
};

export default function AdminAiInsights() {
  const [days, setDays] = useState('7');
  const { data, loading, error, refetch } = useApi<Insights>(`/ai/learning/insights?days=${days}`, [`/ai/learning/insights?days=${days}`]);
  const insights: Insights | null = data && typeof data === 'object' && 'total' in data ? (data as Insights) : null;

  return (
    <div style={styles.container}>
      <PageTitle title="AI Insights" />
      <div style={styles.header}>
        <h1 style={styles.title}>AI Self-Learner Insights</h1>
        <div style={styles.controls}>
          <select style={styles.select} value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
          </select>
          <button style={{ ...styles.select, cursor: 'pointer', background: 'var(--surface)' }} onClick={() => refetch()}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !insights ? (
        <div style={styles.empty}>No insights yet — AI will learn as users chat.</div>
      ) : (
        <>
          <div style={styles.card}>
            <div style={styles.cardTitle}>Overview · {insights.total} total interactions</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              {insights.byModule.length === 0 ? 'No module activity in this period.' : `${insights.byModule.length} modules, ${insights.byFeature.length} features active.`}
              {insights.recentFeedbackLow.length > 0 && (
                <span style={{ color: '#991b1b', fontWeight: 600 }}> · {insights.recentFeedbackLow.length} recent 👎 feedback — review builders.</span>
              )}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>By Module</div>
            {insights.byModule.length === 0 ? (
              <div style={styles.empty}>No module activity</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Module</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Count</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Avg Latency</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>👍</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>👎</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.byModule.map((r) => (
                    <tr key={r.module}>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{r.module}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{r.count}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{r.avgLatencyMs ? `${r.avgLatencyMs} ms` : '—'}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{r.feedbackUp > 0 ? <span style={styles.badgeUp}>{r.feedbackUp}</span> : '—'}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{r.feedbackDown > 0 ? <span style={styles.badgeDown}>{r.feedbackDown}</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={styles.card}>
            <div style={styles.cardTitle}>By Feature</div>
            {insights.byFeature.length === 0 ? (
              <div style={styles.empty}>No feature activity</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Feature</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.byFeature.map((r) => (
                    <tr key={r.feature}>
                      <td style={styles.td}>{r.feature}</td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {insights.recentFeedbackLow.length > 0 && (
            <div style={styles.card}>
              <div style={styles.cardTitle}>Recent 👎 Feedback — needs tuning</div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Module</th>
                    <th style={styles.th}>Feature</th>
                    <th style={styles.th}>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.recentFeedbackLow.map((r, i) => (
                    <tr key={i}>
                      <td style={styles.td}>{r.module}</td>
                      <td style={styles.td}>{r.feature ?? '—'}</td>
                      <td style={styles.td}>{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                Auto-tune reviews this nightly at 03:00 UTC — when 👎 &gt; 3 for a module, tighten its builder constraints.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
