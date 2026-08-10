# ADR-0003: Payment providers fail closed when unconfigured

- Status: Accepted
- Date: 2026-08-10
- Decision maker: Platform Council
- Context: Before production payment keys are set, providers behave differently. The **M-Pesa provider** returns a *simulated success* when credentials are missing (`isConfigured === false` → sandbox-style fake `ws_CO_...` reference). The **AzamPay provider** logs an error and returns `FAILED` — it fails closed. Inconsistent behaviour risks letting a staged/accidental environment "accept" money movement that never happened.
- Options considered:
  1. **Make M-Pesa fail closed too** — any attempt to initiate, check, reverse, or disburse when unconfigured returns `FAILED`, exactly like AzamPay.
  2. Keep M-Pesa sandbox simulation — convenient for local demo, but dangerous: a misconfigured production could silently "confirm" payments.
  3. Add an explicit `PAYMENTS_ENABLED` master switch — fails all providers until production keys are present.
- Decision: Adopt **failing closed** as the platform rule: no payment provider ever simulates success. Align M-Pesa's unconfigured paths with AzamPay (return `FAILED` with a clear message). Optionally layer a `PAYMENTS_ENABLED` master switch when the Payments suite reaches L3.
- Consequences:
  - **Already mitigated at the service layer.** `MobileMoneyService.selectProvider` throws `ServiceUnavailableException` in production when a provider is not configured (unless `PAYMENTS_DEMO_MODE=true`). The M-Pesa provider's simulated-success path is therefore only reachable in development or explicit demo mode, and is additionally superseded by ADR-0004 (AzamPay becomes the primary aggregator).
  - Remaining hardening (deferred, low priority): make `MpesaProvider` itself return `FAILED` when unconfigured, for defense in depth if the provider is ever used outside the service guard.
  - Local development must use real sandbox credentials or `PAYMENTS_DEMO_MODE=true` — never implicit simulation in production.
- Constitution check: Trust (Ch4), Security by default (Ch5.1), Product Principle 7.3 "Trust is a product feature" (Ch7).
