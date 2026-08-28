import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDevice } from '../../hooks/useDevice';
import { useAuth } from '../../context/AuthContext';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'vendor' | 'driver';
  text: string;
  timestamp: string;
  read: boolean;
}

interface ChatProps {
  orderId: string;
  otherParty: { id: string; name: string; role: 'customer' | 'vendor' | 'driver' };
  onClose: () => void;
}

export function OrderChat({ orderId, otherParty, onClose }: ChatProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const device = useDevice();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isPhone = device.type === 'phone';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage() {
    if (!input.trim() || !user) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: user.id,
      senderName: user.fullName,
      senderRole: user.role as 'customer' | 'vendor' | 'driver',
      text: input.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, msg]);
    setInput('');

    // Simulate reply
    setIsTyping(true);
    setTimeout(() => {
      const reply: ChatMessage = {
        id: `msg-${Date.now()}-reply`,
        senderId: otherParty.id,
        senderName: otherParty.name,
        senderRole: otherParty.role,
        text: getAutoReply(input.trim(), otherParty.role),
        timestamp: new Date().toISOString(),
        read: false,
      };
      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1500);
  }

  function getAutoReply(msg: string, role: string): string {
    const lower = msg.toLowerCase();
    if (lower.includes('wapi') || lower.includes('location') || lower.includes('poa')) {
      return role === 'driver'
        ? 'Niko njiani! Nitafika ndani ya dakika 10. Nitakupigia simu karibu na eneo lako.'
        : 'Niko dukani. Mteja atapokea bidhaa yake karibu nawe.';
    }
    if (lower.includes('bei') || lower.includes('price') || lower.includes('pesa')) {
      return 'Bei ni kama ilivyokubaliwa. Unaweza kulipa kupitia mtandao au kwa mtu mwenye.';
    }
    if (lower.includes('asante') || lower.includes('thank')) {
      return 'Karibu! Tafadhali kadiria uzoefu wako. 🙏';
    }
    return 'Nimepokea ujumbe wako. Nitarespondi hivi karibuni.';
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, top: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column', background: 'var(--bg)',
    }}>
      {/* Chat header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: isPhone ? '0.75rem 1rem' : '1rem 1.5rem',
        borderBottom: '1px solid var(--line)', background: 'var(--surface)',
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{otherParty.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
            {otherParty.role === 'driver' ? '🚚 Dereva' : otherParty.role === 'vendor' ? '🏪 Muuzaji' : '👤 Mnunuzi'} · Order #{orderId.slice(0, 8)}
          </div>
        </div>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isPhone ? '1rem' : '1.5rem' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>💬</div>
            <p style={{ fontSize: '0.9rem' }}>{t('chat.startConversation', { name: otherParty.name })}</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <div key={msg.id} style={{
              display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '0.75rem',
            }}>
              <div style={{ maxWidth: '75%' }}>
                {!isMe && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginBottom: '0.2rem', paddingLeft: '0.5rem' }}>
                    {msg.senderName}
                  </div>
                )}
                <div style={{
                  padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-lg)',
                  background: isMe ? 'var(--brand)' : 'var(--surface)',
                  color: isMe ? '#fff' : 'var(--ink)',
                  fontSize: '0.88rem', lineHeight: 1.4,
                  borderBottomRightRadius: isMe ? '4px' : 'var(--radius-lg)',
                  borderBottomLeftRadius: isMe ? 'var(--radius-lg)' : '4px',
                }}>
                  {msg.text}
                </div>
                <div style={{
                  fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.2rem',
                  textAlign: isMe ? 'right' : 'left', paddingLeft: isMe ? 0 : '0.5rem', paddingRight: isMe ? '0.5rem' : 0,
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString('sw-TZ', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div style={{ display: 'flex', gap: '0.3rem', padding: '0.5rem 0.75rem', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', width: 'fit-content', marginBottom: '0.75rem' }}>
            <span style={{ animation: 'pulse 1s infinite' }}>●</span>
            <span style={{ animation: 'pulse 1s infinite 0.2s' }}>●</span>
            <span style={{ animation: 'pulse 1s infinite 0.4s' }}>●</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: '0.5rem', padding: isPhone ? '0.75rem 1rem' : '1rem 1.5rem',
        borderTop: '1px solid var(--line)', background: 'var(--surface)',
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={t('common.typeMessage')}
          style={{ flex: 1, padding: '0.7rem', borderRadius: 'var(--radius)', border: '1px solid var(--line)', fontSize: '0.9rem' }}
        />
        <button
          className="btn btn-primary"
          onClick={sendMessage}
          style={{ padding: '0.7rem 1.2rem' }}
        >
          {t('common.send')}
        </button>
      </div>
    </div>
  );
}
