# ADR-0004: AzamPay as the primary payment aggregator

- Status: Accepted
- Date: 2026-08-10
- Decision maker: Owner + Platform Council
- Context: Production payment credentials are still pending. The chosen path is to use **AzamPay as the single aggregator** that carries all payment methods in Tanzania — M-Pesa, YAS Tanzania (Mixx by Yas), Airtel Money, HaloPesa, T-Pesa, and card — rather than maintaining separate direct integrations with each network.
- Options considered:
  1. **Direct M-Pesa Daraja integration** — one method only, requires its own production go-live, keys, and passkey; does not cover Tigo/Airtel/HaloPesa/card.
  2. **AzamPay as aggregator** — one set of credentials (`AZAMPAY_*`) covering M-Pesa, Mixx by Yas, Tigo Pesa, Airtel Money, HaloPesa, AzamPesa through the MNO checkout, plus card via the AzamPay checkout flow.
  3. Both providers — AzamPay primary, M-Pesa Daraja as fallback.
- Decision: **AzamPay is the primary payment aggregator.** The existing code already supports this: `AZAMPAY_PROVIDER_MAP` in `libs/integrations/src/lib/payments/types.ts` routes all MNO methods to AzamPay, and `MobileMoneyService.selectProvider` prefers AzamPay whenever it is configured. The M-Pesa Daraja provider is retained only as a fallback and is not on the production critical path. Production already fails closed when no provider is configured.
- Consequences:
  - Only one provider configuration is required for launch: the `AZAMPAY_APP_NAME` / `AZAMPAY_CLIENT_ID` / `AZAMPAY_CLIENT_SECRET` / `AZAMPAY_API_KEY` set.
  - **Gap to close:** card payment is not yet routed. Card is a `PaymentChannel`, but `AZAMPAY_PROVIDER_MAP` has no `card` entry and the provider implements the MNO checkout only. When the AzamPay API key arrives, add card checkout (`azampay/checkout` redirect flow) and map `card` accordingly.
  - Webhooks: `/api/webhooks/azampay` becomes the primary callback path; signature verification uses `AZAMPAY_API_KEY` (already implemented).
- Constitution check: Trust (Ch4), Product Principle 7.3 (Ch7), Architecture Principle 6.8 standards over invention (Ch6).
