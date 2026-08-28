import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3000';
const BASE_URL = __ENV.API_URL || `${BASE}/api`;

export default function () {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health status is 200': (r) => r.status === 200,
      'response has ok status': (r) => r.json('status') === 'ok',
    });
  });

  group('Auth Flow', () => {
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      phone: '+255754100000',
      password: 'password123',
    }), { headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'a0000000-0000-0000-0000-000000000002' } });

    check(loginRes, {
      'login succeeds': (r) => r.status === 200,
      'gets access token': (r) => r.json('data.accessToken') !== undefined,
    });

    if (loginRes.status === 200) {
      const token = loginRes.json('data.accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': 'a0000000-0000-0000-0000-000000000002',
      };

      group('Vendors', () => {
        const vendorsRes = http.get(`${BASE_URL}/vendors`, { headers });
        check(vendorsRes, {
          'list vendors succeeds': (r) => r.status === 200,
          'returns vendor array': (r) => Array.isArray(r.json('data')),
        });
      });

      group('Products', () => {
        const prodRes = http.get(`${BASE_URL}/products?limit=10`, { headers });
        check(prodRes, {
          'list products succeeds': (r) => r.status === 200,
        });
      });

      group('Orders', () => {
        const ordersRes = http.get(`${BASE_URL}/orders?limit=5`, { headers });
        check(ordersRes, {
          'list orders succeeds': (r) => r.status === 200,
        });
      });

      group('Wallet', () => {
        http.get(`${BASE_URL}/wallets/me`, { headers });
      });

      group('Admin Dashboard', () => {
        const dashRes = http.get(`${BASE_URL}/admin/dashboard`, { headers });
        check(dashRes, {
          'admin dashboard succeeds': (r) => r.status === 200,
        });
      });
    }
  });

  sleep(1);
}
