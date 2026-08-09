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
