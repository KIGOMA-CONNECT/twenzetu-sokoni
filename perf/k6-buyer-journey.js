import http from 'k6/http';
import { check, sleep } from 'k6';

// Buyer journey load test: browse → add to cart → checkout → track order.
//
// Requires a valid JWT token from a customer account.
// Usage:
//   AUTH_TOKEN=eyJ... k6 run perf/k6-buyer-journey.js
//   AUTH_TOKEN=eyJ... VUS=3 DURATION=1m k6 run perf/k6-buyer-journey.js
//
// This test is READ-HEAVY + LIGHT WRITES. Use with caution on production.
// Acceptance: p(95) < 1000ms, error rate < 5%.

const BASE = __ENV.BASE_URL || 'https://twenzetusokoni.com';
const API = __ENV.API_BASE || `${BASE}/api`;
const TOKEN = __ENV.AUTH_TOKEN || '';

export const options = {
  vus: Number(__ENV.VUS || 3),
  duration: __ENV.DURATION || '1m',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
  },
};

const headers = TOKEN
  ? { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
  : { 'Content-Type': 'application/json' };

export default function () {
  if (!TOKEN) {
    console.warn('No AUTH_TOKEN set — skipping buyer journey tests');
    return;
  }

  // Step 1: Browse public vendor listings
  const vendors = http.get(`${API}/vendors?limit=5`, { tags: { name: 'browse-vendors' } });
  check(vendors, { 'vendors list ok': (r) => r.status === 200 });

  const vendorList = vendors.json('data');
  if (!Array.isArray(vendorList) || vendorList.length === 0) return;
  const vendorId = vendorList[0].id;

  // Step 2: Browse vendor products
  const products = http.get(`${API}/vendors/${vendorId}/products?limit=10`, { tags: { name: 'browse-products' } });
  check(products, { 'vendor products ok': (r) => r.status === 200 });

  const productList = products.json('data');
  if (!Array.isArray(productList) || productList.length === 0) return;
  const productId = productList[0].id;

  sleep(0.5);

  // Step 3: Add to cart
  const addToCart = http.post(
    `${API}/cart/items`,
    JSON.stringify({ productId, quantity: 1 }),
    { headers, tags: { name: 'add-to-cart' } },
  );
  check(addToCart, { 'add to cart ok': (r) => r.status === 200 || r.status === 201 });

  // Step 4: View cart
  const cart = http.get(`${API}/cart`, { headers, tags: { name: 'view-cart' } });
  check(cart, { 'view cart ok': (r) => r.status === 200 });

  sleep(0.5);

  // Step 5: Get addresses
  const addresses = http.get(`${API}/addresses`, { headers, tags: { name: 'list-addresses' } });
  check(addresses, { 'list addresses ok': (r) => r.status === 200 });

  const addrList = addresses.json('data');
  if (!Array.isArray(addrList) || addrList.length === 0) return;
  const addressId = addrList[0].id;

  // Step 6: Checkout (creates order)
  const checkout = http.post(
    `${API}/orders/checkout`,
    JSON.stringify({ addressId, paymentMethod: 'cash' }),
    { headers, tags: { name: 'checkout' } },
  );
  check(checkout, { 'checkout ok': (r) => r.status === 200 || r.status === 201 });

  const orderData = checkout.json('data');
  const orderId = orderData?.order?.id;

  sleep(1);

  // Step 7: Track order
  if (orderId) {
    const track = http.get(`${API}/orders/${orderId}`, { headers, tags: { name: 'track-order' } });
    check(track, { 'track order ok': (r) => r.status === 200 });
  }

  // Step 8: View order history
  const orderHistory = http.get(`${API}/orders?limit=5`, { headers, tags: { name: 'order-history' } });
  check(orderHistory, { 'order history ok': (r) => r.status === 200 });

  sleep(1);
}
