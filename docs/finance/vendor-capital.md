# Vendor Capital — Merchant Financing Design

Design study grounded in Amazon Lending, Shopify Capital, PayPal Working Capital, Payoneer
Capital Advance, and Alibaba Pay Later, mapped onto afriMarket's existing finance foundation
(`micro_loans`, `credit_scores`, wallets, settlement pipeline).

Status: **proposal** · Owner: Platform finance + marketplace engineering

## 0. Scope decision (ratified)

Of the two product shapes in §3.1, afriMarket ships **one**:

| Feature | Decision | Why |
| --- | --- | --- |
| `CAPITAL_ADVANCE` (flat fee, repaid as % of each settlement) | **Build — flagship** | Rides the existing `PayoutSettlementService` rail; repayment is automatic and cash-flow-matched; zero collections burden. This is the Shopify/PayPal/Payoneer model that fits a marketplace with controlled settlements. |
| `WORKING_CAPITAL_LOAN` (classic term loan) | **Cut** | Duplicates the existing `micro_loans` product; manual calendar repayment reintroduces the default/collections problem we are trying to avoid. Vendors needing term loans keep using micro-loans. |
| Offer engine (score ≥ 55 + 90-day GMV, tier caps) | **Keep** | Core of the "offer-driven, not application-driven" lesson. |
| Flat-fee tiers by score band (18% / 14% / 10%) | **Keep as placeholders** | Tune with pilot data before public launch (§6). |
| Concentration caps + 21-day zero-settlement REVIEW floor | **Keep** | Cheap risk controls, high value. |
| Driver advances | **Defer** | No driver settlement rail yet; revisit after driver payout automation. |
| External funding partner | **Defer to P4 / separate ADR** | Regulatory posture first (§3.6). |

Net effect: one product, one rail, no new repayment UX — the smallest surface that
delivers the reference model's economics.

---

## 1. Reference programs — what they actually do

| Program | Product shape | Eligibility | Repayment | Fee structure | Decision speed |
| --- | --- | --- | --- | --- | --- |
| **Amazon Lending** | Invite-only working-capital offers shown in Seller Central | Sales history on Amazon | **Fixed % deducted from sales proceeds** | Fixed fee (not APR), no prepayment penalty | Pre-qualified; click-to-accept |
| **Shopify Capital** | Merchant cash advance / loan in Shopify admin | Store sales via Shopify Payments | **% of daily sales auto-deducted** from future settlements | Single flat fee ("pay back X, get Y"), no interest, no late fees | Pre-qualified offers in minutes |
| **PayPal Working Capital** | Loan based on PayPal sales history | PayPal transaction history | **% of PayPal sales** auto-deducted until repaid | Single flat fee, no APR, no credit check | Instant offer |
| **Payoneer Capital Advance** | Advance to marketplace sellers | Marketplace sales/receipts via Payoneer | **% of marketplace receipts** auto-deducted | Flat fee, automatic daily deduction | Fast; tied to active selling |
| **Alibaba Pay Later (Ant)** | B2B buy-now-pay-later credit line | Transaction history on Alibaba | Installments / deferred payment at checkout | Interest + late-fee model, credit lines | Credit check (Ant scoring) |

### The five lessons that carry over
1. **Offer-driven, not application-driven.** The platform pre-qualifies from *its own*
   transaction data and pushes an offer. This inverts the risk (only vendors with proven
   cash flow get offers) and removes friction (no forms, no paperwork).
2. **Repayment rides the settlement rail.** Deduct a fixed % from each future settlement,
   not on a fixed calendar schedule. Repayment matches the vendor's actual cash flow, which
   is what makes default rare (Shopify/PayPal/Payoneer all do this).
3. **Flat fee, not APR.** Sellers understand "borrow 1,000,000 TZS, pay back 1,120,000 TZS
   via 8% of each settlement." No compounding, no late fees → trust + clarity.
4. **Behavioral credit, not bureau credit.** The credit score comes from platform signals:
   sales volume, on-time deliveries, disputes, account age. afriMarket already has a
   `credit_scores` table built exactly for this.
5. **Fast and self-serve.** Offer appears in the console; accept → money disbursed to the
   wallet within hours. No human underwriting for small tickets.

---

## 2. Current state in afriMarket (what we already have)

The foundation exists — it just models a *traditional* micro-loan, not the offer-driven
MCA described above.

| Capability | Where | Notes |
| --- | --- | --- |
| Loan records | `micro_loans` table + `MicroLoan` aggregate (`libs/marketplace/domain/src/lib/finance/micro-loan.aggregate.ts`) | Statuses PENDING → APPROVED → DISBURSED → REPAYING → REPAID/COMPLETED/DEFAULTED; daily-repayment math |
| Credit scoring | `credit_scores` table + `CreditScore.calculateScore()` | Score from transactions, revenue, account age, missed deliveries, disputes |
| Loan APIs | `FinanceController` (`POST /finance/loans`, `GET /finance/loans/me`, `GET /finance/credit-score`, `POST /finance/loans/:id/repay`) | Application-driven; hardcodes 30 days, 10% rate, daily = amount/30 |
| Loan types | `LoanType = STOCK_FLOAT / FUEL_LOAN / REPAIR_LOAN / WORKING_CAPITAL` | Vendor and driver borrower types supported |
| Reminders | `LoanReminderService` cron (daily 9AM) | Currently only logs; no push/SMS routing |
| Settlements | `CommissionSweepService` (every 10 min) + `PayoutSettlementService` | `payments.RELEASED` → commission logged → `vendor_net` → wallet → withdrawal |

### Gaps vs. the reference model
1. **Application-driven, not offer-driven.** The vendor must call `POST /finance/loans` and
   name their own amount/terms — the platform doesn't say "you qualify for X."
2. **Repayment is manual.** `POST /finance/loans/:id/repay` — nothing auto-deducts from the
   settlement rail. This is the single biggest structural gap.
3. **Interest-rate framing.** The model charges `interestRate` and fixed daily payments;
   reference programs use a flat fee deducted as a % of sales.
4. **No offer/eligibility engine** exposed to the vendor console, and no admin approval UI
   (aggregate has `approve()`/`disburse()` but no controller wiring).
5. **Loan reminder is a stub** — it queries `status = 'ACTIVE'` which doesn't match the
   aggregate's status vocabulary (PENDING/APPROVED/DISBURSED/...), so it effectively never
   fires.

---

## 3. Target design — "Vendor Capital"

### 3.1 Product model
- **Offer-driven.** A scheduled `VendorCapitalOfferingService` recomputes eligibility per
  vendor (daily or on-demand) and stores offers in a new `capital_offers` table.
- **Two product types** (mirrors Shopify loans + advances):
  - `CAPITAL_ADVANCE` — flat fee (e.g., "borrow 1,000,000, repay 1,120,000"); repayment = X%
    of each settlement until the total is fully repaid.
  - `WORKING_CAPITAL_LOAN` — classic term loan with fixed daily repayment (already supported
    by the `micro_loans` aggregate) for larger tickets.
- **Eligibility** (offer amount sizing) from `credit_scores` + trailing 90-day GMV
  (`payments` RELEASED, vendor_net + commission) + account age:
  - Credit score ≥ 55 → eligible.
  - Offer cap = min(50% of trailing-90-day net revenue, a per-tier ceiling). Payoneer-style
    "up to X% of monthly sales" framing.
- **Flat fee tier** by score band, e.g.:
  - 55–69 → fee 18% of principal
  - 70–84 → fee 14%
  - 85–100 → fee 10%
  (These are placeholders to be validated against default data; the fee is the only revenue
  the program needs to beat the blended cost of funds + expected default.)

### 3.2 Repayment — the critical piece: %-of-settlement auto-deduction
Extend `PayoutSettlementService` (the wallet settle path) so that, **before** a vendor's
wallet balance is zeroed for payout, any active `CAPITAL_ADVANCE` deducts its configured %:

```
settlement_credit  = wallet.balance (pending → balance)
repayment_cut      = min(settlement_credit × repayment_rate, outstanding_balance)
wallet.balance    -= repayment_cut          → paid to vendor
outstanding       -= repayment_cut          → credited to the advance
```

- Enforced with a **row-level lock on the wallet** and the **same `version` optimistic
  concurrency** the wallet already uses, so a concurrent manual repay and the settlement
  sweep can't double-deduct.
- `wallet_transactions` entries of type `loan_repayment` record both sides (settlement cut +
  advance credit) for the audit trail.
- The deduction is **proportional, not cliff**: if a settlement is small, it takes a smaller
  cut; there is never a day the vendor gets zero (unlike fixed daily repayment). This is the
  ShopPay/Payoneer property that keeps default rates low.
- When `outstanding_balance` reaches 0 → status `REPAID` → offering engine may now present a
  *follow-on* offer (renewal), re-using the improved score.

### 3.3 Offer lifecycle & statuses
```
RECOMPUTE (daily, per eligible vendor)
   ↓  creates/updates offer with amount, fee, repayment_rate, expires_at
OFFERED ──accept──▶ ACCEPTED ──disburse──▶ DISBURSED ──settlements──▶ REPAYING ──▶ REPAID
   │                  │                        │
   └──expires──▶ EXPIRED                       └──misses n windows / settles 0──▶ DEFAULTED
```

### 3.4 New/changed surfaces
- **Migration** `capital_offers` (tenant_id, vendor_id, offer_type, principal, flat_fee,
  fee_amount, repayment_rate, status, expires_at, source_score, version) + `repayment_rate`
  on `micro_loans` + a `settlement_cut_total` column.
- **Domain** `CapitalOffer` aggregate + `MicroLoan` gains `repaymentRate` and a
  `recordSettlementCut(amount)` command (repay that keeps `status` REPAYING until 0, sets
  REPAID).
- **Application** `VendorCapitalOfferingService` (compute offers), `AcceptCapitalOfferUseCase`,
  `AdminApproveCapitalOfferUseCase` (reuse existing `approve()`/`disburse()`), extend
  `RepayLoanUseCase` with a settlement-path variant.
- **API** `GET /vendor/capital/offer`, `POST /vendor/capital/offer/:id/accept`,
  admin `GET/POST /admin/capital/offers` (approve/disburse/reject) — mirroring the existing
  admin vendor approve/suspend pattern with **audit logging** (milestone-3 wiring).
- **Vendor console** a "Capital" tab: current offer (amount, fee, % per settlement, ETA to
  repayment), active advance progress bar, history — designed per Part B component patterns.
- **Scheduler** fix `LoanReminderService` status vocabulary and route reminders through the
  notification service (SMS/push) instead of a bare log.
- **Credit score refresh** `CalculateCreditScoreUseCase` currently needs callers to pass
  inputs; add a data-driven recompute that derives them from `payments` + `disputes` +
  `deliveries` so offers are self-service.

### 3.5 Risk & controls
- **Per-window settlement floor:** if a vendor's gross settlement falls to ~0 for 21
  consecutive days while an advance is active → auto-mark `REVIEW` and pause new offers
  (protects follow-on exposure). Default only after the aggregate's `default()` rule fires.
- **Concentration cap:** total active advances ≤ 30% of trailing-90-day revenue; single
  advance ≤ 50% (initial values, tune with data).
- **Fee is the whole price:** no interest compounding, no late fees — matches reference
  programs and keeps the product compliant-simple.
- **Audit trail:** every offer create/accept/approve/disburse/settlement-cut/default writes
  to `audit_logs` (tenant_id, actor, action, entity, before/after) — the milestone-3 pattern.
- **Two-person rule:** admin approval required for advances > a configurable ceiling; auto
  flow below it (fast lane).

### 3.6 Regulatory note (Tanzania)
- MCA/financing on a marketplace sits in lending-adjacent space; keep the flat-fee
  %-of-settlement model clearly documented, disclose the total repayable amount and effective
  cost before acceptance (consumer-protection posture), and treat any licensed lender /
  partner-credit scenario (e.g., a bank buying the advances) as a separate ADR. The
  `credit_scores` + behavioral model should be positioned as decisioning, not a credit bureau.

---

## 4. Phased rollout

| Phase | Scope | Exit evidence |
| --- | --- | --- |
| **P0 (foundation)** | Fix `LoanReminderService` status vocab + route via notifications; add data-driven credit-score recompute | Cron fires reminders; `credit_scores` populated from real data |
| **P1 (offer engine)** | `capital_offers` migration + `CapitalOffer` aggregate + offering service + vendor "Capital" tab + accept/disburse APIs | Vendor sees a live pre-qualified offer; acceptance → DISBURSED |
| **P2 (settlement deduction)** | `repayment_rate` on `micro_loans`; settlement-cut in `PayoutSettlementService` with wallet lock; loan-repayment wallet txs | A real settlement auto-reduces `outstanding_balance`; audit rows exist |
| **P3 (admin + controls)** | Admin approve/disburse UI, per-window floor check, concentration cap, audit wiring, follow-on offers | Defaults and renewals behave per policy; audit coverage |
| **P4 (scale)** | Funding partner (bank/MFI) hooks, KYC (reuse `partner_kyc`), larger tickets via term loans | Partner-disbursed advances live |

---

## 5. Data we already have that powers it

- `payments` (RELEASED, `vendor_net`, `system_commission`) → trailing revenue + repayment rail
- `wallets` / `wallet_transactions` → settlement cut points + audit
- `credit_scores` → eligibility and fee tier
- `micro_loans` → the advance record itself
- `deliveries.estimated_time_minutes` / on-time SLA → delivery reliability signal (SLA dashboards)
- `disputes` / `reviews` → trust signal
- `audit_logs` → governance (milestone-3 wiring reused)

---

## 6. Open decisions (need a call)

1. **Fund the advances from platform float or a lending partner?** The design works either
   way; the answer sets the disbursement source (wallet credit today, partner API later).
2. **Fee/rate table (3.1) and cap percentages (3.5)** are placeholders — validate against
   production settlement data before P1 ships.
3. **Do we open the same program to drivers** (`FUEL_LOAN`, `REPAIR_LOAN` already exist in
   `LoanType`)? Driver repayment would need a driver-earnings cut, not a vendor settlement cut.
4. **Piloting cohort:** the first ~20 vendors who accept an offer define the loss curve that
   tunes every parameter above.