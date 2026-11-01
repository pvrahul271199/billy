# CLAUDE.md — Billy

Billy is a minimal invoicing PWA for Indian Instagram creators to bill brands and agencies for sponsored posts, Reels, Stories and other paid collaborations. It is built to feel like a native phone app.

- Product spec: `docs/SPEC.md` (the original brief; the design and architecture sections below supersede its green palette and URL routing).
- Database schema for cloud sync: `supabase/schema.sql`.

## Commands

```bash
npm run dev         # dev server (service worker disabled)
npm run build       # static export to /out + generates out/sw.js
npm run start       # serve /out to test production + offline
npm run typecheck   # tsc --noEmit
npm run test        # vitest (pure logic in /lib)
```

`/design/` showcases every token, component and state. Update it whenever a component changes.

## Working rules

- Run `npm run typecheck`, `npm test` and `npm run build` before calling anything done. For UI changes, run the app and look at it.
- Pure logic lives in `/lib` with Vitest tests. Add or update tests when touching numbering, tax, amount-in-words, validators, keypad, sync mapping or backup.
- Delete `.next/` if typecheck complains about missing `app/**/page.js` after removing routes (stale generated types).

## Architecture (native-app feel)

Five layers, modelled on the Stash app:

1. **Phone chassis.** `app/page.tsx` renders `components/AppShell.tsx`. `.app-root` is locked to `100dvh` with `overflow: clip`; the document never scrolls. Each screen scrolls its own `.screen-scroll` area. On screens wider than 420px the app sits in a 380×780 frame (`rounded-phone`, 40px) on the `frame` canvas. Safe areas: `--safe-top` / `--safe-bottom`. `overscroll-behavior: none`, no tap highlight.
   - Use `overflow: clip`, never just `hidden`, on the chassis. `hidden` still lets focus / `scrollIntoView` scroll the chassis and tear the layout.
   - Nothing uses `position: fixed` inside the app. Footers are flex children; overlays are absolute inside the chassis.
2. **Local-first data.** Dexie (IndexedDB) is the source of truth.
   - `db/schema.ts`: tables, defaults. `db/actions.ts`: all writes (save, mark sent/paid, duplicate, soft delete). `db/queries.ts`: `useLiveQuery` hooks (return `undefined` while loading). `db/backup.ts`: export/import.
   - Screens subscribe to live queries, so every write updates every screen instantly. Never add loading spinners for local reads; show `<Splash />` (blank) for the few ms IndexedDB takes to open.
   - Writes made outside Dexie (raw IndexedDB) do not trigger live queries.
3. **State-driven navigation** (`lib/nav.tsx`, no URL routing).
   - Tabs (`invoice | history | profile`) switch with React state; all three stay mounted (scroll position survives), inactive ones are `hidden`.
   - Detail and settings screens are `Route`s pushed onto a stack and rendered as sliding layers. Use `useNav()`: `push`, `pop`, `replace`, `reset`, `setTab`. Never import `next/link` or `next/navigation` in app screens.
   - Each push adds a browser history entry so Android back / iOS swipe pop screens. **Entries must keep Next.js's own `history.state` markers** (`withDepth` spreads `history.state`); otherwise the App Router reloads the page on popstate and the stack is lost.
   - Add a screen: add a `Route` variant in `lib/nav.tsx`, a component in `components/screens/`, and a case in `renderRoute` in `AppShell.tsx`. Pushed screens use `<PushedScreen title footer>`; tab roots use `<TabScreen title subtitle footer>`.
4. **Overlays** (`components/ui/Dialog.tsx` → `Overlay`). Sheets and dialogs portal into `#app-overlays` inside the chassis (not native `<dialog>`, which escapes the phone frame). `Overlay` handles focus trap, Esc, click-outside, focus restore, and makes underneath content `inert` via `lib/overlay-stack.ts`. Frosted panels: `bg-white/95 backdrop-blur-md shadow-float`.
5. **Ergonomics.** Money is entered with the in-app `Keypad` via `AmountField` (no phone keyboard). Quantities use `Stepper`. Primary actions sit in screen footers (thumb zone). Haptics via `lib/haptics.ts` (`tap()` on primary buttons, chips, keys; `success()` on saves/mark paid). Toasts drop in below the top bar; passive toasts are click-through.

PWA: `app/manifest.ts` (standalone, portrait), icons in `public/icons`, `scripts/build-sw.mjs` precaches every exported file (cache-first, ignores query strings), registered in production by `lib/pwa.ts`.

## Folder structure

```
app/                 layout (fonts, metadata), page (AppShell), manifest.ts, design/, globals.css
components/AppShell.tsx
components/screens/  SignInScreen, InvoiceTab, HistoryTab, ProfileTab, EditorScreen, PreviewScreen, OnboardingScreen (welcome → optional DemoTour → 3 setup steps), DemoTour (5-step walkthrough with a mock of each real screen, a "Fill demo values" button, and a sample invoice), Screen (PushedScreen/TabScreen/Splash), profile/*
components/ui/       design-system primitives (Button, AmountField, Keypad, Stepper, BottomSheet, Overlay, TabBar, TopBar…)
components/invoice/  form parts, InvoiceSheet (HTML preview), InvoicePdf (PDF), InvoiceActions, InvoiceRow
components/profile/  shared settings forms (used by onboarding and Profile)
db/                  schema, actions, queries, backup
lib/                 pure logic: demo-invoice (sample data for the tour), tax, numbering, amount-in-words, validators, upi, keypad, sync mapping, nav, pdf…
theme/tokens.ts      colours, radii, chassis size (source of truth)
types/               shared types
supabase/schema.sql  cloud schema (phase 6)
```

## Design system (Stash)

Calm, clarity, zero financial anxiety. Swiss typography, hardware-grade surfaces, editorial fintech.

**Colour** (`theme/tokens.ts`, mirrored as CSS vars in `app/globals.css`, mapped to Tailwind utilities; all default Tailwind colours are removed):

| Token | Hex | Use |
|---|---|---|
| `ink` | #1E1B4B | text, primary buttons, active icons (hover `ink-hover`, pressed `ink-press`) |
| `ink2` | #8B88C2 | soft highlights, outlines (not text) |
| `soft` | #5F5C80 | labels, captions, secondary text, inactive tab labels |
| `faint` | #A9A7C4 | inactive icons, placeholders, ₹ symbols only (2.3:1, never body text) |
| `line` | #E4E3F0 | 1px hairlines |
| `tint` | #F5F5FA | chips, keys, cards |
| `bg` | #FFFFFF | background |
| `frame` | #EEEEF6 | desktop canvas |
| `good` / `good-bg` | #2D2A66 / #E6E5F4 | paid, on track (indigo, never green) |
| `warm` / `warm-bg` | #B45309 / #FDF1E4 | overdue, errors, destructive text |

- No reds, no greens, no neon, no gradients. Charts use indigo shades only (`categoryRamp`). Hairlines over shadows; only floating overlays use `shadow-float` (indigo-tinted).
- Never hardcode hex in components. Non-CSS contexts (PDF, QR, manifest, theme-color) import `theme/tokens.ts`.
- Status pills: Draft (tint, PencilSimple), Pending (ink2 outline, Clock), Overdue (warm on warm-bg, WarningCircle), Paid (good on good-bg, CheckCircle). Always icon + word.
- Fields stay white on focus, typing and browser autofill (override in `globals.css`); only disabled fields are tinted.
- Errors: `FieldError` = amber WarningCircle + one sentence. Inputs show errors with a `warm` border.

**Type:** Figtree (UI, 400/500/600) and Bricolage Grotesque (amounts) via `next/font`. Every amount uses the `num` utility (Bricolage, tabular figures, −0.02em tracking). `Amount` renders large figures with a faint ₹ and small paise.

**Shape:** `rounded-phone` 40, `rounded-sheet` 28, `rounded-btn` 16 (buttons), `rounded-key` / `rounded-note` 14 (inputs, keys, cards, lists), `rounded-full` (pills, chips, tab pill). Touch targets ≥ 44px. Press feedback `active:scale-[0.98]`.

**Components:** Button variants `primary | secondary | tint | ghost`; one primary per screen. Destructive actions use `DestructiveButton` (amber text, always confirms via `ConfirmDialog`, whose primary button names the action). Inputs: hairline border → `ink` border on focus (no outline rings on fields; buttons keep a 2px ink focus outline).

## Copy rules

Sentence case. Buttons verb-first, 1–3 words. No exclamation marks, no "please", no "successfully". Errors say what happened and what to do in one sentence ("IFSC needs 11 characters"). Placeholders are real examples.

## Domain rules (India)

- Money in integer paise; display `en-IN` (`₹1,23,456.00`).
- Financial year April–March, label `26-27`. Invoice number `<PREFIX>/<FY>/<seq>` (`BLY/26-27/001`), max 16 chars, unique, editable.
- A brand or agency needs only a name. GSTIN, address and contact sit behind "Add GSTIN, address and contact" in `PartyForm`; with no state the split assumes same state.
- GST only if registered: same state → CGST + SGST (half each), different → IGST; rate editable (default 18). "Tax Invoice" vs "Invoice".
- TDS is informational (on subtotal), never reduces the total.
- Overdue is computed (`displayStatus`), never stored. Totals are computed (`computeTotals`), never stored locally.
- Validators: PAN, GSTIN (chars 3–12 = PAN), IFSC, PIN, +91 phone, UPI (`lib/validators.ts`).
- UPI link `upi://pay?pa=&pn=&am=&cu=INR&tn=`.

## Invoice rendering

**Look:** formal and plain. Pure black text on white, grey secondary text, thin black rules, no filled backgrounds, no app colours. Uses the `print` tokens (`text-print`, `text-print-soft`, `border-print-line`), never `ink`/`tint` inside the sheet.

`lib/invoice-view.ts` builds one display model used by `InvoiceSheet` (HTML) and `InvoicePdf` (react-pdf). They mirror each other point for point; change both together. The PDF stays black on white and uses Inter from `public/fonts` (latin + latin-ext fallback for ₹; Figtree/Bricolage are not verified for ₹ in react-pdf). Drafts render live data; "Mark as sent" freezes from/bill-to/payment snapshots (`lib/snapshots.ts`). Actions pre-generate the PDF so Web Share runs within the tap.

## Settings forms

`components/profile/forms.tsx` forms copy and submit ONLY their own fields. Never pass a whole `Profile` into form state and save it back: a stale snapshot would overwrite other settings (this bug happened once during onboarding).

## Supabase cloud sync (live)

- Env in `.env.local` (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the old `..._ANON_KEY` name also works). Publishable key only, never the service key.
- Setup once in Supabase: run `supabase/schema.sql` (new project) or `supabase/migrations/001_sync_testing.sql` (existing project), and turn on Authentication > Sign In / Providers > Allow anonymous sign-ins.
- **Auth (testing mode): email only, no code** (`lib/auth.ts` `EMAIL_ONLY`, default on). The email maps to a fixed password (`signInWithPassword`, else `signUp`), so anyone who knows an address can open that account. Only for 2-3 testers. Needs Supabase Authentication > Sign In / Providers > Email > "Confirm email" OFF. Set `NEXT_PUBLIC_AUTH_MODE=otp` to switch back to the emailed 6-digit code (then the templates need `{{ .Token }}` and custom SMTP). **Before real users: switch to `otp` mode.** UI: `components/profile/SignInForm.tsx`, `SignInScreen` (first screen on a new device, with "Skip for now" for anonymous testing), Profile > Account. When the signed-in user changes, `lib/sync-engine.ts` resets its sync watermarks and pushes everything to the new account. Sign out pushes pending changes first (needs internet), then clears this device's data.
- Every table has `user_id` and RLS (`user_id = auth.uid()`); every index leads with `user_id`, so it scales per user. Anonymous sessions are per browser; clearing browser data loses them.
- `lib/sync.ts`: tested pure Dexie ↔ row mapping (camelCase/nested/paise/embedded items ↔ snake_case/flat/rupees/`invoice_items`, blanks → NULL).
- `lib/sync-engine.ts`: started from `components/PwaInit.tsx`. Dexie table hooks schedule a push ~0.4s after every write (save, mark sent/paid, delete, import), so each save reaches the cloud at once. Order is push then pull; last-write-wins on `updated_at` (the DB trigger keeps the client's value); soft deletes via `deleted_at`; removed line items are deleted remotely; failed rows are remembered and retried; also runs on reconnect and when the app returns to the foreground. Never blocks the UI. Status shows in Profile > App info and Account. Sync waits (status off) until the user signs in or skips.
- Images are data URLs locally and upload to the private `creator-assets` bucket under `<user_id>/…` (`*_path` columns). Over 2 MB or non-PNG/JPEG/WebP stays local only.
- Add a new synced table: schema + index on `(user_id, updated_at)`, row mapping in `lib/sync.ts`, push/pull in `lib/sync-engine.ts`, hook in `startBackgroundSync`.
