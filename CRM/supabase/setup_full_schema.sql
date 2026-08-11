-- ============================================================
-- ZimplifAI CRM — ESQUEMA COMPLETO (migraciones 01-15)
-- Pega TODO este bloque en: Supabase Dashboard → SQL Editor
-- Se ejecuta sobre una base de datos NUEVA (una sola vez).
-- ============================================================

-- ====================== 01_init_schema.sql ======================
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

-- ====================== 02_organization_modules.sql ======================
-- ============================================================
-- ZimplifAI CRM — Feature flagging por subcuenta
-- Tabla organization_modules + RLS estricto.
--
-- RLS: super_admin bypass total; client_admin / client_member
-- solo pueden leer/escribir los módulos de SU organización
-- (auth.jwt() -> app_metadata -> organization_id).
-- ============================================================

begin;

-- ============================================================
-- TABLA
-- ============================================================
create table if not exists public.organization_modules (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  module_key      text not null, -- 'whatsapp_bot' | 'booking_calendar' | 'light_web_menu' | 'sales_kanban' | 'ai_logs'
  is_enabled      boolean not null default true,
  settings        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (organization_id, module_key)
);

create index organization_modules_org_idx on public.organization_modules (organization_id, is_enabled);

comment on table public.organization_modules is
  'Feature flags por subcuenta: qué módulos verticales tiene activo cada tenant.';

-- ============================================================
-- RLS
-- ============================================================
alter table public.organization_modules enable row level security;

-- SuperAdmin bypass total (define módulos de cualquier subcuenta).
create policy "modules_super_admin_all"
  on public.organization_modules for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- Cliente: solo lectura de los módulos de su organización (para renderizar UI).
-- No pueden escribir: el feature management es exclusivo del SuperAdmin.
create policy "modules_tenant_read"
  on public.organization_modules for select
  using (public.is_tenant_member() and organization_id = public.current_org_id());

commit;

-- ====================== 03_realtime_activity.sql ======================
-- ============================================================
-- ZimplifAI CRM — Fundación escalable (Paquete 1)
-- Realtime multi-tenant + Timeline de actividad + Seguimiento
--
-- 1) Habilita Supabase Realtime (postgres_changes) en las tablas
--    que alimentan vistas en vivo (pipeline, reservas, audit).
-- 2) Añade next_follow_up_at a leads (calendario + SLA).
-- 3) Crea lead_activity (timeline por lead) con RLS estricto.
--
-- Ejecutar: `supabase db push` o desde el SQL Editor.
-- Nota: la publication `supabase_realtime` existe por defecto en
-- Supabase. Si no existe, crear primero:
--   create publication supabase_realtime for all tables;
-- ============================================================

begin;

alter publication supabase_realtime add table public.leads;
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.ai_audit_logs;

-- Seguimiento: fecha prevista del próximo contacto (calendario + SLA).
alter table public.leads add column next_follow_up_at timestamptz;
create index leads_follow_up_idx on public.leads (organization_id, next_follow_up_at)
  where next_follow_up_at is not null;

-- Timeline de actividad por lead.
create table public.lead_activity (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id         uuid references public.leads (id) on delete cascade,
  actor_id        uuid references public.profiles (id) on delete set null, -- null = sistema / agente IA
  actor_name      text,
  event_type      text not null, -- lead_created | stage_changed | comment | whatsapp_reply | booking_confirmed | follow_up_set
  summary         text not null,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index lead_activity_org_lead_idx on public.lead_activity (organization_id, lead_id, created_at desc);
create index lead_activity_org_idx on public.lead_activity (organization_id, created_at desc);

alter publication supabase_realtime add table public.lead_activity;

comment on table public.lead_activity is 'Historial de eventos por lead: quién hizo qué y cuándo.';

-- RLS estricto: super_admin → todo; tenant → solo lectura e insert de su org.
alter table public.lead_activity enable row level security;

create policy "activity_super_admin_all"
  on public.lead_activity for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "activity_tenant_read"
  on public.lead_activity for select
  using (public.is_tenant_member() and organization_id = public.current_org_id());

create policy "activity_tenant_insert"
  on public.lead_activity for insert
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

commit;

-- ====================== 04_workflows.sql ======================
-- ============================================================
-- ZimplifAI CRM — Fase A · Motor de automatización visual
-- Workflows + runs + steps (orquestación tipo GoHighLevel)
--
-- 1) workflows: definición del flujo (trigger + nodos + aristas).
-- 2) workflow_runs: ejecución por lead (estado, tiempos).
-- 3) workflow_run_steps: paso a paso de cada ejecución (payloads,
--    re-ejecutables desde la UI).
--
-- RLS estricto multi-tenant + grants explícitos + realtime.
-- ============================================================

begin;

alter publication supabase_realtime add table public.workflows;
alter publication supabase_realtime add table public.workflow_runs;
alter publication supabase_realtime add table public.workflow_run_steps;

-- ----- workflows -----
create table public.workflows (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  description     text,
  -- lead_created | stage_changed | booking_created | message_incoming | webhook | schedule
  trigger_type    text not null,
  trigger_config  jsonb not null default '{}'::jsonb,
  nodes           jsonb not null default '[]'::jsonb,
  edges           jsonb not null default '[]'::jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index workflows_org_idx on public.workflows (organization_id, is_active);

-- ----- workflow_runs -----
create table public.workflow_runs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  workflow_id     uuid references public.workflows (id) on delete cascade,
  lead_id         uuid references public.leads (id) on delete set null,
  -- running | completed | failed
  status          text not null default 'running',
  started_at      timestamptz not null default now(),
  finished_at     timestamptz
);
create index workflow_runs_org_idx on public.workflow_runs (organization_id, started_at desc);
create index workflow_runs_lead_idx on public.workflow_runs (lead_id);

-- ----- workflow_run_steps -----
create table public.workflow_run_steps (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  workflow_run_id uuid not null references public.workflow_runs (id) on delete cascade,
  node_id         text not null,
  input_payload   jsonb,
  output_payload  jsonb,
  -- running | completed | failed | skipped
  status          text not null default 'running',
  error_message   text,
  executed_at     timestamptz
);
create index workflow_run_steps_run_idx on public.workflow_run_steps (workflow_run_id, executed_at);

-- ======================== RLS ========================

alter table public.workflows enable row level security;
create policy "workflows_super_admin_all"
  on public.workflows for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "workflows_tenant_all"
  on public.workflows for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.workflow_runs enable row level security;
create policy "workflow_runs_super_admin_all"
  on public.workflow_runs for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "workflow_runs_tenant_all"
  on public.workflow_runs for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.workflow_run_steps enable row level security;
create policy "workflow_run_steps_super_admin_all"
  on public.workflow_run_steps for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "workflow_run_steps_tenant_all"
  on public.workflow_run_steps for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ======================== Grants ========================

grant all on table public.workflows to authenticated, service_role;
grant all on table public.workflow_runs to authenticated, service_role;
grant all on table public.workflow_run_steps to authenticated, service_role;

commit;

-- ====================== 05_tenant_sites.sql ======================
-- ============================================================
-- ZimplifAI CRM — Motor de Sitio Web Vertical (light_web_editor)
-- Micro-websites white-label por subcuenta: carta digital,
-- catálogo de servicios o funnel de captación.
--
-- 1) tenant_sites: un sitio por subcuenta (o varios con slug único),
--    contenido estructurado en content_payload JSONB.
-- 2) RLS: lectura pública para sitios publicados + gestión del tenant.
--
-- RLS estricto multi-tenant + grants explícitos + realtime.
-- ============================================================

begin;

alter publication supabase_realtime add table public.tenant_sites;

-- ----- tenant_sites -----
create table public.tenant_sites (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete cascade,
  title              text not null default 'Mi Sitio Web',
  slug               text not null unique,
  -- restaurant_menu | service_catalog | lead_funnel
  vertical_template  text not null default 'restaurant_menu',
  is_published       boolean not null default true,
  custom_domain      text,
  seo_metadata       jsonb not null default '{"meta_title": "", "meta_description": ""}'::jsonb,
  content_payload    jsonb not null default '{
    "hero": {
      "headline": "Bienvenidos a nuestro negocio",
      "subheadline": "La mejor experiencia culinaria de la ciudad.",
      "badge": "Reserva online disponible",
      "bg_image": "",
      "cta_text": "Reservar Mesa"
    },
    "sections": {
      "show_menu": true,
      "show_hours": true,
      "show_location": true,
      "show_booking": true
    },
    "menu_items": [
      {"category": "Entrantes", "name": "Croquetas de Jamón", "description": "Caseras y cremosas (6 ud)", "price": 12.50, "image": ""},
      {"category": "Principales", "name": "Chuletón de Vaca madurada", "description": "1kg a la piedra con guarnición", "price": 58.00, "image": ""}
    ],
    "business_hours": [
      {"day": "Lunes a Viernes", "hours": "13:00 - 16:30 | 20:00 - 23:30"},
      {"day": "Sábados y Domingos", "hours": "13:00 - 24:00"}
    ],
    "contact": {
      "address": "Calle Principal 123, Madrid",
      "phone": "+34 600 000 000",
      "whatsapp": "+34 600 000 000",
      "google_maps_url": ""
    }
  }'::jsonb,
  created_at         timestamptz not null default timezone('utc'::text, now()),
  updated_at         timestamptz not null default timezone('utc'::text, now())
);
create index tenant_sites_org_idx on public.tenant_sites (organization_id);
create index tenant_sites_slug_idx on public.tenant_sites (slug);

-- ======================== RLS ========================

alter table public.tenant_sites enable row level security;

-- Sitios publicados: visibles por cualquiera (página pública).
create policy "tenant_sites_public_read"
  on public.tenant_sites for select
  using (is_published = true);

-- El tenant gestiona su propio sitio; super_admin gestiona todos.
create policy "tenant_sites_tenant_all"
  on public.tenant_sites for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());
create policy "tenant_sites_super_admin_all"
  on public.tenant_sites for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ======================== Grants ========================

grant all on table public.tenant_sites to authenticated, anon, service_role;

commit;

-- ====================== 06_unified_inbox.sql ======================
-- ============================================================
-- ZimplifAI CRM — Fase B · Bandeja unificada (Unified Inbox)
-- Threads + mensajes + plantillas (WhatsApp / Email / Instagram / Web)
--
-- 1) message_threads: conversación por lead y canal (último mensaje,
--    no-leídos, estado abierta/resuelta).
-- 2) messages: mensaje individual con dirección (inbound/outbound),
--    remitente (lead/agent/member) y estado de entrega.
-- 3) message_templates: respuestas rápidas reutilizables con variables
--    {{var}} y categoría, para el redactor de la bandeja.
--
-- RLS estricto multi-tenant + grants explícitos + realtime.
-- ============================================================

begin;

alter publication supabase_realtime add table public.message_threads;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.message_templates;

-- ----- message_threads -----
create table public.message_threads (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete cascade,
  lead_id            uuid references public.leads (id) on delete set null,
  -- whatsapp | email | instagram | web
  channel            text not null,
  external_id        text,
  subject            text,
  last_message_at    timestamptz not null default now(),
  last_message_preview text,
  unread_count       integer not null default 0,
  -- open | resolved
  status             text not null default 'open',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index message_threads_org_idx on public.message_threads (organization_id, last_message_at desc);
create index message_threads_lead_idx on public.message_threads (lead_id);

-- ----- messages -----
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  thread_id       uuid not null references public.message_threads (id) on delete cascade,
  channel         text not null,
  -- lead | agent | member
  sender          text not null,
  sender_name     text,
  -- inbound | outbound
  direction       text not null,
  body            text not null,
  -- sent | delivered | read | failed
  status          text not null default 'sent',
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);
create index messages_thread_idx on public.messages (thread_id, created_at);
create index messages_org_idx on public.messages (organization_id, created_at desc);

-- ----- message_templates -----
create table public.message_templates (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  category        text not null default 'general',
  channel         text not null default 'whatsapp',
  body            text not null,
  variables       jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index message_templates_org_idx on public.message_templates (organization_id, category);

-- ======================== RLS ========================

alter table public.message_threads enable row level security;
create policy "message_threads_super_admin_all"
  on public.message_threads for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "message_threads_tenant_all"
  on public.message_threads for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.messages enable row level security;
create policy "messages_super_admin_all"
  on public.messages for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "messages_tenant_all"
  on public.messages for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.message_templates enable row level security;
create policy "message_templates_super_admin_all"
  on public.message_templates for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "message_templates_tenant_all"
  on public.message_templates for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ======================== Grants ========================

grant all on table public.message_threads to authenticated, service_role;
grant all on table public.messages to authenticated, service_role;
grant all on table public.message_templates to authenticated, service_role;

commit;

-- ====================== 07_calendar_booking.sql ======================
-- ============================================================
-- ZimplifAI CRM — Fase C · Calendarios de citas + reserva pública
--
-- 1) calendars: servicio concreto del negocio (Mesa, Terraza,
--    Consulta legal…) con duración y color.
-- 2) availability_rules: franjas de disponibilidad semanales por
--    calendario (día de semana + hora inicio/fin + aforo).
-- 3) bookings: se enriquece con calendar_id, token (para el enlace
--    público de cancelación/reagenda) y source (manual|public|whatsapp).
--
-- RLS estricto multi-tenant + grants explícitos + realtime.
-- ============================================================

begin;

alter publication supabase_realtime add table public.calendars;
alter publication supabase_realtime add table public.availability_rules;

-- ----- calendars -----
create table public.calendars (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations (id) on delete cascade,
  name                  text not null,
  description           text,
  service_duration_min  integer not null default 60,
  color                 text not null default '#CEFF00',
  is_active             boolean not null default true,
  settings              jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index calendars_org_idx on public.calendars (organization_id);

-- ----- availability_rules -----
create table public.availability_rules (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete cascade,
  calendar_id        uuid not null references public.calendars (id) on delete cascade,
  -- 0 = domingo … 6 = sábado
  day_of_week        integer not null check (day_of_week between 0 and 6),
  start_time         text not null,
  end_time           text not null,
  capacity           integer not null default 1,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index availability_rules_org_idx on public.availability_rules (organization_id, calendar_id);

-- ----- bookings: enriquecer con calendario + token + source -----
alter table public.bookings add column calendar_id uuid references public.calendars (id) on delete set null;
alter table public.bookings add column token text;
alter table public.bookings add column source text not null default 'manual';
create index bookings_calendar_idx on public.bookings (calendar_id);
create index bookings_token_idx on public.bookings (token);

-- ======================== RLS ========================

alter table public.calendars enable row level security;
create policy "calendars_super_admin_all"
  on public.calendars for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "calendars_tenant_all"
  on public.calendars for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.availability_rules enable row level security;
create policy "availability_rules_super_admin_all"
  on public.availability_rules for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "availability_rules_tenant_all"
  on public.availability_rules for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ======================== Grants ========================

grant all on table public.calendars to authenticated, service_role;
grant all on table public.availability_rules to authenticated, service_role;
grant all on table public.bookings to authenticated, service_role;

commit;

-- ====================== 08_crm_extended.sql ======================
-- ============================================================
-- ZimplifAI CRM — Fase E1 · CRM extendido
--
-- 1) companies: cuentas B2B a las que se asocian leads/contactos.
-- 2) pipelines + pipeline_stages: múltiples embudos por subcuenta
--    (Ventas, Eventos, Soporte…). Cada etapa referencia un LeadStatus
--    canónico y define su propio nombre/color/orden.
-- 3) tasks: tareas personales (o por lead/empresa) con prioridad y
--    fecha límite → alimenta el widget "Mi Día" del home.
-- 4) leads: se enriquecen con company_id y pipeline_id.
--
-- RLS estricto multi-tenant + grants explícitos + realtime.
-- ============================================================

begin;

alter publication supabase_realtime add table public.companies;
alter publication supabase_realtime add table public.pipelines;
alter publication supabase_realtime add table public.pipeline_stages;
alter publication supabase_realtime add table public.tasks;

-- ----- companies -----
create table public.companies (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  website         text,
  industry        text,
  phone           text,
  city            text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index companies_org_idx on public.companies (organization_id);

-- ----- pipelines -----
create table public.pipelines (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  description     text,
  is_default      boolean not null default false,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index pipelines_org_idx on public.pipelines (organization_id);

-- ----- pipeline_stages -----
create table public.pipeline_stages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  pipeline_id     uuid not null references public.pipelines (id) on delete cascade,
  name            text not null,
  -- Estado de lead que representa la etapa (enum canónico de leads).
  status          text not null,
  position        integer not null default 0,
  color           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index pipeline_stages_org_idx on public.pipeline_stages (organization_id);
create index pipeline_stages_pipeline_idx on public.pipeline_stages (pipeline_id);

-- ----- tasks -----
create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title           text not null,
  description     text,
  status          text not null default 'todo' check (status in ('todo','in_progress','done')),
  priority        text not null default 'medium' check (priority in ('low','medium','high')),
  due_date        date,
  lead_id         uuid references public.leads (id) on delete set null,
  company_id      uuid references public.companies (id) on delete set null,
  assigned_to     uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index tasks_org_idx on public.tasks (organization_id);
create index tasks_due_idx on public.tasks (organization_id, due_date);

-- ----- leads: asociar a empresa y pipeline -----
alter table public.leads add column company_id uuid references public.companies (id) on delete set null;
alter table public.leads add column pipeline_id uuid references public.pipelines (id) on delete set null;
create index leads_company_idx on public.leads (company_id);
create index leads_pipeline_idx on public.leads (pipeline_id);

-- ======================== RLS ========================

alter table public.companies enable row level security;
create policy "companies_super_admin_all"
  on public.companies for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "companies_tenant_all"
  on public.companies for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.pipelines enable row level security;
create policy "pipelines_super_admin_all"
  on public.pipelines for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "pipelines_tenant_all"
  on public.pipelines for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.pipeline_stages enable row level security;
create policy "pipeline_stages_super_admin_all"
  on public.pipeline_stages for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "pipeline_stages_tenant_all"
  on public.pipeline_stages for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.tasks enable row level security;
create policy "tasks_super_admin_all"
  on public.tasks for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "tasks_tenant_all"
  on public.tasks for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ======================== Grants ========================

grant all on table public.companies to authenticated, service_role;
grant all on table public.pipelines to authenticated, service_role;
grant all on table public.pipeline_stages to authenticated, service_role;
grant all on table public.tasks to authenticated, service_role;
grant all on table public.leads to authenticated, service_role;

commit;

-- ====================== 09_forms_funnels.sql ======================
-- ============================================================
-- ZimplifAI CRM — Fase D · Forms, funnels y atribución UTM
--
-- 1) forms: formularios de captación (standalone o embebidos).
-- 2) form_submissions: cada captura (lead creado) con payload +
--    atribución UTM completa (source/medium/campaign/term/content,
--    landing page y referrer).
-- 3) funnels: embudos de marketing que apuntan a un formulario.
-- 4) leads: se enriquecen con la atribución UTM del canal.
--
-- RLS estricto multi-tenant + grants explícitos + realtime.
-- ============================================================

begin;

alter publication supabase_realtime add table public.forms;
alter publication supabase_realtime add table public.form_submissions;
alter publication supabase_realtime add table public.funnels;

-- ----- forms -----
create table public.forms (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  slug            text not null,
  description     text,
  -- { fields: [{key,label,type,required}], button_text, success_message, redirect_url }
  config          jsonb not null default '{}'::jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index forms_org_idx on public.forms (organization_id);
create index forms_slug_idx on public.forms (slug);

-- ----- form_submissions -----
create table public.form_submissions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  form_id         uuid references public.forms (id) on delete set null,
  lead_id         uuid references public.leads (id) on delete set null,
  payload         jsonb not null default '{}'::jsonb,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  utm_term        text,
  utm_content     text,
  landing_page    text,
  referrer        text,
  created_at      timestamptz not null default now()
);
create index form_submissions_org_idx on public.form_submissions (organization_id);
create index form_submissions_form_idx on public.form_submissions (form_id);

-- ----- funnels -----
create table public.funnels (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  slug            text not null,
  description     text,
  landing_form_id uuid references public.forms (id) on delete set null,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index funnels_org_idx on public.funnels (organization_id);
create index funnels_slug_idx on public.funnels (slug);

-- ----- leads: atribución UTM del canal -----
alter table public.leads add column utm_source   text;
alter table public.leads add column utm_medium   text;
alter table public.leads add column utm_campaign text;
alter table public.leads add column utm_term     text;
alter table public.leads add column utm_content  text;
alter table public.leads add column landing_page text;
alter table public.leads add column referrer     text;

-- ======================== RLS ========================

alter table public.forms enable row level security;
create policy "forms_super_admin_all"
  on public.forms for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "forms_tenant_all"
  on public.forms for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.form_submissions enable row level security;
create policy "form_submissions_super_admin_all"
  on public.form_submissions for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "form_submissions_tenant_all"
  on public.form_submissions for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.funnels enable row level security;
create policy "funnels_super_admin_all"
  on public.funnels for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "funnels_tenant_all"
  on public.funnels for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ======================== Grants ========================

grant all on table public.forms to authenticated, service_role;
grant all on table public.form_submissions to authenticated, service_role;
grant all on table public.funnels to authenticated, service_role;
grant all on table public.leads to authenticated, service_role;

commit;

-- ====================== 10_snapshots_usage.sql ======================
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
-- ====================== 11_ai_copilot_scoring_costs.sql ======================
-- ============================================================
-- ZimplifAI CRM — Fase H · AI Copilot, Scoring y Dashboard de costes
--
-- 1) AI Copilot: sesiones de chat, mensajes, tools/functions
-- 2) Lead Scoring: modelos, scores por lead, factores
-- 3) Cost Dashboard: tracking de costes por tenant (AI tokens, WhatsApp, email, etc.)
-- 4) RLS estricto multi-tenant + grants + realtime
-- ============================================================

begin;

-- ============================================================
-- 1) AI COPILOT
-- ============================================================

-- Sesiones de chat del copilot (una por usuario/contexto)
create table if not exists public.copilot_sessions (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  title               text, -- generado automáticamente del primer mensaje
  context_type        text not null default 'general', -- 'general' | 'lead' | 'pipeline' | 'booking' | 'workflow' | 'analytics'
  context_id          text, -- lead_id, pipeline_id, etc. (opcional)
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index copilot_sessions_org_user_idx on public.copilot_sessions (organization_id, user_id, updated_at desc);
create index copilot_sessions_context_idx on public.copilot_sessions (context_type, context_id);

alter publication supabase_realtime add table public.copilot_sessions;

-- Mensajes del copilot (historial de conversación)
create table if not exists public.copilot_messages (
  id                  uuid primary key default gen_random_uuid(),
  session_id          uuid not null references public.copilot_sessions(id) on delete cascade,
  role                text not null, -- 'user' | 'assistant' | 'tool'
  content             text not null,
  tool_calls          jsonb, -- llamadas a funciones (cuando role='assistant' y hay tools)
  tool_call_id        text, -- para respuestas de tools (role='tool')
  metadata            jsonb not null default '{}'::jsonb, -- tokens, model, latency, etc.
  created_at          timestamptz not null default now()
);

create index copilot_messages_session_idx on public.copilot_messages (session_id, created_at);

alter publication supabase_realtime add table public.copilot_messages;

-- Tools/functions disponibles para el copilot
create table if not exists public.copilot_tools (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null unique, -- ej: 'fetch_leads', 'create_lead', 'update_lead', 'run_workflow', 'query_usage'
  description         text not null,
  parameters_schema   jsonb not null, -- JSON Schema de los parámetros
  category            text not null default 'data', -- 'data' | 'action' | 'analytics' | 'workflow'
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Seed de tools por defecto
insert into public.copilot_tools (name, description, parameters_schema, category) values
  ('fetch_leads', 'Obtiene leads con filtros opcionales',
   '{"type":"object","properties":{"status":{"type":"string"},"limit":{"type":"number","default":20},"offset":{"type":"number","default":0}}}'::jsonb, 'data'),
  ('create_lead', 'Crea un nuevo lead',
   '{"type":"object","properties":{"first_name":{"type":"string"},"last_name":{"type":"string"},"email":{"type":"string"},"phone":{"type":"string"},"status":{"type":"string","default":"new"},"tags":{"type":"array","items":{"type":"string"}}},"required":["first_name"]}'::jsonb, 'action'),
  ('update_lead', 'Actualiza un lead existente',
   '{"type":"object","properties":{"id":{"type":"string"},"status":{"type":"string"},"deal_value":{"type":"number"},"tags":{"type":"array","items":{"type":"string"}},"next_follow_up_at":{"type":"string","format":"date-time"}},"required":["id"]}'::jsonb, 'action'),
  ('fetch_pipeline', 'Obtiene el pipeline con leads agrupados por etapa',
   '{"type":"object","properties":{}}'::jsonb, 'data'),
  ('run_workflow', 'Ejecuta un workflow manualmente sobre un lead',
   '{"type":"object","properties":{"workflow_id":{"type":"string"},"lead_id":{"type":"string"}},"required":["workflow_id","lead_id"]}'::jsonb, 'workflow'),
  ('query_usage', 'Consulta el uso y límites del mes actual',
   '{"type":"object","properties":{}}'::jsonb, 'analytics'),
  ('fetch_bookings', 'Obtiene reservas con filtros',
   '{"type":"object","properties":{"status":{"type":"string"},"calendar_id":{"type":"string"},"date_from":{"type":"string","format":"date"},"date_to":{"type":"string","format":"date"}}}'::jsonb, 'data'),
  ('create_booking', 'Crea una reserva',
   '{"type":"object","properties":{"calendar_id":{"type":"string"},"booking_date":{"type":"string","format":"date-time"},"party_size_or_service":{"type":"string"},"lead_id":{"type":"string"}},"required":["calendar_id","booking_date"]}'::jsonb, 'action')
on conflict (name) do update set
  description = excluded.description,
  parameters_schema = excluded.parameters_schema,
  category = excluded.category,
  is_active = excluded.is_active,
  updated_at = now();

-- ============================================================
-- 2) LEAD SCORING
-- ============================================================

-- Modelos de scoring (configurables por tenant)
create table if not exists public.scoring_models (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  name                text not null,
  description         text,
  version             text not null default '1.0.0',
  is_active           boolean not null default true,
  -- Configuración del modelo: pesos por factor
  factors             jsonb not null default '{
    "engagement": 0.30,
    "recency": 0.20,
    "fit": 0.25,
    "intent": 0.25
  }'::jsonb,
  -- Umbrales para clasificación
  thresholds          jsonb not null default '{
    "hot": 80,
    "warm": 50,
    "cold": 0
  }'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (organization_id, name)
);

create index scoring_models_org_idx on public.scoring_models (organization_id, is_active);

alter publication supabase_realtime add table public.scoring_models;

-- Scores calculados por lead
create table if not exists public.lead_scores (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  lead_id             uuid not null references public.leads(id) on delete cascade,
  model_id            uuid not null references public.scoring_models(id) on delete cascade,
  score               integer not null, -- 0-100
  label               text not null, -- 'hot' | 'warm' | 'cold'
  factors_breakdown   jsonb not null default '{}'::jsonb, -- detalle por factor: {engagement: {score: 85, details: {...}}, ...}
  calculated_at       timestamptz not null default now(),
  unique (lead_id, model_id)
);

create index lead_scores_org_lead_idx on public.lead_scores (organization_id, lead_id);
create index lead_scores_label_idx on public.lead_scores (organization_id, label, score desc);

alter publication supabase_realtime add table public.lead_scores;

-- Historial de cambios de score (para auditoría y tendencias)
create table if not exists public.lead_score_history (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  lead_id             uuid not null references public.leads(id) on delete cascade,
  model_id            uuid not null references public.scoring_models(id) on delete cascade,
  previous_score      integer,
  new_score           integer not null,
  previous_label      text,
  new_label           text not null,
  trigger             text not null, -- 'manual' | 'auto' | 'activity' | 'workflow'
  metadata            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now()
);

create index lead_score_history_lead_idx on public.lead_score_history (lead_id, created_at desc);

alter publication supabase_realtime add table public.lead_score_history;

-- ============================================================
-- 3) COST DASHBOARD
-- ============================================================

-- Costes unitarios por recurso (configurables, con valores por defecto globales)
create table if not exists public.unit_costs (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid references public.organizations(id) on delete cascade, -- null = global/default
  resource_type       text not null, -- 'ai_tokens_input' | 'ai_tokens_output' | 'whatsapp_message' | 'whatsapp_session' | 'email_sent' | 'sms_sent' | 'voice_minute'
  unit                text not null, -- '1k_tokens' | 'message' | 'session' | 'email' | 'minute'
  cost_per_unit       numeric(10,6) not null, -- coste en EUR (ej: 0.0015 por 1k tokens)
  currency            text not null default 'EUR',
  is_active           boolean not null default true,
  effective_from      date not null default current_date,
  effective_to        date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (organization_id, resource_type, effective_from)
);

-- Seed de costes globales por defecto (valores aproximados 2026)
insert into public.unit_costs (organization_id, resource_type, unit, cost_per_unit, currency, effective_from) values
  (null, 'ai_tokens_input',    '1k_tokens', 0.0015, 'EUR', '2026-01-01'), -- GPT-4o-mini input
  (null, 'ai_tokens_output',   '1k_tokens', 0.0060, 'EUR', '2026-01-01'), -- GPT-4o-mini output
  (null, 'whatsapp_message',   'message',   0.0050, 'EUR', '2026-01-01'), -- Meta WhatsApp Business API
  (null, 'whatsapp_session',   'session',   0.0200, 'EUR', '2026-01-01'), -- Sesión 24h iniciada por negocio
  (null, 'email_sent',         'email',     0.0005, 'EUR', '2026-01-01'), -- Resend/SendGrid
  (null, 'sms_sent',           'message',   0.0500, 'EUR', '2026-01-01'), -- Twilio
  (null, 'voice_minute',       'minute',    0.0150, 'EUR', '2026-01-01')  -- Twilio Voice
on conflict (organization_id, resource_type, effective_from) do update set
  cost_per_unit = excluded.cost_per_unit,
  is_active = excluded.is_active,
  updated_at = now();

create index unit_costs_org_idx on public.unit_costs (organization_id, resource_type, effective_from);

-- Registro de consumo de recursos (para cálculo de costes en tiempo real)
create table if not exists public.resource_usage (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  resource_type       text not null, -- mismo vocabulario que unit_costs
  quantity            numeric(20,6) not null, -- ej: 1500 tokens, 1 mensaje, 1 email
  unit                text not null, -- '1k_tokens' | 'message' | 'session' | 'email' | 'minute'
  cost_eur            numeric(10,6) not null, -- coste calculado en el momento
  related_id          text, -- lead_id, message_id, workflow_run_id, etc.
  related_type        text, -- 'lead' | 'message' | 'workflow_run' | 'booking' | 'email' | 'copilot_session'
  metadata            jsonb not null default '{}'::jsonb,
  occurred_at         timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index resource_usage_org_date_idx on public.resource_usage (organization_id, occurred_at desc);
create index resource_usage_related_idx on public.resource_usage (related_type, related_id);

alter publication supabase_realtime add table public.resource_usage;

-- Agregados diarios de costes (materializados para dashboards rápidos)
create table if not exists public.daily_costs (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  date                date not null,
  ai_tokens_input     numeric(20,6) not null default 0,
  ai_tokens_output    numeric(20,6) not null default 0,
  whatsapp_messages   integer not null default 0,
  whatsapp_sessions   integer not null default 0,
  emails_sent         integer not null default 0,
  sms_sent            integer not null default 0,
  voice_minutes       numeric(10,2) not null default 0,
  total_cost_eur      numeric(10,4) not null default 0,
  breakdown           jsonb not null default '{}'::jsonb, -- desglose por resource_type
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (organization_id, date)
);

create index daily_costs_org_date_idx on public.daily_costs (organization_id, date desc);

alter publication supabase_realtime add table public.daily_costs;

-- ============================================================
-- 4) RLS PARA TABLAS NUEVAS
-- ============================================================

-- copilot_sessions: tenant ve las suyas; super_admin todo
alter table public.copilot_sessions enable row level security;
create policy "copilot_sessions_super_admin_all" on public.copilot_sessions
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "copilot_sessions_tenant_all" on public.copilot_sessions
  for all using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- copilot_messages: tenant ve las de sus sesiones; super_admin todo
alter table public.copilot_messages enable row level security;
create policy "copilot_messages_super_admin_all" on public.copilot_messages
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "copilot_messages_tenant_all" on public.copilot_messages
  for all using (
    public.is_tenant_member() and
    session_id in (select id from public.copilot_sessions where organization_id = public.current_org_id())
  )
  with check (
    public.is_tenant_member() and
    session_id in (select id from public.copilot_sessions where organization_id = public.current_org_id())
  );

-- copilot_tools: lectura pública (catálogo global); super_admin gestiona
alter table public.copilot_tools enable row level security;
create policy "copilot_tools_super_admin_all" on public.copilot_tools
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "copilot_tools_read" on public.copilot_tools
  for select using (is_active = true);

-- scoring_models: tenant gestiona los suyos; super_admin todo
alter table public.scoring_models enable row level security;
create policy "scoring_models_super_admin_all" on public.scoring_models
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "scoring_models_tenant_all" on public.scoring_models
  for all using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- lead_scores: tenant ve los de sus leads; super_admin todo
alter table public.lead_scores enable row level security;
create policy "lead_scores_super_admin_all" on public.lead_scores
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "lead_scores_tenant_read" on public.lead_scores
  for select using (public.is_tenant_member() and organization_id = public.current_org_id());
create policy "lead_scores_tenant_write" on public.lead_scores
  for insert with check (public.is_tenant_member() and organization_id = public.current_org_id());
create policy "lead_scores_tenant_update" on public.lead_scores
  for update using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- lead_score_history: tenant ve la de sus leads; super_admin todo
alter table public.lead_score_history enable row level security;
create policy "lead_score_history_super_admin_all" on public.lead_score_history
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "lead_score_history_tenant_read" on public.lead_score_history
  for select using (public.is_tenant_member() and organization_id = public.current_org_id());

-- unit_costs: lectura global + tenant override; super_admin gestiona
alter table public.unit_costs enable row level security;
create policy "unit_costs_super_admin_all" on public.unit_costs
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "unit_costs_read" on public.unit_costs
  for select using (
    (organization_id is null and is_active = true) or
    (public.is_tenant_member() and organization_id = public.current_org_id() and is_active = true)
  );

-- resource_usage: tenant ve el suyo; super_admin todo
alter table public.resource_usage enable row level security;
create policy "resource_usage_super_admin_all" on public.resource_usage
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "resource_usage_tenant_read" on public.resource_usage
  for select using (public.is_tenant_member() and organization_id = public.current_org_id());
create policy "resource_usage_tenant_insert" on public.resource_usage
  for insert with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- daily_costs: tenant ve el suyo; super_admin todo
alter table public.daily_costs enable row level security;
create policy "daily_costs_super_admin_all" on public.daily_costs
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "daily_costs_tenant_read" on public.daily_costs
  for select using (public.is_tenant_member() and organization_id = public.current_org_id());
create policy "daily_costs_tenant_upsert" on public.daily_costs
  for insert with check (public.is_tenant_member() and organization_id = public.current_org_id());
create policy "daily_costs_tenant_update" on public.daily_costs
  for update using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ============================================================
-- 5) GRANTS
-- ============================================================
grant all on table public.copilot_sessions to authenticated, service_role;
grant all on table public.copilot_messages to authenticated, service_role;
grant all on table public.copilot_tools to authenticated, service_role;
grant all on table public.scoring_models to authenticated, service_role;
grant all on table public.lead_scores to authenticated, service_role;
grant all on table public.lead_score_history to authenticated, service_role;
grant all on table public.unit_costs to authenticated, service_role;
grant all on table public.resource_usage to authenticated, service_role;
grant all on table public.daily_costs to authenticated, service_role;

-- ============================================================
-- 6) TRIGGERS updated_at
-- ============================================================
create trigger copilot_sessions_set_updated_at before update on public.copilot_sessions
  for each row execute function public.set_updated_at();

create trigger copilot_tools_set_updated_at before update on public.copilot_tools
  for each row execute function public.set_updated_at();

create trigger scoring_models_set_updated_at before update on public.scoring_models
  for each row execute function public.set_updated_at();

create trigger unit_costs_set_updated_at before update on public.unit_costs
  for each row execute function public.set_updated_at();

create trigger daily_costs_set_updated_at before update on public.daily_costs
  for each row execute function public.set_updated_at();

commit;
-- ====================== 12_finance_reputation_security.sql ======================
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

alter publication supabase_realtime add table public.quotes;
alter publication supabase_realtime add table public.invoices;
alter publication supabase_realtime add table public.payments;
alter publication supabase_realtime add table public.reviews;

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

commit;

-- ====================== 13_timeline_insights_metrics.sql ======================
-- ============================================================
-- ZimplifAI CRM — Fase J · Timeline unificado, Insights AI y Métricas diarias
--
-- 1) timeline_events: eventos del timeline unificado (whatsapp,
--    voice, QR, booking, AI action, SLA breach).
-- 2) insights_moments: momentos AI — sugerencias inteligentes
--    del agent runtime con suggested_action JSONB.
-- 3) metrics_daily: métricas diarias agregadas por tenant
--    (leads, bookings, revenue, AI hours, tokens, speed-to-lead).
-- 4) bookings: enriquecer con risk_score, deposit_status,
--    stripe_payment_intent_id para el Anti-No-Show Engine.
-- 5) calendars: enriquecer con requires_deposit_on_high_risk,
--    deposit_amount_eur.
--
-- RLS estricto multi-tenant + grants explícitos + realtime.
-- ============================================================

begin;

-- ======================== Realtime ========================

alter publication supabase_realtime add table public.timeline_events;
alter publication supabase_realtime add table public.insights_moments;

-- ======================== timeline_events ========================

create table public.timeline_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id         uuid references public.leads (id) on delete cascade,
  event_type      text not null check (event_type in (
    'whatsapp_received', 'whatsapp_sent', 'voice_note', 'qr_scanned',
    'menu_viewed', 'booking_created', 'booking_confirmed', 'booking_cancelled',
    'ai_action', 'sla_breach', 'sla_rescued', 'form_submitted',
    'lead_created', 'stage_changed', 'deposit_requested', 'deposit_paid'
  )),
  title           text not null,
  description     text,
  payload         jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index timeline_events_org_idx on public.timeline_events (organization_id, created_at desc);
create index timeline_events_lead_idx on public.timeline_events (lead_id) where lead_id is not null;
create index timeline_events_type_idx on public.timeline_events (organization_id, event_type);

-- ======================== insights_moments ========================

create table public.insights_moments (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  lead_id           uuid references public.leads (id) on delete cascade,
  severity          text not null check (severity in ('info', 'warning', 'opportunity', 'urgent')),
  title             text not null,
  reasoning         text not null,
  suggested_action  jsonb not null default '{}'::jsonb,
  -- suggested_action = { "type": "send_whatsapp" | "rescue_lead" | "charge_deposit" | "follow_up", "payload": {} }
  is_resolved       boolean not null default false,
  created_at        timestamptz not null default now()
);

create index insights_org_idx on public.insights_moments (organization_id, created_at desc);
create index insights_unresolved_idx on public.insights_moments (organization_id, is_resolved)
  where is_resolved = false;

-- ======================== metrics_daily ========================

create table public.metrics_daily (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations (id) on delete cascade,
  date                      date not null,
  total_leads               integer not null default 0,
  total_bookings            integer not null default 0,
  attributed_revenue        numeric(12,2) not null default 0.00,
  ai_hours_saved            numeric(5,2) not null default 0.00,
  ai_tokens_used            integer not null default 0,
  speed_to_lead_avg_seconds integer not null default 0,
  created_at                timestamptz not null default now(),
  unique (organization_id, date)
);

create index metrics_daily_org_idx on public.metrics_daily (organization_id, date desc);

-- ======================== bookings: risk + deposit ========================

alter table public.bookings add column if not exists risk_score numeric(5,2) not null default 0.00;
alter table public.bookings add column if not exists deposit_status text not null default 'none'
  check (deposit_status in ('none', 'pending', 'paid', 'refunded'));
alter table public.bookings add column if not exists stripe_payment_intent_id text;

-- ======================== calendars: deposit config ========================

alter table public.calendars add column if not exists requires_deposit_on_high_risk boolean not null default true;
alter table public.calendars add column if not exists deposit_amount_eur numeric(10,2) not null default 10.00;

-- ======================== RLS ========================

alter table public.timeline_events enable row level security;
create policy "timeline_events_super_admin_all"
  on public.timeline_events for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "timeline_events_tenant_all"
  on public.timeline_events for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.insights_moments enable row level security;
create policy "insights_moments_super_admin_all"
  on public.insights_moments for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "insights_moments_tenant_all"
  on public.insights_moments for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

alter table public.metrics_daily enable row level security;
create policy "metrics_daily_super_admin_all"
  on public.metrics_daily for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
create policy "metrics_daily_tenant_all"
  on public.metrics_daily for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ======================== Grants ========================

grant all on table public.timeline_events to authenticated, service_role;
grant all on table public.insights_moments to authenticated, service_role;
grant all on table public.metrics_daily to authenticated, service_role;
grant all on table public.bookings to authenticated, service_role;
grant all on table public.calendars to authenticated, service_role;

commit;

-- ====================== 14_reservation_bots.sql ======================
-- ============================================================
-- ZimplifAI CRM — Fase K · Bot de reservas multi-cliente
--
-- Registro central de bots de mensajería (Telegram hoy, WhatsApp
-- después) por organización. La agencia activa el servicio desde el
-- perfil de SuperAdmin y solo introduce el token: el resto de la
-- configuración (horarios, aforo, franjas, web, plantillas) se lee
-- de la propia subcuenta del cliente.
--
-- Un único webhook (/api/v1/telegram/webhook) recibe los updates de
-- TODOS los bots; cada bot se registra con un `webhook_secret` único
-- que permite resolver a qué organización pertenece el update.
--
-- RLS estricto multi-tenant + grants explícitos.
-- ============================================================

begin;

create table public.messaging_bots (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations (id) on delete cascade,
  channel              text not null check (channel in ('telegram', 'whatsapp')),
  -- @username del bot (Telegram) o número de teléfono (WhatsApp).
  external_id          text not null,
  -- Credencial cifrada con BOT_CREDENTIAL_KEY (AES-256-GCM). Solo se
  -- lee desde rutas de servidor (service role); nunca desde el cliente.
  credential_encrypted text not null,
  -- Secret token pasado a setWebhook: desambigua el webhook por bot.
  webhook_secret       text,
  status               text not null default 'connecting'
                         check (status in ('connecting', 'connected', 'error')),
  last_error           text,
  connected_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (organization_id, channel)
);

create index messaging_bots_org_idx on public.messaging_bots (organization_id);
-- Lookup del webhook: busqueda rápida por secret token.
create unique index messaging_bots_webhook_secret_idx
  on public.messaging_bots (webhook_secret) where webhook_secret is not null;

create trigger messaging_bots_set_updated_at before update on public.messaging_bots
  for each row execute function public.set_updated_at();

-- ======================== RLS ========================
-- Los clientes gestionan su propia fila (la credencial y el secret
-- quedan ocultos porque las queries de cliente no seleccionan esas
-- columnas). El webhook usa service role (bypass de RLS).

alter table public.messaging_bots enable row level security;

create policy "messaging_bots_super_admin_all"
  on public.messaging_bots for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "messaging_bots_tenant_all"
  on public.messaging_bots for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ======================== Grants ========================

grant all on table public.messaging_bots to authenticated, service_role;

commit;

-- ====================== 15_voice_agent_configs.sql ======================
-- ============================================================
-- ZimplifAI CRM — Fase L · Agente de llamadas IA multi-cliente
--
-- Configuración del bot de llamadas de voz por organización. La
-- agencia activa el servicio desde el perfil de SuperAdmin y solo
-- introduce lo que es exclusivo del cliente (nombre del agente,
-- tono, reglas, API keys opcionales y voz): el resto del contexto
-- (servicios, precios, horarios, aforo, historial del lead) se lee
-- de la propia subcuenta del cliente en tiempo de conversación.
--
-- Un único endpoint (/api/v1/voice/turn) sirve a TODAS las llamadas:
-- cada agente se registra con un `webhook_secret` único que permite
-- al orquestador de voz (Vapi / Retell) autenticarse por agente y
-- al backend resolver a qué organización pertenece la llamada.
--
-- Las API keys se guardan cifradas con BOT_CREDENTIAL_KEY
-- (AES-256-GCM) y nunca salen al cliente.
--
-- RLS estricto multi-tenant + grants explícitos.
-- ============================================================

begin;

create table public.voice_agent_configs (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references public.organizations (id) on delete cascade,
  -- Identidad y personalidad del agente de voz.
  agent_name           text not null default 'Recepción',
  tone                 text not null default 'cercano, natural y profesional',
  -- Reglas de negocio adicionales del cliente (p. ej. "mínimo 2 noches").
  custom_rules         text,
  -- Cerebro: proveedor LLM y clave (cifrada). 'demo' = respuesta simulada.
  llm_provider         text not null default 'demo'
                         check (llm_provider in ('gemini', 'groq', 'demo')),
  llm_api_key_encrypted text,
  -- Voz: proveedor TTS, clave (cifrada) e ID de voz. 'demo' = sin audio.
  tts_provider         text not null default 'demo'
                         check (tts_provider in ('elevenlabs', 'deepgram', 'demo')),
  tts_api_key_encrypted text,
  voice_id             text,
  -- Número de teléfono al que llama el agente (referencia, para la UI).
  phone_number         text,
  -- Secret token del orquestador de voz: autentica /api/v1/voice/turn.
  webhook_secret       text,
  status               text not null default 'connecting'
                         check (status in ('connecting', 'connected', 'error')),
  last_error           text,
  connected_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (organization_id)
);

create index voice_agent_configs_org_idx on public.voice_agent_configs (organization_id);
-- Lookup del webhook de voz: busqueda rápida por secret token.
create unique index voice_agent_configs_webhook_secret_idx
  on public.voice_agent_configs (webhook_secret) where webhook_secret is not null;

create trigger voice_agent_configs_set_updated_at before update on public.voice_agent_configs
  for each row execute function public.set_updated_at();

-- ======================== RLS ========================
-- Los clientes gestionan su propia fila (las claves y el secret quedan
-- ocultos porque las queries de cliente no seleccionan esas columnas).
-- El orquestador de voz usa service role (bypass de RLS).

alter table public.voice_agent_configs enable row level security;

create policy "voice_agent_configs_super_admin_all"
  on public.voice_agent_configs for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "voice_agent_configs_tenant_all"
  on public.voice_agent_configs for all
  using (public.is_tenant_member() and organization_id = public.current_org_id())
  with check (public.is_tenant_member() and organization_id = public.current_org_id());

-- ======================== Grants ========================

grant all on table public.voice_agent_configs to authenticated, service_role;

commit;

