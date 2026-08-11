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

-- Realtime (las tablas ya existen aquí)
alter publication supabase_realtime add table public.workflows;
alter publication supabase_realtime add table public.workflow_runs;
alter publication supabase_realtime add table public.workflow_run_steps;

commit;
