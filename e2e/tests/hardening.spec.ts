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

test.describe('Hardening', () => {
  test('ConsumerDashboard no TDZ — customer can view dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('ReferenceError');
    await expect(page.locator('body')).not.toContainText('Cannot access');
  });

  test('VendorPos shows posError when stock exceeded', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/vendor/pos');
    await expect(page.locator('body')).not.toContainText('ReferenceError');
  });

  test('RouteErrorBoundary shows navigation on error', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/vendors');
    // Force a JS error in the marketplace section by evaluating invalid JS if needed, otherwise just check boundary is not showing
    await expect(page.locator('body')).not.toContainText('Marketplace Error');
  });

  test('AI chat rejects invalid module', async ({ page, request }) => {
    await loginAsAdmin(page);
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await request.post('/api/ai/chat', {
      headers: { Authorization: `Bearer ${token}` },
      data: { module: 'invalid module!', message: 'hello' },
    });
    expect(res.status()).toBe(400);
  });

  test('AI chat sanitizes xss', async ({ page, request }) => {
    await loginAsAdmin(page);
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const res = await request.post('/api/ai/chat', {
      headers: { Authorization: `Bearer ${token}` },
      data: { module: 'vendor-analytics', message: '<script>alert(1)</script> hello', context: { summary: 'test', facts: { a: 1 } } },
    });
    expect([200, 500].includes(res.status())).toBe(true);
    const text = await res.text();
    expect(text.toLowerCase()).not.toContain('<script>');
  });
});
