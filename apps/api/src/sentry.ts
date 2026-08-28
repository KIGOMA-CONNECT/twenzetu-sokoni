import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.httpIntegration(),
      Sentry.consoleIntegration(),
    ],
  });
  console.log('[Sentry] Error tracking initialized');
} else {
  console.log('[Sentry] DSN not configured, error tracking disabled');
}
