# afriMarket Design System

Evolution proposal grounded in a study of Apple HIG, Airbnb DLS, Spotify, Stripe, Linear,
and Uber Base — applied to the existing token foundation in `apps/web/src/styles/globals.css`.

Status: **proposal** · Owner: Platform design + web engineering

---

## 1. What the reference companies do

### Apple (Human Interface Guidelines)
- **Principles:** *Clarity* (legible, precise, self-evident), *Deference* (the UI serves the
  content, never competes with it), *Depth* (layers + motion convey hierarchy), with
  *Consistency* as the connective tissue.
- **Typography:** one family (SF Pro), optical sizing; hierarchy via **weight** more than size
  extremes; a 17pt legibility floor for body text; Dynamic Type (user-scalable).
- **Spacing:** 4pt / 8pt grid with 4pt subdivisions; 44pt minimum touch targets.
- **Motion:** purposeful, communicates change and spatial relationships; respects Reduce Motion.
- **Depth:** mostly flat surfaces, subtle rounding (8–11px), depth implied by typography and
  layering, not heavy shadows.
- **Takeaway for us:** content-first, restrained chrome, weight-driven hierarchy, small
  radius scale, respectful motion.

### Airbnb (Design Language System)
- **Principles (Saarinen):** *Unified* (each piece contributes to the whole at scale),
  *Universal* (welcoming, accessible, WCAG AA), *Iconic*, *Conversational* (motion that
  communicates like natural interaction).
- **Color:** Rausch coral `#FF385C` used **sparingly** — the single primary action; everything
  else is a disciplined warm-grey scale; ink `#222222` is never pure black.
- **Shape:** soft rounded corners nearly everywhere (8px buttons, 12–20px cards, pill search);
  depth from photography + whitespace, not shadows.
- **Typography:** one proprietary family (Airbnb Cereal, 6 weights) carries the hierarchy;
  type scale deliberately flat so imagery leads.
- **Motion:** 100–200ms, conversational, context-adding not decorative; Lottie for rich motion.
- **Takeaway for us:** restraint — one accent, one font family, disciplined grays, a "color
  usage rule" (brand color only for the most important moments), generous whitespace.

### Spotify
- **Visual direction:** dark, bold, **music-first** — album artwork is the hero, chrome recedes
  to near-nothing; near-black surfaces (`#121212`) with one vibrant green accent (`#1DB954`).
- **Typography:** strong weight contrast, tight leading, confident headlines; type is big and
  bold where the content matters.
- **Motion:** subtle, functional — equalizer icon, card reveals, page transitions; never
  competes with the art.
- **Takeaway for us:** dark surfaces make imagery pop; a single bold accent color; let the
  *product* (in our case produce, food, and delivery photos) be the hero, not the UI.

### Stripe / Linear / Uber Base (brief)
- **Stripe:** huge whitespace, a serif display face alongside the UI sans, restrained color,
  crisp hairline borders — "quality is in the restraint."
- **Linear:** dark theme, extremely tight, high-tracking small caps labels, precise
  keyboard-driven interaction, motion that's instant (60–100ms) — power tools feel fast.
- **Uber Base:** near black-and-white with a single blue accent; 14px modular type scale;
  "Go big / Less is more."

**Synthesis:** the strongest consumer systems share four traits — (1) *one* primary accent
used sparingly, (2) *one* type family carrying hierarchy by weight, (3) disciplined spacing on
a 4/8pt grid, (4) motion that communicates rather than decorates, and (5) whitespace + imagery
doing the heavy lifting that shadows try to do.

---

## 2. afriMarket design principles

1. **Clarity over decoration** *(Apple)* — every screen answers "where am I, what can I do,
   what happens next" before it shows any flourish.
2. **Deference to the goods** *(Apple + Spotify)* — produce/food/delivery photography is the
   hero; UI chrome recedes.
3. **One accent, used with purpose** *(Airbnb)* — the brand teal and the "deal" orange are
   reserved for primary actions and the deal moments; they never compete.
4. **Fast feels good** *(Linear)* — interactions respond in ≤150ms; optimistic updates for
   cart/order actions; skeletons over spinners.
5. **Trust is a design material** *(Apple + Airbnb)* — visible prices, explicit totals,
   clear states, WCAG AA contrast, and honest empty/error states.
6. **Conversational motion** *(Airbnb)* — animations communicate cause and effect (an item
   flies into the cart, a toast confirms a payment) and are switchable off via
   `prefers-reduced-motion`.

---

## 3. Overall visual direction

**Current (baseline):** a warm, commerce-first system — teal brand (`#0f766e`) + orange accent
(`#f97316`), slate neutrals, soft shadows, generous rounded corners, gradient CTAs, emoji-driven
icons. This is a strong, distinctive identity for an African marketplace and should be **evolved,
not replaced**.

**Target:** *"warm precision."* Keep the teal + orange identity but:
- Reduce gradient reliance on CTAs (gradients only in hero/brand moments, per Apple's flat
  discipline and Airbnb's restraint).
- Move depth from shadows to borders + whitespace (hairline `1px` separators like Airbnb's
  `deco` lines).
- Raise the photography weight: product images edge-to-edge in cards, `object-fit: cover`,
  no text over images (Airbnb rule).
- Add a disciplined dark surface (`#0f172a` already exists as `--ink-soft`) for the top bar,
  footer, and future dark mode — this is the Spotify move that makes imagery pop.
- One font family (already Plus Jakarta Sans) with weight-driven hierarchy.

---

## 4. Typography

Keep **Plus Jakarta Sans** as the single family (geometric-humanist, close in spirit to Airbnb
Cereal / Inter; supports the Latin + Swahili alphabet cleanly). Add a true **modular type
scale** as tokens and drop ad-hoc sizes.

| Token | Size | Line-height | Weight | Tracking | Use |
| --- | --- | --- | --- | --- | --- |
| `--text-display` | 40–56 (clamp) | 1.08 | 800 | -0.03em | Hero, campaign pages |
| `--text-h1` | 28–32 (clamp) | 1.15 | 800 | -0.02em | Page titles |
| `--text-h2` | 22 | 1.25 | 800 | -0.015em | Section titles |
| `--text-h3` | 18 | 1.3 | 700 | -0.01em | Card titles |
| `--text-body` | 16 | 1.55 | 400 | 0 | Body (legibility floor — Apple 17pt equivalent) |
| `--text-body-sm` | 14 | 1.5 | 400 | 0 | Secondary text |
| `--text-caption` | 12 | 1.5 | 600 | +0.02em | Metadata, labels |
| `--text-label` | 11 | 1.4 | 800 | +0.06em | Uppercase stat labels, table headers |

Rules:
- Hierarchy by weight first, size second (Apple).
- Body never below 14px; captions never below 11px.
- Table headers + stat labels are the Linear small-caps treatment (already partially present).

## 5. Color

Keep the existing semantic tokens (brand teal, accent orange, slate neutrals, semantic
success/danger/warning/info). Add **usage rules** and a few refinements:

| Rule | Detail |
| --- | --- |
| One primary action per screen | The brand teal gradient is reserved for the single most important CTA; secondary CTAs are outline/ghost (Airbnb's "Rausch only on the most important element"). |
| Brand color ≠ decoration | Teal does not paint badges, borders, and icons at the same time; pick the element that needs attention. |
| "Deal" orange = time/value | Orange is for deals, discounts, prices, and urgency only (it already maps to `--accent`). |
| Neutrals carry content | Ink (`#0f172a`), text (`#334155`), muted (`#64748b`), faint (`#94a3b8`), line (`#e2e8f0`) — content reads in neutral; color is for meaning. |
| Dark surfaces | `--ink-soft` (`#1e293b`/`#0f172a`) for top bar, footer, and a future dark mode; green/teal pops on it (Spotify). |
| Accessible contrast | All text meets WCAG AA on its background; hover/focus states shift color consistently (Airbnb pattern). |

## 6. Spacing

Adopt a **4pt base grid** (Apple + Airbnb + Atlassian). Add spacing tokens and replace magic
values:

| Token | Value | Use |
| --- | --- | --- |
| `--space-1` | 4px | Icon-to-label gaps, tight metadata |
| `--space-2` | 8px | Chip padding, list row padding |
| `--space-3` | 12px | Card inner padding (compact), form gaps |
| `--space-4` | 16px | Default gutter, card padding, button padding |
| `--space-5` | 24px | Section gaps, card-to-card rhythm |
| `--space-6` | 32px | Major section padding, modal padding |
| `--space-7` | 48px | Page-level whitespace, empty states |
| `--space-8` | 64px | Hero/landing rhythm |

Rules:
- Gaps in `4/8/12/16/24/32/48/64` only.
- Card-to-card: 16–24px (Airbnb keeps 24px between cards; metadata groups 4–8px).
- 44px minimum touch target (Apple) for all taps; buttons at least 40px tall.

## 7. Motion

Add a motion token set (currently only `fadeUp`/`spin`/`pulse`/`shimmer` exist). Define:

| Token | Value | Use |
| --- | --- | --- |
| `--ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default UI transitions (Material standard; Apple ≈ `cubic-bezier(0.4,0,0.6,1)`) |
| `--ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the screen (cards, modals) |
| `--ease-accelerate` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving the screen |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Delight moments (cart badge, heart) |
| `--dur-instant` | 80ms | Press/active states, checkbox |
| `--dur-fast` | 150ms | Hover, focus, small state changes |
| `--dur-base` | 250ms | Cards, toasts, dropdowns |
| `--dur-slow` | 400ms | Page/hero entrances, skeletons |

Principles (Airbnb *Conversational* + Apple Reduce Motion):
- Motion communicates cause/effect: item → cart fly, order status change → toast, payment →
  confirmation pulse.
- Never block interaction: total UI motion time per action ≤ 400ms.
- **Respect `prefers-reduced-motion`**: collapse all motion to 0–80ms fades. (Add a global
  `@media (prefers-reduced-motion: reduce)` block.)
- Keep `fadeUp` for page-level entrances; replace scattered `transition: all` with the token
  set so timing is consistent.

## 8. Components (anatomy + states)

Every component gets explicit states: **default · hover · focus-visible · pressed ·
loading · disabled · error**.

| Component | Spec |
| --- | --- |
| **Button** | Height 40px (44 on mobile-primary), radius `--radius`, padding `0.65rem 1.35rem`; primary = brand gradient, secondary = outline, tertiary = ghost; loading shows inline spinner + `aria-busy`; press = `translateY(1px)` + `--dur-instant`; focus-visible = `--ring`. |
| **Input / Select / Textarea** | Height 40px+, `--radius`, 1.5px border `--line`, focus = brand border + `--ring`; error = danger border + error text below; helper text 12px muted; labels always above (never placeholder-only). |
| **Card** | `--radius-lg`, hairline border `--line`, `--shadow-sm`; hover = border-brand + slight lift (`card-hover`); **no gradient borders**. Product card: image edge-to-edge `aspect-ratio: 1/1`, name 2-line clamp, price + old price, discount badge orange. |
| **Badge / Chip** | Pill radius; badge = status semantics (green/amber/red/blue/slate/brand); chip = filter control with `.active` filled state. |
| **Modal / Sheet** | Overlay `rgba(15,23,42,.55)` + blur 3px; card `--radius-lg`, `--shadow-lg`; enter via `--ease-decelerate`, exit via `--ease-accelerate`; on mobile use bottom-sheet pattern (rounded top corners, drag handle, `safe-area` padding). |
| **Table** | `--radius-lg` container, hairline rows, header = 11px uppercase labels, row hover `--line-soft`; right-align numerics; sticky header for long tables. |
| **Toast** | Slide in top-right on desktop / bottom above bottom-nav on mobile; `--dur-base`; success/danger/info variants; auto-dismiss 4s + manual close; `aria-live`. |
| **Skeleton** | Shimmer on `--line-soft` blocks matching final layout; replace spinners on data loads (Linear pattern). |
| **Empty state** | Illustration/emoji (existing), title + sub + one primary action (Airbnb/Apple guidance). |
| **Skeleton of stat cards** | Keep 4px brand/amber/blue/violet left-rail color coding — it is a distinctive, useful pattern. |

## 9. UI patterns

- **Loading:** skeletons for content, spinners only inside buttons/inline actions; never blank
  areas.
- **Optimistic updates:** cart add, order status, notification read toggle apply immediately
  and reconcile in the background (already the direction; make it systematic).
- **Live order tracking:** existing Socket.IO events should drive a *subtle* status bar pulse
  (the `pulse` keyframe) instead of full-screen spinners.
- **Empty + error:** always offer a recovery action ("Browse categories", "Retry").
- **Mobile:** bottom nav (exists), bottom-sheet forms, safe-area insets (exists), sticky
  checkout/summary bar on product + order pages.
- **Forms:** single column, labels above, real-time validation with inline error text, disabled
  submit while invalid.
- **Search:** pill searchbar (exists) with `:focus-within` ring; keep it in the top bar.
- **Numbers:** prices right-aligned in tables; TZS with no decimals for large values; use
  tabular numerals where totals change (avoid jitter).

## 10. Accessibility (WCAG AA baseline)

- All text ≥ 4.5:1 on its background; large text ≥ 3:1 (audit brand-soft/white combos).
- Visible `:focus-visible` using `--ring` on every interactive element.
- 44px minimum touch targets (Apple) for mobile primary actions.
- `prefers-reduced-motion` global override (motion §7).
- Screen-reader text for icon-only buttons; `aria-live` for toasts and status changes.
- Forms: label association, error text with `aria-describedby`, `aria-invalid`.

## 11. Implementation plan

1. **Tokens first (this proposal):** add spacing + motion token sets and the
   `prefers-reduced-motion` block to `globals.css`; document the type scale.
2. **Refactor inline-style components** (admin/analytics pages) to use the CSS token
   variables instead of hardcoded hex (`#0f172a`, `#64748b`, `#2563eb`) — the AdminAnalytics
   file alone has ~15 hardcoded colors.
3. **Component sweep:** buttons/inputs/cards/toasts/skeletons to the state spec; replace
   `transition: all 0.15s` with the motion tokens.
4. **Image treatment:** product/delivery photography edge-to-edge, no text over images.
5. **Dark mode (future):** map existing tokens to a Spotify-style `#121212` surface set.
6. **Reference files:** keep `globals.css` as the single source of design tokens (it already
   is the effective design system), and extend it rather than creating parallel systems.

## 12. Reference links

- Apple HIG — developer.apple.com/design/human-interface-guidelines
- Apple typography — developer.apple.com/design/human-interface-guidelines/typography
- Airbnb Design Language System (Saarinen, 2016; community-observed tokens)
- Spotify design (community-observed: `#121212` surfaces, `#1DB954` accent)
- Linear, Stripe, Uber Base (community-observed patterns cited above)