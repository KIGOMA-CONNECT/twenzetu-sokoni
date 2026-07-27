import { useState } from 'react';

const TOS_CONTENT = `
By using afriMarket, you agree to the following terms:

1. **Account Registration**: You must provide accurate information and keep your credentials secure.
2. **Orders & Payments**: All orders are binding once placed. Payments are processed via mobile money (M-Pesa, Tigo Pesa, Airtel Money) or cash on delivery.
3. **Vendor Responsibility**: Vendors are responsible for product quality, accurate descriptions, and timely delivery.
4. **Delivery**: Delivery times are estimates. afriMarket coordinates driver logistics but is not liable for delays beyond reasonable control.
5. **Cancellations**: Orders may be cancelled before confirmation. After confirmation, cancellation is at vendor discretion.
6. **Disputes**: Disputes must be raised within 48 hours of delivery. afriMarket admin will mediate.
7. **Prohibited Items**: Illegal goods, counterfeit products, and prohibited items are strictly forbidden.
8. **Limitation of Liability**: afriMarket acts as a marketplace platform and is not party to the sale contract between vendor and customer.
9. **Termination**: Accounts may be suspended for violations of these terms.
10. **Changes**: Terms may be updated with notice to users.
`;

const PRIVACY_CONTENT = `
afriMarket respects your privacy. This policy explains how we collect, use, and protect your data.

1. **Data We Collect**: Name, phone number, delivery address, order history, payment information, device information, and location data (for driver tracking).
2. **How We Use Data**: Order processing, delivery coordination, customer support, fraud prevention, service improvement, and marketing communications (with consent).
3. **Data Sharing**: We share data with vendors to fulfill orders, drivers for delivery, and payment processors for transaction processing. We do not sell personal data.
4. **Data Security**: We use encryption, access controls, and regular security audits to protect your data.
5. **Retention**: We retain data as long as your account is active and for 90 days after account closure for legal compliance.
6. **Your Rights**: You may request access, correction, or deletion of your data by contacting support@afrimarket.co.tz.
7. **Cookies**: We use essential cookies for authentication and functionality. Analytics cookies are used with consent.
8. **Third-Party Services**: M-Pesa, Tigo Pesa, Airtel Money, and Africa's Talking SMS may process your data per their own policies.
9. **Changes**: We will notify users of material changes to this policy.
10. **Contact**: For privacy concerns, contact dpo@afrimarket.co.tz.
`;

export default function LegalPage() {
  const [tab, setTab] = useState<'terms' | 'privacy'>('terms');

  const tabStyle = (active: boolean) => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: active ? '#1e293b' : '#e2e8f0',
    color: active ? '#fff' : '#334155',
    cursor: 'pointer',
    fontWeight: 600,
    borderRadius: '6px 6px 0 0',
  });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: 0 }}>
        <button style={tabStyle(tab === 'terms')} onClick={() => setTab('terms')}>
          Terms of Service
        </button>
        <button style={tabStyle(tab === 'privacy')} onClick={() => setTab('privacy')}>
          Privacy Policy
        </button>
      </div>
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderTop: '3px solid #1e293b',
        borderRadius: '0 6px 6px 6px',
        padding: '2rem',
        lineHeight: 1.8,
        whiteSpace: 'pre-line',
      }}>
        {tab === 'terms' ? renderMarkdown(TOS_CONTENT) : renderMarkdown(PRIVACY_CONTENT)}
      </div>
    </div>
  );
}

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('**')) {
      const bold = line.replace(/\*\*/g, '');
      return <p key={i} style={{ fontWeight: 700, marginTop: '1rem', marginBottom: '0.25rem' }}>{bold}</p>;
    }
    if (line.startsWith('-')) {
      return <li key={i} style={{ marginLeft: '1.5rem' }}>{line.slice(2)}</li>;
    }
    return <p key={i} style={{ margin: '0.25rem 0' }}>{line || '\u00A0'}</p>;
  });
}
