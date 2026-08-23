import http from 'k6/http';
import { check, sleep } from 'k6';

// Authenticated endpoint load test for afriMarket.
//
// Requires a valid JWT token (from login).
// Usage:
//   AUTH_TOKEN=eyJ... k6 run perf/k6-auth.js
//   AUTH_TOKEN=eyJ... VUS=5 DURATION=1m k6 run perf/k6-auth.js
//
// Acceptance: p(95) < 800ms, error rate < 1%.

const BASE = __ENV.BASE_URL || 'https://twenzetusokoni.com';
const API = __ENV.API_BASE || `${BASE}/api`;
const TOKEN = __ENV.AUTH_TOKEN || '';

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '1m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

const headers = TOKEN ? { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

export default function () {
  if (!TOKEN) {
    console.warn('No AUTH_TOKEN set — skipping authenticated tests');
    return;
  }

  const health = http.get(`${API}/health`, { tags: { name: 'api-health' } });
  check(health, { 'health ok': (r) => r.status === 200 });

  const me = http.get(`${API}/auth/me`, { headers, tags: { name: 'auth-me' } });
  check(me, { 'me ok': (r) => r.status === 200 });

  const vendorProfile = http.get(`${API}/vendors/me/profile`, { headers, tags: { name: 'vendor-profile' } });
  check(vendorProfile, {
    'vendor profile ok': (r) => r.status === 200 || r.status === 403,
  });

  const products = http.get(`${API}/pos/products`, { headers, tags: { name: 'pos-products' } });
  check(products, { 'pos products ok': (r) => r.status === 200 || r.status === 403 });

  const shift = http.get(`${API}/pos/shifts/current`, { headers, tags: { name: 'pos-shift-current' } });
  check(shift, { 'shift current ok': (r) => r.status === 200 });

  const report = http.get(`${API}/pos/report`, { headers, tags: { name: 'pos-report' } });
  check(report, { 'pos report ok': (r) => r.status === 200 || r.status === 403 });

  const orders = http.get(`${API}/vendors/me/orders?limit=10`, { headers, tags: { name: 'vendor-orders' } });
  check(orders, { 'vendor orders ok': (r) => r.status === 200 || r.status === 403 });

  sleep(1);
}
