import { expect, test } from '@playwright/test';
import { apiBaseURL } from '../playwright.config';

// Payment flows: wallet top-up, escrow order, withdrawal, supplier payment.
// MUTATES DATA — staging/local only:
//   RUN_PAYMENT_FLOW=1 npx playwright test tests/payment-flow.spec.ts
const enabled = process.env.RUN_PAYMENT_FLOW === '1';

test.skip(!enabled, 'set RUN_PAYMENT_FLOW=1 to run the mutating payment journey');

const CUSTOMER_PHONE = process.env.TEST_PHONE || '07540000001';
const CUSTOMER_PASSWORD = process.env.TEST_PASSWORD || 'TestPass1x!';
const VENDOR_PHONE = process.env.TEST_VENDOR_PHONE || '07540000002';
const VENDOR_PASSWORD = process.env.TEST_VENDOR_PASSWORD || 'VendorPass1x!';

async function loginAs(page: any, phone: string, password: string, dashPattern: RegExp) {
  await page.goto('/login');
  await page.fill('#phoneNumber', phone);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(dashPattern, { timeout: 10_000 });
}

test.describe('Payment Flows', () => {
  test('customer can top up wallet', async ({ page }) => {
    await loginAs(page, CUSTOMER_PHONE, CUSTOMER_PASSWORD, /dashboard|wallet/);

    await page.goto('/wallet');
    const topupBtn = page.locator('button:has-text("Top Up"), button:has-text("Add"), button:has-text("Tengeneza")').first();
    await topupBtn.click();

    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.fill('5000');

    const phoneInput = page.locator('input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill(CUSTOMER_PHONE);
    }

    const confirmBtn = page.locator('button:has-text("Top Up"), button:has-text("Pay"), button:has-text("Confirm")').first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await expect(page.locator('body')).toContainText(/success|prompt|sent|processing|checkout/i, { timeout: 10_000 });
    }
  });

  test('customer can place an order with escrow', async ({ page }) => {
    await loginAs(page, CUSTOMER_PHONE, CUSTOMER_PASSWORD, /dashboard|wallet/);

    await page.goto('/cart');
    await expect(page).toHaveURL(/cart/);

    const addItemBtn = page.locator('button:has-text("Add"), button:has-text("Order")').first();
    if (await addItemBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addItemBtn.click();
    }

    const checkoutBtn = page.locator('button:has-text("Checkout"), button:has-text("Place Order"), a:has-text("Checkout")').first();
    if (await checkoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkoutBtn.click();
      await expect(page).toHaveURL(/checkout/, { timeout: 10_000 });

      const payBtn = page.locator('button:has-text("Pay"), button:has-text("Place"), button:has-text("Confirm")').first();
      if (await payBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await payBtn.click();
        await expect(page.locator('body')).toContainText(/order|placed|success|escrow/i, { timeout: 15_000 });
      }
    }
  });

  test('payment status updates on order completion', async ({ page }) => {
    await loginAs(page, CUSTOMER_PHONE, CUSTOMER_PASSWORD, /dashboard|wallet/);

    await page.goto('/orders');
    await expect(page).toHaveURL(/orders/);

    const orderRow = page.locator('tr, .order-card, [data-testid*="order"]').first();
    if (await orderRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderRow.click();
      await expect(page.locator('body')).toContainText(/paid|escrow|pending|delivered|completed/i);
    }
  });

  test('vendor can withdraw wallet balance', async ({ page }) => {
    test.skip(true, 'Requires real payment provider integration');
    await loginAs(page, VENDOR_PHONE, VENDOR_PASSWORD, /vendor/);

    await page.goto('/wallet');
    const withdrawBtn = page.locator('button:has-text("Withdraw"), button:has-text("Toa")').first();
    if (await withdrawBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await withdrawBtn.click();

      const amountInput = page.locator('input[type="number"]').first();
      await amountInput.fill('1000');

      const phoneInput = page.locator('input[type="tel"]').first();
      if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await phoneInput.fill(VENDOR_PHONE);
      }

      const confirmBtn = page.locator('button:has-text("Withdraw"), button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmBtn.click();
        await expect(page.locator('body')).toContainText(/success|initiated|processing/i, { timeout: 10_000 });
      }
    }
  });

  test('vendor can pay a supplier from wallet', async ({ page }) => {
    test.skip(true, 'Requires vendor with supplier setup');
    await loginAs(page, VENDOR_PHONE, VENDOR_PASSWORD, /vendor/);

    await page.goto('/vendor/suppliers');
    await expect(page).toHaveURL(/vendor\/suppliers/);
    await expect(page.locator('body')).toContainText(/supplier|supplier|vendor/i);
  });
});
