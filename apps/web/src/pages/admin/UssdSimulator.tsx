import { useState, useRef, useEffect } from 'react';
import api from '../../api/client';

const USSD_SECRET = (import.meta.env.VITE_USSD_SIMULATE_SECRET as string | undefined) ?? '';

const PHONE_NUMBERS = [
  { label: 'Hassan (Customer)', phone: '+255754100003' },
  { label: 'Amina (Vendor)', phone: '+255754100002' },
  { label: 'Juma (Driver)', phone: '+255754100004' },
  { label: 'Bakari (Vendor)', phone: '+255754100005' },
];

export default function UssdSimulator() {
  const [selectedPhone, setSelectedPhone] = useState(PHONE_NUMBERS[0].phone);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ type: 'request' | 'response'; text: string }[]>([]);
  const [sessionId] = useState(() => `sim-${Date.now()}`);
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(true);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  const sendUssd = async (text: string) => {
    setLoading(true);
    try {
      const res = await api.post(
        '/ussd/simulate',
        {
          sessionId,
          phoneNumber: selectedPhone,
          text,
          serviceCode: '*150*30#',
        },
        USSD_SECRET ? { headers: { 'x-ussd-secret': USSD_SECRET } } : undefined,
      );
      const payload = res.data.data || res.data;
      setHistory((prev) => [
        ...prev,
        { type: 'request', text: text || '(Open Session)' },
        { type: 'response', text: payload.message },
      ]);
      setSessionActive(payload.continueSession);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setHistory((prev) => [
        ...prev,
        { type: 'request', text },
        { type: 'response', text: `Error: ${errorMessage}` },
      ]);
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendUssd(input.trim());
    setInput('');
  };

  const handleDial = () => {
    setHistory([]);
    setSessionActive(true);
    sendUssd('');
  };

  const handleEndSession = () => {
    setSessionActive(false);
    setHistory((prev) => [
      ...prev,
      { type: 'response', text: 'Session ended.' },
    ]);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#1a1a2e' }}>
        USSD Simulator
      </h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
        Simulate dialing <strong>*150*30#</strong> on your phone
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select
          value={selectedPhone}
          onChange={(e) => setSelectedPhone(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: 13,
            background: '#fff',
          }}
        >
          {PHONE_NUMBERS.map((p) => (
            <option key={p.phone} value={p.phone}>
              {p.label} ({p.phone})
            </option>
          ))}
        </select>
        <button
          onClick={handleDial}
          style={{
            padding: '8px 20px',
            background: '#22c55e',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Dial *150*30#
        </button>
      </div>

      <div
        ref={outputRef}
        style={{
          background: '#1a1a2e',
          color: '#e0e0e0',
          padding: 16,
          borderRadius: 12,
          minHeight: 300,
          maxHeight: 500,
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
        }}
      >
        {history.length === 0 && (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            Tap "Dial *150*30#" to start a session...
          </div>
        )}
        {history.map((entry, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            {entry.type === 'request' ? (
              <div style={{ color: 'var(--faint)' }}>
                &gt; {entry.text}
              </div>
            ) : (
              <div style={{ color: '#4ade80', borderLeft: '2px solid #22c55e', paddingLeft: 8 }}>
                {entry.text}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ color: '#fbbf24' }}>Processing...</div>
        )}
      </div>

      {sessionActive ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your choice (e.g. 1, 2, 0)"
            autoFocus
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'monospace',
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading || !input.trim() ? 0.5 : 1,
            }}
          >
            Send
          </button>
          <button
            type="button"
            onClick={handleEndSession}
            style={{
              padding: '10px 14px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            End
          </button>
        </form>
      ) : (
        <div style={{ marginTop: 12, textAlign: 'center', color: '#666', fontSize: 13 }}>
          Session ended. Click "Dial *150*30#" to start a new session.
        </div>
      )}

      <div style={{ marginTop: 24, padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 12, color: '#666' }}>
        <strong>Quick Guide:</strong><br />
        0 = Back/Exit &nbsp;|&nbsp; 1-5 = Menu options &nbsp;|&nbsp;
        Customer: Shop → Categories → Products → Add to Cart → Checkout<br />
        Vendor: View Orders → My Products → My Sales → My Wallet
      </div>
    </div>
  );
}
