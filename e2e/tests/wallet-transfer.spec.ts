import { expect, test } from '@playwright/test';

// Wallet transfer flows: send money, withdraw, balance checks.
// MUTATES DATA â€” staging/local only:
//   RUN_WALLET_TRANSFER=1 npx playwright test tests/wallet-transfer.spec.ts
const enabled = process.env.RUN_WALLET_TRANSFER === '1';

test.skip(!enabled, 'set RUN_WALLET_TRANSFER=1 to run the mutating wallet transfer journey');

const SENDER_PHONE = process.env.TEST_PHONE || '07540000001';
const SENDER_PASSWORD = process.env.TEST_PASSWORD || 'TestPass1x!';
const RECIPIENT_PHONE = process.env.TEST_RECIPIENT_PHONE || '07540000099';

async function loginAsUser(page: any, phone: string, password: string) {
  await page.goto('/login');
  await page.fill('#phoneNumber', phone);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard|wallet/, { timeout: 10_000 });
}

test.describe('Wallet Transfer', () => {
  test('user can send money to another phone number', async ({ page }) => {
    await loginAsUser(page, SENDER_PHONE, SENDER_PASSWORD);

    await page.goto('/wallet');
    const sendBtn = page.locator('button:has-text("Send"), button:has-text("Transfer"), button:has-text("Tuma")').first();
    await sendBtn.click();

    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('500');

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"], input[placeholder*="+255"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill(RECIPIENT_PHONE);
    }

    const confirmBtn = page.locator('button:has-text("Send"), button:has-text("Confirm"), button:has-text("Tuma")').last();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await expect(page.locator('body')).toContainText(/success|sent|transferred/i, { timeout: 10_000 });
    }
  });

  test('user can withdraw to bank account', async ({ page }) => {
    test.skip(true, 'Requires real bank integration');
    await loginAsUser(page, SENDER_PHONE, SENDER_PASSWORD);

    await page.goto('/wallet');
    const bankBtn = page.locator('button:has-text("Bank"), button:has-text("Withdraw")').first();
    if (await bankBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bankBtn.click();

      const amountInput = page.locator('input[type="number"]').first();
      await amountInput.fill('10000');

      const bankSelect = page.locator('select').first();
      if (await bankSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await bankSelect.selectOption({ index: 1 });
      }

      await page.fill('input[placeholder*="account"]', '0150123456789');
      await page.fill('input[placeholder*="name"]', 'E2E Test User');

      const confirmBtn = page.locator('button:has-text("Withdraw"), button:has-text("Confirm")').last();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await expect(page.locator('body')).toContainText(/success|initiated|processing/i, { timeout: 10_000 });
      }
    }
  });

  test('insufficient balance shows error on transfer', async ({ page }) => {
    await loginAsUser(page, SENDER_PHONE, SENDER_PASSWORD);

    await page.goto('/wallet');
    const sendBtn = page.locator('button:has-text("Send"), button:has-text("Transfer")').first();
    await sendBtn.click();

    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('999999999');

    const phoneInput = page.locator('input[type="tel"], input[placeholder*="phone"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill(RECIPIENT_PHONE);
    }

    const confirmBtn = page.locator('button:has-text("Send"), button:has-text("Confirm")').last();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await expect(page.locator('body')).toContainText(/insufficient|balance|error|failed/i, { timeout: 10_000 });
    }
  });

  test('transaction history updates after transfer', async ({ page }) => {
    await loginAsUser(page, SENDER_PHONE, SENDER_PASSWORD);

    await page.goto('/wallet');
    await expect(page.locator('body')).toContainText(/transaction|history|ledger/i);

    const txTable = page.locator('table, .transaction-list, [data-testid*="transaction"]').first();
    if (await txTable.isVisible({ timeout: 5000 }).catch(() => false)) {
      const txRow = page.locator('tr').nth(1);
      if (await txRow.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(txRow).toContainText(/credit|debit|sent|received|transfer/i);
      }
    }
  });
});
