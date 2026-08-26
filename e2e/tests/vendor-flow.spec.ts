import { expect, test } from '@playwright/test';

// Vendor journey: register â†’ login â†’ products â†’ POS â†’ orders.
// MUTATES DATA â€” staging/local only:
//   RUN_VENDOR_FLOW=1 npx playwright test tests/vendor-flow.spec.ts
const enabled = process.env.RUN_VENDOR_FLOW === '1';

test.skip(!enabled, 'set RUN_VENDOR_FLOW=1 to run the mutating vendor journey');

const VENDOR_PHONE = process.env.TEST_VENDOR_PHONE || `0754${Date.now().toString().slice(-7)}`;
const VENDOR_PASSWORD = process.env.TEST_VENDOR_PASSWORD || 'VendorPass1x!';

test.describe('Vendor Flow', () => {
  test('vendor can register and login', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[type="text"]', 'E2E Vendor Shop');
    await page.fill('input[type="tel"]', VENDOR_PHONE);
    await page.fill('input[type="password"]', VENDOR_PASSWORD);

    await page.selectOption('select', 'vendor');
    await page.fill('input[placeholder*="Business"]', 'E2E Test Market');
    await page.fill('input[placeholder*="RDB"]', `RDB-${Date.now()}`);
    await page.fill('input[placeholder*="Kigali"]', 'Dar es Salaam');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/(login|vendor\/onboarding)/, { timeout: 10_000 });

    if (page.url().includes('/login')) {
      await page.fill('#phoneNumber', VENDOR_PHONE);
      await page.fill('#password', VENDOR_PASSWORD);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/vendor\/(dashboard|onboarding)/, { timeout: 10_000 });
    }
  });

  test('vendor can create a product', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#phoneNumber', process.env.TEST_VENDOR_PHONE || VENDOR_PHONE);
    await page.fill('#password', process.env.TEST_VENDOR_PASSWORD || VENDOR_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/vendor/, { timeout: 10_000 });

    await page.goto('/vendor/products');
    await expect(page.locator('body')).toContainText(/product|bidhaa/i);

    const addBtn = page.locator('button:has-text("Add"), button:has-text("New"), button:has-text("Create")').first();
    await addBtn.click();

    await page.fill('input[placeholder*="name"], input[placeholder*="Name"]', 'E2E Test Product');
    await page.fill('input[type="number"]', '5000');
    await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Create")');

    await expect(page.locator('body')).toContainText(/E2E Test Product|success|created/i, { timeout: 10_000 });
  });

  test('vendor can view their products list', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#phoneNumber', process.env.TEST_VENDOR_PHONE || VENDOR_PHONE);
    await page.fill('#password', process.env.TEST_VENDOR_PASSWORD || VENDOR_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/vendor/, { timeout: 10_000 });

    await page.goto('/vendor/products');
    await expect(page).toHaveURL(/vendor\/products/);
    await expect(page.locator('body')).toContainText(/product|bidhaa|inventory/i);
  });

  test('vendor can update product price', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#phoneNumber', process.env.TEST_VENDOR_PHONE || VENDOR_PHONE);
    await page.fill('#password', process.env.TEST_VENDOR_PASSWORD || VENDOR_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/vendor/, { timeout: 10_000 });

    await page.goto('/vendor/products');
    const editBtn = page.locator('button:has-text("Edit"), button:has-text("Sasisha"), [data-testid="edit-product"]').first();
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click();
      const priceInput = page.locator('input[type="number"]').first();
      await priceInput.fill('7500');
      await page.click('button[type="submit"], button:has-text("Save"), button:has-text("Update")');
      await expect(page.locator('body')).toContainText(/saved|updated|success/i, { timeout: 10_000 });
    }
  });

  test('vendor can view incoming orders', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#phoneNumber', process.env.TEST_VENDOR_PHONE || VENDOR_PHONE);
    await page.fill('#password', process.env.TEST_VENDOR_PASSWORD || VENDOR_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/vendor/, { timeout: 10_000 });

    await page.goto('/vendor/orders');
    await expect(page).toHaveURL(/vendor\/orders/);
    await expect(page.locator('body')).toContainText(/order|maagizo/i);
  });

  test('vendor can open a POS shift', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#phoneNumber', process.env.TEST_VENDOR_PHONE || VENDOR_PHONE);
    await page.fill('#password', process.env.TEST_VENDOR_PASSWORD || VENDOR_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/vendor/, { timeout: 10_000 });

    await page.goto('/vendor/pos');
    await expect(page).toHaveURL(/vendor\/pos/);

    const openShiftBtn = page.locator('button:has-text("Open"), button:has-text("Start"), button:has-text("Shift")').first();
    if (await openShiftBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await openShiftBtn.click();
      await expect(page.locator('body')).toContainText(/shift|open|active/i, { timeout: 10_000 });
    }
  });

  test('vendor can create a POS sale', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#phoneNumber', process.env.TEST_VENDOR_PHONE || VENDOR_PHONE);
    await page.fill('#password', process.env.TEST_VENDOR_PASSWORD || VENDOR_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/vendor/, { timeout: 10_000 });

    await page.goto('/vendor/pos');
    await expect(page).toHaveURL(/vendor\/pos/);

    const productTile = page.locator('[style*="cursor: pointer"]').first();
    if (await productTile.isVisible({ timeout: 5000 }).catch(() => false)) {
      await productTile.click();
      const payBtn = page.locator('button:has-text("Pay"), button:has-text("Cash"), button:has-text("Complete")').first();
      if (await payBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await payBtn.click();
        await expect(page.locator('body')).toContainText(/receipt|success|sold|complete/i, { timeout: 10_000 });
      }
    }
  });
});
