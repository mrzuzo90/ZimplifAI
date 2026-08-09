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
