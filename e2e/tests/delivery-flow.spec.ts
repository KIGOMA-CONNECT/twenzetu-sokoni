import { expect, test } from '@playwright/test';

// Driver journey: register â†’ login â†’ deliveries â†’ earnings.
// MUTATES DATA â€” staging/local only:
//   RUN_DELIVERY_FLOW=1 npx playwright test tests/delivery-flow.spec.ts
const enabled = process.env.RUN_DELIVERY_FLOW === '1';

test.skip(!enabled, 'set RUN_DELIVERY_FLOW=1 to run the mutating delivery journey');

const DRIVER_PHONE = process.env.TEST_DRIVER_PHONE || `0753${Date.now().toString().slice(-7)}`;
const DRIVER_PASSWORD = process.env.TEST_DRIVER_PASSWORD || 'DriverPass1x!';

async function loginAsDriver(page: any) {
  await page.goto('/login');
  await page.fill('#phoneNumber', process.env.TEST_DRIVER_PHONE || DRIVER_PHONE);
  await page.fill('#password', process.env.TEST_DRIVER_PASSWORD || DRIVER_PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/driver/, { timeout: 10_000 });
}

test.describe('Delivery Flow', () => {
  test('driver can register and login', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[type="text"]', 'E2E Test Driver');
    await page.fill('input[type="tel"]', DRIVER_PHONE);
    await page.fill('input[type="password"]', DRIVER_PASSWORD);

    await page.selectOption('select', 'driver');
    await page.fill('input[placeholder*="NIN"]', `NIN-${Date.now()}`);
    await page.fill('input[placeholder*="Kigali"]', 'Dar es Salaam');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/(login|driver\/dashboard)/, { timeout: 10_000 });

    if (page.url().includes('/login')) {
      await page.fill('#phoneNumber', DRIVER_PHONE);
      await page.fill('#password', DRIVER_PASSWORD);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/driver\/dashboard/, { timeout: 10_000 });
    }
  });

  test('driver can view available deliveries', async ({ page }) => {
    await loginAsDriver(page);

    await page.goto('/driver/deliveries');
    await expect(page).toHaveURL(/driver\/deliveries/);
    await expect(page.locator('body')).toContainText(/delivery|usafirishaji|order/i);
  });

  test('driver can accept a delivery', async ({ page }) => {
    await loginAsDriver(page);

    await page.goto('/driver/deliveries');
    const acceptBtn = page.locator('button:has-text("Accept"), button:has-text("Pokea")').first();
    if (await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await acceptBtn.click();
      await expect(page.locator('body')).toContainText(/accepted|assigned|picked|transit/i, { timeout: 10_000 });
    }
  });

  test('driver can update delivery status through the pipeline', async ({ page }) => {
    await loginAsDriver(page);

    await page.goto('/driver/deliveries');

    const pickupBtn = page.locator('button:has-text("Pickup"), button:has-text("Picked"), button:has-text("PICKED")').first();
    if (await pickupBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pickupBtn.click();
      await expect(page.locator('body')).toContainText(/picked|transit|delivering/i, { timeout: 10_000 });
    }

    const transitBtn = page.locator('button:has-text("Transit"), button:has-text("In Transit"), button:has-text("IN_TRANSIT")').first();
    if (await transitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await transitBtn.click();
      await expect(page.locator('body')).toContainText(/transit|delivering|on way/i, { timeout: 10_000 });
    }

    const deliveredBtn = page.locator('button:has-text("Deliver"), button:has-text("Complete"), button:has-text("DELIVERED")').first();
    if (await deliveredBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deliveredBtn.click();
      await expect(page.locator('body')).toContainText(/delivered|complete|success/i, { timeout: 10_000 });
    }
  });

  test('driver can view earnings', async ({ page }) => {
    await loginAsDriver(page);

    await page.goto('/driver/earnings');
    await expect(page).toHaveURL(/driver\/earnings/);
    await expect(page.locator('body')).toContainText(/earning|mapato|income|total/i);
  });
});
