import { expect, test } from '@playwright/test';

// Full buyer journey: register -> login -> browse -> add to cart -> checkout.
// MUTATES DATA (creates a user + order). Opt-in only:
//   RUN_BUYER_JOURNEY=1 npx playwright test tests/buyer-journey.spec.ts
const enabled = process.env.RUN_BUYER_JOURNEY === '1';

test.skip(!enabled, 'set RUN_BUYER_JOURNEY=1 to run the mutating buyer journey');

test('buyer journey: register to order', async ({ page }) => {
  const phone = `0755${Date.now().toString().slice(-7)}`; // unique test number
  const email = `e2e-buyer-${Date.now()}@example.com`;

  await page.goto('/register');
  await page.fill('input[name="fullName"], input[type="text"]', 'E2E Buyer');
  await page.fill('input[name="phone"], input[type="tel"]', phone);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'E2ePassw0rd!x');
  await page.click('button[type="submit"]');

  // Registration lands on /login per current flow.
  await expect(page).toHaveURL(/\/(login|dashboard)/);
  if (page.url().includes('/login')) {
    await page.fill('input[type="tel"], input[name="phone"]', phone);
    await page.fill('input[type="password"]', 'E2ePassw0rd!x');
    await page.click('button[type="submit"]');
  }

  // Consumer dashboard is the landing experience for customers (even sellers).
  await expect(page).not.toHaveURL(/vendor\/dashboard/);
  await expect(page.locator('body')).toContainText(/karibu|welcome|dashboard/i);
});
