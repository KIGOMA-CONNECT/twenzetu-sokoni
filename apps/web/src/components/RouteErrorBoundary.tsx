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

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>{this.props.fallbackTitle || i18n.t('common.somethingWentWrong')}</h2>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>
            {i18n.t('common.sectionError')}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '0.5rem 1.5rem',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {i18n.t('common.tryAgain')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
