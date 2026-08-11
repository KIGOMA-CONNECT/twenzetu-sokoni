# ADR-0005: Cargo, Express & Logistics — server-side binding fare and instant booking

- Status: Accepted
- Date: 2026-08-11
- Decision maker: Owner + Platform Council
- Context: The Cargo, Express & Logistics suite previously posted a client-supplied `fare` to `POST /services/cargo/requests`, which never actually existed as a route (frontend fell back silently and nothing was booked). Cargo must operate like an international transport platform (live quotes, weight/distance-aware pricing, maps, multiple payment channels) while staying rooted in the local foundation: Tanzanian vehicle types (bodaboda, bajaji, pickup, van, guta, fuso), TZS pricing, Swahili breakdown labels, mobile-money-first payments, and the fail-closed payments constitution.
- Decision:
  1. **Single binding fare engine.** `CargoFareCalculator` (in `libs/marketplace/domain/src/lib/delivery/delivery-fare.ts`) is the only place fare is computed. Formula: `max(base + distance·perKm + weight·perKg, vehicle.minFare)`, plus optional cargo insurance (`max(500, 0.5% of cargo value)`) and a 10% scheduled-pickup discount (`max(subtotal − 10%, minFare·0.9)`). The client can never dictate the price it is charged — a server quote from `GET /cargo/fare` is authoritative and the booking re-computes it server-side.
  2. **Canonical vehicle keys** `boda | bajaji | carry | van | guta | fuso` are shared between backend (`CARGO_VEHICLE_RATES`) and frontend (`VEHICLE_RATES` in `MapPicker.tsx`), with capacity limits enforced server-side (`Uzito unazidi uwezo wa ...`).
  3. **Instant booking.** `POST /cargo/requests` (new `CargoController`, replacing the dead `services/cargo/requests` route) creates a service request, immediately creates an order, and routes payment through the existing dispatch: wallet (debit + escrow confirm, instant), cash (escrow confirm), card (AzamPay checkout redirect URL), mobile money (STK push). Paid cargo orders (`specialInstructions` tagged `CargoBooking`) are promoted to `READY_FOR_PICKUP` — synchronously for wallet/cash, and via `ConfirmPaymentUseCase` when the payment webhook confirms MNO/card.
  4. **Fail-closed payments** (per ADR-0003): wallet, card, and mobile money all route through the same validated gateways; the booking returns `paymentStatus` so the UI can guide the customer (redirect to card checkout, wait for STK, or booked immediately).
- Consequences:
  - The fare shown during booking is a live server quote; the charged amount is recomputed and stored in the order at booking time.
  - Cargo is now a first-class paid flow: it reuses the existing request→order→payment pipeline, so refunds, disputes, OTP delivery, and notifications keep working unchanged.
  - Frontend `CargoPage` now submits canonical vehicle keys, trip type, insurance, cargo value, and a payment method; card payments redirect to the AzamPay-hosted checkout.
- Constitution check: Trust (Ch4), Product Principle 7.3 (Ch7), Architecture Principle 6.8 standards over invention (Ch6), Payments Principle: fail closed (Ch9), local-first: Swahili, TZS, mobile-money-first (Ch1).
