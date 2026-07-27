# Load Testing with k6

Run tests against a running local or production instance.

## Prerequisites

Install k6: https://k6.io/docs/getting-started/installation/

## Commands

```bash
# Smoke test (1 user, 30s)
k6 run k6/smoke-test.js

# Smoke test against production
k6 run -e API_URL=https://yourdomain.com/api k6/smoke-test.js

# Stress test (ramp up to 100 users)
k6 run k6/stress-test.js

# Stress test with output
k6 run --out json=k6/results.json k6/stress-test.js
```

## Key Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| p(95) response time | < 2000ms (smoke) / < 3000ms (stress) | 95th percentile latency |
| Error rate | < 1% (smoke) / < 5% (stress) | Failed request ratio |
| Throughput | Monitor | Requests per second |

## Test Types

- **smoke-test.js**: Single user, verifies all critical endpoints work (health, auth, vendors, products, orders, wallet, admin) 
- **stress-test.js**: Ramps from 20 to 100 users, random endpoint selection, simulates real traffic patterns
