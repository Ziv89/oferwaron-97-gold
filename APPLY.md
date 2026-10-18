# 97% Gold — Improvements: Apply Guide

No new npm packages required (`react-helmet-async` is already installed; Formspree is a plain `fetch`).

## 1. File placement

Copy into your repo (overwrite where noted):

```
vercel.json                          -> repo root   (REQUIRED for BrowserRouter deep links)
firestore.rules                      -> repo root   (deploy to Firebase)
public/index.html                    -> overwrite   (default meta + JSON-LD for scrapers)
public/robots.txt                    -> public/
public/sitemap.xml                   -> public/
public/og-image.jpg                  -> public/     (social share image, 1200x630)

src/components/Seo.jsx               -> new
src/components/ErrorBoundary.jsx     -> new
src/utils/logger.js                  -> new
src/utils/debounce.js                -> new  (delete the old src/utils/devounce.js)
src/styles/contact-form.css          -> new

src/App.js                           -> overwrite (BrowserRouter + ErrorBoundary + logo.webp + gated logs)
src/pages/Home.jsx                   -> overwrite (uses <Seo>)
src/pages/Contact.jsx                -> overwrite (real working form)
```

Optimized images (`assets-optimized/`) go to `src/assets/images/`:
- `logo.webp`  (App.js already imports this — replaces the 2.7 MB SantaLogo.jpg)
- `questionMarkCoin.webp`, `goldenface.webp`, `ofernewChart.webp` (see step 4)

## 2. Environment variables (Vercel + local `.env`)

Keep your existing `REACT_APP_FIREBASE_*` vars, then add:

```
REACT_APP_FORMSPREE_ID=xxxxxxx      # from https://formspree.io (free)
```

## 3. Finish the SEO swap on the other pages

Home + Contact are done. Do the same 2-line swap on the rest:
replace `import { Helmet } from 'react-helmet-async';` with
`import Seo from '../components/Seo';`, then replace the whole `<Helmet>...</Helmet>`
block with the matching `<Seo .../>` below (your original copy is preserved):

**Strategy.jsx**
```jsx
<Seo
  title="The Strategy — How 97% Gold Trades XAUUSD | 97% Gold"
  description="How the 97% Gold strategy works: price-action entries, high-probability zones and strict risk management on XAUUSD. See the rules and live performance."
  path="/strategy"
  ogType="article"
/>
```

**Pricing.jsx**
```jsx
<Seo
  title="Pricing — Gold Signals Subscription | 97% Gold"
  description="Get real-time XAUUSD gold signals via WhatsApp — entry, exit and stop-loss included. Start with a free trial, then continue only if it works for you. Cancel anytime."
  path="/pricing"
/>
```

**YouTube.jsx**
```jsx
<Seo
  title="Free Content — Gold Trading Videos | 97% Gold"
  description="Watch free XAUUSD gold trading videos: trade breakdowns, market analysis and strategy explained. New content on the 97% Gold channel."
  path="/youtube"
/>
```

**About.jsx**
```jsx
<Seo
  title="About Ofer Waron — Gold Trader | 97% Gold"
  description="Meet the trader behind 97% Gold. Learn the experience, approach and risk-first philosophy behind the XAUUSD gold trading signals."
  path="/about"
  ogType="profile"
/>
```

**TradingDashboard.jsx** (keep it out of the index)
```jsx
<Seo
  title="Live Trading Dashboard (Coming Soon) | 97% Gold"
  description="The live XAUUSD trading dashboard is coming soon — real-time gold performance tracking from the 97% Gold strategy."
  path="/trading"
  noindex
/>
```

## 4. Swap the remaining heavy images

In each page, point the import at the `.webp`:
- `Pricing.jsx`:  `questionMarkCoin.png`  -> `questionMarkCoin.webp`
- `About.jsx`:    `goldenface.png`        -> `goldenface.webp`
- `Home.jsx`:     `ofernewChart.jpg`      -> `ofernewChart.webp` (only the commented fallback)

(App.js logo is already switched to `logo.webp`. `logo.png` is included only as a fallback if you ever need non-WebP support.)

## 5. Delete dead weight

- `src/components/cta/CTA.jsx`, `src/components/cta/DirectCTA.jsx` (0 bytes)
- `src/strategies/Ofer97GoldStrategy.js` (0 bytes)
- `src/utils/devounce.js` (replaced by `debounce.js`)
- **`src/src.rar`** — a 6.2 MB archive committed inside your source tree. Remove it.

## 6. Deploy Firestore rules

```
firebase deploy --only firestore:rules
```
This makes `siteData` read-only from the web and denies everything else. Edit those
docs from the Firebase console.

## 7. Verify after deploy

1. Deep-link works: open `.../strategy` directly (no `#`). It should load, not 404 — that's the `vercel.json` rewrite doing its job.
2. Social preview: paste your URL into https://www.opengraph.xyz or send it to yourself on WhatsApp — you should now see the title, description, and the gold share image.
3. Run Lighthouse (Chrome DevTools). The image compression alone should move Performance/LCP substantially.
4. Submit `sitemap.xml` in Google Search Console.

## Not done for you (needs your accounts / decisions)
- Custom domain on Vercel (biggest trust/SEO lever after this).
- SSR/prerender: if you want bulletproof SEO, migrate the marketing shell to Next.js later. The `<Seo>` component ports over almost unchanged.
- Toning down absolute "97%" claims for ad-platform eligibility (Google/Meta restrict trading-signal ads).
