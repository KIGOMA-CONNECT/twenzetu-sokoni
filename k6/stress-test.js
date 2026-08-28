import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 20 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const BASE_URL = __ENV.API_URL || `${BASE}/api`;
const TENANT_ID = 'a0000000-0000-0000-0000-000000000002';

function getToken() {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    phone: '+255754100000',
    password: 'password123',
  }), { headers: { 'Content-Type': 'application/json', 'x-tenant-id': TENANT_ID } });
  return res.status === 200 ? res.json('data.accessToken') : null;
}

const TOKEN = getToken();
const HEADERS = TOKEN
  ? { Authorization: `Bearer ${TOKEN}`, 'x-tenant-id': TENANT_ID }
  : { 'x-tenant-id': TENANT_ID };

export default function () {
  const endpoints = [
    { path: '/health', method: 'GET' },
    { path: '/vendors?limit=20', method: 'GET' },
    { path: '/products?limit=20', method: 'GET' },
    { path: '/orders?limit=10', method: 'GET' },
    { path: '/admin/dashboard', method: 'GET' },
    { path: '/admin/analytics?period=7d', method: 'GET' },
    { path: '/admin/finance/summary', method: 'GET' },
    { path: '/wallets/me', method: 'GET' },
  ];

  const ep = endpoints[Math.floor(Math.random() * endpoints.length)];

  const res = http.get(`${BASE_URL}${ep.path}`, { headers: HEADERS });
  check(res, {
    [`${ep.path} status < 500`]: (r) => r.status < 500,
  });

  sleep(Math.random() * 2 + 0.5);
}
