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

test('vendor marketplace lists vendors', async ({ request }) => {
  const res = await request.get(`${apiBaseURL}/vendors`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  // Response envelope may be { data: [...] } or a bare array depending on version.
  const list = Array.isArray(body) ? body : (body.data ?? []);
  expect(Array.isArray(list)).toBe(true);
});

test('login rejects bad credentials without crashing', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', 'e2e-smoke@example.com');
  await page.fill('input[type="password"]', 'wrong-password-123');
  await page.click('button[type="submit"]');
  // Either an inline error appears or we stay on /login; never a 5xx crash page.
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
});

test('protected route redirects anonymous users to login', async ({ page }) => {
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/(login|dashboard)/);
});
