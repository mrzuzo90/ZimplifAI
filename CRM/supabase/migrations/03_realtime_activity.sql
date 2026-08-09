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
