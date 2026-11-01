-- =============================================================================
-- Billy — Supabase schema
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS.
--
-- Design notes
-- * Every row is owned by auth.uid() and protected by RLS.
-- * IDs are UUIDs generated on the client so Dexie (IndexedDB) and Supabase
--   rows share the same id. Server defaults exist only as a fallback.
-- * updated_at is maintained by trigger; deleted_at is a soft-delete tombstone
--   used for sync (last-write-wins on updated_at).
-- * Money is numeric(14,2) in rupees. The client calculates in paise.
-- * Invoice status stored: draft | pending | paid. "overdue" is computed
--   (see view invoices_with_status).
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.party_type as enum ('brand', 'agency');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invoice_status as enum ('draft', 'pending', 'paid');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_terms as enum ('due_on_receipt', 'net_7', 'net_15', 'net_30', 'custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gst_mode as enum ('none', 'intra', 'inter');  -- none | CGST+SGST | IGST
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Shared trigger: keep updated_at fresh
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  -- Keep the client's value (last-write-wins sync); stamp server time only if unchanged.
  if tg_op = 'INSERT' then
    new.updated_at := now();
  elsif new.updated_at is not distinct from old.updated_at then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Reference: Indian states / UTs with GST state codes (read-only, public)
-- -----------------------------------------------------------------------------
create table if not exists public.indian_states (
  code      text primary key,          -- 2-digit GST state code, e.g. '27'
  name      text not null unique,
  is_ut     boolean not null default false
);

insert into public.indian_states (code, name, is_ut) values
  ('01', 'Jammu and Kashmir', true),
  ('02', 'Himachal Pradesh', false),
  ('03', 'Punjab', false),
  ('04', 'Chandigarh', true),
  ('05', 'Uttarakhand', false),
  ('06', 'Haryana', false),
  ('07', 'Delhi', true),
  ('08', 'Rajasthan', false),
  ('09', 'Uttar Pradesh', false),
  ('10', 'Bihar', false),
  ('11', 'Sikkim', false),
  ('12', 'Arunachal Pradesh', false),
  ('13', 'Nagaland', false),
  ('14', 'Manipur', false),
  ('15', 'Mizoram', false),
  ('16', 'Tripura', false),
  ('17', 'Meghalaya', false),
  ('18', 'Assam', false),
  ('19', 'West Bengal', false),
  ('20', 'Jharkhand', false),
  ('21', 'Odisha', false),
  ('22', 'Chhattisgarh', false),
  ('23', 'Madhya Pradesh', false),
  ('24', 'Gujarat', false),
  ('26', 'Dadra and Nagar Haveli and Daman and Diu', true),
  ('27', 'Maharashtra', false),
  ('29', 'Karnataka', false),
  ('30', 'Goa', false),
  ('31', 'Lakshadweep', true),
  ('32', 'Kerala', false),
  ('33', 'Tamil Nadu', false),
  ('34', 'Puducherry', true),
  ('35', 'Andaman and Nicobar Islands', true),
  ('36', 'Telangana', false),
  ('37', 'Andhra Pradesh', false),
  ('38', 'Ladakh', true)
on conflict (code) do update set name = excluded.name, is_ut = excluded.is_ut;

-- -----------------------------------------------------------------------------
-- profiles — one row per user (creator details, tax settings, defaults)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,

  -- Creator details
  full_name             text,
  instagram_username    text check (instagram_username is null or instagram_username ~ '^[A-Za-z0-9._]{1,30}$'),
  email                 text,
  phone                 text check (phone is null or phone ~ '^\+91[6-9][0-9]{9}$'),
  pan                   text check (pan is null or pan ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
  address_line1         text,
  address_line2         text,
  city                  text,
  state_code            text references public.indian_states(code),
  pin                   text check (pin is null or pin ~ '^[1-9][0-9]{5}$'),

  -- Images (paths inside storage bucket 'creator-assets')
  photo_path            text,
  logo_path             text,
  signature_path        text,

  -- Tax
  gst_registered        boolean not null default false,
  gstin                 text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  default_sac           text check (default_sac is null or default_sac ~ '^[0-9]{4,8}$'),
  default_tds_rate      numeric(5,2) check (default_tds_rate is null or (default_tds_rate >= 0 and default_tds_rate <= 100)),

  -- Defaults
  invoice_prefix        text not null default 'BLY' check (char_length(invoice_prefix) between 1 and 6),
  default_notes         text,
  invoice_template      text not null default 'classic' check (invoice_template in ('classic','statement','signature','structured','studio')),
  default_include_bank  boolean not null default true,
  default_include_upi   boolean not null default true,
  default_include_sign  boolean not null default true,

  onboarded_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  -- GSTIN chars 3–12 must equal PAN
  constraint gstin_matches_pan check (
    gstin is null or pan is null or substring(gstin from 3 for 10) = pan
  ),
  -- GSTIN required when registered
  constraint gstin_required_when_registered check (
    not gst_registered or gstin is not null
  )
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create an empty profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- payment_details — bank + UPI (one row per user)
-- -----------------------------------------------------------------------------
create table if not exists public.payment_details (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  account_holder_name   text,
  account_number        text check (account_number is null or account_number ~ '^[0-9]{9,18}$'),
  ifsc                  text check (ifsc is null or ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  bank_name             text,
  branch                text,
  upi_id                text check (upi_id is null or upi_id ~ '^[A-Za-z0-9._-]{2,100}@[A-Za-z][A-Za-z0-9.-]{1,63}$'),
  static_qr_path        text,  -- optional uploaded QR image in 'creator-assets'
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists trg_payment_details_updated_at on public.payment_details;
create trigger trg_payment_details_updated_at
  before update on public.payment_details
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- parties — brands and agencies the creator bills
-- -----------------------------------------------------------------------------
create table if not exists public.parties (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  type              public.party_type not null default 'brand',
  name              text not null check (char_length(name) between 1 and 200),
  gstin             text check (gstin is null or gstin ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  address_line1     text,
  address_line2     text,
  city              text,
  state_code        text references public.indian_states(code),
  pin               text check (pin is null or pin ~ '^[1-9][0-9]{5}$'),
  contact_person    text,
  email             text,
  phone             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index if not exists idx_parties_user on public.parties (user_id) where deleted_at is null;
create index if not exists idx_parties_user_updated on public.parties (user_id, updated_at);
create index if not exists idx_parties_name on public.parties (user_id, lower(name));

drop trigger if exists trg_parties_updated_at on public.parties;
create trigger trg_parties_updated_at
  before update on public.parties
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- line_item_presets — creator's saved quick-add chips with default rates
-- -----------------------------------------------------------------------------
create table if not exists public.line_item_presets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  label             text not null check (char_length(label) between 1 and 60),   -- chip text, e.g. "Instagram Reel"
  description       text,                                                         -- default line description
  default_quantity  numeric(10,2) not null default 1 check (default_quantity > 0),
  default_rate      numeric(14,2) check (default_rate is null or default_rate >= 0),
  unit_label        text,                                                         -- e.g. "Reel", used for summaries like "2 Reels"
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index if not exists idx_presets_user on public.line_item_presets (user_id, sort_order) where deleted_at is null;
create index if not exists idx_presets_user_updated on public.line_item_presets (user_id, updated_at);

drop trigger if exists trg_presets_updated_at on public.line_item_presets;
create trigger trg_presets_updated_at
  before update on public.line_item_presets
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- invoices
-- -----------------------------------------------------------------------------
create table if not exists public.invoices (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null default auth.uid() references auth.users(id) on delete cascade,

  invoice_number        text not null check (char_length(invoice_number) between 1 and 16),
  financial_year        text not null check (financial_year ~ '^[0-9]{2}-[0-9]{2}$'),  -- e.g. '26-27'
  status                public.invoice_status not null default 'draft',

  -- Dates & terms
  invoice_date          date not null default current_date,
  payment_terms         public.payment_terms not null default 'due_on_receipt',
  custom_terms_days     integer check (custom_terms_days is null or custom_terms_days >= 0),
  due_date              date,
  delivery_date         date,

  -- Bill to
  bill_to_party_id      uuid references public.parties(id) on delete set null,  -- brand, or agency when via_agency
  via_agency            boolean not null default false,
  end_brand_name        text,                                                    -- "Campaign for: <Brand>"
  campaign_name         text,

  -- Frozen copies at time of sending (so later profile/brand edits don't alter sent invoices)
  from_snapshot         jsonb,
  bill_to_snapshot      jsonb,
  payment_snapshot      jsonb,

  -- Tax
  is_tax_invoice        boolean not null default false,       -- "Tax Invoice" vs "Invoice"
  gst_mode              public.gst_mode not null default 'none',
  gst_rate              numeric(5,2) not null default 0 check (gst_rate >= 0 and gst_rate <= 100), -- total rate, e.g. 18
  sac_code              text,
  place_of_supply_code  text references public.indian_states(code),

  -- Amounts (rupees)
  subtotal              numeric(14,2) not null default 0 check (subtotal >= 0),
  cgst_amount           numeric(14,2) not null default 0 check (cgst_amount >= 0),
  sgst_amount           numeric(14,2) not null default 0 check (sgst_amount >= 0),
  igst_amount           numeric(14,2) not null default 0 check (igst_amount >= 0),
  total                 numeric(14,2) not null default 0 check (total >= 0),
  amount_in_words       text,

  -- TDS (informational; never reduces total)
  show_tds              boolean not null default false,
  tds_rate              numeric(5,2) check (tds_rate is null or (tds_rate >= 0 and tds_rate <= 100)),
  tds_amount            numeric(14,2) check (tds_amount is null or tds_amount >= 0),
  net_receivable        numeric(14,2),

  -- Content & toggles
  notes                 text,
  include_bank          boolean not null default true,
  include_upi_qr        boolean not null default true,
  include_signature     boolean not null default true,
  template              text check (template is null or template in ('classic','statement','signature','structured','studio')),

  -- Lifecycle
  sent_at               timestamptz,
  paid_date             date,
  duplicated_from_id    uuid references public.invoices(id) on delete set null,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz,

  constraint invoice_paid_has_date check (status <> 'paid' or paid_date is not null),
  constraint invoice_tax_mode_consistent check (
    (gst_mode = 'none'  and cgst_amount = 0 and sgst_amount = 0 and igst_amount = 0)
    or (gst_mode = 'intra' and igst_amount = 0)
    or (gst_mode = 'inter' and cgst_amount = 0 and sgst_amount = 0)
  )
);

-- Invoice numbers are unique per user (ignoring soft-deleted rows)
create unique index if not exists uq_invoices_user_number
  on public.invoices (user_id, invoice_number)
  where deleted_at is null;

create index if not exists idx_invoices_user_status on public.invoices (user_id, status) where deleted_at is null;
create index if not exists idx_invoices_user_date   on public.invoices (user_id, invoice_date desc) where deleted_at is null;
create index if not exists idx_invoices_user_fy     on public.invoices (user_id, financial_year) where deleted_at is null;
create index if not exists idx_invoices_user_updated on public.invoices (user_id, updated_at);
create index if not exists idx_invoices_party       on public.invoices (bill_to_party_id);

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- invoice_items — line items
-- -----------------------------------------------------------------------------
create table if not exists public.invoice_items (
  id                uuid primary key default gen_random_uuid(),
  invoice_id        uuid not null references public.invoices(id) on delete cascade,
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  position          integer not null default 0,
  preset_id         uuid references public.line_item_presets(id) on delete set null,
  description       text not null default '' check (char_length(description) <= 500),
  unit_label        text,
  quantity          numeric(10,2) not null default 1 check (quantity >= 0),
  rate              numeric(14,2) not null default 0 check (rate >= 0),
  amount            numeric(14,2) generated always as (round(quantity * rate, 2)) stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

create index if not exists idx_items_invoice on public.invoice_items (invoice_id, position) where deleted_at is null;
create index if not exists idx_items_user_updated on public.invoice_items (user_id, updated_at);
create index if not exists idx_items_user on public.invoice_items (user_id);

drop trigger if exists trg_items_updated_at on public.invoice_items;
create trigger trg_items_updated_at
  before update on public.invoice_items
  for each row execute function public.set_updated_at();

-- Items must belong to an invoice owned by the same user
create or replace function public.check_item_owner()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.invoices i
    where i.id = new.invoice_id and i.user_id = new.user_id
  ) then
    raise exception 'Invoice item owner does not match invoice owner';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_items_owner on public.invoice_items;
create trigger trg_items_owner
  before insert or update on public.invoice_items
  for each row execute function public.check_item_owner();

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

-- Indian financial year label for a date: 2026-10-31 → '26-27', 2027-02-01 → '26-27'
create or replace function public.fy_label(d date)
returns text
language sql
immutable
as $$
  select case
    when extract(month from d) >= 4
      then to_char(d, 'YY') || '-' || to_char(d + interval '1 year', 'YY')
    else to_char(d - interval '1 year', 'YY') || '-' || to_char(d, 'YY')
  end;
$$;

-- Start date of the financial year containing d
create or replace function public.fy_start(d date)
returns date
language sql
immutable
as $$
  select make_date(
    case when extract(month from d) >= 4 then extract(year from d)::int
         else extract(year from d)::int - 1 end,
    4, 1);
$$;

-- Suggest the next invoice number for the current user, e.g. 'BLY/26-27/004'.
-- The client generates numbers offline too; this is for use when online.
create or replace function public.next_invoice_number(p_date date default current_date)
returns text
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_prefix text;
  v_fy     text := public.fy_label(p_date);
  v_next   integer;
begin
  select coalesce(invoice_prefix, 'BLY') into v_prefix
  from public.profiles where id = auth.uid();

  v_prefix := coalesce(v_prefix, 'BLY');

  select coalesce(max((regexp_match(invoice_number, '/([0-9]+)$'))[1]::int), 0) + 1
    into v_next
  from public.invoices
  where user_id = auth.uid()
    and financial_year = v_fy
    and deleted_at is null
    and invoice_number like v_prefix || '/' || v_fy || '/%';

  return v_prefix || '/' || v_fy || '/' || lpad(v_next::text, 3, '0');
end;
$$;

-- -----------------------------------------------------------------------------
-- Views (security_invoker so RLS of the caller applies)
-- -----------------------------------------------------------------------------

-- Invoices with computed display status (adds 'overdue')
create or replace view public.invoices_with_status
with (security_invoker = true)
as
select
  i.*,
  case
    when i.status = 'pending' and i.due_date is not null and i.due_date < current_date
      then 'overdue'
    else i.status::text
  end as display_status,
  coalesce(i.bill_to_snapshot ->> 'name', p.name) as bill_to_name
from public.invoices i
left join public.parties p on p.id = i.bill_to_party_id
where i.deleted_at is null;

-- Per-user totals for the current financial year (History summary row)
create or replace view public.invoice_summary_current_fy
with (security_invoker = true)
as
select
  i.user_id,
  public.fy_label(current_date)                                                    as financial_year,
  coalesce(sum(i.total) filter (where i.status in ('pending', 'paid')), 0)         as total_invoiced,
  coalesce(sum(i.total) filter (where i.status = 'paid'), 0)                       as total_paid,
  coalesce(sum(i.total) filter (where i.status = 'pending'), 0)                    as total_pending,
  coalesce(sum(i.total) filter (where i.status = 'pending' and i.due_date < current_date), 0) as total_overdue,
  count(*) filter (where i.status = 'draft')                                       as draft_count
from public.invoices i
where i.deleted_at is null
  and i.invoice_date >= public.fy_start(current_date)
group by i.user_id;

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.indian_states      enable row level security;
alter table public.profiles           enable row level security;
alter table public.payment_details    enable row level security;
alter table public.parties            enable row level security;
alter table public.line_item_presets  enable row level security;
alter table public.invoices           enable row level security;
alter table public.invoice_items      enable row level security;

-- indian_states: readable by anyone, writable by no one (via API)
drop policy if exists "states readable" on public.indian_states;
create policy "states readable" on public.indian_states
  for select using (true);

-- profiles: id = auth.uid()
drop policy if exists "profiles select own" on public.profiles;
drop policy if exists "profiles insert own" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "profiles delete own" on public.profiles;
create policy "profiles select own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles insert own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles delete own" on public.profiles for delete to authenticated using (id = auth.uid());

-- Generic owner policies for user_id tables
do $$
declare
  t text;
begin
  foreach t in array array['payment_details', 'parties', 'line_item_presets', 'invoices', 'invoice_items']
  loop
    execute format('drop policy if exists "%1$s select own" on public.%1$I', t);
    execute format('drop policy if exists "%1$s insert own" on public.%1$I', t);
    execute format('drop policy if exists "%1$s update own" on public.%1$I', t);
    execute format('drop policy if exists "%1$s delete own" on public.%1$I', t);

    execute format('create policy "%1$s select own" on public.%1$I for select to authenticated using (user_id = auth.uid())', t);
    execute format('create policy "%1$s insert own" on public.%1$I for insert to authenticated with check (user_id = auth.uid())', t);
    execute format('create policy "%1$s update own" on public.%1$I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
    execute format('create policy "%1$s delete own" on public.%1$I for delete to authenticated using (user_id = auth.uid())', t);
  end loop;
end $$;

-- Grants (Supabase defaults usually cover these; explicit for clarity)
grant usage on schema public to anon, authenticated;
grant select on public.indian_states to anon, authenticated;
grant select, insert, update, delete on
  public.profiles, public.payment_details, public.parties,
  public.line_item_presets, public.invoices, public.invoice_items
  to authenticated;
grant select on public.invoices_with_status, public.invoice_summary_current_fy to authenticated;
grant execute on function public.next_invoice_number(date), public.fy_label(date), public.fy_start(date) to authenticated;

-- -----------------------------------------------------------------------------
-- Storage: private bucket for photo, logo, signature, static UPI QR
-- Object paths must start with the user's id: '<user_id>/logo.png'
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('creator-assets', 'creator-assets', false, 2097152,
        array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "assets select own" on storage.objects;
drop policy if exists "assets insert own" on storage.objects;
drop policy if exists "assets update own" on storage.objects;
drop policy if exists "assets delete own" on storage.objects;

create policy "assets select own" on storage.objects for select to authenticated
  using (bucket_id = 'creator-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "assets insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'creator-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "assets update own" on storage.objects for update to authenticated
  using (bucket_id = 'creator-assets' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'creator-assets' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "assets delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'creator-assets' and (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================================
-- Done. Next: turn on Authentication > Sign In / Providers > "Allow anonymous
-- sign-ins" (testers need no login), then put the project URL and publishable key
-- in .env.local (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).
-- =============================================================================
