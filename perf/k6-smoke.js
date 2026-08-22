import http from 'k6/http';
import { check, sleep } from 'k6';

// Baseline load smoke for afriMarket public surfaces.
//
// Usage (install k6: https://k6.io):
//   k6 run perf/k6-smoke.js
//   BASE_URL=https://staging.example.com API_BASE=https://staging.example.com/api VUS=50 DURATION=5m k6 run perf/k6-smoke.js
//
// Acceptance baseline: p(95) < 800ms, error rate < 1%.

const BASE = __ENV.BASE_URL || 'https://twenzetusokoni.com';
const API = __ENV.API_BASE || `${BASE}/api`;

export const options = {
  vus: Number(__ENV.VUS || 20),
  duration: __ENV.DURATION || '3m',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  const home = http.get(`${BASE}/`, { tags: { name: 'web-home' } });
  check(home, {
    'home ok': (r) => r.status === 200,
    'home has content': (r) => r.body && r.body.length > 500,
  });

  const health = http.get(`${API}/health`, { tags: { name: 'api-health' } });
  check(health, { 'health ok': (r) => r.status === 200 });

  const vendors = http.get(`${API}/vendors?limit=20`, { tags: { name: 'api-vendors' } });
  check(vendors, { 'vendors ok': (r) => r.status === 200 });

  sleep(1);
}
