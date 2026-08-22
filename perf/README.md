# Load testing baseline (k6)

```bash
# install: https://grafana.com/docs/k6/latest/set-up/install-k6/
k6 run perf/k6-smoke.js

# heavier pass
VUS=50 DURATION=5m k6 run perf/k6-smoke.js
```

## Acceptance baseline

| Metric | Target |
|---|---|
| Error rate | < 1% |
| p(95) latency | < 800 ms |
| Duration | 3–5 min steady state |

Record results per release in this file:

| Date | Env | VUs | p(95) | Errors | Notes |
|---|---|---|---|---|---|
| — | — | — | — | — | first run pending |

Read-only endpoints only; safe against production at modest VU counts.
