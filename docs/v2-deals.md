# v2.4 Rate card and deals (designed, not built)

The creator publishes a rate card, which works like a menu of their prices, and shares the link with a brand or agency. The brand browses the rates and sends an offer without signing in. The two sides can negotiate in rounds. Each new offer or counter lands on the Invoice tab as a **deal**, and an accepted deal becomes a quote or invoice in one tap.

Decisions:
- **Brands:** never create an account, and their email is not verified, so the spam controls in section 5 are mandatory.
- **Alerts:** in-app only, with no email or push.
- **Prerequisite:** the prerequisite in section 10 must be done first.

## 1. Shape of the system
- **Creator side (the existing app):** the rate card is local-first. It lives in Dexie, syncs like presets (reusing `pushTable` / `fetchSince` in `lib/sync-engine.ts`) and is edited in Profile → Rate card. Deals are **server-authoritative**: Dexie keeps a read-only cache that is pulled incrementally. Every deal action goes through a Postgres function, so the negotiation state machine can't be bypassed.
- **Brand side (two new public static pages, no login):**
  - `app/r/page.tsx` serves `/r/?h=<handle>`, the rate card.
  - `app/d/page.tsx` serves `/d/#<token>`, the private deal thread.
  - The token sits after `#`, so it never reaches server logs or referrers.
  - They fit the static export (`output: "export"`). A host rewrite can map `/@handle` to `/r/?h=handle` later.
  - Both pages live outside `AppShell` and use the Stash design system.
- **Backend:**
  - One Supabase Edge Function, `deals-public`, holds the service-role key server-side. It handles every anonymous request and checks the captcha, rate limits, input sizes and honeypot.
  - Postgres functions (`security definer`) do the writes. Each locks the deal row and checks the round number.
  - The `anon` role has **no table access at all**.

## 2. Database (migration `supabase/migrations/004_deals.sql`)
Conventions match `supabase/schema.sql`: uuid ids, `user_id` on every row, RLS with `user_id = auth.uid()`, indexes leading with `user_id`, money as `numeric(14,2)` rupees (paise on the client), `updated_at` trigger, soft delete.

| Table | Purpose | Key columns |
|---|---|---|
| `rate_cards` | One per creator | `user_id` unique, `handle` citext unique (3–30 chars, `[a-z0-9._]`), `is_published`, `accepting_offers`, `display_name`, `headline`, `bio`, `photo_path`, `terms`, `offer_validity_days` (default 14), `max_rounds` (default 10), `updated_at` |
| `rate_card_items` | Menu lines | `rate_card_id`, `user_id`, `position`, `label`, `description`, `unit_label`, `price_type` (`fixed` \| `starting_at` \| `on_request`), `price` (null when on request), `turnaround_days`, `usage_rights`, `is_active`, `preset_id` (link to `line_item_presets`), `updated_at`, `deleted_at` |
| `deals` | One negotiation | `user_id` (creator), `rate_card_id`, `token_hash` bytea unique (sha256 of the brand's 256-bit token), `status`, `round`, `last_actor` (`brand` \| `creator`), `current_offer_id`, `brand_name`, `company`, `party_type`, `end_brand_name`, `email`, `phone`, `campaign_name`, `brief`, `go_live_date`, `expires_at`, `last_activity_at`, `creator_seen_at`, `brand_seen_at`, `party_id`, `invoice_id` (the quote or invoice made from it), `ip_hash`, `created_at`, `updated_at`, `deleted_at` (creator archived it) |
| `deal_offers` | Append-only history (never updated) | `deal_id`, `user_id`, `round`, `author`, `items` jsonb (each: `rate_card_item_id`, `label`, `unit_label`, `quantity`, `unit_price`, `note`), `subtotal` (computed server-side), `message`, `valid_until`, `client_request_id` unique per deal (idempotency), `created_at` |
| `deal_events` | Audit trail and "seen" signals | `deal_id`, `user_id`, `kind` (`viewed`, `accepted`, `declined`, `withdrawn`, `blocked`, `link_rotated`, `converted`), `actor`, `created_at` |
| `blocked_senders` | Creator's block list | `user_id`, `email_hash`, `ip_hash`, `created_at` |
| `rate_limits` | Fixed-window counters | `key` (for example `ip:<hash>:new_deal`), `window_start`, `count`; cleaned by `pg_cron` |

**Indexes**
- `deals (user_id, last_activity_at desc) where deleted_at is null`: the inbox.
- `deals (user_id, updated_at)`: sync.
- `deals (token_hash)` unique.
- `deal_offers (deal_id, round)`.
- `deal_offers (user_id, created_at)`: sync.
- `rate_card_items (rate_card_id, position)`.
- `rate_cards (lower(handle))` unique.

**RLS**
- The creator can `select` their own deals, offers and events. Insert, update and delete happen only through functions.
- Rate card tables use the standard owner policies for creator sync.
- The public reads published cards only through the Edge Function.

## 3. Deal state machine (`lib/deals.ts` pure and tested, mirrored in SQL)
**Stored statuses**
- `open`: the brand made the latest offer and it's the creator's turn.
- `countered`: the creator made the latest offer and it's the brand's turn.
- `accepted`, `declined`, `withdrawn`.

**Computed:** `expired`. A deal counts as expired once `expires_at < now()` while it's `open` or `countered`. It is never stored, matching the "overdue is computed" rule.

**Transitions**, all through `deal_act(deal_id | token, actor, action, expected_round, payload)`
- Only the side whose turn it is can `counter` or `accept`. Accept must name the `current_offer_id`, so nobody can accept a stale offer. Nobody can accept their own offer.
- Either side can `decline` while the deal is open or countered. The brand can `withdraw` at any time before acceptance.
- A counter appends to `deal_offers`, increments `round`, flips `last_actor`, and resets `expires_at` to `valid_until` (by default now + `offer_validity_days`).
- After `max_rounds`, the only actions left are accept or decline.
- `accepted`, `declined` and `withdrawn` are final. Any further change means a new deal.
- On an expired deal the brand can't act. The creator may send a fresh counter, which reopens the deal and resets the expiry.

**Concurrency and repeats**
- `select … for update` plus an `expected_round` check. If both sides act at once, the second gets "This deal just changed" and the latest state.
- `client_request_id` makes double-taps and retries safe.

## 4. Flows
1. **Publish (creator, online, signed in with email, never anonymous)**
   - Claim a handle through the `claim_handle` RPC, which is uniqueness-checked.
   - Add items, seeded from saved line items (presets).
   - Turn on Publish.
   - Share the link via Web Share, WhatsApp or copy.
2. **Brand browses `/r/?h=`.**
   - Shows display name, photo, headline, items, terms, and "Prices exclude GST".
   - Never shows PAN, address, bank details or phone.
   - If the card is unpublished or paused, it shows "Not taking offers right now".
   - The response is CDN-cacheable for 60 seconds.
3. **Brand sends an offer.**
   - **Form:** pick items and quantities and propose a price per line (the listed price by default; "on request" lines need a price). Add campaign, brief, go-live date, name, company, brand or agency (with the end brand for agencies), email and phone.
   - **Spam checks:** Cloudflare Turnstile and a honeypot.
   - **Result:** the function creates the deal and the first offer and returns a one-time private link `/d/#<token>`. The page tells the brand to save the link to continue the conversation, since no email is sent.
4. **Creator sees it on the Invoice tab.**
   - A "Deals" section sits at the top.
   - **Cards:** each shows brand, deliverables summary (reusing `itemSummary` in `lib/summary.ts`), offered total and a status pill. Pills always show icon and word: New offer, Your turn, Waiting on brand, Accepted (`good`), Expired (`warm`), Declined/Withdrawn (`soft`).
   - **Unread:** `last_activity_at > creator_seen_at` puts a dot on the card and a count on the tab.
5. **Deal screen (new `deal` route in `lib/nav.tsx`, rendered with `PushedScreen`).**
   - **Thread:** each offer shows its item table, total and the change from the previous round (₹20,000 → ₹25,000), alongside the brief and contact details.
   - **Footer:** Accept (primary), Counter and Decline. Decline uses `ConfirmDialog`.
   - **Counter:** a sheet pre-filled from the latest offer, using `AmountField`, `Keypad` and `Stepper`, plus a message and a valid-until date.
   - **Offline:** actions need the network. When offline the buttons are disabled with "Connect to the internet to reply".
6. **Brand thread `/d/#token`.**
   - Shows the same history.
   - On the brand's turn: Accept, Counter or Decline. Withdraw is available any time before acceptance.
   - Shows "Seen by creator" from `creator_seen_at`.
7. **Accepted → document.**
   - The creator taps "Create quote" (v2.2) or "Create invoice" (if v2.2 isn't built yet).
   - A Party is matched by email, then by name, or created.
   - Brand or agency details map to `viaAgency` / `endBrandName`, items become `LineItem`s (price → `rate` in paise), and the campaign name carries over.
   - `deal.invoice_id` is set. This is idempotent: it opens the existing document if one was already made.

## 5. Spam and abuse (no brand verification)
- **Captcha:** Turnstile on every new deal and every brand counter.
- **Rate limits:**
  - New deals: 5 per IP per hour, 2 per IP per handle per day.
  - 50 new deals per handle per day, after which the card shows "Not taking offers right now" until midnight.
  - 30 actions per hour per brand token.
- **Input limits:**
  - 20 items per offer; quantity 1–100; unit price ₹0–₹1,00,00,000.
  - Message 2,000 characters; brief 4,000; names 120.
  - Plain text only, rendered without links.
- **Creator controls:**
  - Block a sender, which adds the email and IP hash to `blocked_senders` and archives the deal.
  - Pause offers.
  - Archive a deal.
- **Labels:** every brand email shows "Not verified" in the creator UI.
- **Privacy:** IPs are stored only as salted hashes and deleted after 30 days.
- **Lost brand link:** the creator taps "New brand link". This rotates `token_hash` (logged as `link_rotated`) and the creator shares the new link themselves.

## 6. Other cases
- **Rate card changes:** offers keep their own copies of items and prices, so editing or deleting card items never changes open deals.
- **Handle changes:** the old link stops working. Warn before saving. Redirects are a later phase.
- **Creator signs out or loses the device:** deals live on the server and come back on sign-in. A deleted account cascades, and the brand page shows "This deal is no longer available".
- **Tax and currency:**
  - Offers are pre-GST. GST and TDS are applied by the existing quote or invoice logic (`computeTotals` in `lib/tax.ts`).
  - INR only until v2.3 (foreign-brand invoices).
- **Time:** dates are shown in IST, timestamps stored in UTC.
- **Totals:** quotes and deals never count in invoice totals, consistent with the v2.2 rule.

## 7. Scale
- **Stateless function:** the Edge Function holds no state, every query is index-bound, and inbox and sync reads are per-user and paged.
- **Growth:** `deal_offers` is append-only and grows linearly. It is small rows with jsonb items, so no partitioning is needed for a long time.
- **Read load:** the public rate card is CDN-cached for 60 seconds, so heavy traffic on one shared link barely touches Postgres.
- **Background jobs (pg_cron):** clean up `rate_limits` hourly, purge IP hashes after 30 days.
- **Live updates:** Supabase Realtime on `deals` (filtered by `user_id`) is phase 4, for instant in-app updates while Billy is open. It stays in-app only, matching the decision.

## 8. Client code (when built)
| Area | Files |
|---|---|
| Pure logic + Vitest | `lib/deals.ts` (state machine, validation, totals, diff), `lib/rate-card.ts` (handle rules, public view model) |
| Local data | `db/schema.ts` (Dexie `version(2)`: `rateCard`, `rateCardItems`, `deals`, `dealOffers`), `db/queries.ts` (`useDeals`, `useDeal`) |
| Sync | `lib/sync.ts` row mappings plus tests, `lib/sync-engine.ts` (push the rate card, pull deals and offers, deal actions through RPC) |
| Screens | `components/screens/profile/RateCard.tsx`, `components/screens/DealScreen.tsx`, Deals section in `components/screens/InvoiceTab.tsx`, routes `rate-card` and `deal` in `lib/nav.tsx` and `AppShell.tsx` |
| Public pages | `app/r/page.tsx`, `app/d/page.tsx` (noindex) |
| Backend | `supabase/migrations/004_deals.sql`, `supabase/functions/deals-public/index.ts` |
| Docs | `/design` showcase for deal cards and status pills |

## 9. Phases
1. **Rate card:** editor, sync, handle claim, publish, public `/r/` page.
2. **First offers:** brand offer with captcha and limits, Deals inbox on the Invoice tab, Accept or Decline, convert to quote or invoice.
3. **Negotiation:** counters both ways, brand thread `/d/`, withdraw, expiry, concurrency, block, rotate link.
4. **Polish:** Realtime, acceptance-rate insights (ties to v2.1 brand insights), handle redirects, optional private minimum price per item.

## 10. Prerequisite
Switch sign-in to OTP mode (`NEXT_PUBLIC_AUTH_MODE=otp`) before phase 1. With email-only testing auth, anyone who knows a creator's email could open their deals.
