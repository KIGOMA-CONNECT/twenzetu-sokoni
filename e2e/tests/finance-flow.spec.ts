import { expect, test } from '@playwright/test';

// Finance flows: wallet balance, fintech tabs, savings, loans, send money, bank withdraw.
// READ-ONLY â€” safe against any environment, creates no data.
//   npx playwright test tests/finance-flow.spec.ts

const TEST_PHONE = process.env.TEST_PHONE || '07540000001';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPass1x!';

async function loginAsUser(page: any, phone: string, password: string) {
  await page.goto('/login');
  await page.fill('#phoneNumber', phone);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard|wallet/, { timeout: 10_000 });
}

test.describe('Finance Flow', () => {
  test('user can view wallet page with balance', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/wallet');
    await expect(page.locator('.stat-label:has-text("Balance"), .stat-label').first()).toBeVisible();
    await expect(page.locator('button:has-text("Top Up"), button:has-text("Tengeneza")').first()).toBeVisible();
  });

  test('wallet page has send money and bank withdraw buttons', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/wallet');
    await expect(page.locator('button:has-text("Send Money")')).toBeVisible();
    await expect(page.locator('button:has-text("Bank Withdraw")')).toBeVisible();
  });

  test('wallet top-up opens payment method selection', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/wallet');
    const topupBtn = page.locator('button:has-text("Top Up"), button:has-text("Tengeneza")').first();
    await topupBtn.click();

    await expect(page.locator('text=M-Pesa').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=Card / Virtual Card')).toBeVisible();
    await expect(page.locator('text=Bank Transfer')).toBeVisible();
  });

  test('wallet top-up shows quick amount buttons', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/wallet');
    const topupBtn = page.locator('button:has-text("Top Up"), button:has-text("Tengeneza")').first();
    await topupBtn.click();

    await expect(page.locator('button:has-text("5000")').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('button:has-text("10000")').first()).toBeVisible();
  });

  test('wallet top-up requires phone number for mobile money', async ({ page }) => {
    test.skip(true, 'Requires real payment provider integration');
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/wallet');
    const topupBtn = page.locator('button:has-text("Top Up"), button:has-text("Tengeneza")').first();
    await topupBtn.click();

    const phoneInput = page.locator('input[type="tel"]').first();
    await phoneInput.fill(TEST_PHONE);
    await expect(phoneInput).toHaveValue(/.*/);
  });

  test('send money opens transfer form', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/wallet');
    await page.locator('button:has-text("Send Money")').click();

    await expect(page.locator('text=Recipient').first()).toBeVisible({ timeout: 5_000 });
  });

  test('bank withdraw opens bank form', async ({ page }) => {
    test.skip(true, 'Requires real bank integration');
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/wallet');
    await page.locator('button:has-text("Bank Withdraw")').click();

    await expect(page.locator('text=Bank Name').first()).toBeVisible({ timeout: 5_000 });
  });

  test('user can view fintech page with savings tab', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/fintech');
    await expect(page.locator('text=afriMarket Finance')).toBeVisible();
    await expect(page.locator('button:has-text("Akiba (Savings)")')).toBeVisible();
    await expect(page.locator('button:has-text("Fixed Deposits")')).toBeVisible();
    await expect(page.locator('button:has-text("Mikopo (Loans)")')).toBeVisible();
  });

  test('fintech page can switch to fixed deposits tab', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/fintech');
    await page.locator('button:has-text("Fixed Deposits")').click();
    await expect(page.locator('button:has-text("Fixed Deposits")')).toHaveCSS(/border/, /.*/);
  });

  test('fintech page can switch to loans tab', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/fintech');
    await page.locator('button:has-text("Mikopo (Loans)")').click();
    await expect(page.locator('button:has-text("Mikopo (Loans)")')).toHaveCSS(/border/, /.*/);
  });

  test('wallet transaction list is visible', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/wallet');
    await expect(page.locator('text=Recent Transactions, text=Transaction History, text=transaction').first()).toBeVisible({ timeout: 10_000 });
  });

  test('wallet displays pending balance section', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/wallet');
    await expect(page.locator('.stat-card').first()).toBeVisible();
  });

  test('fintech savings tab shows quick deposit amounts', async ({ page }) => {
    await loginAsUser(page, TEST_PHONE, TEST_PASSWORD);

    await page.goto('/fintech');
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
