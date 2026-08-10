# Google Play Store Listing — afriMarket

## Identity
- App name: **afriMarket**
- Package ID (applicationId): `com.twenzetusokoni.app`
- App category: **Shopping**
- App type: Application (not game)
- Default language: English (en-US); add sw in a future release for `sw` locale

## Core store info
- Short description (max 80 chars):
  > Buy and sell locally on afriMarket — groceries, phones, and more with fast delivery.

- Full description (max 4000 chars):
  ```
  afriMarket is a local marketplace that connects buyers and sellers in your community.

  SHOP WITH EASE
  • Browse categories from groceries and fashion to phones and electronics
  • Search and filter products from trusted local vendors
  • Save favorites and reorder your regular items in seconds

  SELL YOUR WAY
  • List products with photos and pricing in minutes
  • Manage orders and stock from your phone
  • Grow your customer base without commission surprises

  FAST, TRACKED DELIVERY
  • Choose home delivery or pickup
  • Follow your order from confirmation to your doorstep
  • Pay securely with M-Pesa, Tigo Pesa, Airtel Money, or cash on delivery

  BUILT FOR TANZANIA
  • Mobile-money payments you already trust
  • Lightweight app that works well on slower connections
  • Swahili-friendly interface with clear local terminology

  afriMarket handles coordination between buyers, sellers, and drivers so everyone
  knows where their order is and when it will arrive. Disputes are mediated by our
  support team within 48 hours.

  Get the app and start buying and selling in your neighborhood today.
  ```

- Privacy Policy URL: `https://twenzetusokoni.com/privacy`
- (Optional) Terms of Service URL: `https://twenzetusokoni.com/terms` (route is `/terms` tab on the Legal page — confirm exact URL, see below)

## Contact
- Support email: `support@afrimarket.co.tz`
- Data Protection contact: `dpo@afrimarket.co.tz`

## Target audience
- Age range: 13+
- Content rating declaration: use the Play Console questionnaire
- App access: all features require an account (free registration)

## Screenshots (8 max, min 320px; recommended 1080x1920)
Capture on a Pixel-class device in portrait, teal theme (`#0F766E`), status bar teal:
1. Home / feed with category chips
2. Product list with price + delivery badge
3. Product detail page (photos, add-to-cart, vendor card)
4. Cart / checkout with M-Pesa + cash on delivery options
5. Order tracking map with driver progress
6. Vendor dashboard (orders, sales)
7. Favorites / saved items
8. Profile with settings
Add a feature graphic 1024x500 (teal, "afriMarket" wordmark).

## Promo assets
- Feature graphic: 1024 x 500 px, JPG/PNG, no text below safe margins
- Phone mockups: 12-4-5-11-12-4-5-11 ("Phones 12-4-5-11" = 6 screenshots grid format)

## Release / signing checklist
1. Upload `app-release.aab` from the latest CI artifact (GitHub Actions → Android build → artifact `afrimarket-android-release`).
2. versionCode is auto-incremented from git history (`git rev-list --count HEAD`); do NOT edit it manually.
3. **CRITICAL — Play App Signing**: Google re-signs the uploaded AAB with a Play-managed key. After the first upload, open Play Console → Setup → App signing and copy the **App signing key certificate SHA-256 fingerprint** into `.well-known/assetlinks.json` (append a second entry alongside the current upload-key fingerprint). Without this, the TWA <-> site verification breaks on devices installed from Play. Keep the upload keystore (`afrimarket-release.keystore`) + `keystore-pass.txt` backed up — losing it locks you out of future uploads.

## First-release naming
- Release name: `1.0.0 (<versionCode>)` — versionCode is auto-derived from `git rev-list --count HEAD`; it increases with every commit. Last built artifact: `1.0.0 (185)`.
