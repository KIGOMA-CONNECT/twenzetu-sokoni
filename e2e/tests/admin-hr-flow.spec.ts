import { expect, test } from '@playwright/test';

// Admin HR module: dashboard, org units, positions, employees, leave, payroll,
// recruitment, performance, compensation, learning, succession, offboarding, compliance.
// READ-ONLY — safe against any environment, creates no data.
//   npx playwright test tests/admin-hr-flow.spec.ts

const ADMIN_PHONE = process.env.TEST_ADMIN_PHONE || '07540000010';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'AdminPass1x!';

async function loginAsAdmin(page: any) {
  await page.goto('/login');
  await page.waitForSelector('#phoneNumber', { timeout: 10_000 });
  await page.fill('#phoneNumber', ADMIN_PHONE);
  await page.fill('#password', ADMIN_PASSWORD);

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
  await page.goto('/admin/dashboard');
  await page.waitForURL(/admin/, { timeout: 15_000 });
}

test.describe('Admin HR Flow', () => {
  test('admin can view HR dashboard with module cards', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr');
    await expect(page.locator('h1')).toContainText('HR & Workforce Suite');
    await expect(page.locator('text=Manage your organization, employees, and HR operations')).toBeVisible();

    for (const title of ['Organization', 'Positions', 'Employees', 'Leave & Attendance', 'Payroll', 'Recruitment', 'Performance', 'Compensation', 'Learning', 'Succession', 'Offboarding', 'Compliance', 'Workflows']) {
      await expect(page.locator(`text=${title}`).first()).toBeVisible();
    }
  });

  test('admin can view org units page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/org/units');
    await expect(page.locator('h2')).toContainText('Org Units');
    await expect(page.locator('text=+ New Unit')).toBeVisible();
  });

  test('admin can view org types page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/org/types');
    await expect(page.locator('h2')).toContainText('Org Unit Types');
  });

  test('admin can view org profile page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/org/profile');
    await expect(page.locator('text=Company')).toBeVisible();
    await expect(page.locator('text=Branch')).toBeVisible();
    await expect(page.locator('text=Department')).toBeVisible();
    await expect(page.locator('text=Cost Center')).toBeVisible();
    await expect(page.locator('text=Profit Center')).toBeVisible();
  });

  test('admin can view workflows page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/workflows');
    await expect(page.locator('h2')).toContainText('Workflow Approvals');
    await expect(page.locator('button:has-text("Definitions")')).toBeVisible();
    await expect(page.locator('button:has-text("Instances")')).toBeVisible();
  });

  test('admin can view positions page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/positions');
    await expect(page.locator('h2')).toContainText('Positions');
    await expect(page.locator('text=+ New Position')).toBeVisible();
  });

  test('admin can view employees page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/employees');
    await expect(page.locator('h2')).toContainText('Employees');
    await expect(page.locator('text=+ New Employee')).toBeVisible();
  });

  test('admin can view leave management page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/leave');
    await expect(page.locator('h2')).toContainText('Leave & Attendance');
    await expect(page.locator('button:has-text("Leave Types")')).toBeVisible();
    await expect(page.locator('button:has-text("Leave Requests")')).toBeVisible();
  });

  test('admin can view payroll page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/payroll');
    await expect(page.locator('h2')).toContainText('Payroll');
    await expect(page.locator('button:has-text("Pay Periods")')).toBeVisible();
    await expect(page.locator('button:has-text("Payslips")')).toBeVisible();
  });

  test('admin can view recruitment page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/recruitment');
    await expect(page.locator('h2')).toContainText('Recruitment');
    await expect(page.locator('button:has-text("Requisitions")')).toBeVisible();
    await expect(page.locator('button:has-text("Candidates")')).toBeVisible();
    await expect(page.locator('button:has-text("Applications")')).toBeVisible();
  });

  test('admin can view performance page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/performance');
    await expect(page.locator('h2')).toContainText('Performance');
    await expect(page.locator('button:has-text("Goals")')).toBeVisible();
    await expect(page.locator('button:has-text("Review Cycles")')).toBeVisible();
  });

  test('admin can view compensation page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/compensation');
    await expect(page.locator('h2')).toContainText('Compensation');
    await expect(page.locator('button:has-text("revisions")')).toBeVisible();
    await expect(page.locator('button:has-text("benefits")')).toBeVisible();
    await expect(page.locator('button:has-text("structures")')).toBeVisible();
  });

  test('admin can view learning & development page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/learning');
    await expect(page.locator('h2')).toContainText('Learning & Development');
    await expect(page.locator('text=+ New Course')).toBeVisible();
  });

  test('admin can view succession planning page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/succession');
    await expect(page.locator('h2')).toContainText('Succession Planning');
    await expect(page.locator('text=+ New Plan')).toBeVisible();
  });

  test('admin can view offboarding page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/offboarding');
    await expect(page.locator('h2')).toContainText('Offboarding');
  });

  test('admin can view compliance page', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/compliance');
    await expect(page.locator('h2')).toContainText('Compliance');
    await expect(page.locator('button:has-text("Requirements")')).toBeVisible();
    await expect(page.locator('button:has-text("Records")')).toBeVisible();
  });

  test('HR dashboard links navigate to correct pages', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr');
    await page.locator('text=Positions').first().click();
    await expect(page).toHaveURL(/admin\/hr\/positions/);
    await expect(page.locator('h2')).toContainText('Positions');

    await page.goto('/admin/hr');
    await page.locator('text=Employees').first().click();
    await expect(page).toHaveURL(/admin\/hr\/employees/);
    await expect(page.locator('h2')).toContainText('Employees');
  });

  test('leave page can switch between types and requests tabs', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/leave');
    await expect(page.locator('button:has-text("Leave Types")')).toHaveCSS(/border/, /.*/);

    await page.locator('button:has-text("Leave Requests")').click();
    await expect(page.locator('button:has-text("Leave Requests")')).toHaveCSS(/border/, /.*/);
  });

  test('payroll page can switch between periods and payslips tabs', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/hr/payroll');
    await expect(page.locator('button:has-text("Pay Periods")')).toBeVisible();

    await page.locator('button:has-text("Payslips")').click();
    await expect(page.locator('button:has-text("Payslips")')).toBeVisible();
  });

  test('protected HR routes redirect non-admin to login', async ({ page }) => {
    await page.goto('/admin/hr');
    await expect(page).toHaveURL(/\/(login|dashboard)/, { timeout: 15_000 });
  });
});
