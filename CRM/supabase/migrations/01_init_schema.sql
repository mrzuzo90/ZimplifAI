-- ============================================================
-- ZimplifAI CRM — Schema inicial
-- Multi-tenancy + Row Level Security + AI Orchestration + Provisioning
--
-- Ejecutar: `supabase db push` o desde el SQL Editor de Supabase.
-- ============================================================

begin;

create extension if not exists pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================
create type public.user_role as enum ('super_admin', 'client_admin', 'client_member');
create type public.organization_status as enum ('active', 'suspended', 'trial');
create type public.vertical_type as enum ('restaurant_booking', 'service_lead_gen', 'custom_agency');
create type public.lead_status as enum ('new', 'ai_contacted', 'qualified', 'booked', 'closed_won', 'closed_lost');
create type public.booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
create type public.audit_status as enum ('success', 'error');

-- ============================================================
-- TABLAS
-- ============================================================

-- 1. Organizaciones (tenants)
create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  vertical_type public.vertical_type not null default 'custom_agency',
  logo_url      text,
  primary_color text not null default '#CEFF00',
  custom_domain text unique,
  status        public.organization_status not null default 'trial',
  api_key_hash  text, -- sha256(hex) de la API key para orquestación externa
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.organizations is 'Tenants / subcuentas del CRM white-label.';

-- 2. Perfiles (usa auth.users.id como PK → 1:1 con auth)
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete set null,
  role            public.user_role not null default 'client_member',
  full_name       text,
  avatar_url      text,
  created_at      timestamptz not null default now()
);

comment on table public.profiles is 'Datos de perfil ligados a auth.users. El rol y org viajan en el JWT para RLS.';

-- 3. Leads
create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  first_name      text,
  last_name       text,
  email           text,
  phone           text,
  status          public.lead_status not null default 'new',
  deal_value      numeric(12, 2) not null default 0,
  assigned_to     uuid references public.profiles (id) on delete set null,
  tags            text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index leads_org_status_idx on public.leads (organization_id, status);
create index leads_assigned_idx on public.leads (assigned_to);
create index leads_email_idx on public.leads (organization_id, lower(email)) where email is not null;

-- 4. Bookings
create table public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations (id) on delete cascade,
  lead_id             uuid references public.leads (id) on delete set null,
  booking_date        timestamptz not null,
  party_size_or_service text,
  status              public.booking_status not null default 'pending',
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index bookings_org_date_idx on public.bookings (organization_id, booking_date);
create index bookings_status_idx on public.bookings (organization_id, status);

-- 5. Agentes de IA
create table public.ai_agents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  model           text not null default 'claude-sonnet-5',
  system_prompt   text not null default '',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index agents_org_active_idx on public.ai_agents (organization_id, is_active);

-- 6. Audit logs de IA (stream en vivo)
create table public.ai_audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id         uuid references public.leads (id) on delete set null,
  agent_name      text not null,
  input_payload   jsonb,
  output_payload  jsonb,
  tokens_used     integer,
  status          public.audit_status not null default 'success',
  created_at      timestamptz not null default now()
);

create index audit_org_created_idx on public.ai_audit_logs (organization_id, created_at desc);
create index audit_status_idx on public.ai_audit_logs (organization_id, status);

-- 7. Snapshots verticales (plantillas de provisión)
create table public.vertical_snapshots (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  vertical_type         public.vertical_type not null default 'custom_agency',
  default_pipeline_stages jsonb not null default '[]'::jsonb,
  default_ai_prompt     text,
  enabled_modules       jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now()
);

comment on table public.vertical_snapshots is 'Plantillas que el motor de provisión 1-Click clona a una subcuenta.';

-- ============================================================
-- updated_at automático
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger leads_set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
create trigger ai_agents_set_updated_at before update on public.ai_agents
  for each row execute function public.set_updated_at();

-- ============================================================
-- HELPERS RLS (contexto de tenant desde el JWT)
-- ============================================================

-- Org actual: GUC de impersonación si existe, si no claim del JWT.
create or replace function public.current_org_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('app.current_org_id', true), '')::uuid,
    (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid
  );
$$;

-- Rol actual: GUC de impersonación si existe, si no claim del JWT.
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('app.current_user_role', true), '')::public.user_role,
    ((auth.jwt() -> 'app_metadata' ->> 'role'))::public.user_role
  );
$$;

-- Alias que el spec usa en las políticas: org del JWT (sin impersonación).
create or replace function public.get_org_id()
returns uuid
language sql
stable
as $$
  select (auth.jwt() -> 'app_metadata' ->> 'organization_id')::uuid;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'super_admin';
$$;

create or replace function public.is_tenant_member()
returns boolean
language sql
stable
as $$
  select public.current_user_role() in ('client_admin', 'client_member')
     and public.current_org_id() is not null;
$$;

-- ============================================================
-- IMPERSONACIÓN (SuperAdmin)
-- ============================================================
-- Cambia el contexto de tenant de la sesión/transacción actual.
-- En la app web la impersonación persistente se hace por JWT-swap
-- (ver /api/admin/impersonate); esta función es el helper canónico
-- para sesiones SQL / triggers.
create or replace function public.impersonate_organization(target_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Acceso denegado: se requiere rol super_admin para impersonar';
  end if;
  perform set_config('app.current_org_id', target_org_id::text, true);
end;
$$;

-- ============================================================
-- RLS
-- ============================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.bookings enable row level security;
alter table public.ai_agents enable row level security;
alter table public.ai_audit_logs enable row level security;
alter table public.vertical_snapshots enable row level security;

-- ----- organizations -----
create policy "org_super_admin_all"
  on public.organizations for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "org_tenant_read"
  on public.organizations for select
  using (public.is_tenant_member() and id = public.current_org_id());

create policy "org_admin_update"
  on public.organizations for update
  using (public.is_tenant_member() and id = public.current_org_id())
  with check (public.is_tenant_member() and id = public.current_org_id());

-- ----- profiles -----
create policy "profiles_super_admin_all"
  on public.profiles for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "profiles_tenant_read"
  on public.profiles for select
  using (public.is_tenant_member() and organization_id = public.current_org_id());

create policy "profiles_own_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ----- leads -----
create policy "leads_super_admin_all"
  on public.leads for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "leads_tenant_all"
  on public.leads for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ----- bookings -----
create policy "bookings_super_admin_all"
  on public.bookings for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "bookings_tenant_all"
  on public.bookings for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ----- ai_agents -----
create policy "agents_super_admin_all"
  on public.ai_agents for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "agents_tenant_all"
  on public.ai_agents for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ----- ai_audit_logs -----
create policy "audit_super_admin_all"
  on public.ai_audit_logs for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "audit_tenant_all"
  on public.ai_audit_logs for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ----- vertical_snapshots (plantillas: lectura para todos, escritura solo super_admin) -----
create policy "snapshots_super_admin_all"
  on public.vertical_snapshots for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "snapshots_read"
  on public.vertical_snapshots for select
  using (true);

-- ============================================================
-- TRIGGERS DE AUTH (perfil automático + claims del JWT)
-- ============================================================

-- Al crear un usuario de auth → crea su perfil.
-- El rol super_admin se puede conceder vía user_metadata.role = 'super_admin'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, organization_id, role, full_name, avatar_url)
  values (
    new.id,
    null,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'client_member'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Sincroniza role + organization_id al app_metadata del usuario
-- para que viajen en el JWT (necesario para RLS por claim).
create or replace function public.sync_profile_claims()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set raw_app_meta_data = jsonb_set(
        jsonb_set(
          coalesce(raw_app_meta_data, '{}'::jsonb),
          '{role}',
          to_jsonb(new.role::text)
        ),
        '{organization_id}',
        coalesce(to_jsonb(new.organization_id::text), 'null'::jsonb)
      )
  where id = new.id;
  return new;
end;
$$;

create trigger on_profile_claims_sync
  after insert or update on public.profiles
  for each row execute function public.sync_profile_claims();

commit;
