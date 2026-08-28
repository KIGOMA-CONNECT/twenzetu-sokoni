# E2E smoke suite (Playwright)

```bash
cd e2e
npm install
npx playwright install chromium

# read-only smoke against local dev (default)
npm run e2e

# against production (read-only specs only — safe, no data created)
E2E_BASE_URL=https://twenzetusokoni.com E2E_API_URL=https://twenzetusokoni.com/api npm run e2e

# full buyer journey (MUTATES DATA — staging/local only)
RUN_BUYER_JOURNEY=1 npm run e2e -- tests/buyer-journey.spec.ts
```

Reports: `npm run e2e:report` (HTML, `playwright-report/`).

## Specs

| File | Mutates data? | Purpose |
|---|---|---|
| `tests/smoke.spec.ts` | No | Up-checks: web renders, `/health` 200, vendors API lists, login rejects bad creds, auth guard redirects |
| `tests/buyer-journey.spec.ts` | Yes (gated) | Register → login → consumer landing (regression guard for the role-routing fix) |
| `tests/vendor-flow.spec.ts` | Yes (gated) | Vendor: register, login, create/view/update products, orders, POS shift & sale |
| `tests/delivery-flow.spec.ts` | Yes (gated) | Driver: register, login, view/accept deliveries, status pipeline, earnings |
| `tests/payment-flow.spec.ts` | Yes (gated) | Wallet top-up, escrow order, payment status, withdrawal, supplier pay |
| `tests/admin-flow.spec.ts` | Yes (gated) | Admin: login, dashboard stats, list/approve/suspend vendors, disputes, audit logs |
| `tests/auth-flow.spec.ts` | Yes (gated) | Register, login, OTP, token refresh, logout, protected routes, password reset |
| `tests/wallet-transfer.spec.ts` | Yes (gated) | Send money, bank withdrawal, insufficient balance error, transaction history |

CI note: this suite runs on-demand/manually; the GitHub Actions gate (`ci.yml`)
covers lint/unit/build. Wire the read-only spec into CI later once a preview
environment exists.
