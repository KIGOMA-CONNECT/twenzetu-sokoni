# Payments & SMS Readiness

How to take AfriMarket from sandbox to production payments and SMS. This is the checklist for advancing the **Payments** suite from L2 → L4 and enabling OTP SMS delivery.

**Payment strategy (ADR-0004): AzamPay is the single payment aggregator.** One AzamPay API key covers M-Pesa, YAS Tanzania (Mixx by Yas), Airtel Money, HaloPesa, T-Pesa, and AzamPesa. We are waiting for the production AzamPay API key; no payment code changes are needed to launch except the card checkout gap below.

## Current state (what is already built)

| Capability | Status |
|---|---|
| AzamPay provider (MNO checkout, transfers/reversals, callback verification) | Built — `libs/integrations/src/lib/payments/azampay.provider.ts` |
| Provider routing table (M-Pesa, Mixx by Yas, Tigo Pesa, Airtel Money, HaloPesa, AzamPesa → AzamPay) | Built — `AZAMPAY_PROVIDER_MAP` in `types.ts` |
| Router prefers AzamPay whenever configured; production fails closed if unconfigured | Built — `MobileMoneyService.selectProvider` |
| Webhook controllers (AzamPay, M-Pesa, Tigo Pesa, MTN MoMo, internal top-up confirm) | Built — `libs/marketplace/api/src/lib/webhooks.controller.ts` |
| Wallet top-ups + pending claim/dedup | Built (DB `wallet_topup_requests`, `creditWallet`) |
| Payment timeout scheduler | Built — `apps/api/src/app/scheduler/payment-timeout.service.ts` |
| SMS provider adapters (Africa's Talking, Twilio, Termii) + per-country routing | Built — `libs/integrations/src/lib/sms/` |
| OTP login via SMS | Built — auth flow calls `smsService.sendOtp` |

## What blocks production

1. **The AzamPay production API key** — the only payment credential required (covers all MNO methods). AzamPay env vars are empty in production.
2. **Card checkout (gap to close).** Card is a supported `PaymentChannel`, but the AzamPay provider currently implements only the MNO checkout. When the API key arrives, add the AzamPay **card checkout** (`azampay/checkout` redirect flow) and map `card` in `AZAMPAY_PROVIDER_MAP`.
3. **SMS provider credentials** — `AT_API_KEY`, `TWILIO_*`, or `TERMII_API_KEY` are empty; OTP cannot be delivered in production.
4. **M-Pesa Daraja is NOT required.** The direct M-Pesa provider remains only as an optional fallback (see ADR-0004). Production already fails closed when AzamPay is unconfigured.

## Credentials you must gather

### AzamPay (the one you are waiting for)
Register at the AzamPay merchant portal and request production access. Covers: M-Pesa, YAS Tanzania (Mixx by Yas), Airtel Money, HaloPesa, T-Pesa, AzamPesa, and card.

| Env var | What it is |
|---|---|
| `AZAMPAY_APP_NAME` | Registered app name |
| `AZAMPAY_CLIENT_ID` | Client ID |
| `AZAMPAY_CLIENT_SECRET` | Client secret |
| `AZAMPAY_API_KEY` | X-API-Key used to verify callbacks |
| `AZAMPAY_CALLBACK_URL` | → `https://twenzetusokoni.com/api/webhooks/azampay` |
| `AZAMPAY_ENVIRONMENT` | `sandbox` → `production` |

### SMS provider (choose one; we already support Africa's Talking, Twilio, Termii)
Recommendation for Tanzania: **Africa's Talking** (local, good rates) or **Termii**. Current default routing: `SMS_PROVIDER_TZ=termii`.

| Provider | Env vars |
|---|---|
| Africa's Talking | `AT_API_KEY`, `AT_USERNAME`, `AT_SENDER_ID`, `AT_ENVIRONMENT` (sandbox → production) |
| Twilio | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` |
| Termii | `TERMII_API_KEY` |

Routing: `SMS_PROVIDER_DEFAULT`, `SMS_PROVIDER_TZ`, `SMS_PROVIDER_NG`, `SMS_DEFAULT_COUNTRY`.

## Cutover checklist

1. **Receive the AzamPay production API key.** Add the six `AZAMPAY_*` values to the server's `/opt/afri-market/.env.production` (never commit them; the file is gitignored). Set `AZAMPAY_ENVIRONMENT=production`.
2. **Close the card gap.** Implement AzamPay card checkout and map `card` in `AZAMPAY_PROVIDER_MAP` (small, tested change to `libs/integrations`). Deploy.
3. **Register the callback.** Point the AzamPay dashboard at `https://twenzetusokoni.com/api/webhooks/azampay`.
4. **Sandbox verification (staging).** Put sandbox credentials in staging, run an end-to-end MNO checkout + callback, confirm wallet credit. Repeat per method (M-Pesa, Mixx by Yas, Airtel Money, HaloPesa, T-Pesa).
5. **Card verification.** Complete a card checkout end-to-end; confirm the redirect flow and callback.
6. **Real transaction.** Small real STK push → webhook → `confirmPayment` → order status updated; wallet top-up credited; duplicate webhook calls do **not** double-credit (dedup already implemented).
7. **Reconciliation.** Compare AzamPay statements vs. DB payment records for a week before enabling vendor disbursement.
8. **Vendor payouts.** Enable transfers/disbursement only after reconciliation is green.
9. **Enable OTP SMS.** Add SMS provider keys; verify an OTP login on a real number in production.

## Post-cutover monitoring

- Watch `/api/metrics` + payment logs for failed checkouts and callback signature mismatches.
- Alert on: payments stuck in `INITIATED`, callback failures, webhook 401s (signature mismatch).
- Record the maturity change (Payments **L2 → L4**) as an ADR with evidence per the [roadmap](roadmap.md).

## Related

- [ADR-0004 — AzamPay as the primary payment aggregator](adr/ADR-0004-azampay-primary-aggregator.md)
- [ADR-0003 — Payment providers fail closed](adr/ADR-0003-payments-fail-closed.md)
- [Constitution, Chapter 7 — Product Principles (7.3 Trust)](constitution/07-product-principles.md)
- [Roadmap — Horizon 1](roadmap.md)
