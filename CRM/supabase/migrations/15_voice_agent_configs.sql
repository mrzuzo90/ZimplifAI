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
