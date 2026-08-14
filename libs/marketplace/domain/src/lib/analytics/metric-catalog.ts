export type MetricCategory =
  | 'SALES'
  | 'ORDERS'
  | 'CUSTOMERS'
  | 'INVENTORY'
  | 'DELIVERY';

export const METRIC_CATEGORIES: ReadonlyArray<MetricCategory> = [
  'SALES',
  'ORDERS',
  'CUSTOMERS',
  'INVENTORY',
  'DELIVERY',
];

export interface MetricDefinition {
  key: string;
  name: string;
  category: MetricCategory;
  unit: 'TZS' | 'COUNT' | 'RATE' | 'DISTANCE';
  description: string;
  source: string;
}

export const METRIC_CATALOG: ReadonlyArray<MetricDefinition> = [
  {
    key: 'total_revenue',
    name: 'Total Revenue',
    category: 'SALES',
    unit: 'TZS',
    description: 'Sum of order totals excluding cancelled and refunded orders in the period.',
    source: 'orders.total_amount',
  },
  {
    key: 'commission',
    name: 'Platform Commission',
    category: 'SALES',
    unit: 'TZS',
    description: 'Sum of system commission charged on orders in the period.',
    source: 'orders.system_commission',
  },
  {
    key: 'net_revenue',
    name: 'Net Revenue',
    category: 'SALES',
    unit: 'TZS',
    description: 'Total revenue minus platform commission.',
    source: 'orders.total_amount - orders.system_commission',
  },
  {
    key: 'delivery_fee_revenue',
    name: 'Delivery Fee Revenue',
    category: 'SALES',
    unit: 'TZS',
    description: 'Sum of delivery fees on orders in the period.',
    source: 'orders.delivery_fee',
  },
  {
    key: 'average_order_value',
    name: 'Average Order Value',
    category: 'SALES',
    unit: 'TZS',
    description: 'Total revenue divided by the number of delivered orders.',
    source: 'orders.total_amount / delivered orders',
  },
  {
    key: 'order_count',
    name: 'Order Count',
    category: 'ORDERS',
    unit: 'COUNT',
    description: 'Number of orders placed in the period.',
    source: 'orders',
  },
  {
    key: 'completed_orders',
    name: 'Completed Orders',
    category: 'ORDERS',
    unit: 'COUNT',
    description: 'Number of orders delivered in the period.',
    source: 'orders.status = DELIVERED',
  },
  {
    key: 'cancelled_orders',
    name: 'Cancelled / Refunded Orders',
    category: 'ORDERS',
    unit: 'COUNT',
    description: 'Number of orders cancelled or refunded in the period.',
    source: 'orders.status IN (CANCELLED, REFUNDED)',
  },
  {
    key: 'cancellation_rate',
    name: 'Cancellation Rate',
    category: 'ORDERS',
    unit: 'RATE',
    description: 'Cancelled and refunded orders as a share of all orders in the period.',
    source: 'orders.status',
  },
  {
    key: 'order_funnel',
    name: 'Order Funnel',
    category: 'ORDERS',
    unit: 'COUNT',
    description: 'Count of orders per status: PLACED to DELIVERED, plus CANCELLED and REFUNDED.',
    source: 'orders.status',
  },
  {
    key: 'unique_customers',
    name: 'Unique Customers',
    category: 'CUSTOMERS',
    unit: 'COUNT',
    description: 'Distinct customers who placed orders in the period.',
    source: 'orders.customer_id',
  },
  {
    key: 'new_customers',
    name: 'New Customers',
    category: 'CUSTOMERS',
    unit: 'COUNT',
    description: 'Customers whose first order fell within the period.',
    source: 'min(orders.created_at) per customer',
  },
  {
    key: 'returning_customers',
    name: 'Returning Customers',
    category: 'CUSTOMERS',
    unit: 'COUNT',
    description: 'Customers with two or more orders in the period.',
    source: 'orders.customer_id grouped',
  },
  {
    key: 'low_stock_products',
    name: 'Low Stock Products',
    category: 'INVENTORY',
    unit: 'COUNT',
    description: 'Active products with stock above zero but at or below the low-stock threshold.',
    source: 'products.stock_quantity',
  },
  {
    key: 'out_of_stock_products',
    name: 'Out of Stock Products',
    category: 'INVENTORY',
    unit: 'COUNT',
    description: 'Active products with zero or negative stock.',
    source: 'products.stock_quantity',
  },
  {
    key: 'inventory_value',
    name: 'Inventory Value',
    category: 'INVENTORY',
    unit: 'TZS',
    description: 'Stock on hand valued at retail price (stock_quantity x price).',
    source: 'products.stock_quantity x products.price',
  },
  {
    key: 'deliveries_completed',
    name: 'Deliveries Completed',
    category: 'DELIVERY',
    unit: 'COUNT',
    description: 'Deliveries for the vendor completed in the period.',
    source: 'deliveries.status = DELIVERED',
  },
  {
    key: 'deliveries_active',
    name: 'Active Deliveries',
    category: 'DELIVERY',
    unit: 'COUNT',
    description: 'Deliveries currently assigned, picked up or in transit.',
    source: 'deliveries.status IN (ASSIGNED, PICKED_UP, IN_TRANSIT)',
  },
  {
    key: 'deliveries_failed',
    name: 'Failed Deliveries',
    category: 'DELIVERY',
    unit: 'COUNT',
    description: 'Deliveries marked failed in the period.',
    source: 'deliveries.status = FAILED',
  },
  {
    key: 'average_delivery_distance',
    name: 'Average Delivery Distance',
    category: 'DELIVERY',
    unit: 'DISTANCE',
    description: 'Average distance in kilometres of completed deliveries.',
    source: 'deliveries.distance_km',
  },
  {
    key: 'driver_earnings',
    name: 'Driver Earnings Paid',
    category: 'DELIVERY',
    unit: 'TZS',
    description: 'Sum of driver earnings paid on completed deliveries in the period.',
    source: 'deliveries.driver_earnings',
  },
];
