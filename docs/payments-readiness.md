# Payments & SMS Readiness

How to take AfriMarket from sandbox to production payments and SMS. This is the checklist for advancing the **Payments** suite from L2 → L4 and enabling OTP SMS delivery.

## Current state (what is already built)

| Capability | Status |
|---|---|
| M-Pesa provider (STK Push, status query, reversal, B2C) | Built — `libs/integrations/src/lib/payments/mpesa.provider.ts` |
| AzamPay provider (MNO checkout for M-Pesa/Tigo/Airtel/HaloPesa/AzamPesa, transfers) | Built — `azampay.provider.ts` |
| Webhook controllers (M-Pesa, AzamPay, Tigo Pesa, MTN MoMo, internal top-up confirm) | Built — `libs/marketplace/api/src/lib/webhooks.controller.ts` |
| Wallet top-ups + pending claim/dedup | Built (DB `wallet_topup_requests`, `creditWallet`) |
| Payment timeout scheduler | Built — `apps/api/src/app/scheduler/payment-timeout.service.ts` |
| SMS provider adapters (Africa's Talking, Twilio, Termii) + per-country routing | Built — `libs/integrations/src/lib/sms/` |
| OTP login via SMS | Built — auth flow calls `smsService.sendOtp` |

## What blocks production

1. **No M-Pesa or AzamPay production credentials** — provider env vars are empty in production (the Payments suite is at L2).
2. **No SMS provider credentials** — `AT_API_KEY`, `TWILIO_*`, `TERMII_API_KEY` are empty; OTP cannot be delivered in production.
3. **Provider behaviour rule (ADR-0003):** providers must **fail closed** when unconfigured. M-Pesa still returns a simulated success when unconfigured — align it to fail closed (AzamPay already does) before going live.

## Credentials you must gather

### M-Pesa (Safaricom Daraja, Tanzania)
Register at the Safaricom/Daraja developer portal and request a **production** go-live (requires business documents). You need:

| Env var | What it is | Where from |
|---|---|---|
| `MPESA_CONSUMER_KEY` | API consumer key | Daraja app credentials |
| `MPESA_CONSUMER_SECRET` | API consumer secret | Daraja app credentials |
| `MPESA_SHORTCODE` | Paybill/Buy-Goods till (e.g. `174379` is the sandbox one) | Your approved paybill |
| `MPESA_PASSKEY` | STK push passkey (Lipa na MPESA Online) | Daraja app |
| `MPESA_CALLBACK_URL` | Public HTTPS endpoint → `/api/webhooks/mpesa` | Your domain (set `https://twenzetusokoni.com/api/webhooks/mpesa`) |
| `MPESA_ENVIRONMENT` | `sandbox` → `production` | — |

Notes:
- Callback must be publicly reachable and HTTPS.
- Test in sandbox first with sandbox test numbers; then switch `MPESA_ENVIRONMENT=production`.
- The STK push amount is TZS; `TransactionType: CustomerBuyGoodsOnline`.

### AzamPay (Tanzania, supports M-Pesa/Tigo/Airtel/HaloPesa/AzamPesa)
Register at the AzamPay merchant portal and request production access.

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

1. **Fail-closed change (ADR-0003).** Align `MpesaProvider` unconfigured paths with AzamPay (return `FAILED`, never simulate). Add tests. Deploy.
2. **Sandbox verification (staging).** Put sandbox credentials in staging `.env`, run an end-to-end STK push + callback, confirm wallet credit. Same for AzamPay sandbox.
3. **Production credentials.** Add production keys to the server's `/opt/afri-market/.env.production` (never commit them; the file is gitignored). Set `MPESA_ENVIRONMENT=production`, `AZAMPAY_ENVIRONMENT=production`.
4. **Callbacks.** Ensure both provider dashboards are pointed at `https://twenzetusokoni.com/api/webhooks/mpesa` and `.../azampay`. Test by triggering a small real transaction.
5. **Verify callbacks end-to-end.** Real STK push → webhook → `confirmPayment` → order status updated; wallet top-up credited; duplicate webhook calls do **not** double-credit (dedup already implemented).
6. **Reconciliation.** Compare provider statements vs. DB payment records for a week before enabling vendor disbursement.
7. **Vendor payouts.** Enable B2C/transfer disbursement only after reconciliation is green.
8. **Enable OTP SMS.** Add SMS provider keys; verify an OTP login on a real number in production.

## Post-cutover monitoring

- Watch `/api/metrics` + payment logs for failed STK pushes and callback signature mismatches.
- Alert on: payments stuck in `INITIATED`, callback failures, webhook 401s.
- Record the maturity change (Payments **L2 → L4**) as an ADR with evidence per the [roadmap](roadmap.md).

## Related

- [ADR-0003 — Payment providers fail closed](adr/ADR-0003-payments-fail-closed.md)
- [Constitution, Chapter 7 — Product Principles (7.3 Trust)](constitution/07-product-principles.md)
- [Roadmap — Horizon 1](roadmap.md)
