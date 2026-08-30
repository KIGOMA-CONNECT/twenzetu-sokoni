import React from 'react';
import i18n from 'i18next';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Route error:', error, errorInfo);
    // Strong solution: capture to Sentry if available, and beacon to API for server logs
    try {
      const sentry = (window as unknown as { Sentry?: { captureException: (e: Error, ctx?: unknown) => void } }).Sentry;
      sentry?.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
      if (navigator.sendBeacon) {
        const payload = JSON.stringify({ message: error.message, stack: error.stack, componentStack: errorInfo.componentStack, url: window.location.href });
        navigator.sendBeacon('/api/metrics/client-error', new Blob([payload], { type: 'application/json' }));
      }
    } catch {
      // ignore beacon failures
    }
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleGoBack = () => {
    this.setState({ hasError: false, error: null });
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/';
  };

  private handleBrowseVendors = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/vendors';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1.5rem', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--ink)' }}>{this.props.fallbackTitle || i18n.t('common.somethingWentWrong')}</h2>
          <p style={{ color: 'var(--text-muted)', margin: '0.75rem 0 1rem', fontSize: '0.85rem' }}>
            {i18n.t('common.sectionError')}
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{ padding: '0.5rem 1.1rem', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              {i18n.t('common.tryAgain')}
            </button>
            <button
              onClick={this.handleGoBack}
              style={{ padding: '0.5rem 1.1rem', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              ← Back
            </button>
            <button
              onClick={this.handleGoHome}
              style={{ padding: '0.5rem 1.1rem', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--line)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
            >
              Home
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={this.handleBrowseVendors} style={{ padding: '0.4rem 0.9rem', background: 'var(--surface)', color: 'var(--brand)', border: '1px solid #bfdbfe', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              🏪 Browse Vendors
            </button>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/services'; }} style={{ padding: '0.4rem 0.9rem', background: 'var(--surface)', color: 'var(--brand)', border: '1px solid #bfdbfe', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              🧰 Services
            </button>
            <button onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/cart'; }} style={{ padding: '0.4rem 0.9rem', background: 'var(--surface)', color: 'var(--brand)', border: '1px solid #bfdbfe', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
              💳 Smart Cart
            </button>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--faint)', marginTop: '1rem' }}>If this keeps happening, hard refresh (Ctrl+Shift+R) or clear site data.</div>
        </div>
      );
    }
    return this.props.children;
  }
}
