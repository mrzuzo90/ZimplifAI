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
