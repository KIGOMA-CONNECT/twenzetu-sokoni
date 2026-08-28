import { useEffect, useState } from 'react';
import api from '../api/client';

type AiFeature = 'assistant' | 'summarize' | 'analyze' | 'draft' | 'recommend' | 'review' | 'extract';
type AiRole = 'user' | 'assistant';

interface AiContext {
  summary: string;
  facts: Record<string, unknown>;
  rows?: Record<string, unknown>[];
  constraints?: string[];
  questions?: string[];
  payload?: unknown;
}

interface AiAssistantProps {
  module: string;
  feature?: AiFeature;
  features?: AiFeature[];
  context?: AiContext;
  title?: string;
  description?: string;
  placeholder?: string;
  suggestedPrompts?: string[];
  compact?: boolean;
}

const ALL_FEATURES: AiFeature[] = ['assistant', 'analyze', 'summarize', 'recommend', 'review', 'draft', 'extract'];

const FEATURE_LABELS: Record<AiFeature, string> = {
  assistant: 'Ask',
  summarize: 'Summarize',
  analyze: 'Analyze',
  draft: 'Draft',
  recommend: 'Recommend',
  review: 'Review',
  extract: 'Extract',
};

const styles: Record<string, React.CSSProperties> = {
  panel: { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden' },
  header: { padding: '0.75rem 1rem', borderBottom: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  headerTitle: { fontWeight: 700, color: 'var(--ink)', fontSize: '0.95rem', margin: 0 },
  headerSub: { color: 'var(--muted)', fontSize: '0.78rem', marginTop: '0.15rem' },
  badge: { fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '999px', border: '1px solid var(--line)', background: 'var(--surface)' },
  badgeOk: { color: '#047857', borderColor: '#a7f3d0', background: '#ecfdf5' },
  badgeOff: { color: '#92400e', borderColor: '#fde68a', background: '#fffbeb' },
  features: { display: 'flex', gap: '0.3rem', flexWrap: 'wrap' },
  featureBtn: { padding: '0.35rem 0.7rem', border: '1px solid #cbd5e1', background: 'var(--surface)', borderRadius: '999px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' },
  featureBtnActive: { padding: '0.35rem 0.7rem', border: '1px solid #2563eb', background: '#2563eb', color: '#fff', borderRadius: '999px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 },
  messages: { padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '360px', overflowY: 'auto' },
  msgUser: { alignSelf: 'flex-end', background: '#2563eb', color: '#fff', borderRadius: '14px 14px 2px 14px', padding: '0.55rem 0.8rem', fontSize: '0.85rem', maxWidth: '85%', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  msgAssistant: { alignSelf: 'flex-start', background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink-soft)', borderRadius: '14px 14px 14px 2px', padding: '0.6rem 0.85rem', fontSize: '0.85rem', maxWidth: '88%', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  empty: { color: 'var(--faint)', fontSize: '0.82rem', padding: '0.6rem 0' },
  suggestions: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap', padding: '0 1rem 0.7rem' },
  suggBtn: { padding: '0.3rem 0.6rem', border: '1px dashed #cbd5e1', background: 'var(--surface)', borderRadius: '999px', cursor: 'pointer', fontSize: '0.72rem', color: 'var(--muted)' },
  composer: { display: 'flex', gap: '0.5rem', padding: '0.7rem 1rem', borderTop: '1px solid var(--line)', background: 'var(--surface)', alignItems: 'flex-end' },
  input: { flex: 1, minHeight: '38px', maxHeight: '90px', resize: 'vertical', padding: '0.55rem 0.7rem', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.85rem', fontFamily: 'inherit', boxSizing: 'border-box' },
  sendBtn: { padding: '0.55rem 0.95rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' },
  sendBtnDisabled: { opacity: 0.55, cursor: 'not-allowed' },
  error: { color: 'var(--danger)', fontSize: '0.78rem', padding: '0 1rem 0.6rem' },
  hint: { color: 'var(--muted)', fontSize: '0.72rem', padding: '0.4rem 1rem 0.7rem' },
};

export default function AiAssistant({
  module,
  feature: initialFeature = 'assistant',
  features,
  context,
  title,
  description,
  placeholder,
  suggestedPrompts,
  compact,
}: AiAssistantProps) {
  const allowed = features && features.length ? features : ALL_FEATURES;
  const [feature, setFeature] = useState<AiFeature>(() => (allowed.includes(initialFeature) ? initialFeature : allowed[0] ?? 'assistant'));
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<Array<{ role: AiRole; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [status, setStatus] = useState<{ enabled: boolean; provider: string | null } | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/ai/status', { params: { module } });
        const payload = res.data?.data ?? res.data;
        if (!cancelled) setStatus({ enabled: Boolean(payload?.enabled), provider: payload?.provider ?? null });
      } catch {
        if (!cancelled) setStatus({ enabled: false, provider: null });
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [module]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setErr(null);
    setHistory((h) => [...h, { role: 'user', content: message }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/ai/chat', {
        module,
        message,
        feature,
        history: history.map((m) => ({ role: m.role, content: m.content })),
        context: context
          ? {
              summary: context.summary,
              facts: context.facts,
              rows: context.rows,
              constraints: context.constraints,
              questions: context.questions,
              payload: context.payload,
            }
          : undefined,
      });
      const payload = res.data?.data ?? res.data;
      const textReply = typeof payload?.text === 'string' ? payload.text : typeof payload === 'string' ? payload : '';
      setHistory((h) => [...h, { role: 'assistant', content: textReply || '(no response)' }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '';
      const apiMsg =
        (e as { response?: { data?: { message?: string; error?: { message?: string } } } })?.response?.data?.message ??
        (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        msg ??
        'Request failed';
      setErr(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  const headerTitle = title ?? `AI · ${module}`;
  const headerDesc = description ?? `Grounded in ${module} — answers use your current facts and visible data.`;

  return (
    <div style={{ ...styles.panel, ...(compact ? { maxWidth: '720px' } : {}) }}>
      <div style={styles.header}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={styles.headerTitle}>{headerTitle}</div>
          <div style={styles.headerSub}>{headerDesc}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {statusLoading ? (
            <span style={styles.badge}>checking…</span>
          ) : status?.enabled ? (
            <span style={{ ...styles.badge, ...styles.badgeOk }}>● {status.provider ?? 'ready'}</span>
          ) : (
            <span style={{ ...styles.badge, ...styles.badgeOff }}>○ not configured</span>
          )}
        </div>
      </div>

      <div style={{ padding: '0.6rem 1rem 0', display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, alignSelf: 'center' }}>Feature:</span>
        <div style={styles.features}>
          {allowed.map((f) => (
            <button
              key={f}
              type="button"
              style={f === feature ? styles.featureBtnActive : styles.featureBtn}
              onClick={() => setFeature(f)}
              aria-pressed={f === feature}
            >
              {FEATURE_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.messages}>
        {history.length === 0 ? (
          <div style={styles.empty}>Ask anything about this view. The AI sees the same summary, facts and rows you see.</div>
        ) : (
          history.map((m, i) => (
            <div key={i} style={m.role === 'user' ? styles.msgUser : styles.msgAssistant}>
              {m.content}
            </div>
          ))
        )}
        {loading && <div style={styles.msgAssistant}>Thinking…</div>}
      </div>

      {suggestedPrompts && suggestedPrompts.length > 0 && history.length === 0 && (
        <div style={styles.suggestions}>
          {suggestedPrompts.map((p) => (
            <button key={p} type="button" style={styles.suggBtn} onClick={() => send(p)}>
              {p}
            </button>
          ))}
        </div>
      )}

      <div style={styles.composer}>
        <textarea
          style={styles.input}
          value={input}
          placeholder={placeholder ?? 'Ask about this data, request an analysis, or say what you want drafted…'}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          disabled={loading}
        />
        <button
          type="button"
          style={{ ...styles.sendBtn, ...(loading || !input.trim() ? styles.sendBtnDisabled : {}) }}
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          {loading ? '…' : 'Send'}
        </button>
      </div>

      {err && <div style={styles.error}>{err}</div>}
      {!statusLoading && !status?.enabled && (
        <div style={styles.hint}>AI is not configured on this environment. Set AI_PROVIDER and GEMINI_API_KEY (or OPENAI/ANTHROPIC) to enable. The component still renders — requests will return a clear error.</div>
      )}
      {context && (Object.keys(context.facts).length > 0 || (context.rows && context.rows.length > 0)) && (
        <div style={styles.hint}>
          Grounded in {Object.keys(context.facts).length} fact{Object.keys(context.facts).length === 1 ? '' : 's'} {context.rows?.length ? `· ${context.rows.length} row${context.rows.length === 1 ? '' : 's'}` : ''} · {context.summary}
        </div>
      )}
    </div>
  );
}
