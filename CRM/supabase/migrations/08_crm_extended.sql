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


alter publication supabase_realtime add table public.companies;
alter publication supabase_realtime add table public.pipelines;
alter publication supabase_realtime add table public.pipeline_stages;
alter publication supabase_realtime add table public.tasks;
commit;
