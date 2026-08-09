# ZimplifAI CRM — Agency Operating System

> Documento técnico completo del proyecto. Describe la arquitectura, el design system, la capa de datos multi-tenant, el motor white-label y **todas** las features implementadas: la base del CRM, la expansión a **Agency Control View, Subaccount Switcher y Feature Flagging**, el **Paquete 1** (realtime + actividad + vistas + tema), la **Fase A** (workflows visuales) y la **Fase light_web_editor** (sitios web verticales).
>
> **Stack:** Next.js 16.3 (App Router · Turbopack) · React 19 · TypeScript strict · Tailwind CSS v4 (CSS-first) · Supabase (Postgres + RLS) · Radix UI + shadcn · framer-motion · sonner · date-fns · cmdk

---

## 1. Visión del producto

**ZimplifAI CRM** es una plataforma B2B SaaS multi-tenant tipo **"Agency Operating System"** (concepto GoHighLevel Snapshots, pero ligero y modular). Un SuperAdmin (Zuzo, dueño de la agencia) **aprovisiona subcuentas verticales en 1 clic** (Restaurantes con bot de WhatsApp, Captación de leads para servicios, Agencia a medida), gestiona qué **módulos** tiene activos cada subcuenta, y puede **entrar en cualquier workspace cliente** con impersonación.

Los **clientes** (client_admin / client_member) ven un **workspace white-label restringido**: solo los módulos habilitados para su organización, sin control de features, sin API keys y sin provisioning.

**Toda la interfaz está en español** (restricción explícita del cliente). El modo demo funciona **offline sin Supabase** con datos mock interactivos.

---

## 2. Arquitectura en dos modos (Supabase ⇄ Mock)

La capa de datos es **doble y unificada** (`src/lib/data-access.ts`): si las variables de entorno de Supabase están configuradas usa Supabase; si no, un **mock store en localStorage con pub/sub** que simula realtime.

```
data-access.ts (API unificada)
   ├─ Supabase configurado → clientes supabase-js (browser / server / service)
   └─ Sin configurar (demo) → mock-store.ts (localStorage + pub/sub + seed realista)
```

- `src/lib/supabase/client.ts` — cliente de navegador (`@supabase/ssr`).
- `src/lib/supabase/server.ts` — cliente de servidor con `cookies` (solo Server Component).
- `src/lib/supabase/admin.ts` — cliente **service role** (bypass RLS) para provisioning/impersonación.
- `src/lib/supabase/config.ts` — módulo **neutro** (`isSupabaseConfigured`) sin imports de `next/headers`, para que `data-access` pueda compartirse con componentes client sin filtrar código de servidor al bundle (esto fue un fix crítico de build).
- `src/lib/mock-store.ts` — store persistido en `localStorage` con `subscribeDb()` para realtime simulado; seed desde `mock-data.ts` (6 subcuentas, leads, bookings, agentes, audit, módulos).
- `src/hooks/useCollection.ts` — hook genérico de colección con carga + suscripción al mock (simula realtime en demo).

**Tipado Supabase (`src/types/database.ts`, 262 líneas):** todos los `Row` son `type` aliases (no `interface`) porque el contrato `GenericSchema` de supabase-js exige que satisfagan `Record<string, unknown>`; cada tabla declara `Relationships` y los `Functions` se tipan explícitamente. Incluye `LeadWithProfile`, `BookingWithLead`, `OrganizationWithStats`, `AdminOverview`.

---

## 3. Design System (Tailwind v4, CSS-first)

Estética técnica oscura **Linear / Vercel / Stripe**. Tokens definidos en `src/app/globals.css` con `@theme inline` (las utilidades usan variables CSS, así el **white-label puede re-pintar** el tenant en runtime).

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#0B0D0C` | Pitch Black |
| `--surface` | `#121614` | Dark Slate / Charcoal |
| `--surface-elevated` | `#171C19` | Elevación |
| `--foreground` | `#E8E8E3` | Headings Off-White |
| `--muted-foreground` | `#8A948E` | Body gris-verde |
| `--border` / `--border-strong` | `#1F2622` / `#2A342E` | Dividers 1px |
| `--primary` | `var(--tenant-primary)` → `#CEFF00` | **Volt Green** |
| `--primary-foreground` | `var(--tenant-primary-foreground)` → `#0B0D0C` | Contraste auto |
| `--accent` | `#1A2418` | Tinte volt 8% |
| `--success` / `--warning` / `--info` / `--destructive` | `#3DD68C` / `#FFB020` / `#6AB7FF` / `#FF5C5C` | Estados |
| `--radius*` | 0.625–1rem | Radios |

- Tipografía display condensada para títulos, `font-mono` para datos técnicos, botones/tags con micro-copy en mayúsculas espaciadas.
- Efectos: `glow-volt` (halo), blur de cabecera, skeletons, `prefers-reduced-motion` respetado (animaciones con `motion-safe`).

### UI primitives (21 componentes shadcn/Radix escritos a mano)
`avatar · badge · button · card · command (cmdk) · dialog · dropdown-menu · input · label · popover · progress · scroll-area · select · separator · sheet (nuevo, drawer lateral) · skeleton · switch · table · tabs · textarea · tooltip`

---

## 4. Multi-tenancy + Row Level Security

### Migraciones
- **`supabase/migrations/01_init_schema.sql`** — esquema base: 6 enums, 7 tablas (`organizations`, `profiles`, `leads`, `bookings`, `ai_agents`, `ai_audit_logs`, `vertical_snapshots`), índices, triggers (`set_updated_at`, `sync_profile_claims`), funciones RLS y políticas.
- **`supabase/migrations/02_organization_modules.sql`** (nuevo) — feature flags por subcuenta:

```sql
create table public.organization_modules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_key text not null,            -- 'whatsapp_bot' | 'booking_calendar' | 'light_web_menu' | 'sales_kanban' | 'ai_logs'
  is_enabled boolean default true,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (organization_id, module_key)
);
```

### Modelo RLS estricto (requisito verbatim)
- **SuperAdmin:** `is_super_admin()` → **bypass total** (todas las tablas, `for all` con `with check`).
- **Clientes:** `is_tenant_member() AND <tenant_id> = current_org_id()` → **solo filas de su organización**. La org se resuelve del claim `app.current_org_id` (seteado por el trigger `sync_profile_claims` / la función `impersonate_organization`).
- **Nueva política para `organization_modules`:** los clientes tienen **solo lectura** de sus módulos (para renderizar la UI) — la escritura de features es **exclusiva del SuperAdmin**. `UNIQUE(organization_id, module_key)` garantiza 5 filas por subcuenta.
- Helpers: `current_org_id()`, `current_user_role()`, `is_super_admin()`, `is_tenant_member()`, `impersonate_organization(target_org_id)`.

---

## 5. Motor white-label

- **`src/context/BrandingContext.tsx`** — proveedor global que inyecta `--tenant-primary` y `--tenant-primary-foreground` en `:root` al cargar la org activa (fallback Volt `#CEFF00`). Expone `useBranding()` con: `organization`, `role`, `profile`, `loading`, `isSuperAdmin`, `isImpersonating`, `isAgencyMode`, `demoMode`, `setActiveOrg`, `updateBranding`, `isModuleEnabled`, `toggleModule`, `updateModuleSettings`, `refresh`, `stopImpersonation`, `switchDemoRole`, `primaryColor`, `logoUrl`.
- **`src/lib/branding.ts`** — utilidades de color: `isValidHex`, `hexToRgb`, `relativeLuminance`, `getContrastForeground` (elige automáticamente texto oscuro/claro según contraste WCAG — requisito AA).
- **`TenantLogo`** — logo del tenant: URL si existe, si no iniciales sobre color primario.
- **`BrandingSettingsPage`** (ruta `/workspace/settings/branding`) — picker de color + nombre + logo con **previsualización en vivo** y persistencia.

---

## 6. Auth, sesión e impersonación

- **`src/middleware.ts`** — refresca la sesión de Supabase en cada request (sin config → modo demo, no bloquea).
- **`/login`** — página de acceso con `LoginForm`.
- **Impersonación real (JWT swap):** `POST /api/admin/impersonate` (service role): comprueba `super_admin`, verifica la org, y hace `updateUserById` cambiando `app_metadata` a `{ role: "client_admin", organization_id, _impersonated_from }`. `DELETE` restaura role + `organization_id` real del perfil. El claim vuelve al JWT en el siguiente refresh; el trigger `sync_profile_claims` mantiene consistencia con `profiles`.
- **Banner persistente de impersonación** ("Viewing as SuperAdmin (Agency Mode) · dentro de [subcuenta]" + botón **Exit to Agency Dashboard** que revierte y navega a `/admin`).

---

## 7. AGENCY OPERATING SYSTEM (iteración 2)

### 7.1 Registro central de módulos — `src/lib/modules.ts`
Las **5 claves canónicas de feature flags** (spec): `whatsapp_bot`, `booking_calendar`, `light_web_menu`, `sales_kanban`, `ai_logs`. Cada una con icono lucide, descripción, **settings por defecto** y **mapeo ruta→módulo** (`MODULE_ROUTES`). `normalizeModules()` rellena filas ausentes con defaults; `enabledModuleKeys()` extrae las activas.

```ts
export const VERTICAL_MODULES: Record<VerticalType, ModuleKey[]> = {
  restaurant_booking: ["whatsapp_bot", "booking_calendar", "light_web_menu"],
  service_lead_gen:   ["whatsapp_bot", "sales_kanban", "ai_logs"],
  custom_agency:      ["whatsapp_bot", "sales_kanban", "ai_logs"],
};
```

### 7.2 Feature flagging + route guard
- **`useModuleAccess(moduleKey)`** — hook que comprueba el módulo en la org activa; SuperAdmin siempre true.
- **`ProtectedModule`** (wrapper) — infiere el módulo de la ruta (`moduleKeyForRoute`) y **bloquea la navegación directa** si está deshabilitado: estado "Módulo no activo" con enlace "Volver al panel". Aplicado a:
  - `/workspace/bookings` → `booking_calendar`
  - `/workspace/automations` → `whatsapp_bot`
  - `/workspace/logs` → `ai_logs`
  - `/workspace/settings/branding` → `light_web_menu`
- **Contexto**: `BrandingContext` mantiene `enabledModules` por org activa, recargándolos al cambiar de org, al impersonar y al togglear.

### 7.3 Agency Dashboard — `/admin`
- **`KpiGrid`** — 4 métricas del spec: **Subcuentas**, **Módulos activos** (sistema), **Agentes IA activos**, **MRR sistema** (con skeletons y tag `live`).
- **`TenantsTable`** — directorio con búsqueda, filtro de estado (Activa/Trial/Suspendida) y de vertical. Columnas: **Cliente/Subcuenta** (logo+nombre+slug), **Vertical**, **Módulos** (badges de los habilitados + `+N`), **Estado**, **Agentes**, **Leads**, **Creado**, **Acciones**:
  1. **Manage Features** (icono llave) → abre el drawer.
  2. **Copy Ingest Webhook / API key** → copia el webhook completo (en demo con API key plana; en producción avisa que la key solo se muestra en provisión).
  3. **Enter Subaccount Workspace** (botón "Entrar") → impersona y navega a `/workspace`.

### 7.4 Subaccount Switcher global — `SubaccountSwitcher`
En el header, **solo visible para super_admin**:
- Trigger muestra **"Agency View (All Subaccounts)"** (contexto agencia) o el **nombre de la subcuenta activa** (impersonando).
- Dropdown: opción "Agency View (All Subaccounts)" (sale de impersonación y va a `/admin`), lista de subcuentas con logo + vertical (clic → impersona y entra), y acceso rápido a **Provisión 1-Click**.

### 7.5 Feature Management Drawer — `FeatureManagementDrawer`
Drawer lateral (`Sheet`) **exclusivo SuperAdmin**, abierto desde cada fila del directorio:
- **Toggle por módulo** (`Switch`) que persiste en tiempo real (`organization_modules`) con optimistic update + rollback.
- **Editor JSON de settings** expandible por módulo (WhatsApp token/phone/prompt, horarios de reserva, menú web, moneda del kanban, retención de logs) con validación y guardado.
- Contador "X / 5 módulos activos" y refresco del overview tras cada cambio.

### 7.6 Sidebar dinámica cliente — `Sidebar`
- **Clientes:** renderiza **solo los módulos habilitados** de su org (`isModuleEnabled`). Nada de toggles, API keys ni provisioning.
- **SuperAdmin en modo agencia:** navegación global (Agency Dashboard, Provisión 1-Click) + contexto "Agency View · Todas las subcuentas".
- **SuperAdmin impersonando:** sidebar del cliente (todos los módulos) + sección "ZimplifAI" con acceso al Agency Dashboard.
- El **`GlobalSearch` (⌘K)** también filtra páginas por módulos habilitados y permite cambiar de subcuenta.

### 7.7 Home adaptativa por vertical — `VerticalHome`
- `restaurant_booking` → **"Hoy en tu restaurante"** (`RestaurantToday`): 4 KPIs del día (Reservas hoy, Confirmadas, Pendientes, Próximas) + lista de reservas de hoy con hora y estado.
- `service_lead_gen` / `custom_agency` → **Pipeline kanban**.
- Lógica: si la vertical es hostelería y `booking_calendar` está habilitado → dashboard de reservas; si no, kanban.

### 7.8 Provisión 1-Click — `/admin/provision` + `/api/provision`
- Formulario: **Cliente**, **Slug** (auto-slugify + sufijo `.zimplifai.app`), **Plantilla vertical** (desde `vertical_snapshots`) y **Email del owner**.
- `POST /api/provision` (service role, bypass RLS), pasos:
  1. Lee la `vertical_snapshots` y aplica `applySnapshot()`.
  2. Genera **API key** (`generateApiKey` → `zx_…` con hash sha256 en `organizations.api_key_hash`).
  3. Crea `organizations` (status trial, color por vertical) + `profiles` (client_admin).
  4. Inserta los **2 agentes IA por defecto** de la vertical.
  5. **Auto-inserta y habilita los módulos de la snapshot** en `organization_modules`.
  6. Devuelve **webhook de ingesta cifrado** `/api/v1/webhooks/ingest?org_id=…&key=…`, pipeline stages, agentes, módulos y API key (solo se muestra una vez, con botones de copia).
- En **modo demo**, `provisionOrganization` hace lo mismo contra el mock store (incluye `ensureOrgModules`).

### 7.9 Webhook de ingesta — `POST /api/v1/webhooks/ingest`
Para sistemas externos / n8n: valida `org_id` + `key` contra `api_key_hash`, acepta JSON o form, exige `phone`, whitelist de estados (`VALID_STATUSES`), crea el `lead`, registra el audit (`ai_audit_logs`, status `success`) y responde `{ ok, leadId, organization }`. 503 elegante si Supabase no está configurado.

---

## 8. Workspace cliente (iteración 1)

- **Pipeline multi-vista** (`/workspace`) — `PipelineView` expone el mismo dataset de leads en 4 vistas (kanban / tabla / calendario / lista) con switcher persistido en localStorage; drag & drop nativo en kanban, edición inline (estado, valor, seguimiento) en tabla, calendario mensual de seguimientos con creación por día. `LeadDialog` es un panel de 2 columnas: datos editables + `ActivityTimeline`.
- **Reservas** (`/workspace/bookings`) — `BookingsView` con lista/agenda, `NewBookingDialog`, estados.
- **Automations** (`/workspace/automations`) — `AgentsGrid` + `AgentCard` + `AgentEditDialog` (edita nombre/modelo/system prompt con render-time sync), `PayloadViewerModal` (muestra payloads input/output reales), enlace a logs.
- **Logs IA** (`/workspace/logs`) — `AuditLogStream` en tiempo real (token a token: input, output, coste, estado) con generador de stream demo (`MOCK_AUDIT_STREAM_POOL`).
- **Marca** (`/workspace/settings/branding`) — white-label en vivo.
- **Shell** (`WorkspaceShell` + `WorkspaceHeader`) — sidebar fija, responsive (drawer móvil), `DemoBanner`, `ImpersonationBanner`, `StatusBadge`, `UserMenu` (rol, reset demo, logout), `GlobalSearch` ⌘K.

---

## 8b. Paquete 1 — Fundación escalable (realtime + actividad + vistas + tema)

Capa de datos viva que desbloquea los paquetes siguientes (IA nativa, automatización visual, reporting).

- **Realtime multi-tenant** — `src/hooks/useRealtimeCollection.ts`: hook genérico tipo `useCollection` que en producción abre un canal Supabase (`postgres_changes`) por tabla filtrado por tenant y aplica INSERT/UPDATE/DELETE sobre el estado local sin recargar; en demo se suscribe al store mock (`subscribeDb`). Migración `supabase/migrations/03_realtime_activity.sql`: publication realtime para `leads`/`bookings`/`ai_audit_logs`/`lead_activity`, columna `next_follow_up_at`, tabla `lead_activity` con RLS estricto.
- **Timeline de actividad por lead** — tabla `lead_activity` (actor, tipo de evento, resumen, metadata jsonb, timestamp) + registro centralizado en `data-access.ts`: `createLead`→`lead_created`, `updateLeadStatus`→`stage_changed` (leeyendo el estado previo, con `metadata {from,to}`), `createBooking` confirmada→`booking_confirmed`, y el webhook de ingesta también registra. `ActivityTimeline` (dentro de `LeadDialog`) lista eventos con icono por tipo, autor, hora relativa, estados vacío/error y un campo "Añadir nota" (`comment`). `src/lib/activity.ts` centraliza meta + labels + `summarizeActivity` (datos puros).
- **Seguimientos** — `next_follow_up_at` en `Lead` (input `datetime-local` en nuevo lead, diálogo y tabla; dotes en el calendario; seed demo poblado).
- **4 vistas del pipeline** — `PipelineView` (contenedor) + `views/{KanbanView,TableView,CalendarView,ListView}`; vista activa persistida con `useSyncExternalStore` (sin hydration mismatch).
- **Modo claro/oscuro** — tokens CSS en `globals.css` (`:root` = oscuro intacto; `:root[data-theme="light"]` redefinido), `ThemeProvider` con `useSyncExternalStore`, script anti-FOUC en `<head>`, `ThemeToggle` (header + login), `ThemeToaster` que sigue el tema. White-label (`--tenant-primary`) se respeta en ambos temas.

---

## 8c. Fase A — Automatización visual (workflows)

Motor de workflows por vertical: disparadores + nodos conectados linealmente, editor de canvas y historial de ejecuciones con re-ejecución.

- **Esquema** — `supabase/migrations/04_workflows.sql`: `workflows` (organización, trigger_type + trigger_config jsonb, nodes/edges jsonb, is_active), `workflow_runs` (workflow_id, trigger, status, contexto), `workflow_run_steps` (run_id, node_id, tipo, estado, payload input/output, error). Realtime + RLS (`workflow_super_admin_all` / `workflow_tenant_all`) + grants.
- **Librería pura** — `src/lib/workflows.ts` (SSR-safe, sin imports de UI): `TRIGGERS`, `NODE_META` (label/icon/accent por tipo), `createNode`, `defaultNodeConfig`, `executeNode` (simulador determinista con interpolación `{{var}}`), `orderNodes` (orden topológico Kahn), `linearEdges` y `createVerticalWorkflowTemplate(vertical)` — plantillas por vertical (restaurante → bienvenida+winback; servicios → leads calientes).
- **Provisión** — `/api/provision` copia la plantilla de la vertical si el módulo `workflow_automation` está activo.
- **UI** — `WorkflowList` (grid de tarjetas, toggle activo, borrado con confirmación) · `WorkflowEditorDialog` (canvas: insertar/mover/borrar nodos, configuración por tipo de nodo) · `WorkflowRunHistoryDialog` (runs en realtime, pasos con payload `<pre>`, botón re-ejecutar paso).
- **Módulo** — clave `workflow_automation`, ruta `/workspace/automations/workflows` protegida con `ProtectedModule`.

---

## 8d. Fase light_web_editor — Sitios web verticales (`/s/[slug]`)

Motor de micro-websites white-label sin dependencias externas: cada subcuenta publica su web vertical (carta digital + reservas, catálogo de servicios con lead form, o funnel de captación) desde el editor del workspace.

- **Esquema** — `supabase/migrations/05_tenant_sites.sql` (nombrado `05_` porque `04_workflows.sql` ya existía): `tenant_sites` (title, slug UNIQUE, vertical_template, is_published, custom_domain, seo_metadata, content_payload jsonb con defaults completos). RLS: lectura pública solo si `is_published` (`tenant_sites_public_read`) + gestión de tenant (`tenant_sites_tenant_all`) + super_admin; grants a `authenticated`, `anon` y `service_role`; realtime.
- **Contenido** — `src/lib/site.ts` (puro): `restaurantContent()` / `serviceCatalogContent()` / `leadFunnelContent()` / `defaultContentForTemplate()` + `slugify()` + `templateLabel()`. Tres plantillas: `restaurant_menu`, `service_catalog`, `lead_funnel` con labels en `SITE_TEMPLATE_LABELS`.
- **Editor** — `/workspace/marketing/site` (`SiteEditor`, ProtectedModule `light_web_menu`): columna izquierda de configuración (selector de plantilla, tabs Hero/Menú/Horario/SEO, gestores de items de menú y horarios, flags de sección) + **preview en vivo** a la derecha con toggle Móvil 375px / Escritorio, reutilizando el mismo `SiteRenderer` de la página pública.
- **Renderer** — `SiteRenderer` (cliente): hero con imagen o gradiente tintado del color de marca, menú/servicios agrupados por categoría con badges de precio ("€" restaurante / "Desde €" servicios), horario, CTA de reserva, footer (dirección, teléfono, maps, copyright), botón flotante de WhatsApp y modal de captura (nombre + teléfono) con estado de éxito. Inyecta `primary_color` y `logo_url` de la organización (white-label).
- **Página pública SSR** — `/s/[slug]` (force-dynamic): `getSite(slug)` (service role → fallback mock), `generateMetadata` desde `seo_metadata`, `notFound()` si no está publicado.
- **Captura de leads** — `createSiteLead` (demo) / `POST /api/v1/sites/lead` (producción, service role) etiqueta el lead con `SITE_LEAD_SOURCE = "website_digital_menu"` y registra `lead_activity` "Sitio web".
- **Provisión** — paso 7 de `/api/provision`: crea el `tenant_sites` por defecto de la vertical (`slugify(clientName)-{orgId.slice(0,6)}`) cuando `light_web_menu` está activo.

---

## 8e. Fase B — Bandeja unificada (`/workspace/inbox`)

Inbox de 3 columnas con conversaciones de todos los canales (WhatsApp, Email, Instagram, Web) en un solo hilo por lead, plantillas de respuesta rápida y AI Reply Copilot determinista.

- **Esquema** — `supabase/migrations/06_unified_inbox.sql`: `message_threads` (canal, `external_id`, `subject`, `last_message_at`, `last_message_preview`, `unread_count`, estado `open|resolved`), `messages` (remitente `lead|agent|member`, dirección `inbound|outbound`, estado `sent|delivered|read|failed`), `message_templates` (nombre, categoría, canal, cuerpo con variables `{{var}}`). RLS estricto (`_super_admin_all` + `_tenant_all`), grants a `authenticated`/`service_role`, realtime por tabla.
- **Tipos + i18n** — `MESSAGE_CHANNELS`/`CHANNEL_LABELS`/`MESSAGE_SENDERS`/`THREAD_STATUSES` en `src/types/database.ts`; namespace `es.inbox` (~45 claves) en `src/lib/i18n/es.ts`.
- **Motor puro** — `src/lib/inbox.ts`: `threadPreview`, `interpolateVariables`, `extractVariables`, `detectIntent` (keyword matching) y `generateReplySuggestion` → respuesta en español contextual por intención (reserva, precio, horario, alergias, evento, saludo, gracias, cualificación, fallback) con label + tokens.
- **Data-access dual** — `fetchThreads` (hilos enriquecidos con lead), `fetchMessages`, `sendMessage` (insert + preview del hilo + `whatsapp_reply` en timeline), `markThreadRead`, `setThreadResolved`, `fetchMessageTemplates`/`saveMessageTemplate`/`deleteMessageTemplate`, `suggestAiReply` (compone hilo + lead + agente activo → `generateReplySuggestion` + entrada de auditoría).
- **UI (5 componentes)** — `ChannelBadge` (icono+color por canal), `ThreadList` (búsqueda, no-leídos, relativo, resuelto atenuado), `Conversation` (burbujas por remitente, snippets de variables `{{…}}`, redactor con Enter para enviar, auto-scroll, tarjeta del copilot con "Usar/Descartar"), `LeadSidebar` (identidad, estado, contacto, tags), `TemplatesDialog` (alta + listado por categoría + borrado).
- **Orquestador** — `InboxView`: `useRealtimeCollection(fetchThreads, { table: "message_threads" })` (demo vía `subscribeDb`, producción vía `postgres_changes`), `markThreadRead` al seleccionar, toggle resolver/reabrir, layout `h-[calc(100vh-13rem)]` con sidebar derecha oculta bajo `lg`.
- **Nav** — ítem "Inbox" en la Sidebar tras "Reservas" (módulo `unified_inbox`), ya registrado en `modules.ts` (label + descripción + settings + guard de ruta).
- **Demo** — 7 hilos con mensajes para `org_brasa` (Nerea 3 no-leídos, Marc, Laura IG, Jorge, Sofía resuelto, anónimo web, Elena email), 6 plantillas de ejemplo, canales conectados para brasa/baremo/kluster/demo.

---

## 8f. Fase C — Calendarios de citas + página pública `/b/[slug]`

Motor de reservas con calendarios por servicio, franjas semanales de disponibilidad, slots en tiempo real y página pública white-label con cancelación/reagenda por token.

- **Esquema** — `supabase/migrations/07_calendar_booking.sql`: `calendars` (servicio: `service_duration_min`, `color`, `settings` jsonb con `slot_minutes`, `is_active`) y `availability_rules` (día 0-6, `start_time`/`end_time` text, `capacity`, `is_active`) con RLS estricto + grants; `bookings` gana `calendar_id` (FK set null), `token` (gestión pública) y `source` (`manual|public|whatsapp`). Realtime por tabla.
- **Motor puro** — `src/lib/booking.ts`: `generateBookingToken`, `parseTime`/`formatMinutes`/`addMinutes`/`timeInRange`, `weekdayLabel` y `buildDaySlots` (slots cada `slot_minutes` dentro de cada franja activa mientras quepa la duración; las reservas no canceladas descuentan aforo por slot).
- **Gestión** (`/workspace/bookings/calendars`) — `CalendarsView` + `CalendarDialog` + `RuleForm`: tarjetas por calendario (color, duración, descripción, switch activo, editar/borrar), editor desplegable de franjas semanales (añadir/quitar, toggle activo, capacidad), y cabecera con la URL pública copiable `/b/{slug}`.
- **Página pública** (`/b/[slug]`) — SSR `force-dynamic` con `fetchPublicBookingContext` vía service role (demo: mapa `slug→org`); `PublicBookingWidget` con flujo servicio → día (14 chips) → hora (grid de slots) → datos, `createPublicBooking` (dedupe lead por teléfono, source `public`, status `confirmed`, `booking_confirmed` en timeline). Con `?token=…` pasa a modo gestión: ver detalles, cancelar (`cancelBookingByToken`) o reagendar (`rescheduleBookingByToken` reutilizando slots). Marca de la subcuenta (`primary_color`) aplicada en el CTA.
- **Demo** — 3 calendarios para `org_brasa` (Mesa interior 90′, Terraza 90′, Salón privado 120′) y 1 para `org_baremo` (Consulta 30′), con franjas reales por día; reservas semilla con `token` y `source` backfilleados.

---

## 8g. Fase E1 — CRM extendido (empresas, pipelines, tareas)

CRM multi-embudo al estilo Pipedrive/Notion: empresas B2B, pipelines configurables y tareas que alimentan el widget "Mi Día".

- **Esquema** — `supabase/migrations/08_crm_extended.sql`: `companies` (B2B), `pipelines` (`is_default`, `is_active`), `pipeline_stages` (referencian el enum canónico `LeadStatus` con `name`/`position`/`color` propios → sin tocar el enum), `tasks` (`status` check, `priority` check, `due_date`, `lead_id`/`company_id` FK set null). `leads` gana `company_id` + `pipeline_id`. RLS estricto + grants + realtime en cada tabla.
- **Multi-pipeline** — `PipelineSelector` (dropdown + crear/editar/borrar) y `PipelineDialog` (editor de etapas con nombre, estado canónico y color; sincroniza añadir/actualizar/eliminar). El `KanbanView` toma sus columnas de las etapas del pipeline activo (`columnsFromStages` en `config.ts`), con fallback al pipeline canónico. Los leads sin pipeline pertenecen al por defecto; el filtro aplica a las 4 vistas (kanban/tabla/calendario/lista).
- **Empresas** (`/workspace/sales/companies`) — `CompaniesView`: directorio con nº de leads por cuenta, diálogo crear/editar (web, industria, ciudad, teléfono, notas) y borrado que desvincula leads.
- **Tareas** (`/workspace/sales/tasks`) — `TasksView`: pestañas por estado, toggle hecha/pendiente, prioridad, fecha límite (válida para vencidas), vínculo a lead/empresa.
- **"Mi Día"** — `MyDay` en la home de verticales de servicios: tareas vencidas/hoy + leads con seguimiento hoy (con hora), enlaces a Tareas y Pipeline.
- **Capa de datos** — `data-access.ts` ampliado con CRUD completo (fetch/save/update/remove) para companies, pipelines + stages y tasks, con rama Supabase y demo; `createLead`/`updateLead` aceptan `company_id`/`pipeline_id`; webhook de ingesta backfillea ambos a `null`.
- **Demo** — `org_brasa` con pipelines Ventas (default) y Eventos (leads asignados a cada uno, empresas Bodas & Receptions / Catering Deluxe / TechCorp); `org_baremo` con pipeline legal, leads de prueba y `sales_crm` habilitado.

---

## 9. Inventario de archivos

```
src/
├─ app/
│  ├─ (app)/                     # shell autenticado (WorkspaceShell)
│  │  ├─ admin/page.tsx          # Agency Dashboard
│  │  ├─ admin/provision/page.tsx# Provisión 1-Click
│  │  ├─ settings/branding/page.tsx
│  │  ├─ workspace/page.tsx      # Home adaptativa (VerticalHome)
│  │  ├─ workspace/bookings/page.tsx
│  │  ├─ workspace/inbox/page.tsx      # NUEVO · Fase B bandeja unificada
│  │  ├─ workspace/automations/page.tsx
│  │  ├─ workspace/automations/workflows/page.tsx  # NUEVO · Fase A
│  │  ├─ workspace/marketing/site/page.tsx         # NUEVO · editor web vertical
│  │  ├─ workspace/logs/page.tsx # módulo ai_logs
│  │  ├─ workspace/settings/branding/page.tsx
│  │  └─ s/[slug]/page.tsx       # NUEVO · web pública SSR
│  ├─ api/
│  │  ├─ admin/impersonate/route.ts   # POST/DELETE JWT swap
│  │  ├─ provision/route.ts           # service role
│  │  ├─ v1/webhooks/ingest/route.ts  # ingesta externa
│  │  └─ v1/sites/lead/route.ts       # NUEVO · captura de leads del sitio
│  ├─ login/page.tsx · page.tsx · layout.tsx · globals.css
├─ components/
│  ├─ admin/    FeatureManagementDrawer · KpiGrid · TenantsTable
│  ├─ auth/     LoginForm
│  ├─ automations/ AgentCard·AgentEditDialog·AgentsGrid·AuditLogStream·PayloadViewerModal·config
│  ├─ bookings/ BookingsView · NewBookingDialog
│  ├─ dashboard/ VerticalHome · RestaurantToday
│  ├─ guards/   ProtectedModule
│  ├─ inbox/    ChannelBadge · Conversation · InboxView · LeadSidebar · ThreadList · TemplatesDialog  # NUEVO · Fase B
│  ├─ layout/   Sidebar · WorkspaceHeader · WorkspaceShell · SubaccountSwitcher · GlobalSearch · UserMenu
│  ├─ pipeline/ config · LeadCard · LeadDialog · NewLeadDialog
│  │  ├─ PipelineView · ActivityTimeline
│  │  └─ views/ KanbanView · TableView · CalendarView · ListView
│  ├─ sites/    SiteRenderer · SiteEditor · PublicSitePage       # NUEVO · Fase light_web_editor
│  ├─ theme/    ThemeProvider · ThemeToaster · ThemeToggle
│  ├─ settings/ BrandingSettingsPage
│  ├─ shared/   DemoBanner · ImpersonationBanner · PageHeader · States · StatusBadge · TenantLogo · ZLogo
│  ├─ workflows/ WorkflowList · WorkflowEditorDialog · WorkflowRunHistoryDialog   # NUEVO · Fase A
│  └─ ui/       21 primitives (incl. sheet.tsx)
├─ context/   BrandingContext.tsx
├─ hooks/     useBranding · useCollection · useRealtimeCollection · useModuleAccess
├─ lib/
│  ├─ supabase/ client · server · admin · config (neutro)
│  ├─ data-access.ts · mock-store.ts · mock-data.ts · provisioning.ts · modules.ts
│  ├─ activity.ts · branding.ts · format.ts · utils.ts
│  ├─ site.ts · workflows.ts · inbox.ts                          # NUEVO · dominios puros
├─ types/     database.ts
└─ middleware.ts
supabase/migrations/ 01_init_schema.sql · 02_organization_modules.sql · 03_realtime_activity.sql
                    · 04_workflows.sql · 05_tenant_sites.sql · 06_unified_inbox.sql   # NUEVO
```

---

## 10. Calidad y verificación

| Check | Comando | Resultado |
|---|---|---|
| TypeScript | `npm run typecheck` | ✓ 0 errores |
| ESLint (regla estricta `react-hooks/set-state-in-effect` de Next 16) | `npx eslint .` | ✓ 0 errores/avisos |
| Build producción (Turbopack) | `npm run build` | ✓ 20 páginas + 4 APIs (incl. `/s/[slug]` SSR y `/workspace/inbox`) |
| Smoke test dev | `npm run dev -p 4521` | ✓ todas las rutas → 200 |

Detalles de calidad:
- **Regla ESLint estricta `set-state-in-effect`**: todos los efectos de carga usan async IIFE con flag `cancelled` (setState solo tras `await`); los diálogos sincronizan props con render-time "adjust state on prop change" (`prevX` state).
- **Fix de build clave**: `isSupabaseConfigured` vive en `supabase/config.ts` (neutro) para no filtrar `next/headers` (solo Server Component) al bundle de cliente.
- **Tipado Supabase**: `type` aliases + `Relationships` para satisfacer `GenericSchema`.
- Iconos lucide verificados contra el paquete instalado (nunca importar exports inexistentes).
- `prefers-reduced-motion` respetado.

---

## 11. Cómo ejecutar

```bash
npm install        # incluye devDeps (hay .npmrc con include=dev)
npm run dev -p 4521   # → http://localhost:4521  (modo demo sin Supabase)
npm run build      # build producción
npm run start      # sirve el build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

**Variables de entorno** (`.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `NEXT_PUBLIC_SITE_URL`. Sin ellas, todo funciona en **modo demo** con datos mock.

### Flujo de demostración
1. Entra en `/workspace` → cliente hostelería "Brasa & Carbón": dashboard **"Hoy en tu restaurante"**, sidebar restringida (Reservas, Automations, Logs IA, Marca) — **sin** Pipeline ni controles de agencia.
2. `/admin` → Agency Dashboard: KPIs + directorio + acciones (Manage Features / Entrar / Copiar webhook).
3. Menú de usuario → conmutar rol a **SuperAdmin** → `/admin` muestra el switcher "Agency View"; **Entrar** en una subcuenta activa el banner de impersonación y la sidebar de esa subcuenta.
4. **Manage Features** sobre cualquier subcuenta → toggle módulos en tiempo real y editor JSON de settings.
5. `/admin/provision` → crea una subcuenta en 1 clic (agentes + módulos + webhook).
6. `/workspace/automations/workflows` → editor de workflows visual; activa uno y abre su historial de ejecuciones.
7. `/workspace/marketing/site` → edita la web vertical con preview en vivo (toggle móvil/escritorio) y pulsa "Ver sitio publicado".
8. `/s/brasa-carbon` → web pública SSR de la subcuenta hostelería (carta, horario, botón de reserva con captura de lead).
9. Toggle claro/oscuro en la cabecera → el tema persiste tras recargar y el white-label (color del tenant) se respeta en ambos.
10. `/workspace/inbox` → bandeja unificada de 3 columnas: selecciona un hilo (marca como leído), responde con Enter o variables `{{…}}`, pulsa "Sugerir respuesta" para el AI Reply Copilot, marca como resuelto, y abre Plantillas para crear/borrar respuestas rápidas.

---

*Documento generado el 2026-08-08. Todas las features descritas están implementadas, compilando y verificadas con build, typecheck, lint y smoke test en dev.*
