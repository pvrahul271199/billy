-- Billy: invoice templates. Safe to run more than once. Run in the Supabase SQL editor.
alter table public.profiles add column if not exists invoice_template text not null default 'classic';
alter table public.profiles drop constraint if exists profiles_invoice_template_check;
alter table public.profiles add constraint profiles_invoice_template_check
  check (invoice_template in ('classic','statement','signature','structured','studio'));

alter table public.invoices add column if not exists template text;
alter table public.invoices drop constraint if exists invoices_template_check;
alter table public.invoices add constraint invoices_template_check
  check (template is null or template in ('classic','statement','signature','structured','studio'));
