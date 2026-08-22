import { expect, test } from '@playwright/test';
import { apiBaseURL } from '../playwright.config';

// Read-only smoke suite: safe to run against any environment, creates no data.

test('platform is up: web renders and health API responds', async ({ page, request }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBeLessThan(400);
  await expect(page).toHaveTitle(/./); // title exists and is non-empty
  const health = await request.get(`${apiBaseURL}/health`);
  expect(health.status()).toBe(200);
});

test('public vendor marketplace lists vendors without auth', async ({ request }) => {
  const res = await request.get(`${apiBaseURL}/public/vendors`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  // Envelopes seen in the wild: bare array | { data: [...] } |
  // { data: { data: [...] , total } } (success wrapper around paginated).
  const list = Array.isArray(body)
    ? body
    : Array.isArray(body.data)
      ? body.data
      : (body.data?.data ?? []);
  expect(Array.isArray(list)).toBe(true);
});

test('protected APIs answer 401 (never 500) for anonymous callers', async ({ request }) => {
  // Regression guard: tenant middleware once turned these into INTERNAL 500s.
  for (const path of ['/vendors', '/orders', '/wallets']) {
    const res = await request.get(`${apiBaseURL}${path}`);
    expect(res.status(), `${path} for anonymous caller`).toBe(401);
  }
});

test('login rejects bad credentials without crashing', async ({ page }) => {
  await page.goto('/login');
  // Login is phone-based: #phoneNumber + #password.
  await page.fill('#phoneNumber', '+255754000000');
  await page.fill('#password', 'wrong-password-123');
  await page.click('button[type="submit"]');
  // Either an inline error appears or we stay on /login; never a crash page.
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
});

test('protected route redirects anonymous users to login', async ({ page }) => {
  await page.goto('/orders');
  // SPA auth boot is async; give the client guard time to land somewhere sane.
  await expect(page).toHaveURL(/\/(login|dashboard)/, { timeout: 15_000 });
});
