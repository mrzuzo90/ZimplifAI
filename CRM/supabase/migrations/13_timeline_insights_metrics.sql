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
