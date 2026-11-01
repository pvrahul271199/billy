# Billy — original product spec

This is the source spec for Billy. `CLAUDE.md` summarises the rules; this file is the full reference.

---

Build "Billy" — a minimal, professional invoicing PWA for Indian Instagram creators and influencers to bill brands and agencies for sponsored posts, Reels, Stories and other paid collaborations.

Work in phases (listed at the end), run the app after each phase, fix any build or type errors, and give a short summary of what was done before moving to the next phase.

## Tech stack
- Next.js (latest stable, App Router) + TypeScript, configured for static export (output: 'export'). No backend, no API routes. (Update: Supabase will be added later for auth + cloud sync — see `CLAUDE.md` and `supabase/schema.sql`.)
- Tailwind CSS, with all colours defined as CSS variables in globals.css and mapped in tailwind.config. Never hardcode hex values in components.
- Local-first storage: IndexedDB via Dexie. All data (profile, bank details, brands, invoices, images) stays on the device.
- Images (profile photo, logo, signature) stored as compressed blobs/data URLs in IndexedDB (resize to max 800px; signature as transparent PNG).
- PDF generation client-side with @react-pdf/renderer.
- UPI QR generation with the "qrcode" npm package.
- Icons: @phosphor-icons/react only. Weight "regular" for default icons, "bold" for the active bottom-nav icon. Consistent 22px in nav, 20px in rows and buttons, 16px inline.
- PWA: @serwist/next (or a hand-written service worker if Serwist conflicts with static export), web manifest, app icons 192/512 + maskable, theme_color #002500, background_color #FFFFFF, display "standalone", works offline after first load, installable on Android and iOS (include apple-touch-icon and iOS meta tags).
- Font: Inter via next/font. Weights 400 and 500 only. Tabular numbers for all amounts.

## Design system (build this FIRST as reusable components)
Clean white UI that feels like a native mobile app. Minimal, calm, trustworthy. White background, deep forest green #002500 as the single brand colour. No gradients, no heavy shadows, no second accent colour. Never use red, yellow, orange or bright green anywhere, not even for errors or status.

Colour tokens (one green family):
- --white #FFFFFF (app background)
- --green-50 #F3F7F3 (surface, cards on white, draft pill bg)
- --green-100 #E3ECE3 (hairline borders, active nav pill, tinted highlights, focus ring wash)
- --green-200 #CCDACC (strong border, disabled button bg)
- --green-400 #7C957C (placeholder text, disabled icons)
- --green-500 #5B785B (inactive nav icons and labels, secondary icons)
- --green-600 #3F5F3F (secondary text)
- --green-800 #0D3A0D (primary hover)
- --green-900 #002500 (PRIMARY: buttons, primary text, active icons, headings)
- --green-950 #001A00 (pressed state)
Text: primary text is --green-900, secondary text --green-600, placeholder --green-400. Verify WCAG AA contrast for every text/background pair.

Shape and spacing: radius 12px for controls, 16px for cards, 14px for the nav pill, full pill for status chips. Base spacing unit 4px. Minimum touch target 44px. Borders 1px var(--green-100). Cards: --green-50 background, no shadow.

Components in /components/ui, each with all states (default, hover, pressed, focus-visible, disabled, loading where relevant):
- Button: primary (--green-900 bg, white text; hover --green-800; pressed --green-950; disabled --green-200 bg with white text), secondary (white bg, 1px --green-200 border, --green-900 text; hover --green-50), ghost (transparent, --green-900 text; hover --green-50), destructive (white bg, 1.5px --green-900 border, Trash icon, --green-900 text) which ALWAYS opens a ConfirmDialog whose confirm button is the primary button labelled with the action ("Delete invoice"). Sizes sm/md/lg, full-width option, optional leading icon, loading spinner. Only ONE primary button per screen.
- Input, Textarea, Select, DatePicker (native date input styled): label above, helper text below. Focus: 1px --green-900 border + 3px --green-100 ring. Error: 1.5px --green-900 border + WarningCircle icon + message text in --green-900. Never signal an error by colour alone, always icon + text.
- Focus-visible on every interactive element: 2px --green-900 outline with 2px offset.
- Image uploader (preview, replace, remove), Toggle switch (on = --green-900 track, off = --green-200 track, white thumb), Segmented control, Card, ListRow (icon, title, value, chevron), Divider, EmptyState, Toast (--green-900 bg, white text), BottomSheet (mobile pickers), ConfirmDialog, Avatar.
- Highlight: key amounts (like the pending total) may use a --green-100 marker background behind the number with --green-900 text, as a subtle emphasis.
- StatusPill (differentiated by icon and fill style, not hue):
  - Draft: --green-50 bg, --green-600 text, 1px --green-100 border, PencilSimple icon
  - Pending: --green-100 bg, --green-900 text, Clock icon
  - Overdue: --green-900 bg, white text, WarningCircle icon
  - Paid: white bg, --green-900 text, 1px --green-900 border, CheckCircle icon
- BottomNav: 3 tabs, icon + label ALWAYS visible — Invoice (Receipt), History (ClockCounterClockwise), Profile (User). Fixed to bottom, white background, 1px --green-100 top border, safe-area padding (env(safe-area-inset-bottom)). Active tab: a rounded 14px pill background in --green-100 behind the icon and label, icon in "bold" weight, icon and label in --green-900, label weight 500. Inactive tabs: no pill, "regular" weight icon and label in --green-500. Smooth 150ms transition when switching.
Create a /design page that showcases every token, component and state.

Layout: mobile-first. On tablet/desktop, centre the app in a max-width ~480px column; allow the invoice preview to use more width. Respect iOS safe areas. Sticky top bar with screen title and optional back button.

## Onboarding (first launch only)
Short 3-step setup with a progress indicator, skippable where sensible:
1. Creator profile: full name, Instagram username (store without @, show with @), email, phone (+91 format), PAN (validate AAAAA9999A), business address (line 1, line 2, city, state dropdown of Indian states/UTs, 6-digit PIN). Uploads: profile photo, logo, signature.
2. Tax: "I am GST registered" toggle. If on: GSTIN (validate 15-char format and check that characters 3–12 match the PAN), default SAC code (editable, nothing hardcoded). Default TDS rate (editable %, default empty) with a note that the brand may deduct TDS and the creator should confirm the rate with their CA.
3. Payment: account holder name, account number (with confirm field), IFSC (validate 11-char format), bank name, branch; UPI ID (validate name@handle); optional upload of a static QR image.
After setup, go to the Invoice tab. Everything stays editable in Profile.

## Tab 1: Invoice
- Top: "Pending" summary card showing total pending (Pending + Overdue) with the amount highlighted, and a primary "New invoice" button.
- Invoice form (single scrolling page with clear sections, sticky bottom bar showing the total and a "Preview" button):
  - Invoice number: auto-generated per Indian financial year (April–March), format BLY/26-27/001, max 16 characters, editable, must be unique.
  - Invoice date (default today), payment terms (Due on receipt, Net 7, Net 15, Net 30, Custom), payment due date (auto from terms, editable), content delivery date.
  - Bill to: pick a saved brand from a searchable bottom sheet, or add a new brand inline. Option "Billing via agency": select the agency plus the end brand name (shown as "Campaign for: <Brand>").
  - Campaign name (optional).
  - Line items: quick-add preset chips (Instagram Reel, Story set, Static post, Carousel, Link in bio, Usage rights, Whitelisting / paid ads access, Custom). Each item: description, quantity, rate, amount. Creator can save own presets with default rates (managed in Profile).
  - Taxes: if GST registered, auto-apply 18% as CGST 9% + SGST 9% when brand state equals creator state, else IGST 18% (rate editable); document titled "Tax Invoice". If not registered, no GST and the document is titled "Invoice".
  - TDS: optional lines "Less: expected TDS @ x%" and "Net receivable". TDS is informational and does NOT reduce the invoice total.
  - Notes / terms (prefilled from a saved default).
  - Amount in words in Indian format, e.g. "Rupees Forty-Eight Thousand Five Hundred Only".
  - Toggles: include bank details, include UPI QR, include signature.
- Save as Draft anytime; auto-save the form to prevent data loss.
- Preview screen: renders exactly like the PDF. Actions: Download PDF, Share (Web Share API with the PDF file, fall back to download), Mark as sent (status becomes Pending), Edit.

## Invoice PDF design
A4, nearly monochrome so it prints well in black and white: --green-900 text on white, one thin 1px --green-900 rule under the header, creator logo top-left, "INVOICE" or "TAX INVOICE" top-right with invoice number and dates. Sections: From (name, @instagram, address, email, phone, PAN, GSTIN if any), Bill to (brand/agency name, address, GSTIN, contact), campaign, line-items table (hairline row dividers, --green-50 header row), subtotal, tax lines, total (largest number on the page), amount in words, TDS note if enabled, payment block (bank details plus a generated UPI QR with the exact amount: upi://pay?pa=<upi>&pn=<name>&am=<total>&cu=INR&tn=<invoice number>), notes/terms, signature image with name, footer "Generated with Billy". Format money with en-IN grouping (₹1,23,456.00).

## Tab 2: History
- Summary row: total invoiced this financial year, total paid, total pending.
- Filter chips: All, Draft, Pending, Overdue, Paid. Search by brand or invoice number.
- List rows (bordered rows, not heavy cards): brand name, item summary (e.g. "2 Reels"), invoice number, date, amount, StatusPill.
- Overdue is computed automatically: status Pending and the due date has passed.
- Row actions (tap for detail; swipe or menu): View, Download/Share PDF, Mark as paid (with paid date), Duplicate (new number, today's date), Edit (drafts freely; sent invoices with a warning), Delete (destructive button plus confirm dialog).
- Empty state: invitation-style copy and a "Create your first invoice" button.

## Tab 3: Profile
List rows that open edit screens: Creator details, Images (photo, logo, signature), Tax settings (GST, SAC, default TDS), Bank and UPI, Brands and agencies (list, add, edit, delete: company name, type brand/agency, GSTIN optional, billing address with state, contact person, email, phone), Saved line-item presets, Default notes/terms, Invoice number prefix, Backup (export all data as JSON, import from JSON with confirmation), App info and an "Install app" button (beforeinstallprompt on Android; Add to Home Screen instructions on iOS).

## Copy style
Sentence case everywhere. Buttons are verb-first, 1–3 words ("Create invoice", "Mark as paid"). No exclamation marks, no "please", no "successfully". Errors say what happened and what to do, in one sentence ("IFSC needs 11 characters"). Placeholders are real examples, not labels.

## Quality bar
- Accessible: semantic HTML, labels on every input, aria-labels on icon-only buttons, visible focus, AA contrast, status never conveyed by colour alone.
- Subtle transitions (150–200ms), no flashy animation.
- No runtime network calls except fonts at build time.
- Folder structure: /app, /components/ui, /components/invoice, /lib (db, formatters, validators, tax, numbering, amount-in-words, upi), /types.
- Unit-test pure logic in /lib (numbering, tax split, amount in words, validators) with Vitest.
- README: how to run, build, and deploy the static export (Vercel or any static host).

## Phases
1. Project setup, tokens, all UI components, bottom nav, and the /design showcase page.
2. Dexie database, types, onboarding flow, Profile tab.
3. Brands, invoice form, preview, PDF generation, UPI QR.
4. History tab, statuses, duplicate, mark as paid, summaries.
5. PWA (manifest, icons, service worker, install prompt, offline), backup export/import, tests, README, final responsive and accessibility pass.
