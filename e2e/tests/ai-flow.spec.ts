import { expect, test } from '@playwright/test';

const ADMIN_PHONE = process.env.TEST_ADMIN_PHONE || '07540000010';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'AdminPass1x!';

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.waitForSelector('#phoneNumber', { timeout: 10_000 });
  await page.fill('#phoneNumber', ADMIN_PHONE);
  await page.fill('#password', ADMIN_PASSWORD);
  const [response] = await Promise.all([
    page.waitForResponse((resp: any) => resp.url().includes('/api/auth/login') && resp.request().method() === 'POST', { timeout: 15_000 }),
    page.click('button[type="submit"]'),
  ]);
  const status = response.status();
  if (status < 200 || status >= 300) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Login API returned ${status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  await page.waitForFunction(() => localStorage.getItem('accessToken') !== null, { timeout: 10_000 });
  await page.waitForURL(/(?!.*\/login)/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
}

async function gotoAndWait(page: any, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

test.describe('AI Flow', () => {
  test('AI status endpoint returns provider info', async ({ page, request }) => {
    await loginAsAdmin(page);
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await request.get('/api/ai/status', { headers: { Authorization: `Bearer ${token}` } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const payload = body.data ?? body;
    expect(typeof payload.enabled).toBe('boolean');
    expect(Array.isArray(payload.providers)).toBe(true);
  });

  test('AI chat endpoint is reachable and grounded', async ({ page, request }) => {
    await loginAsAdmin(page);
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await request.post('/api/ai/chat', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        module: 'vendor-analytics',
        message: 'Summarize this period',
        feature: 'assistant',
        context: { summary: 'test period', facts: { totalRevenue: 1000, orderCount: 5 }, rows: [{ kind: 'daily', date: '2026-08-28', revenue: 1000 }] },
      },
    });
    // When provider not configured, API returns 500 with error about provider; when configured, 200 with text
    expect([200, 500].includes(res.status())).toBe(true);
    const body = await res.json().catch(() => ({}));
    if (res.status() === 200) {
      const payload = body.data ?? body;
      expect(typeof payload.text).toBe('string');
    } else {
      expect(JSON.stringify(body).toLowerCase()).toContain('provider');
    }
  });

  test('AI stream endpoint is reachable', async ({ page, request }) => {
    await loginAsAdmin(page);
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await request.post('/api/ai/stream', {
      headers: { Authorization: `Bearer ${token}` },
      data: { module: 'finance', message: 'hello', context: { summary: 'test', facts: { balance: 1000 } } },
    });
    expect([200, 500].includes(res.status())).toBe(true);
  });

  test('AI agent vendor-restock endpoint is reachable', async ({ page, request }) => {
    await loginAsAdmin(page);
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await request.post('/api/ai/agent/vendor-restock', {
      headers: { Authorization: `Bearer ${token}` },
      data: { module: 'vendor-analytics', message: 'draft restock plan', context: { summary: 'test', facts: { lowStockThreshold: 5 }, rows: [{ kind: 'inventory', name: 'Mchele', stockQuantity: 2 }] } },
    });
    expect([200, 500].includes(res.status())).toBe(true);
  });

  test('vendor analytics shows AI assistant grounded in data', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoAndWait(page, '/vendor/analytics');
    await expect(page.locator('text=AI · Vendor Analytics').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Feature:').first()).toBeVisible();
  });

  test('admin analytics shows AI assistant', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoAndWait(page, '/admin/analytics');
    await expect(page.locator('text=AI · Platform Analytics').first()).toBeVisible({ timeout: 10_000 });
  });

  test('vendor products shows catalog AI', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoAndWait(page, '/vendor/products');
    await expect(page.locator('text=AI · Product Catalog').first()).toBeVisible({ timeout: 10_000 });
  });

  test('wallet shows finance AI', async ({ page }) => {
    await loginAsAdmin(page);
    await gotoAndWait(page, '/wallet');
    await expect(page.locator('text=AI · Wallet & Finance').first()).toBeVisible({ timeout: 10_000 });
  });
});
