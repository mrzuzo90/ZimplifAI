-- ============================================================
-- ZimplifAI CRM — Fase G · Snapshots versionados, usage limits y marketplace de agencia
--
-- 1) vertical_snapshots: versioning (version, changelog, is_published, parent_snapshot_id)
-- 2) organization_usage: contadores mensuales por tenant (leads, messages, ai_tokens, bookings, forms, emails)
-- 3) usage_limits: límites por plan (free/trial/pro/enterprise) + overage policy
-- 4) agency_marketplace: plantillas compartibles entre agencias (snapshots + workflows + sites)
-- 5) RLS estricto multi-tenant + grants + realtime
-- ============================================================

begin;

-- ============================================================
-- 1) VERSIONADO DE SNAPSHOTS
-- ============================================================
alter table public.vertical_snapshots
  add column if not exists version text not null default '1.0.0',
  add column if not exists changelog text,
  add column if not exists is_published boolean not null default false,
  add column if not exists parent_snapshot_id uuid references public.vertical_snapshots(id) on delete set null,
  add column if not exists marketplace_category text, -- 'restaurant', 'services', 'agency', 'ecommerce', 'healthcare', etc.
  add column if not exists marketplace_tags text[] not null default '{}',
  add column if not exists marketplace_price_monthly numeric(10,2), -- null = gratis, 0 = freemium, >0 = pago
  add column if not exists marketplace_rating numeric(3,2), -- rating promedio 0-5
  add column if not exists marketplace_installs integer not null default 0;

create index vertical_snapshots_published_idx on public.vertical_snapshots (is_published, vertical_type);
create index vertical_snapshots_marketplace_idx on public.vertical_snapshots (marketplace_category, marketplace_price_monthly);
create index vertical_snapshots_parent_idx on public.vertical_snapshots (parent_snapshot_id);

alter publication supabase_realtime add table public.vertical_snapshots;

-- ============================================================
-- 2) USAGE TRACKING POR TENANT (mensual)
-- ============================================================
create table if not exists public.organization_usage (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations(id) on delete cascade,
  period            text not null, -- formato 'YYYY-MM' (p.ej. '2026-08')
  leads_count       integer not null default 0,
  messages_count    integer not null default 0,
  ai_tokens_count   integer not null default 0,
  bookings_count    integer not null default 0,
  forms_count       integer not null default 0,
  emails_count      integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, period)
);

create index organization_usage_org_idx on public.organization_usage (organization_id, period desc);

alter publication supabase_realtime add table public.organization_usage;

-- ============================================================
-- 3) LÍMITES DE USO POR PLAN
-- ============================================================
create table if not exists public.usage_limits (
  id                      uuid primary key default gen_random_uuid(),
  plan                    text not null unique, -- 'free' | 'trial' | 'pro' | 'enterprise'
  max_leads_monthly       integer not null default 100,
  max_messages_monthly    integer not null default 500,
  max_ai_tokens_monthly   integer not null default 50000,
  max_bookings_monthly    integer not null default 200,
  max_forms_monthly       integer not null default 10,
  max_emails_monthly      integer not null default 100,
  overage_policy          text not null default 'block', -- 'block' | 'allow' | 'bill'
  overage_price_per_unit  jsonb not null default '{"leads": 0.10, "messages": 0.02, "ai_tokens": 0.00001, "bookings": 0.05, "forms": 1.00, "emails": 0.01}'::jsonb,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Seed de planes por defecto
insert into public.usage_limits (plan, max_leads_monthly, max_messages_monthly, max_ai_tokens_monthly, max_bookings_monthly, max_forms_monthly, max_emails_monthly, overage_policy) values
  ('free',      20,   100,    10000,  20,   3,   20,  'block'),
  ('trial',     200,  1000,   100000, 200,  10,  200, 'allow'),
  ('pro',       5000, 25000,  2000000, 5000, 50,  5000, 'bill'),
  ('enterprise', 50000, 250000, 50000000, 50000, 500, 50000, 'bill')
on conflict (plan) do update set
  max_leads_monthly = excluded.max_leads_monthly,
  max_messages_monthly = excluded.max_messages_monthly,
  max_ai_tokens_monthly = excluded.max_ai_tokens_monthly,
  max_bookings_monthly = excluded.max_bookings_monthly,
  max_forms_monthly = excluded.max_forms_monthly,
  max_emails_monthly = excluded.max_emails_monthly,
  overage_policy = excluded.overage_policy,
  overage_price_per_unit = excluded.overage_price_per_unit,
  updated_at = now();

alter table public.usage_limits enable row level security;
create policy "usage_limits_super_admin_all" on public.usage_limits for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "usage_limits_read" on public.usage_limits for select using (true);

-- ============================================================
-- 4) MARKETPLACE DE AGENCIA (plantillas compartibles)
-- ============================================================
create table if not exists public.agency_marketplace (
  id                    uuid primary key default gen_random_uuid(),
  snapshot_id           uuid not null references public.vertical_snapshots(id) on delete cascade,
  publisher_org_id      uuid not null references public.organizations(id) on delete cascade,
  title                 text not null,
  description           text,
  preview_images        text[] not null default '{}', -- URLs de imágenes de preview
  price_monthly         numeric(10,2) not null default 0,
  revenue_share_pct     integer not null default 30, -- % para la plataforma
  status                text not null default 'draft', -- 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived'
  featured              boolean not null default false,
  requirements          text, -- requisitos técnicos (ej. "WhatsApp Business API")
  demo_url              text,
  installs_count        integer not null default 0,
  rating_avg            numeric(3,2),
  rating_count          integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index agency_marketplace_status_idx on public.agency_marketplace (status, featured);
create index agency_marketplace_publisher_idx on public.agency_marketplace (publisher_org_id);
create index agency_marketplace_snapshot_idx on public.agency_marketplace (snapshot_id);

alter publication supabase_realtime add table public.agency_marketplace;

-- ============================================================
-- 5) RLS PARA TABLAS NUEVAS
-- ============================================================

-- organization_usage: tenant solo ve lo suyo; super_admin todo
alter table public.organization_usage enable row level security;
create policy "usage_super_admin_all" on public.organization_usage for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "usage_tenant_read" on public.organization_usage for select using (public.is_tenant_member() and organization_id = public.current_org_id());
create policy "usage_tenant_insert" on public.organization_usage for insert with check (public.is_tenant_member() and organization_id = public.current_org_id());
create policy "usage_tenant_update" on public.organization_usage for update using (public.is_tenant_member() and organization_id = public.current_org_id()) with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- agency_marketplace: lectura pública para publicados; publisher gestiona los suyos; super_admin todo
alter table public.agency_marketplace enable row level security;
create policy "marketplace_super_admin_all" on public.agency_marketplace for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "marketplace_published_read" on public.agency_marketplace for select using (status = 'published');
create policy "marketplace_publisher_all" on public.agency_marketplace for all using (public.is_tenant_member() and publisher_org_id = public.current_org_id()) with check (public.is_tenant_member() and publisher_org_id = public.current_org_id());

-- ============================================================
-- 6) GRANTS
-- ============================================================
grant all on table public.vertical_snapshots to authenticated, service_role;
grant all on table public.organization_usage to authenticated, service_role;
grant all on table public.usage_limits to authenticated, service_role;
grant all on table public.agency_marketplace to authenticated, service_role;

-- ============================================================
-- 7) TRIGGER updated_at PARA TABLAS NUEVAS
-- ============================================================
create trigger organization_usage_set_updated_at before update on public.organization_usage
  for each row execute function public.set_updated_at();

create trigger usage_limits_set_updated_at before update on public.usage_limits
  for each row execute function public.set_updated_at();

create trigger agency_marketplace_set_updated_at before update on public.agency_marketplace
  for each row execute function public.set_updated_at();

commit;