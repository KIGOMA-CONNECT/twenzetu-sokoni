import { expect, test } from '@playwright/test';

// Admin operations: dashboard, vendors, disputes, audit logs.
// MUTATES DATA â€” staging/local only:
//   RUN_ADMIN_FLOW=1 npx playwright test tests/admin-flow.spec.ts
const enabled = process.env.RUN_ADMIN_FLOW === '1';

test.skip(!enabled, 'set RUN_ADMIN_FLOW=1 to run the mutating admin journey');

const ADMIN_PHONE = process.env.TEST_ADMIN_PHONE || '07540000010';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'AdminPass1x!';

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.fill('#phoneNumber', ADMIN_PHONE);
  await page.fill('#password', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/admin/, { timeout: 10_000 });
}

test.describe('Admin Flow', () => {
  test('admin can login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#phoneNumber', ADMIN_PHONE);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/admin\/dashboard/, { timeout: 10_000 });
  });

  test('admin can view dashboard stats', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/admin\/dashboard/);
    await expect(page.locator('.stat-card, .stat-value, .stat-label').first()).toBeVisible();
    await expect(page.locator('body')).toContainText(/vendor|order|revenue|customer|dashboard/i);
  });

  test('admin can list vendors', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/vendors');
    await expect(page).toHaveURL(/admin\/vendors/);
    await expect(page.locator('body')).toContainText(/vendor|business/i);
  });

  test('admin can approve or suspend a vendor', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/vendors');
    const vendorRow = page.locator('tr, .vendor-card, [data-testid*="vendor"]').first();
    if (await vendorRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await vendorRow.click();

      const approveBtn = page.locator('button:has-text("Approve"), button:has-text("Activate"), button:has-text("Suspend")').first();
      if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await approveBtn.click();
        await expect(page.locator('body')).toContainText(/approved|suspended|updated|success/i, { timeout: 10_000 });
      }
    }
  });

  test('admin can view disputes', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/disputes');
    await expect(page).toHaveURL(/admin\/disputes/);
    await expect(page.locator('body')).toContainText(/dispute|tagozo|complaint/i);
  });

  test('admin can view audit logs', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/audit-log');
    await expect(page).toHaveURL(/admin\/audit-log/);
    await expect(page.locator('body')).toContainText(/audit|log|activity|action/i);
  });
});
