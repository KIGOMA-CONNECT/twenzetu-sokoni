import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const httpReqDuration = new Trend('http_req_duration_custom');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 20 },
    { duration: '2m', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    errors: ['rate<0.1'],
  },
};

export default function () {
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, { 'health check ok': (r) => r.status === 200 });
  errorRate.add(healthRes.status !== 200);

  sleep(1);

  const catalogRes = http.get(`${BASE_URL}/api/public/vendors`);
  check(catalogRes, { 'catalog loaded': (r) => r.status === 200 });
  errorRate.add(catalogRes.status !== 200);

  sleep(1);

  const searchRes = http.get(`${BASE_URL}/api/public/products?q=milk`);
  check(searchRes, { 'search works': (r) => r.status === 200 });
  errorRate.add(searchRes.status !== 200);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'perf/load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const metrics = data.metrics;
  let summary = '\n=== Load Test Results ===\n';
  summary += `Total requests: ${metrics.http_reqs?.values?.count || 0}\n`;
  summary += `Error rate: ${((metrics.errors?.values?.rate || 0) * 100).toFixed(2)}%\n`;
  summary += `P95 duration: ${metrics.http_req_duration?.values?.['p(95)']?.toFixed(0) || 0}ms\n`;
  summary += `P99 duration: ${metrics.http_req_duration?.values?.['p(99)']?.toFixed(0) || 0}ms\n`;
  return summary;
}
