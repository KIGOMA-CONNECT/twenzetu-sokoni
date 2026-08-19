# Metric Catalog

The platform defines a single, authoritative catalog of business metrics for tenant-facing
reports. Every metric has a stable `key`, a display `name`, a `category`, a `unit`, a
`description`, and the source column(s) it is derived from.

- **Source of truth:** `libs/marketplace/domain/src/lib/analytics/metric-catalog.ts`
- **Exposed via:** `GET /vendor/analytics/metric-catalog` (requires `view_reports`) and
  `GET /admin/analytics/metric-catalog` (requires `view_analytics`).
- **Units:** `TZS` (currency), `COUNT` (quantity), `RATE` (0–1 ratio), `DISTANCE` (kilometres).
- **Report periods:** `7d`, `30d`, `90d`, `this_month`, `last_month`, `all_time`, or a custom
  `YYYY-MM-DD` range (`from`/`to` overrides `period`).
- **Scoping:** vendor reports scope every metric to the vendor; admin reports are tenant-wide
  (no vendor filter). Cancelled and refunded orders are excluded from revenue metrics.

## Categories

| Category | Metrics |
| --- | --- |
| SALES | total_revenue, commission, net_revenue, delivery_fee_revenue, average_order_value |
| ORDERS | order_count, completed_orders, cancelled_orders, cancellation_rate, order_funnel |
| CUSTOMERS | unique_customers, new_customers, returning_customers |
| INVENTORY | low_stock_products, out_of_stock_products, inventory_value |
| DELIVERY | deliveries_completed, deliveries_active, deliveries_failed, average_delivery_distance, driver_earnings, delivery_on_time_rate, delivery_late_rate, average_delivery_eta, average_delivery_duration |

## Definitions

| Key | Name | Unit | Source | Definition |
| --- | --- | --- | --- | --- |
| total_revenue | Total Revenue | TZS | `orders.total_amount` | Sum of order totals excluding cancelled and refunded orders in the period. |
| commission | Platform Commission | TZS | `orders.system_commission` | Sum of system commission charged on orders in the period. |
| net_revenue | Net Revenue | TZS | `total_amount - system_commission` | Total revenue minus platform commission. |
| delivery_fee_revenue | Delivery Fee Revenue | TZS | `orders.delivery_fee` | Sum of delivery fees on orders in the period. |
| average_order_value | Average Order Value | TZS | `total_amount / delivered orders` | Total revenue divided by the number of delivered orders. |
| order_count | Order Count | COUNT | `orders` | Number of orders placed in the period. |
| completed_orders | Completed Orders | COUNT | `orders.status = DELIVERED` | Number of orders delivered in the period. |
| cancelled_orders | Cancelled / Refunded Orders | COUNT | `orders.status IN (CANCELLED, REFUNDED)` | Number of orders cancelled or refunded in the period. |
| cancellation_rate | Cancellation Rate | RATE | `orders.status` | Cancelled and refunded orders as a share of all orders in the period. |
| order_funnel | Order Funnel | COUNT | `orders.status` | Count of orders per status: PLACED to DELIVERED, plus CANCELLED and REFUNDED. |
| unique_customers | Unique Customers | COUNT | `orders.customer_id` | Distinct customers who placed orders in the period. |
| new_customers | New Customers | COUNT | `min(orders.created_at)` per customer | Customers whose first order fell within the period. |
| returning_customers | Returning Customers | COUNT | `orders.customer_id` grouped | Customers with two or more orders in the period. |
| low_stock_products | Low Stock Products | COUNT | `products.stock_quantity` | Active products with stock above zero but at or below the low-stock threshold. |
| out_of_stock_products | Out of Stock Products | COUNT | `products.stock_quantity` | Active products with zero or negative stock. |
| inventory_value | Inventory Value | TZS | `stock_quantity x price` | Stock on hand valued at retail price. |
| deliveries_completed | Deliveries Completed | COUNT | `deliveries.status = DELIVERED` | Deliveries completed in the period. |
| deliveries_active | Active Deliveries | COUNT | `deliveries.status IN (ASSIGNED, PICKED_UP, IN_TRANSIT)` | Deliveries currently assigned, picked up or in transit. |
| deliveries_failed | Failed Deliveries | COUNT | `deliveries.status = FAILED` | Deliveries marked failed in the period. |
| average_delivery_distance | Average Delivery Distance | DISTANCE | `deliveries.distance_km` | Average distance in kilometres of completed deliveries. |
| driver_earnings | Driver Earnings Paid | TZS | `deliveries.driver_earnings` | Sum of driver earnings paid on completed deliveries in the period. |
| delivery_on_time_rate | Delivery On-Time Rate | RATE | `estimated_time_minutes` vs actual | Share of completed deliveries with an ETA estimate whose actual duration was within the estimate. |
| delivery_late_rate | Delivery Late Rate | RATE | `estimated_time_minutes` vs actual | Share of completed deliveries with an ETA estimate whose actual duration exceeded the estimate. |
| average_delivery_eta | Average Delivery ETA | COUNT | `deliveries.estimated_time_minutes` | Average estimated delivery duration in minutes. |
| average_delivery_duration | Average Delivery Duration | COUNT | `deliveries.updated_at - created_at` | Average actual delivery duration in minutes for completed deliveries. |

## Computed by

`AnalyticsService` (`libs/marketplace/application/src/lib/use-cases/analytics/analytics.service.ts`)
computes the metrics with raw SQL over `orders`, `order_items`, `products` and `deliveries`.
Extending the catalog means adding a `MetricDefinition` entry and, where applicable, the
corresponding computation in the service.