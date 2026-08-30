import { useState, useEffect } from 'react';
import api from '../../api/client';

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

export default function AdminAiAudit() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/audit-logs?limit=100&offset=0')
      .then((res) => {
        const d = res.data?.data ?? res.data;
        const rows: AuditEntry[] = d?.rows ?? [];
        setLogs(rows.filter((r) => r.action.startsWith('ai.')));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading AI audit...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>AI Audit Log</h2>
        <div style={{ color: 'var(--faint)', fontSize: '0.9rem' }}>{logs.length} AI actions</div>
      </div>
      <div style={{ background: 'var(--surface)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--line)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Action</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actor</th>
              <th style={{ padding: '0.75rem', textAlign: 'left' }}>Target (module)</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  No AI audit entries yet — chat with AI to generate logs.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>{log.action}</span>
                  </td>
                  <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {log.actorId.slice(0, 8)}... ({log.actorRole})
                  </td>
                  <td style={{ padding: '0.75rem', fontSize: '0.85rem' }}>{log.targetId}</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: 'var(--muted)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
