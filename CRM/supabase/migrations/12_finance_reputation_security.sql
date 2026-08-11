-- ============================================================
-- ZimplifAI CRM — Fase E2/F/I · Facturación, Reputación y Hardening
--
-- 1) Fase E2 (finance_suite): presupuestos (quotes + quote_items),
--    facturas (invoices + invoice_items) y cobros (payments).
--    Serie de facturación por subcuenta, impuesto configurable.
-- 2) Fase F (reputation_mgmt): reseñas (reviews) de Google/WhatsApp/web
--    y solicitudes de reseña (review_requests) con canal y estado.
-- 3) Fase I (hardening): garantiza que toda tabla nueva tenga RLS
--    habilitado con políticas multi-tenant estrictas, y endurece
--    profiles contra escalada de privilegios (nadie puede autopromoverse).
--
-- RLS estricto multi-tenant + grants explícitos + realtime.
-- ============================================================

begin;


-- ============================ Fase E2 — Presupuestos ============================

create table public.quotes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  number          text not null,                 -- serie + secuencia, p. ej. "PR-2026-001"
  customer_id     uuid references public.companies (id) on delete set null,
  customer_name   text not null,                 -- snapshot del cliente en el momento del envío
  status          text not null default 'draft' check (status in ('draft','sent','accepted','declined')),
  currency        text not null default 'EUR',
  tax_rate        numeric(5,2) not null default 21,
  subtotal_eur    numeric(12,2) not null default 0,
  tax_eur         numeric(12,2) not null default 0,
  total_eur       numeric(12,2) not null default 0,
  valid_until     date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index quotes_org_idx on public.quotes (organization_id, created_at desc);

create table public.quote_items (
  id              uuid primary key default gen_random_uuid(),
  quote_id        uuid not null references public.quotes (id) on delete cascade,
  description     text not null,
  quantity        numeric(10,2) not null default 1,
  unit_price_eur  numeric(12,2) not null default 0,
  line_total_eur  numeric(12,2) not null default 0,
  created_at      timestamptz not null default now()
);
create index quote_items_quote_idx on public.quote_items (quote_id);

-- ============================ Fase E2 — Facturas y cobros ============================

create table public.invoices (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  number          text not null unique,          -- serie + secuencia, p. ej. "FC-2026-014"
  quote_id        uuid references public.quotes (id) on delete set null, -- factura desde presupuesto aceptado
  customer_id     uuid references public.companies (id) on delete set null,
  customer_name   text not null,
  status          text not null default 'draft' check (status in ('draft','sent','paid','overdue','cancelled')),
  currency        text not null default 'EUR',
  tax_rate        numeric(5,2) not null default 21,
  subtotal_eur    numeric(12,2) not null default 0,
  tax_eur         numeric(12,2) not null default 0,
  total_eur       numeric(12,2) not null default 0,
  issue_date      date not null default (now()::date),
  due_date        date,
  paid_at         timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index invoices_org_idx on public.invoices (organization_id, issue_date desc);

create table public.invoice_items (
  id              uuid primary key default gen_random_uuid(),
  invoice_id      uuid not null references public.invoices (id) on delete cascade,
  description     text not null,
  quantity        numeric(10,2) not null default 1,
  unit_price_eur  numeric(12,2) not null default 0,
  line_total_eur  numeric(12,2) not null default 0,
  created_at      timestamptz not null default now()
);
create index invoice_items_invoice_idx on public.invoice_items (invoice_id);

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  invoice_id      uuid not null references public.invoices (id) on delete cascade,
  amount_eur      numeric(12,2) not null,
  method          text not null default 'transfer' check (method in ('card','transfer','cash','link')),
  reference       text,
  paid_at         timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create index payments_org_invoice_idx on public.payments (organization_id, invoice_id);

-- ============================ Fase F — Reputación ============================

create table public.reviews (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source          text not null default 'google' check (source in ('google','whatsapp','web')),
  rating          integer not null check (rating between 1 and 5),
  customer_name   text not null,
  content         text,
  reply_text      text,
  status          text not null default 'pending' check (status in ('pending','published','archived')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index reviews_org_idx on public.reviews (organization_id, created_at desc);

create table public.review_requests (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  contact_id      uuid references public.companies (id) on delete set null,
  contact_name    text not null,
  channel         text not null default 'whatsapp' check (channel in ('whatsapp','email','sms')),
  status          text not null default 'pending' check (status in ('pending','sent','responded')),
  sent_at         timestamptz,
  responded_at    timestamptz,
  created_at      timestamptz not null default now()
);
create index review_requests_org_idx on public.review_requests (organization_id, created_at desc);

-- ============================ RLS — Presupuestos ============================

alter table public.quotes enable row level security;
create policy "quotes_super_admin_all" on public.quotes
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "quotes_tenant_all" on public.quotes
  for all using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.quote_items enable row level security;
create policy "quote_items_super_admin_all" on public.quote_items
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "quote_items_tenant_all" on public.quote_items
  for all using (
    public.is_tenant_member() and
    quote_id in (select id from public.quotes where organization_id = public.current_org_id())
  )
  with check (
    public.is_tenant_member() and
    quote_id in (select id from public.quotes where organization_id = public.current_org_id())
  );

-- ============================ RLS — Facturas y cobros ============================

alter table public.invoices enable row level security;
create policy "invoices_super_admin_all" on public.invoices
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "invoices_tenant_all" on public.invoices
  for all using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.invoice_items enable row level security;
create policy "invoice_items_super_admin_all" on public.invoice_items
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "invoice_items_tenant_all" on public.invoice_items
  for all using (
    public.is_tenant_member() and
    invoice_id in (select id from public.invoices where organization_id = public.current_org_id())
  )
  with check (
    public.is_tenant_member() and
    invoice_id in (select id from public.invoices where organization_id = public.current_org_id())
  );

alter table public.payments enable row level security;
create policy "payments_super_admin_all" on public.payments
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "payments_tenant_all" on public.payments
  for all using (
    public.is_tenant_member() and
    invoice_id in (select id from public.invoices where organization_id = public.current_org_id())
  )
  with check (
    public.is_tenant_member() and
    invoice_id in (select id from public.invoices where organization_id = public.current_org_id())
  );

-- ============================ RLS — Reputación ============================

alter table public.reviews enable row level security;
create policy "reviews_super_admin_all" on public.reviews
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "reviews_tenant_all" on public.reviews
  for all using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.review_requests enable row level security;
create policy "review_requests_super_admin_all" on public.review_requests
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "review_requests_tenant_all" on public.review_requests
  for all using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ============================ Fase I — Hardening ============================

-- Hardening 1: nadie puede autopromoverse ni cambiar su tenant de forma lateral.
-- Sustituye la política base "profiles_own_update" (que permitía editar rol y
-- organización) por una que solo deja editar el propio perfil manteniendo rol y
-- org intactos. SuperAdmin sigue gestionando perfiles via profiles_super_admin_all.
drop policy if exists "profiles_own_update" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role is not distinct from (select role from public.profiles where id = auth.uid())
    and organization_id is not distinct from (select organization_id from public.profiles where id = auth.uid())
  );

-- Hardening 2: en organizaciones suspendidas se bloquean las escrituras de
-- datos operacionales (leads, facturas, reseñas). Política RESTRICTIVE (se ANDa
-- con las permissivas del tenant) y super_admin siempre puede operar.
create or replace function public.is_org_active()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_super_admin() or exists (
    select 1 from public.organizations o
    where o.id = public.current_org_id() and o.status = 'active'
  );
$$;

do $$
declare
  t text;
begin
  foreach t in array array['public.leads', 'public.bookings', 'public.invoices', 'public.quotes', 'public.reviews']
  loop
    execute format('drop policy if exists %I on %s', 'suspend_guard_' || replace(t, '.', '_'), t);
    execute format(
      'create policy %I on %s
         as restrictive
         for insert
         with check (public.is_org_active());',
      'suspend_guard_' || replace(t, '.', '_'), t
    );
  end loop;
end $$;


alter publication supabase_realtime add table public.quotes;
alter publication supabase_realtime add table public.invoices;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.reviews;
commit;
