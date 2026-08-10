# iOS App Store Handoff — afriMarket (PWA-first)

Status: **PWA-only for now.** Users install afriMarket on iPhone/iPad via Safari
("Add to Home Screen"). This doc captures everything needed to submit to the
App Store later without re-doing research.

## Current iOS experience (live today)
- Fully installable PWA served from `https://twenzetusokoni.com` with a valid
  web manifest (`/manifest.json`) and service worker (`/sw.js` v5).
- `viewport-fit=cover` + `apple-mobile-web-app-capable` enable full-screen
  standalone mode with safe-area insets respected by the app layout.
- `apple-touch-icon` and `apple-touch-startup-image` media-query splash screens
  for iPhone 14 Pro Max / 14 / 13 / 12 / SE and iPad / iPad Pro 12.9 — source
  PNGs in `apps/web/public/splash/` (teal `#0F766E` + white wordmark).
- Web push notifications work on iOS 16.4+ once the user opts in.

## Options to reach the App Store later
1. **Capacitor wrapper (recommended when ready)** — wrap the existing web build
   (`apps/web`) in a Capacitor iOS project, open in Xcode, set
   `com.twenzetusokoni.app` as bundle id, sign with an Apple Developer account.
   Push can reuse the same VAPID/web-push backend if the wrapper keeps the SW;
   otherwise migrate to APNs.
2. **Third-party PWA publisher** — services that submit PWAs to the App Store.
   Lower effort, but costs per submission and you lose control of review flow.

## Requirements to submit
- Apple Developer Program membership (US$99/year) with the entity owning the
  App Store account.
- Bundle ID: `com.twenzetusokoni.app` (must stay consistent with Android).
- Privacy policy: `https://twenzetusokoni.com/privacy`
- Support URL / support email: `support@afrimarket.co.tz`
- Screenshots: iPhone 6.7" (428x926 pt) and iPad 12.9" minimum; reuse the teal
  theme + content plan in `play/store-listing.md`.
- App Review notes: account required to use the app; demo login available via
  seed accounts (`apps/api/src/composition/seed.ts`).

## Notes
- Apple forbids referencing Android in store copy.
- Age rating questionnaire must match Play's 13+ declaration.
- `apple-touch-startup-image` is ignored by iOS 15+ in favor of Launch Screen;
  a Capacitor project supplies the real LaunchScreen storyboard.
