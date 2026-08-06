# Monitoring Stack

Run alongside the main docker-compose:

```bash
docker compose -f docker-compose.prod.yml -f docker-compose.monitoring.yml up -d
```

## Services

| Service         | Port  | Default Credentials           |
|-----------------|-------|-------------------------------|
| Prometheus      | 9090  | —                             |
| Grafana         | 3001  | Set `GRAFANA_ADMIN_PASSWORD` in your environment — **do not reuse default credentials in production**. After first login, rotate from **Settings > Users > admin**. |
| Node Exporter   | 9100  | —                             |
| Postgres Exporter | 9187 | —                           |

## Grafana Dashboards

- **afriMarket Overview** — auto-provisioned with API, DB, Node, Redis metrics
- Import community dashboards:
  - [PostgreSQL (ID: 405)](https://grafana.com/grafana/dashboards/405)
  - [Node Exporter Full (ID: 1860)](https://grafana.com/grafana/dashboards/1860)

## Alerting

Configure alerts in Grafana:
1. Go to **Alerting > Contact points**
2. Add email, Slack, Telegram, etc.
3. Create alert rules from dashboard panels

## Prometheus Data

- Scrape interval: 15s
- Retention: configurable in `prometheus.yml` via `--storage.tsdb.retention.time`
