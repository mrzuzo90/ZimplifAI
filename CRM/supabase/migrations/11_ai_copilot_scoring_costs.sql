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