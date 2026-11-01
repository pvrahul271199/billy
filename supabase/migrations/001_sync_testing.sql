-- Billy: changes needed for cloud sync with anonymous (no-login) testers.
-- Safe to run more than once. Run in the Supabase SQL editor.
--
-- BEFORE USING: Supabase dashboard > Authentication > Sign In / Providers >
-- turn on "Allow anonymous sign-ins". Each browser then gets its own user id,
-- and Row Level Security keeps every tester's data separate.

-- 1. Keep the client's updated_at (last-write-wins) instead of overwriting it
--    with server time. The server only stamps it when the client didn't change it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.updated_at := now();
  elsif new.updated_at is not distinct from old.updated_at then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- 2. Drafts are saved while half-filled, so don't reject them in the database.
--    The app validates before a bill is previewed or sent.
alter table public.invoice_items drop constraint if exists invoice_items_description_check;
alter table public.invoice_items add constraint invoice_items_description_check check (char_length(description) <= 500);
alter table public.invoice_items drop constraint if exists invoice_items_quantity_check;
alter table public.invoice_items add constraint invoice_items_quantity_check check (quantity >= 0);
alter table public.invoices drop constraint if exists invoice_agency_has_brand;
alter table public.invoices drop constraint if exists invoice_custom_terms;

-- 3. Index for the incremental pull of presets (every table now has user_id first).
create index if not exists idx_presets_user_updated on public.line_item_presets (user_id, updated_at);
create index if not exists idx_items_user on public.invoice_items (user_id);

-- 4. The UPI id pattern used {2,256}, but Postgres regex repeat limit is 255, so
--    every row with a UPI id was rejected ("invalid repetition count(s)").
alter table public.payment_details drop constraint if exists payment_details_upi_id_check;
alter table public.payment_details add constraint payment_details_upi_id_check
  check (upi_id is null or upi_id ~ '^[A-Za-z0-9._-]{2,100}@[A-Za-z][A-Za-z0-9.-]{1,63}$');
