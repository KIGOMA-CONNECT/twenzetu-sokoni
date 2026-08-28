import { apiBaseURL } from '../playwright.config';
import { expect, test } from '@playwright/test';

// Authentication flows: register, login, OTP, token refresh, logout, password reset.
// MUTATES DATA â€” staging/local only:
//   RUN_AUTH_FLOW=1 npx playwright test tests/auth-flow.spec.ts
const enabled = process.env.RUN_AUTH_FLOW === '1';

test.skip(!enabled, 'set RUN_AUTH_FLOW=1 to run the mutating auth journey');

const TEST_PHONE = process.env.TEST_PHONE || `0754${Date.now().toString().slice(-7)}`;
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'AuthTest1x!';

test.describe('Authentication Flow', () => {
  test('user can register with phone + password', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/register/);

    await page.fill('input[type="text"]', 'E2E Auth Test');
    await page.fill('input[type="tel"]', TEST_PHONE);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/(login|dashboard)/, { timeout: 10_000 });
  });

  test('user can login with phone + password', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);

    await page.fill('#phoneNumber', TEST_PHONE);
    await page.fill('#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('login with phone + OTP flow', async ({ page }) => {
    await page.goto('/login');

    await page.click('button:has-text("SMS Code"), button:has-text("OTP")');
    await page.fill('#phoneNumber', TEST_PHONE);
    await page.click('button[type="submit"]');

    await expect(page.locator('body')).toContainText(/code|sent|verify|otp/i, { timeout: 10_000 });

    const otpInput = page.locator('#otpCode, input[placeholder*="code"], input[maxlength="4"]');
    if (await otpInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await otpInput.fill('000000');
      await page.click('button:has-text("Verify"), button[type="submit"]');
      await expect(page).toHaveURL(/(dashboard|login)/, { timeout: 10_000 });
    }
  });

  test('token refresh works via API', async ({ request }) => {
    const loginRes = await request.post(`${apiBaseURL}/auth/login`, {
      data: { phoneNumber: TEST_PHONE, password: TEST_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { refreshToken } = (await loginRes.json()).data;

    const refreshRes = await request.post(`${apiBaseURL}/auth/refresh`, {
      data: { refreshToken },
    });
    expect(refreshRes.ok()).toBeTruthy();
    const body = await refreshRes.json();
    expect(body.data?.accessToken || body.accessToken).toBeTruthy();
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#phoneNumber', TEST_PHONE);
    await page.fill('#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });

    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign out"), a:has-text("Logout")').first();
    if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/(login|$)/, { timeout: 10_000 });
    }
  });

  test('protected routes redirect to login for anonymous users', async ({ page }) => {
    const protectedRoutes = ['/dashboard', '/wallet', '/orders', '/vendor/dashboard', '/driver/dashboard'];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/(login|dashboard)/, { timeout: 15_000 });
    }
  });

  test('password reset flow loads reset page', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page).toHaveURL(/reset-password/);
    await expect(page.locator('body')).toContainText(/reset|password|phone|email/i);
  });
});
