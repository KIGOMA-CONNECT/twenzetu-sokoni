import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import * as Sentry from '@sentry/react';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CurrencyProvider } from './context/CurrencyContext';
import './styles/globals.css';

function dismissLoader() {
  const loader = document.getElementById('app-loader');
  if (loader && !loader.dataset.dismissed) {
    loader.dataset.dismissed = '1';
    loader.remove();
  }
}

function DismissLoader({ children }: { children: React.ReactNode }) {
  React.useEffect(() => { dismissLoader(); }, []);
  return <>{children}</>;
}

try {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE || 'development',
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true }),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,
    });
  }
} catch (err) {
  console.error('[afriMarket] Sentry init failed:', err);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const SentryErrorBoundary = Sentry.ErrorBoundary;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryErrorBoundary fallback={<ErrorBoundary />} showDialog>
      <DismissLoader>
        <HelmetProvider>
          <BrowserRouter>
            <CurrencyProvider>
              <App />
            </CurrencyProvider>
          </BrowserRouter>
        </HelmetProvider>
      </DismissLoader>
    </SentryErrorBoundary>
  </React.StrictMode>
);