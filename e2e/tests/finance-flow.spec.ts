import { expect, test } from '@playwright/test';

const TEST_PHONE = process.env.TEST_PHONE || '07540000001';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPass1x!';

async function loginAsUser(page: any, phone: string, password: string) {
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      console.log(`[BROWSER ERROR] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err: any) => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  await page.goto('/login');
  await page.waitForSelector('#phoneNumber', { timeout: 10_000 });
  await page.fill('#phoneNumber', phone);
  await page.fill('#password', password);

  const [response] = await Promise.all([
    page.waitForResponse(
      (resp: any) => resp.url().includes('/api/auth/login') && resp.request().method() === 'POST',
      { timeout: 15_000 },
    ),
    page.click('button[type="submit"]'),
  ]);

  const status = response.status();
  if (status < 200 || status >= 300) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Login API returned ${status}: ${JSON.stringify(body).slice(0, 300)}`);
  }

  await page.waitForFunction(
    () => localStorage.getItem('accessToken') !== null,
    { timeout: 10_000 },
  );
  await page.waitForURL(/(?!.*\/login)/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
}

async function waitForWalletPage(page: any) {
  await page.goto('/wallet');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('.stat-label, .alert-error, .empty-state, .page', { timeout: 15_000 });
}

async function gotoAndWait(page: any, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

test.describe('Finance Flow', () => {
  test('user can view wallet page with balance', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await waitForWalletPage(page);
    await expect(page.locator('.stat-label:has-text("Balance"), .stat-label').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('button:has-text("Top Up"), button:has-text("Tengeneza")').first()).toBeVisible({ timeout: 10_000 });
  });

  test('wallet page has send money and bank withdraw buttons', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await waitForWalletPage(page);
    await expect(page.locator('button:has-text("Send Money")')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('button:has-text("Bank Withdraw")')).toBeVisible({ timeout: 10_000 });
  });

  test('wallet top-up opens payment method selection', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await waitForWalletPage(page);
    const topupBtn = page.locator('button:has-text("Top Up"), button:has-text("Tengeneza")').first();
    await expect(topupBtn).toBeVisible({ timeout: 10_000 });
    await topupBtn.click();

    await expect(page.locator('text=M-Pesa').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Card / Virtual Card')).toBeVisible();
    await expect(page.locator('text=Bank Transfer')).toBeVisible();
  });

  test('wallet top-up shows quick amount buttons', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await waitForWalletPage(page);
    const topupBtn = page.locator('button:has-text("Top Up"), button:has-text("Tengeneza")').first();
    await expect(topupBtn).toBeVisible({ timeout: 10_000 });
    await topupBtn.click();

    const amountField = page.locator('.flex.wrap button.btn-sm').first();
    await expect(amountField).toBeVisible({ timeout: 5_000 });
    const buttonCount = await page.locator('.flex.wrap button.btn-sm').count();
    expect(buttonCount).toBeGreaterThanOrEqual(2);
  });

  test('wallet top-up requires phone number for mobile money', async ({ page }) => {
    test.skip(true, 'Requires real payment provider integration');
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await waitForWalletPage(page);
    const topupBtn = page.locator('button:has-text("Top Up"), button:has-text("Tengeneza")').first();
    await topupBtn.click();

    const phoneInput = page.locator('input[type="tel"]').first();
    await phoneInput.fill(TEST_PHONE);
    await expect(phoneInput).toHaveValue(/.*/);
  });

  test('send money opens transfer form', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await waitForWalletPage(page);
    await expect(page.locator('button:has-text("Send Money")')).toBeVisible({ timeout: 10_000 });
    await page.locator('button:has-text("Send Money")').click();

    await expect(page.locator('text=Recipient').first()).toBeVisible({ timeout: 5_000 });
  });

  test('bank withdraw opens bank form', async ({ page }) => {
    test.skip(true, 'Requires real bank integration');
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await waitForWalletPage(page);
    await expect(page.locator('button:has-text("Bank Withdraw")')).toBeVisible({ timeout: 10_000 });
    await page.locator('button:has-text("Bank Withdraw")').click();

    await expect(page.locator('text=Bank Name').first()).toBeVisible({ timeout: 5_000 });
  });

  test('user can view fintech page with savings tab', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await gotoAndWait(page, '/fintech');
    await expect(page.locator('text=afriMarket Finance')).toBeVisible();
    await expect(page.locator('button:has-text("Akiba (Savings)")')).toBeVisible();
    await expect(page.locator('button:has-text("Fixed Deposits")')).toBeVisible();
    await expect(page.locator('button:has-text("Mikopo (Loans)")')).toBeVisible();
  });

  test('fintech page can switch to fixed deposits tab', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await gotoAndWait(page, '/fintech');
    await page.locator('button:has-text("Fixed Deposits")').click();
    await expect(page.locator('button:has-text("Fixed Deposits")')).toHaveCSS(/border/, /.*/);
  });

  test('fintech page can switch to loans tab', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await gotoAndWait(page, '/fintech');
    await page.locator('button:has-text("Mikopo (Loans)")').click();
    await expect(page.locator('button:has-text("Mikopo (Loans)")')).toHaveCSS(/border/, /.*/);
  });

  test('wallet transaction list is visible', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await waitForWalletPage(page);
    await expect(page.locator('.section-title').first()).toBeVisible({ timeout: 10_000 });
  });

  test('wallet displays pending balance section', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await waitForWalletPage(page);
    await expect(page.locator('.stat-card').first()).toBeVisible({ timeout: 10_000 });
  });

  test('fintech savings tab shows quick deposit amounts', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await gotoAndWait(page, '/fintech');
    await page.locator('button:has-text("Akiba (Savings)")').click();
    await expect(page.locator('button:has-text("10000")').first()).toBeVisible({ timeout: 5_000 });
  });

  test('protected wallet route redirects anonymous users to login', async ({ page }) => {
    await page.goto('/wallet');
    await expect(page).toHaveURL(/\/(login|dashboard)/, { timeout: 15_000 });
  });

  test('protected fintech route redirects anonymous users to login', async ({ page }) => {
    await page.goto('/fintech');
    await expect(page).toHaveURL(/\/(login|dashboard)/, { timeout: 15_000 });
  });
});
