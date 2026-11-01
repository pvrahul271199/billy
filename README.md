# Billy

A minimal invoicing PWA for Indian Instagram creators to bill brands and agencies for sponsored Reels, Stories, posts and other paid collaborations.

- **Local-first.** Profile, bank details, brands, invoices and images live in IndexedDB on the device. Nothing is uploaded.
- **Works offline** after the first visit, and installs to the home screen on Android and iOS.
- **Indian invoicing built in:** financial-year numbering (`BLY/26-27/001`), CGST + SGST or IGST by state, informational TDS, amount in words (lakh/crore), en-IN money formatting, and a UPI QR code for the exact amount.
- **PDF generated on the device** with `@react-pdf/renderer`. A4, near-monochrome, prints well in black and white.
- **Feels native:** one locked app shell with state-driven tabs, screens that slide in, frosted bottom sheets, an in-app number pad for amounts, haptics, and a phone frame on desktop.

## Requirements

- Node.js 20 or newer (built and tested on Node 24)
- npm

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The first launch goes through a 3-step setup. On a desktop browser the app appears inside a phone frame; on a phone it fills the screen. To see every design token and component, open http://localhost:3000/design/.

The service worker is only registered in production builds, so offline mode can only be tested with `npm run build` (see below).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Static export to `out/`, then generates `out/sw.js` (offline precache) |
| `npm run start` | Serves `out/` locally to test the production build and offline mode |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests (Vitest) for numbering, tax, amount in words, validators, UPI, dates, keypad, sync mapping, backup |

## Deploy

`npm run build` produces a fully static site in `out/`. Any static host works. It needs no server, no environment variables and no API routes.

**Vercel**

1. Import the repository in Vercel.
2. Framework preset: Next.js. Build command: `npm run build`. Output directory: `out`.
3. Deploy.

**Netlify, Cloudflare Pages, GitHub Pages, S3, nginx…**

Build command `npm run build`, publish directory `out`. Make sure:

- the site is served over **HTTPS** (needed for the service worker and install prompt);
- `/sw.js` is served with `Cache-Control: no-cache` so updates reach users promptly;
- `/manifest.webmanifest` is served as `application/manifest+json` (most hosts do this already).

Each deploy produces a new service worker version. Installed apps pick it up on their next launch.

## Project structure

```
app/                  layout, the single app page, manifest, /design showcase
components/AppShell   phone chassis, tabs, screen stack, overlay host
components/screens/   tab screens, editor, preview, onboarding, profile screens
components/ui/        design-system primitives (keypad, sheets, tab bar, …)
components/invoice/   invoice form parts, preview sheet, PDF document, actions
db/                   Dexie schema, writes, live queries, backup
lib/                  pure logic: tax, numbering, words, validators, UPI, nav, sync mapping
theme/tokens.ts       colours, radii, chassis size
supabase/schema.sql   database schema for future cloud sync
scripts/build-sw.mjs  generates the offline service worker after build
```

See `CLAUDE.md` for architecture and design-system rules.

## Data and backup

Everything is stored in the browser's IndexedDB for this site. Clearing site data removes it. Use **Profile → Backup** to export a JSON file (including images) and import it on another device. Importing replaces all data on the device after a confirmation.

## Tax note

Billy calculates GST and shows expected TDS to help you invoice. It isn't tax advice. Confirm your SAC code, GST rate and TDS treatment with your CA.
