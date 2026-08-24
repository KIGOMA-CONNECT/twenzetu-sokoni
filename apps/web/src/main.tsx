import './sentry';
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

const SentryErrorBoundary = Sentry.ErrorBoundary;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SentryErrorBoundary fallback={<ErrorBoundary />} showDialog>
      <HelmetProvider>
        <BrowserRouter>
          <CurrencyProvider>
            <App />
          </CurrencyProvider>
        </BrowserRouter>
      </HelmetProvider>
    </SentryErrorBoundary>
  </React.StrictMode>
);