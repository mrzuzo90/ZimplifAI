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
