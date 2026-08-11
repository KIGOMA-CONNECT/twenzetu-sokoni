# ADR-0006: Marketing catalog data, public ads API, and shareable category links

- Status: Accepted
- Date: 2026-08-11
- Decision maker: Owner + Platform Council
- Context: Growth is currently driven by word of mouth, but the app has no built-in way to turn a catalog into a marketing channel. Categories carry only structural fields (name, type, parent, image), so the dashboard hardcodes Swahili taglines, emojis and benefit hints in the frontend (`ConsumerDashboard.tsx`). That content cannot be managed per tenant, cannot be served to external tools (WhatsApp cards, SMS, affiliate links), and cannot be copied as share links. We need (1) tenant-managed marketing data on the catalog, (2) a public API for external consumers that does not require a tenant header or JWT, and (3) an in-app "Matangazo" page where users copy share links for WhatsApp/Social.
- Options considered:
  1. **Keep marketing content hardcoded in the frontend** — fastest, but not tenant-managed, not externally consumable, and duplicates copy across code and DB. Rejected.
  2. **Add marketing columns + a public API + Matangazo page (chosen)** — marketing fields become data (`tagline`, `benefits`, `emoji` on `product_categories`), a new `adverts` table holds promotional campaigns, public `/api/public/ads` and `/api/public/catalog` endpoints serve them tenant-aware (defaulting to the primary Dar es Salaam tenant when no `x-tenant-id` is sent), and a new `/matangazo` page renders ads plus copyable per-category share links (`https://twenzetusokoni.com/cargo`, …).
  3. **Full public marketing site + dynamic OpenGraph cards** — strongest for SEO/social, but needs SSR/OG rendering infrastructure that does not exist; deferred.
- Decision:
  1. **Catalog marketing fields.** `product_categories` gains `tagline` (text), `benefits` (jsonb array), and `emoji` (varchar). The `ProductCategory` aggregate exposes them through `toDto()`; `CreateCategoryUseCase`/`CreateCategoryDto` accept them; the dashboard renders `emoji` and `tagline` per tile (falling back to the existing hardcoded icons/hints).
  2. **New `adverts` table** (tenant-aware): `title`, `body`, `emoji`, `image_url`, `cta_label`, `cta_url`, `is_active`, `sort_order`, `starts_at`, `ends_at`. Managed via a JWT-protected `/api/ads` controller; served publicly via `/api/public/ads` (active + within date window, ordered by `sort_order`).
  3. **Public routes without tenant/JWT.** `TenantMiddleware`/`CurrentUserMiddleware` are excluded for `public/*path` in `app.module.ts`. The `PublicController` resolves the tenant from the optional `x-tenant-id` header and otherwise defaults to the primary tenant (`a0000000-0000-0000-0000-000000000002`), so share links and third-party tools work with a bare `GET /api/public/ads`.
  4. **Matangazo page.** A protected `/matangazo` route (customer + staff roles) fetches `/api/public/ads` and `/api/categories`, and offers "Nakili Kiungo" (copy link) buttons per ad and per parent category. Links are built on the public base URL (`https://twenzetusokoni.com`, overridable via `VITE_PUBLIC_BASE_URL`) with a clipboard fallback (`execCommand('copy')`) for in-app browsers.
- Consequences:
  - Marketing copy is now data: it can be seeded, managed per tenant, and edited without a frontend deploy; the hardcoded dashboard hints become fallbacks only.
  - External channels can consume a tenant-aware public catalog/ads API with no auth setup, unblocking WhatsApp business, SMS campaigns, and affiliates.
  - Public endpoints are rate-limited by the global throttler (300 req/min default) and expose only curated active content — no PII, no admin data.
  - Future OpenGraph/social cards can be layered onto the same public routes without changing the data model.
- Constitution check: Trust (Ch4), Product Principles 7.2/7.3 local-first Swahili content (Ch7), Architecture Principle 6.8 standards over invention (Ch6), tenancy isolation preserved for write/tenant-scoped endpoints (Ch2), fail-closed defaults retained for everything non-public (Ch9).
