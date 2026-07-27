import { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

interface AuditEntry {
  id: string;
  action: string;
  actorId: string;
  actorRole: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  createdAt: string;
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();
  const limit = 50;

  useEffect(() => {
    setLoading(true);
    get<{ rows: AuditEntry[]; total: number }>(`/admin/audit-logs?limit=${limit}&offset=${page * limit}`)
      .then(data => { setLogs(data.rows); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const actionColor = (action: string) => {
    if (action.includes('approve')) return '#22c55e';
    if (action.includes('suspend') || action.includes('rejected')) return '#ef4444';
    if (action.includes('resolve')) return '#3b82f6';
    return '#64748b';
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading audit logs...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Audit Log</h2>
        <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{total} total entries</div>
      </div>

      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actor</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Target</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>IP</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    background: `${actionColor(log.action)}20`,
                    color: actionColor(log.action),
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {log.actorId.slice(0, 8)}... ({log.actorRole})
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
                  {log.targetType ? `${log.targetType} / ${log.targetId?.slice(0, 8)}...` : '-'}
                </td>
                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {log.ipAddress || '-'}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: '#64748b' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
        <button
          disabled={page === 0}
          onClick={() => setPage(p => p - 1)}
          style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.5 : 1 }}
        >
          Previous
        </button>
        <span style={{ padding: '0.5rem', color: '#64748b' }}>
          Page {page + 1} of {Math.ceil(total / limit)}
        </span>
        <button
          disabled={(page + 1) * limit >= total}
          onClick={() => setPage(p => p + 1)}
          style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: (page + 1) * limit >= total ? 'not-allowed' : 'pointer', opacity: (page + 1) * limit >= total ? 0.5 : 1 }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
