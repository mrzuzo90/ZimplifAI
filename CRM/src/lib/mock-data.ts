import type {
  AiAgent,
  AiAuditLog,
  AgencyMarketplace,
  AvailabilityRule,
  Booking,
  Calendar,
  Company,
  CopilotMessage,
  CopilotSession,
  CopilotTool,
  DailyCosts,
  FormSubmission,
  Invoice,
  InvoiceItem,
  Lead,
  LeadActivity,
  LeadScore,
  LeadScoreHistory,
  MarketingForm,
  MarketingFunnel,
  Message,
  MessageThread,
  MessageTemplate,
  ModuleKey,
  Organization,
  OrganizationModule,
  OrganizationUsage,
  Payment,
  Pipeline,
  PipelineStage,
  Profile,
  Quote,
  QuoteItem,
  ResourceUsage,
  Review,
  ReviewRequest,
  ScoringModel,
  Task,
  TenantSite,
  UnitCost,
  UsageLimits,
  VerticalSnapshot,
  Workflow,
  WorkflowRun,
  WorkflowRunStep,
  TimelineEvent,
  InsightsMoment,
  MetricsDaily,
} from "@/types/database";
import { defaultContentForTemplate } from "@/lib/site";

/** Datos mock deterministas para el modo demo (sin Supabase). */

export function initialsLogo(name: string, color: string): string {
  const letters = name
    .replace(/[·&]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="14" fill="${color}"/><text x="32" y="41" font-family="Inter,sans-serif" font-size="26" font-weight="700" text-anchor="middle" fill="#0B0D0C">${letters}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

/* ------------------------- Tenants ------------------------- */

export const mockOrganizations: Organization[] = [
  {
    id: "org_brasa",
    name: "Brasa & Carbón · Restaurante",
    slug: "brasa-carbon",
    vertical_type: "restaurant_booking",
    logo_url: initialsLogo("Brasa & Carbón", "#CEFF00"),
    primary_color: "#CEFF00",
    custom_domain: "reservas.brasacarbon.com",
    status: "active",
    api_key_hash: null,
    created_at: daysAgo(120),
  },
  {
    id: "org_baremo",
    name: "Baremo Estudio · Abogados",
    slug: "baremo-estudio",
    vertical_type: "service_lead_gen",
    logo_url: initialsLogo("Baremo", "#6AB7FF"),
    primary_color: "#6AB7FF",
    custom_domain: null,
    status: "active",
    api_key_hash: null,
    created_at: daysAgo(84),
  },
  {
    id: "org_mamare",
    name: "MamaRed · Clínica dental",
    slug: "mamared-dental",
    vertical_type: "service_lead_gen",
    logo_url: initialsLogo("MamaRed", "#FFB020"),
    primary_color: "#FFB020",
    custom_domain: "citas.mamared.es",
    status: "trial",
    api_key_hash: null,
    created_at: daysAgo(12),
  },
  {
    id: "org_kluster",
    name: "Klüster · Gimnasio boutique",
    slug: "kluster-gym",
    vertical_type: "service_lead_gen",
    logo_url: initialsLogo("Klüster", "#C084FC"),
    primary_color: "#C084FC",
    custom_domain: null,
    status: "active",
    api_key_hash: null,
    created_at: daysAgo(60),
  },
  {
    id: "org_tenzo",
    name: "Tenzo · Sushi bar",
    slug: "tenzo-sushi",
    vertical_type: "restaurant_booking",
    logo_url: initialsLogo("Tenzo", "#22D3EE"),
    primary_color: "#22D3EE",
    custom_domain: null,
    status: "suspended",
    api_key_hash: null,
    created_at: daysAgo(200),
  },
  {
    id: "org_demo",
    name: "Demo Agency · ZimplifAI",
    slug: "demo-agency",
    vertical_type: "custom_agency",
    logo_url: initialsLogo("ZimplifAI", "#CEFF00"),
    primary_color: "#CEFF00",
    custom_domain: null,
    status: "active",
    api_key_hash: null,
    created_at: daysAgo(400),
  },
];

/** Tenant activo por defecto en modo demo. */
export const mockActiveOrg = mockOrganizations[0];

/* ------------------------- Sitios web verticales (light_web_editor) ------------------------- */

const buildSite = (
  organization_id: string,
  title: string,
  slug: string,
  vertical_template: TenantSite["vertical_template"],
  overrides: { hero?: Partial<TenantSite["content_payload"]["hero"]>; contact?: Partial<TenantSite["content_payload"]["contact"]> } = {}
): TenantSite => {
  const content = defaultContentForTemplate(vertical_template);
  if (overrides.hero) content.hero = { ...content.hero, ...overrides.hero };
  if (overrides.contact) content.contact = { ...content.contact, ...overrides.contact };
  return {
    id: `site_${organization_id}`,
    organization_id,
    title,
    slug,
    vertical_template,
    is_published: true,
    custom_domain: null,
    seo_metadata: { meta_title: title, meta_description: content.hero.subheadline },
    content_payload: content,
    created_at: daysAgo(120),
    updated_at: daysAgo(2),
  };
};

export const mockSites: TenantSite[] = [
  buildSite("org_brasa", "Brasa & Carbón · Carta", "brasa-carbon", "restaurant_menu", {
    hero: { headline: "Brasa & Carbón", subheadline: "Cocina de brasa, producto de temporada y reservas online.", badge: "Reserva online disponible", cta_text: "Reservar Mesa" },
    contact: { address: "Calle del Horno 12, Madrid", phone: "+34 612 000 000", whatsapp: "+34 612 000 000", google_maps_url: "https://maps.google.com/?q=Brasa+y+Carbon+Madrid" },
  }),
  buildSite("org_baremo", "Baremo Estudio · Servicios", "baremo-estudio", "service_catalog", {
    hero: { headline: "Baremo Estudio", subheadline: "Asesoría legal cercana y transparente. Presupuestos claros.", badge: "Valoración gratuita", cta_text: "Pedir Presupuesto" },
    contact: { address: "Avenida de los Servicios 45, Madrid", phone: "+34 610 111 222", whatsapp: "+34 610 111 222", google_maps_url: "" },
  }),
  buildSite("org_mamare", "MamaRed · Clínica dental", "mamared-dental", "service_catalog", {
    hero: { headline: "MamaRed", subheadline: "Tu clínica dental de confianza. Sonríe sin miedo.", badge: "Cita online", cta_text: "Pedir Cita" },
  }),
  buildSite("org_kluster", "Klüster · Gimnasio boutique", "kluster-gym", "lead_funnel", {
    hero: { headline: "Klüster", subheadline: "Entrena en grupo reducido. Primera semana gratis.", badge: "Plazas limitadas", cta_text: "Probar Clase" },
  }),
  buildSite("org_tenzo", "Tenzo · Sushi bar", "tenzo-sushi", "restaurant_menu", {
    hero: { headline: "Tenzo Sushi", subheadline: "Omakase y roll de autor. Reserva tu contador.", badge: "Reserva online disponible", cta_text: "Reservar Mesa" },
  }),
  buildSite("org_demo", "Demo Agency · ZimplifAI", "demo-agency", "lead_funnel", {
    hero: { headline: "ZimplifAI", subheadline: "Agencia de implantación de IA para tu negocio.", badge: "Demo en vivo", cta_text: "Solicitar Contacto" },
  }),
];

/* ------------------------- Snapshots ------------------------- */

export const mockSnapshots: VerticalSnapshot[] = [
  {
    id: "snap_hosteleria",
    organization_id: "org_demo",
    name: "Snapshot Hostelería / Reservas WhatsApp",
    vertical_type: "restaurant_booking",
    default_pipeline_stages: ["Nuevo", "Contactado por IA", "Cualificado", "Reservado", "Cerrado ganado", "Cerrado perdido"],
    default_ai_prompt:
      "Eres el asistente de reservas de un restaurante. Hablas en español, con tono cercano y eficiente. Objetivos: confirmar mesa, nº de comensales, fecha y hora, y pedir email/teléfono. Si el usuario quiere algo fuera de horario, ofrécele alternativas. Nunca inventes disponibilidad.",
    enabled_modules: ["whatsapp_bot", "booking_calendar", "light_web_menu"],
    version: "2.1.0",
    changelog: "v2.1: Añadido módulo light_web_menu. v2.0: Pipeline stages actualizados. v1.0: Versión inicial.",
    is_published: true,
    parent_snapshot_id: null,
    marketplace_category: "restaurant",
    marketplace_tags: ["restaurant", "booking", "whatsapp", "menu"],
    marketplace_price_monthly: 0,
    marketplace_rating: 4.8,
    marketplace_installs: 142,
    created_at: daysAgo(30),
  },
  {
    id: "snap_servicios",
    organization_id: "org_demo",
    name: "Snapshot Servicios Captación Leads",
    vertical_type: "service_lead_gen",
    default_pipeline_stages: ["Nuevo", "Contactado por IA", "Cualificado", "Propuesta enviada", "Cerrado ganado", "Cerrado perdido"],
    default_ai_prompt:
      "Eres el cualificador comercial de una agencia de servicios. En español. Objetivo: entender la necesidad, presupuesto aproximado y urgencia; clasifica el lead como A (listo), B (requiere seguimiento) o C (frío). Pide nombre y teléfono. Deriva a humano si lo pide.",
    enabled_modules: ["whatsapp_bot", "sales_kanban", "ai_logs"],
    version: "1.5.0",
    changelog: "v1.5: Optimización de prompts. v1.0: Versión inicial.",
    is_published: true,
    parent_snapshot_id: null,
    marketplace_category: "services",
    marketplace_tags: ["services", "lead-gen", "whatsapp", "kanban"],
    marketplace_price_monthly: 0,
    marketplace_rating: 4.6,
    marketplace_installs: 89,
    created_at: daysAgo(30),
  },
  {
    id: "snap_agencia",
    organization_id: "org_demo",
    name: "Snapshot Agencia a medida",
    vertical_type: "custom_agency",
    default_pipeline_stages: ["Nuevo", "Contactado por IA", "Cualificado", "Cerrado ganado", "Cerrado perdido"],
    default_ai_prompt:
      "Eres el asistente de una agencia a medida. En español. Detecta el sector del cliente, prioridad y entregables. Recoge email y teléfono para que un consultor dé continuidad.",
    enabled_modules: ["whatsapp_bot", "sales_kanban", "ai_logs"],
    version: "1.0.0",
    changelog: "v1.0: Versión inicial.",
    is_published: false,
    parent_snapshot_id: null,
    marketplace_category: "agency",
    marketplace_tags: ["agency", "custom", "whatsapp", "kanban"],
    marketplace_price_monthly: 99,
    marketplace_rating: null,
    marketplace_installs: 0,
    created_at: daysAgo(30),
  },
  {
    id: "snap_ecommerce",
    organization_id: "org_demo",
    name: "Snapshot E-commerce Automatizado",
    vertical_type: "service_lead_gen",
    default_pipeline_stages: ["Nuevo", "Contactado por IA", "Cualificado", "Cerrado ganado", "Cerrado perdido"],
    default_ai_prompt:
      "Eres el asistente de una tienda online. Recupera carritos abandonados, sugiere productos y gestiona devoluciones por WhatsApp.",
    enabled_modules: ["whatsapp_bot", "sales_kanban", "ai_logs", "workflow_automation"],
    version: "1.2.0",
    changelog: "v1.2: Añadido workflow_automation. v1.0: Versión inicial.",
    is_published: true,
    parent_snapshot_id: "snap_servicios",
    marketplace_category: "ecommerce",
    marketplace_tags: ["ecommerce", "cart-recovery", "whatsapp", "automation"],
    marketplace_price_monthly: 49,
    marketplace_rating: 4.7,
    marketplace_installs: 234,
    created_at: daysAgo(15),
  },
  {
    id: "snap_healthcare",
    organization_id: "org_demo",
    name: "Snapshot Clínica / Citas Médicas",
    vertical_type: "service_lead_gen",
    default_pipeline_stages: ["Nuevo", "Contactado por IA", "Cualificado", "Cita agendada", "Cerrado ganado", "Cerrado perdido"],
    default_ai_prompt:
      "Eres el asistente de una clínica médica. Gestiona citas, derivaciones y recordatorios por WhatsApp con tono profesional y empático.",
    enabled_modules: ["whatsapp_bot", "booking_calendar", "ai_logs", "unified_inbox"],
    version: "1.0.0",
    changelog: "v1.0: Versión inicial.",
    is_published: true,
    parent_snapshot_id: null,
    marketplace_category: "healthcare",
    marketplace_tags: ["healthcare", "appointments", "whatsapp", "calendar"],
    marketplace_price_monthly: 79,
    marketplace_rating: 4.9,
    marketplace_installs: 67,
    created_at: daysAgo(5),
  },
];

/* ------------------------- Módulos por subcuenta (feature flags) ------------------------- */

const mod = (
  organization_id: string,
  module_key: ModuleKey,
  is_enabled: boolean,
  settings: Record<string, unknown> = {}
): OrganizationModule => ({
  id: `mod_${organization_id}_${module_key}`,
  organization_id,
  module_key,
  is_enabled,
  settings,
  created_at: daysAgo(120),
});

export const mockModules: OrganizationModule[] = [
  mod("org_brasa", "whatsapp_bot", true, {
    phone: "+34 612 000 000",
    whatsapp_token: "wpa_brasa_demo",
    ai_prompt: "Asistente de reservas de Brasa & Carbón. En español, tono cercano.",
    language: "es",
  }),
  mod("org_brasa", "booking_calendar", true, {
    open_hours: "12:00–16:00, 20:00–23:30",
    max_capacity: 40,
    confirmation_sms: true,
  }),
  mod("org_brasa", "light_web_menu", true, {
    site_url: "https://reservas.brasacarbon.com",
    has_menu: true,
    cta_phone: "+34 612 000 000",
  }),
  mod("org_brasa", "sales_kanban", false, { deal_currency: "EUR", default_pipeline: [] }),
  mod("org_brasa", "sales_crm", true, { currencies: ["EUR"], default_view: "kanban" }),
  mod("org_brasa", "ai_logs", true, { retention_days: 90, stream_enabled: true }),
  mod("org_brasa", "roi_dashboard", true, {
    monthly_software_cost: 290,
    sla_alert_minutes: 5,
    sla_auto_rescue_minutes: 10,
    show_simulator: true,
  }),
  mod("org_brasa", "reservation_bot", true, {
    channel: "telegram",
    telegram_token: "",
    whatsapp_phone: "",
    status: "disconnected",
    bot_username: "",
    last_error: "",
  }),

  mod("org_baremo", "whatsapp_bot", true, {
    phone: "+34 610 111 222",
    whatsapp_token: "wpa_baremo_demo",
    ai_prompt: "Cualificador legal para Baremo Estudio. En español.",
    language: "es",
  }),
  mod("org_baremo", "sales_kanban", true, { deal_currency: "EUR", default_pipeline: [] }),
  mod("org_baremo", "sales_crm", true, { currencies: ["EUR"], default_view: "kanban" }),
  mod("org_baremo", "ai_logs", true, { retention_days: 90, stream_enabled: true }),
  mod("org_baremo", "booking_calendar", false, { open_hours: "09:00–18:00", max_capacity: 8, confirmation_sms: false }),
  mod("org_baremo", "light_web_menu", false, { site_url: "", has_menu: false, cta_phone: "" }),
  mod("org_baremo", "roi_dashboard", true, {
    monthly_software_cost: 290,
    sla_alert_minutes: 5,
    sla_auto_rescue_minutes: 10,
    show_simulator: true,
  }),

  mod("org_mamare", "whatsapp_bot", true, {
    phone: "+34 620 222 333",
    whatsapp_token: "wpa_mamare_demo",
    ai_prompt: "Cualificador de citas dentales para MamaRed. En español.",
    language: "es",
  }),
  mod("org_mamare", "sales_kanban", true, { deal_currency: "EUR", default_pipeline: [] }),
  mod("org_mamare", "ai_logs", false, { retention_days: 30, stream_enabled: false }),
  mod("org_mamare", "booking_calendar", false, { open_hours: "09:00–20:00", max_capacity: 12, confirmation_sms: true }),
  mod("org_mamare", "light_web_menu", false, { site_url: "https://citas.mamared.es", has_menu: false, cta_phone: "" }),

  mod("org_kluster", "whatsapp_bot", true, {
    phone: "+34 630 333 444",
    whatsapp_token: "wpa_kluster_demo",
    ai_prompt: "Captación de clientes de gimnasio para Klüster. En español.",
    language: "es",
  }),
  mod("org_kluster", "sales_kanban", true, { deal_currency: "EUR", default_pipeline: [] }),
  mod("org_kluster", "ai_logs", true, { retention_days: 90, stream_enabled: true }),
  mod("org_kluster", "booking_calendar", false, { open_hours: "07:00–22:00", max_capacity: 20, confirmation_sms: false }),
  mod("org_kluster", "light_web_menu", false, { site_url: "", has_menu: false, cta_phone: "" }),

  mod("org_tenzo", "booking_calendar", true, { open_hours: "13:00–16:30, 20:00–00:00", max_capacity: 60, confirmation_sms: true }),
  mod("org_tenzo", "whatsapp_bot", false, { phone: "", whatsapp_token: "", ai_prompt: "", language: "es" }),
  mod("org_tenzo", "light_web_menu", false, { site_url: "", has_menu: false, cta_phone: "" }),
  mod("org_tenzo", "sales_kanban", false, { deal_currency: "EUR", default_pipeline: [] }),
  mod("org_tenzo", "ai_logs", false, { retention_days: 30, stream_enabled: false }),

  mod("org_demo", "whatsapp_bot", true, {
    phone: "+34 600 000 001",
    whatsapp_token: "wpa_zimplifai_demo",
    ai_prompt: "Asistente demo de ZimplifAI. En español.",
    language: "es",
  }),
  mod("org_demo", "sales_kanban", true, { deal_currency: "EUR", default_pipeline: [] }),
  mod("org_demo", "ai_logs", true, { retention_days: 90, stream_enabled: true }),
  mod("org_demo", "booking_calendar", false, { open_hours: "09:00–18:00", max_capacity: 10, confirmation_sms: false }),
  mod("org_demo", "light_web_menu", false, { site_url: "", has_menu: false, cta_phone: "" }),
  mod("org_demo", "reservation_bot", true, {
    channel: "telegram",
    status: "disconnected",
    bot_username: "",
    telegram_token: "",
    whatsapp_phone: "",
    last_error: "",
  }),

  // --- Fase A: workflow_automation habilitado en los tenants activos ---
  mod("org_brasa", "workflow_automation", true, { max_active_workflows: 10, execution_budget_tokens: 50000 }),
  mod("org_baremo", "workflow_automation", true, { max_active_workflows: 10, execution_budget_tokens: 50000 }),
  mod("org_kluster", "workflow_automation", true, { max_active_workflows: 10, execution_budget_tokens: 50000 }),
  mod("org_mamare", "workflow_automation", true, { max_active_workflows: 5, execution_budget_tokens: 20000 }),
  mod("org_demo", "workflow_automation", true, { max_active_workflows: 10, execution_budget_tokens: 50000 }),

  // --- Fase B: unified_inbox habilitado en los tenants con canales conectados ---
  mod("org_brasa", "unified_inbox", true, { whatsapp_linked: true, email_linked: true, instagram_linked: true }),
  mod("org_baremo", "unified_inbox", true, { whatsapp_linked: true, email_linked: false, instagram_linked: false }),
  mod("org_kluster", "unified_inbox", true, { whatsapp_linked: true, email_linked: false, instagram_linked: true }),
  mod("org_mamare", "unified_inbox", false, { whatsapp_linked: false, email_linked: false, instagram_linked: false }),
  mod("org_tenzo", "unified_inbox", false, { whatsapp_linked: false, email_linked: false, instagram_linked: false }),
  mod("org_demo", "unified_inbox", true, { whatsapp_linked: true, email_linked: true, instagram_linked: true }),

  // --- Fase H: ai_copilot (chat IA + scoring + costes) habilitado en tenants activos ---
  mod("org_brasa", "ai_copilot", true, { enabled_suggestions: true, scoring_model: "claude-sonnet-5" }),
  mod("org_baremo", "ai_copilot", true, { enabled_suggestions: true, scoring_model: "claude-sonnet-5" }),
  mod("org_kluster", "ai_copilot", true, { enabled_suggestions: true, scoring_model: "claude-sonnet-5" }),
  mod("org_mamare", "ai_copilot", false, { enabled_suggestions: false, scoring_model: "claude-sonnet-5" }),
  mod("org_demo", "ai_copilot", true, { enabled_suggestions: true, scoring_model: "claude-sonnet-5" }),

  // --- Fase E2: finance_suite (presupuestos, facturas y cobros) en tenants activos ---
  mod("org_brasa", "finance_suite", true, { invoice_series: "FC", tax_rate: 21 }),
  mod("org_baremo", "finance_suite", true, { invoice_series: "FC", tax_rate: 21 }),
  mod("org_kluster", "finance_suite", false, { invoice_series: "FC", tax_rate: 21 }),
  mod("org_mamare", "finance_suite", true, { invoice_series: "FC", tax_rate: 21 }),
  mod("org_demo", "finance_suite", true, { invoice_series: "FC", tax_rate: 21 }),

  // --- Fase F: reputation_mgmt (reseñas Google/WhatsApp/web) en tenants activos ---
  mod("org_brasa", "reputation_mgmt", true, { google_connected: true, auto_reply: true }),
  mod("org_baremo", "reputation_mgmt", true, { google_connected: true, auto_reply: true }),
  mod("org_kluster", "reputation_mgmt", false, { google_connected: false, auto_reply: false }),
  mod("org_mamare", "reputation_mgmt", false, { google_connected: false, auto_reply: false }),
  mod("org_demo", "reputation_mgmt", true, { google_connected: true, auto_reply: true }),
];

/** API keys planas demo para poder copiar el webhook completo en el directorio de agencia. */
export const MOCK_API_KEYS: Record<string, string> = {
  org_brasa: "zx_demo_brasa_7f9k2",
  org_baremo: "zx_demo_baremo_3h8j1",
  org_mamare: "zx_demo_mamare_9c4v6",
  org_kluster: "zx_demo_kluster_2n5m8",
  org_tenzo: "zx_demo_tenzo_5q7w3",
  org_demo: "zx_demo_zimplifai_1a2b3",
};

/* ------------------------- Perfiles ------------------------- */

export const mockProfiles: Profile[] = [
  { id: "prof_zuzo", organization_id: null, role: "super_admin", full_name: "Zuzo · CEO ZimplifAI", avatar_url: null, created_at: daysAgo(400) },
  { id: "prof_admin", organization_id: "org_brasa", role: "client_admin", full_name: "Luis Carballo", avatar_url: null, created_at: daysAgo(120) },
  { id: "prof_member", organization_id: "org_brasa", role: "client_member", full_name: "Ana Roca", avatar_url: null, created_at: daysAgo(90) },
];

/* ------------------------- Leads (tenant activo) ------------------------- */

export const mockLeads: Lead[] = [
  {
    id: "lead_laura", organization_id: "org_brasa", first_name: "Laura", last_name: "García",
    email: "laura@example.com", phone: "+34 612 000 001", status: "new", deal_value: 0,
    tags: ["WhatsApp", "Ig"], assigned_to: "prof_member", next_follow_up_at: hoursFromNow(6),
    company_id: null, pipeline_id: "pl_ventas",
    utm_source: "instagram", utm_medium: "social", utm_campaign: "verano_2026",
    utm_term: null, utm_content: "story_terraza", landing_page: "https://brasa-carbon.es/f/contacta", referrer: "instagram.com",
    created_at: hoursAgo(2), updated_at: hoursAgo(2),
  },
  {
    id: "lead_alex", organization_id: "org_brasa", first_name: "Álex", last_name: "Rubio",
    email: "alex@example.com", phone: "+34 612 000 008", status: "new", deal_value: 0,
    tags: ["Ig"], assigned_to: null, next_follow_up_at: hoursFromNow(26),
    company_id: null, pipeline_id: "pl_ventas",
    utm_source: "google", utm_medium: "cpc", utm_campaign: "seo_brasa",
    utm_term: "restaurante terraza madrid", utm_content: "ad_terraza", landing_page: "https://brasa-carbon.es/f/contacta", referrer: "google.com",
    created_at: hoursAgo(1), updated_at: hoursAgo(1),
  },
  {
    id: "lead_marc", organization_id: "org_brasa", first_name: "Marc", last_name: "Vidal",
    email: "marc@example.com", phone: "+34 612 000 002", status: "ai_contacted", deal_value: 0,
    tags: ["AI-Qualified", "WhatsApp"], assigned_to: "prof_member", next_follow_up_at: hoursFromNow(4),
    company_id: null, pipeline_id: "pl_ventas",
    utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null, landing_page: null, referrer: null,
    created_at: hoursAgo(5), updated_at: hoursAgo(3),
  },
  {
    id: "lead_sofia", organization_id: "org_brasa", first_name: "Sofía", last_name: "Martínez",
    email: "sofia@example.com", phone: "+34 612 000 003", status: "ai_contacted", deal_value: 40,
    tags: ["AI-Qualified"], assigned_to: "prof_admin", next_follow_up_at: hoursFromNow(2),
    company_id: null, pipeline_id: "pl_ventas",
    utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null, landing_page: null, referrer: null,
    created_at: daysAgo(1), updated_at: hoursAgo(6),
  },
  {
    id: "lead_jorge", organization_id: "org_brasa", first_name: "Jorge", last_name: "Navarro",
    email: "jorge@example.com", phone: "+34 612 000 004", status: "qualified", deal_value: 120,
    tags: ["Mesa-vip", "Aniversario"], assigned_to: "prof_admin", next_follow_up_at: daysFromNow(2),
    company_id: "comp_bodas_r", pipeline_id: "pl_eventos",
    utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null, landing_page: null, referrer: null,
    created_at: daysAgo(2), updated_at: daysAgo(1),
  },
  {
    id: "lead_elena", organization_id: "org_brasa", first_name: "Elena", last_name: "Rojas",
    email: "elena@example.com", phone: "+34 612 000 005", status: "booked", deal_value: 250,
    tags: ["Evento", "10-pax"], assigned_to: "prof_member", next_follow_up_at: daysFromNow(3),
    company_id: "comp_bodas_r", pipeline_id: "pl_eventos",
    utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null, landing_page: null, referrer: null,
    created_at: daysAgo(3), updated_at: daysAgo(1),
  },
  {
    id: "lead_ivan", organization_id: "org_brasa", first_name: "Iván", last_name: "Soler",
    email: "ivan@example.com", phone: "+34 612 000 006", status: "closed_won", deal_value: 800,
    tags: ["Catering", "Recurrente"], assigned_to: "prof_admin", next_follow_up_at: null,
    company_id: "comp_catering", pipeline_id: "pl_ventas",
    utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null, landing_page: null, referrer: null,
    created_at: daysAgo(6), updated_at: daysAgo(4),
  },
  {
    id: "lead_paula", organization_id: "org_brasa", first_name: "Paula", last_name: "Díaz",
    email: "paula@example.com", phone: "+34 612 000 007", status: "closed_lost", deal_value: 0,
    tags: ["No-por-precio"], assigned_to: null, next_follow_up_at: null,
    company_id: null, pipeline_id: "pl_ventas",
    utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null, landing_page: null, referrer: null,
    created_at: daysAgo(8), updated_at: daysAgo(7),
  },
  {
    id: "lead_nerea", organization_id: "org_brasa", first_name: "Nerea", last_name: "Costa",
    email: "nerea@example.com", phone: "+34 612 000 009", status: "new", deal_value: 0,
    tags: ["WhatsApp"], assigned_to: null, next_follow_up_at: hoursFromNow(8),
    company_id: null, pipeline_id: "pl_ventas",
    utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null, landing_page: null, referrer: null,
    created_at: hoursAgo(0.5), updated_at: hoursAgo(0.5),
  },
  {
    id: "lead_beatriz", organization_id: "org_baremo", first_name: "Beatriz", last_name: "Herrera",
    email: "beatriz@constructora.com", phone: "+34 611 000 101", status: "ai_contacted", deal_value: 4500,
    tags: ["Legal", "Obra"], assigned_to: null, next_follow_up_at: hoursFromNow(4),
    company_id: "comp_constructora", pipeline_id: "pl_legal",
    utm_source: "linkedin", utm_medium: "paid_social", utm_campaign: "legal_obra",
    utm_term: null, utm_content: "banner_legal", landing_page: "https://baremo-estudio.es/f/solicita", referrer: "linkedin.com",
    created_at: hoursAgo(5), updated_at: hoursAgo(1),
  },
  {
    id: "lead_david", organization_id: "org_baremo", first_name: "David", last_name: "Serrano",
    email: "david@example.com", phone: "+34 611 000 102", status: "new", deal_value: 0,
    tags: ["WhatsApp"], assigned_to: null, next_follow_up_at: hoursFromNow(26),
    company_id: null, pipeline_id: "pl_legal",
    utm_source: null, utm_medium: null, utm_campaign: null, utm_term: null, utm_content: null, landing_page: null, referrer: null,
    created_at: hoursAgo(3), updated_at: hoursAgo(3),
  },
];

/* ------------------------- Empresas (Fase E1) ------------------------- */

const dayKey = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

export const mockCompanies: Company[] = [
  {
    id: "comp_bodas_r", organization_id: "org_brasa", name: "Bodas & Receptions",
    website: "bodasreceptions.com", industry: "Eventos", phone: "+34 613 000 010",
    city: "Madrid", notes: "Organizan banquetes mensuales. Cliente recurrente en salón privado.",
    created_at: daysAgo(60), updated_at: daysAgo(5),
  },
  {
    id: "comp_catering", organization_id: "org_brasa", name: "Catering Deluxe",
    website: "cateringdeluxe.es", industry: "Catering", phone: "+34 613 000 011",
    city: "Barcelona", notes: "Pedidos grandes para oficinas. Negociar menú Q3.",
    created_at: daysAgo(90), updated_at: daysAgo(12),
  },
  {
    id: "comp_techcorp", organization_id: "org_brasa", name: "TechCorp Events",
    website: "techcorp.io", industry: "Tecnología", phone: "+34 613 000 012",
    city: "Barcelona", notes: "Afterworks trimestrales de 30-40 pax.",
    created_at: daysAgo(20), updated_at: daysAgo(20),
  },
  {
    id: "comp_constructora", organization_id: "org_baremo", name: "Constructora Levante",
    website: "constructoralevante.com", industry: "Construcción", phone: "+34 613 000 020",
    city: "Valencia", notes: "Litigio laboral de 3 trabajadores. Seguimiento semanal.",
    created_at: daysAgo(45), updated_at: daysAgo(2),
  },
];

/* ------------------------- Pipelines + etapas (Fase E1) ------------------------- */

export const mockPipelines: Pipeline[] = [
  { id: "pl_ventas", organization_id: "org_brasa", name: "Ventas", description: "Pipeline canónico del negocio", is_default: true, is_active: true, created_at: daysAgo(120), updated_at: daysAgo(10) },
  { id: "pl_eventos", organization_id: "org_brasa", name: "Eventos", description: "Banquetes, catering y celebraciones", is_default: false, is_active: true, created_at: daysAgo(40), updated_at: daysAgo(8) },
  { id: "pl_legal", organization_id: "org_baremo", name: "Cualificación legal", description: "Entrada de casos y contratación", is_default: true, is_active: true, created_at: daysAgo(120), updated_at: daysAgo(10) },
];

const stage = (
  pipelineId: string,
  name: string,
  status: string,
  position: number,
  color: string | null,
  orgId: string
): PipelineStage => ({
  id: `stg_${pipelineId}_${position}`,
  organization_id: orgId,
  pipeline_id: pipelineId,
  name,
  status: status as PipelineStage["status"],
  position,
  color,
  created_at: daysAgo(120),
  updated_at: daysAgo(10),
});

export const mockPipelineStages: PipelineStage[] = [
  stage("pl_ventas", "Nuevo", "new", 0, null, "org_brasa"),
  stage("pl_ventas", "Contactado por IA", "ai_contacted", 1, null, "org_brasa"),
  stage("pl_ventas", "Cualificado", "qualified", 2, null, "org_brasa"),
  stage("pl_ventas", "Reservado", "booked", 3, "#CEFF00", "org_brasa"),
  stage("pl_ventas", "Cerrado ganado", "closed_won", 4, null, "org_brasa"),
  stage("pl_ventas", "Cerrado perdido", "closed_lost", 5, null, "org_brasa"),

  stage("pl_eventos", "Solicitud", "new", 0, null, "org_brasa"),
  stage("pl_eventos", "Presupuesto enviado", "qualified", 1, null, "org_brasa"),
  stage("pl_eventos", "Reservado", "booked", 2, "#CEFF00", "org_brasa"),
  stage("pl_eventos", "Ganado", "closed_won", 3, null, "org_brasa"),
  stage("pl_eventos", "Descartado", "closed_lost", 4, null, "org_brasa"),

  stage("pl_legal", "Entrada", "new", 0, null, "org_baremo"),
  stage("pl_legal", "Contactado", "ai_contacted", 1, null, "org_baremo"),
  stage("pl_legal", "Cualificado", "qualified", 2, null, "org_baremo"),
  stage("pl_legal", "Contratado", "closed_won", 3, "#CEFF00", "org_baremo"),
  stage("pl_legal", "Descartado", "closed_lost", 4, null, "org_baremo"),
];

/* ------------------------- Tareas (Fase E1 · widget Mi Día) ------------------------- */

export const mockTasks: Task[] = [
  {
    id: "task_1", organization_id: "org_brasa", title: "Llamar a Laura para confirmar la terraza",
    description: "Le prometimos mesa en la terraza el sábado.", status: "todo", priority: "high",
    due_date: dayKey(0), lead_id: "lead_laura", company_id: null, assigned_to: "prof_member",
    created_at: hoursAgo(20), updated_at: hoursAgo(20),
  },
  {
    id: "task_2", organization_id: "org_brasa", title: "Preparar presupuesto evento 10 pax (Elena)",
    description: "Salón privado + menú degustación. Enviar hoy antes de las 18h.",
    status: "in_progress", priority: "medium",
    due_date: dayKey(0), lead_id: "lead_elena", company_id: "comp_bodas_r", assigned_to: "prof_admin",
    created_at: daysAgo(1), updated_at: hoursAgo(3),
  },
  {
    id: "task_3", organization_id: "org_brasa", title: "Revisar propuesta recurrente con Bodas & Receptions",
    description: "Quieren reservar el salón un sábado al mes.", status: "todo", priority: "medium",
    due_date: dayKey(1), lead_id: null, company_id: "comp_bodas_r", assigned_to: "prof_admin",
    created_at: daysAgo(2), updated_at: daysAgo(2),
  },
  {
    id: "task_4", organization_id: "org_brasa", title: "Enviar confirmación de catering a Iván",
    description: "Menú ejecutivo para oficina, 25 pax.", status: "done", priority: "low",
    due_date: dayKey(0), lead_id: "lead_ivan", company_id: "comp_catering", assigned_to: "prof_member",
    created_at: daysAgo(2), updated_at: hoursAgo(5),
  },
  {
    id: "task_5", organization_id: "org_brasa", title: "Diseñar menú degustación Q3",
    description: "3 platos nuevos para probar en la próxima cata.", status: "todo", priority: "low",
    due_date: dayKey(3), lead_id: null, company_id: null, assigned_to: null,
    created_at: daysAgo(5), updated_at: daysAgo(5),
  },
];

/* ------------------------- Actividad por lead (timeline) ------------------------- */

export const mockActivity: LeadActivity[] = [
  {
    id: "act_1", organization_id: "org_brasa", lead_id: "lead_marc",
    actor_id: null, actor_name: "Sistema", event_type: "lead_created",
    summary: "Lead creado", metadata: { source: "Instagram" }, created_at: hoursAgo(5),
  },
  {
    id: "act_2", organization_id: "org_brasa", lead_id: "lead_marc",
    actor_id: null, actor_name: "WhatsApp Qualifier Bot", event_type: "stage_changed",
    summary: "Movido de «Nuevo» a «Contactado por IA»",
    metadata: { from: "new", to: "ai_contacted" }, created_at: hoursAgo(3),
  },
  {
    id: "act_3", organization_id: "org_brasa", lead_id: "lead_marc",
    actor_id: "prof_admin", actor_name: "Luis Carballo", event_type: "comment",
    summary: "Pide mesa en la terraza si es posible. Llamar antes de las 14h.",
    metadata: {}, created_at: hoursAgo(2),
  },
  {
    id: "act_4", organization_id: "org_brasa", lead_id: "lead_marc",
    actor_id: null, actor_name: "WhatsApp Qualifier Bot", event_type: "whatsapp_reply",
    summary: "El bot respondió al cliente por WhatsApp", metadata: { intent: "booking_request" }, created_at: hoursAgo(0.6),
  },
  {
    id: "act_5", organization_id: "org_brasa", lead_id: "lead_sofia",
    actor_id: null, actor_name: "Sistema", event_type: "lead_created",
    summary: "Lead creado", metadata: { source: "Instagram" }, created_at: daysAgo(1),
  },
  {
    id: "act_6", organization_id: "org_brasa", lead_id: "lead_sofia",
    actor_id: null, actor_name: "Lead Scorer (n8n → CRM)", event_type: "stage_changed",
    summary: "Movido de «Nuevo» a «Contactado por IA»",
    metadata: { from: "new", to: "ai_contacted" }, created_at: hoursAgo(6),
  },
  {
    id: "act_7", organization_id: "org_brasa", lead_id: "lead_jorge",
    actor_id: null, actor_name: "Sistema", event_type: "lead_created",
    summary: "Lead creado", metadata: { source: "WhatsApp" }, created_at: daysAgo(2),
  },
  {
    id: "act_8", organization_id: "org_brasa", lead_id: "lead_jorge",
    actor_id: "prof_admin", actor_name: "Luis Carballo", event_type: "stage_changed",
    summary: "Movido de «Nuevo» a «Cualificado»",
    metadata: { from: "new", to: "qualified" }, created_at: daysAgo(1),
  },
  {
    id: "act_9", organization_id: "org_brasa", lead_id: "lead_jorge",
    actor_id: "prof_member", actor_name: "Ana Roca", event_type: "comment",
    summary: "Es aniversario de boda: preparar mesa de la esquina y brindis de cortesía.",
    metadata: {}, created_at: daysAgo(1),
  },
  {
    id: "act_10", organization_id: "org_brasa", lead_id: "lead_laura",
    actor_id: null, actor_name: "Sistema", event_type: "lead_created",
    summary: "Lead creado", metadata: { source: "WhatsApp" }, created_at: hoursAgo(2),
  },
  {
    id: "act_11", organization_id: "org_brasa", lead_id: "lead_elena",
    actor_id: null, actor_name: "Sistema", event_type: "lead_created",
    summary: "Lead creado", metadata: { source: "WhatsApp" }, created_at: daysAgo(3),
  },
  {
    id: "act_12", organization_id: "org_brasa", lead_id: "lead_elena",
    actor_id: null, actor_name: "WhatsApp Qualifier Bot", event_type: "booking_confirmed",
    summary: "Reserva confirmada: 10 pax · Salón privado", metadata: { party_size: 10 }, created_at: daysAgo(1),
  },
];

/* ------------------------- Bookings ------------------------- */

const bk = (b: Omit<Booking, "calendar_id" | "token" | "source"> & { calendar_id?: string | null; source?: string }): Booking => ({
  calendar_id: b.calendar_id ?? "cal_mesa",
  token: `bk_${b.id}`,
  source: b.source ?? "manual",
  ...b,
});

export const mockBookings: Booking[] = [
  bk({
    id: "bk_1", organization_id: "org_brasa", lead_id: "lead_jorge", calendar_id: "cal_terraza",
    booking_date: new Date(Date.now() + 86_400_000 + 13 * 3600_000).toISOString(),
    party_size_or_service: "4 personas · Terraza", status: "confirmed",
    notes: "Confirmado por bot de WhatsApp", created_at: daysAgo(1), updated_at: daysAgo(1), source: "whatsapp",
  }),
  bk({
    id: "bk_2", organization_id: "org_brasa", lead_id: "lead_elena", calendar_id: "cal_salon",
    booking_date: new Date(Date.now() + 2 * 86_400_000 + 15 * 3600_000).toISOString(),
    party_size_or_service: "Evento · 10 pax · Salón privado", status: "pending",
    notes: "Esperando confirmación de precio", created_at: daysAgo(2), updated_at: hoursAgo(8),
  }),
  bk({
    id: "bk_3", organization_id: "org_brasa", lead_id: null,
    booking_date: new Date(Date.now() + 3 * 3600_000).toISOString(),
    party_size_or_service: "2 personas", status: "confirmed",
    notes: "Reserva directa por web", created_at: hoursAgo(5), updated_at: hoursAgo(5), source: "public",
  }),
  bk({
    id: "bk_4", organization_id: "org_brasa", lead_id: "lead_marc",
    booking_date: new Date(Date.now() - 86_400_000 + 20 * 3600_000).toISOString(),
    party_size_or_service: "6 personas", status: "completed",
    notes: "Cumpleaños", created_at: daysAgo(2), updated_at: daysAgo(1), source: "whatsapp",
  }),
  bk({
    id: "bk_5", organization_id: "org_brasa", lead_id: null,
    booking_date: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    party_size_or_service: "3 personas", status: "cancelled",
    notes: "Cliente canceló por WhatsApp", created_at: daysAgo(4), updated_at: daysAgo(3),
  }),
];

/* ------------------------- Calendarios de citas (Fase C) ------------------------- */

export const mockCalendars: Calendar[] = [
  {
    id: "cal_mesa", organization_id: "org_brasa", name: "Mesa interior",
    description: "Comedor principal. Terraza cubierta según disponibilidad.",
    service_duration_min: 90, color: "#CEFF00", is_active: true,
    settings: { slot_minutes: 30, price_eur: 18 }, created_at: daysAgo(100), updated_at: daysAgo(5),
  },
  {
    id: "cal_terraza", organization_id: "org_brasa", name: "Terraza",
    description: "Terraza al aire libre, 4 mesas altas.",
    service_duration_min: 90, color: "#6AB7FF", is_active: true,
    settings: { slot_minutes: 30, price_eur: 15 }, created_at: daysAgo(90), updated_at: daysAgo(5),
  },
  {
    id: "cal_salon", organization_id: "org_brasa", name: "Salón privado",
    description: "Eventos y grupos. Capacidad hasta 14.",
    service_duration_min: 120, color: "#C084FC", is_active: true,
    settings: { slot_minutes: 60, price_eur: 250 }, created_at: daysAgo(80), updated_at: daysAgo(5),
  },
  {
    id: "cal_consulta", organization_id: "org_baremo", name: "Consulta legal",
    description: "Primera valoración gratuita.",
    service_duration_min: 30, color: "#6AB7FF", is_active: true,
    settings: { slot_minutes: 30 }, created_at: daysAgo(70), updated_at: daysAgo(5),
  },
];

const rule = (
  calendar_id: string, day_of_week: number, start_time: string, end_time: string,
  capacity = 1, is_active = true
): AvailabilityRule => ({
  id: `rule_${calendar_id}_${day_of_week}_${start_time.replace(":", "")}`,
  organization_id: calendar_id.startsWith("cal_consulta") ? "org_baremo" : "org_brasa",
  calendar_id, day_of_week, start_time, end_time, capacity, is_active,
  created_at: daysAgo(100), updated_at: daysAgo(5),
});

export const mockAvailabilityRules: AvailabilityRule[] = [
  // Brasa · Mesa interior: comida y cena, aforo 8.
  ...([1, 2, 3, 4, 5].map((d) => rule("cal_mesa", d, "12:00", "16:00", 8))),
  ...([1, 2, 3, 4, 5, 6].map((d) => rule("cal_mesa", d, "20:00", "23:30", 8))),
  rule("cal_mesa", 0, "13:00", "16:00", 6), rule("cal_mesa", 0, "20:00", "22:30", 6),
  // Brasa · Terraza: fin de semana sobre todo, aforo 6.
  ...([5, 6].map((d) => rule("cal_terraza", d, "13:00", "16:00", 6))),
  ...([5, 6].map((d) => rule("cal_terraza", d, "20:00", "23:30", 6))),
  // Brasa · Salón privado: solo con reserva previa, 1 grupo por franja.
  ...([1, 2, 3, 4, 5, 6].map((d) => rule("cal_salon", d, "13:00", "15:00", 1))),
  ...([1, 2, 3, 4, 5, 6].map((d) => rule("cal_salon", d, "20:00", "22:00", 1))),
  // Baremo · Consulta legal: mañana y tarde, aforo 4.
  ...([1, 2, 3, 4, 5].map((d) => rule("cal_consulta", d, "09:00", "14:00", 4))),
  ...([1, 2, 3, 4].map((d) => rule("cal_consulta", d, "16:00", "18:30", 4))),
];

/* ------------------------- Bandeja unificada (Fase B) ------------------------- */

type MockMessageInput = {
  thread_id: string;
  channel: Message["channel"];
  sender: Message["sender"];
  sender_name?: string | null;
  direction: Message["direction"];
  body: string;
  status?: Message["status"];
  at: string;
};

const msg = (m: MockMessageInput): Message => ({
  id: `msg_${m.thread_id.replace("thr_", "")}_${m.at.length}`,
  organization_id: "org_brasa",
  thread_id: m.thread_id,
  channel: m.channel,
  sender: m.sender,
  sender_name: m.sender_name ?? null,
  direction: m.direction,
  body: m.body,
  status: m.status ?? (m.direction === "outbound" ? "delivered" : "read"),
  metadata: {},
  created_at: m.at,
});

export const mockMessageTemplates: MessageTemplate[] = [
  {
    id: "tpl_welcome", organization_id: "org_brasa", name: "Bienvenida WhatsApp",
    category: "Bienvenida", channel: "whatsapp",
    body: "¡Hola {{first_name}}! 👋 Gracias por escribir a {{business}}. ¿En qué podemos ayudarte hoy?",
    variables: ["first_name", "business"], created_at: daysAgo(90), updated_at: daysAgo(10),
  },
  {
    id: "tpl_confirm", organization_id: "org_brasa", name: "Confirmación de mesa",
    category: "Reservas", channel: "whatsapp",
    body: "¡Reservado! {{business}} te confirma mesa para {{party_size}} el {{date}} a las {{time}}. ¿Necesitas algo más? 🙌",
    variables: ["business", "party_size", "date", "time"], created_at: daysAgo(80), updated_at: daysAgo(8),
  },
  {
    id: "tpl_hours", organization_id: "org_brasa", name: "Horario",
    category: "Información", channel: "whatsapp",
    body: "Nuestro horario es {{hours}}. ¿Te reservo mesa para una hora concreta?",
    variables: ["hours"], created_at: daysAgo(70), updated_at: daysAgo(8),
  },
  {
    id: "tpl_reminder", organization_id: "org_brasa", name: "Recordatorio de reserva",
    category: "Reservas", channel: "whatsapp",
    body: "Hola {{first_name}}, te recordamos tu reserva para {{party_size}} el {{date}} a las {{time}}. ¿Seguimos en pie?",
    variables: ["first_name", "party_size", "date", "time"], created_at: daysAgo(60), updated_at: daysAgo(6),
  },
  {
    id: "tpl_qualify", organization_id: "org_brasa", name: "Cualificación de lead",
    category: "Ventas", channel: "whatsapp",
    body: "¡Gracias {{first_name}}! Para ayudarte mejor, ¿me cuentas {{need}} y un teléfono de contacto?",
    variables: ["first_name", "need"], created_at: daysAgo(50), updated_at: daysAgo(5),
  },
  {
    id: "tpl_thanks", organization_id: "org_brasa", name: "Agradecimiento post-venta",
    category: "Postventa", channel: "email",
    body: "Hola {{first_name}}, gracias por confiar en {{business}}. ¿Cómo fue tu experiencia? ¡Tu opinión nos ayuda muchísimo!",
    variables: ["first_name", "business"], created_at: daysAgo(40), updated_at: daysAgo(3),
  },
];

export const mockThreads: MessageThread[] = [
  {
    id: "thr_nerea", organization_id: "org_brasa", lead_id: "lead_nerea", channel: "whatsapp",
    external_id: "wa-+34600000009", subject: null,
    last_message_at: minutesAgo(12), last_message_preview: "+34 600 000 009. Gracias!",
    unread_count: 3, status: "open", created_at: hoursAgo(0.5), updated_at: minutesAgo(12),
  },
  {
    id: "thr_marc", organization_id: "org_brasa", lead_id: "lead_marc", channel: "whatsapp",
    external_id: "wa-+34612000002", subject: null,
    last_message_at: minutesAgo(35), last_message_preview: "Perfecto, reserva para 4 el viernes a las 21:00",
    unread_count: 1, status: "open", created_at: hoursAgo(5), updated_at: minutesAgo(35),
  },
  {
    id: "thr_laura", organization_id: "org_brasa", lead_id: "lead_laura", channel: "instagram",
    external_id: "ig-34288122", subject: null,
    last_message_at: hoursAgo(1), last_message_preview: "Genial, ¿y se puede reservar por aquí?",
    unread_count: 2, status: "open", created_at: hoursAgo(2), updated_at: hoursAgo(1),
  },
  {
    id: "thr_jorge", organization_id: "org_brasa", lead_id: "lead_jorge", channel: "whatsapp",
    external_id: "wa-+34612000004", subject: null,
    last_message_at: hoursAgo(20), last_message_preview: "¿Cuánto costaría añadir el menú degustación?",
    unread_count: 1, status: "open", created_at: daysAgo(2), updated_at: hoursAgo(20),
  },
  {
    id: "thr_sofia", organization_id: "org_brasa", lead_id: "lead_sofia", channel: "whatsapp",
    external_id: "wa-+34612000003", subject: null,
    last_message_at: hoursAgo(6), last_message_preview: "¡Perfecto, gracias!",
    unread_count: 0, status: "resolved", created_at: hoursAgo(7), updated_at: hoursAgo(6),
  },
  {
    id: "thr_anon_web", organization_id: "org_brasa", lead_id: null, channel: "web",
    external_id: null, subject: "Consulta desde la web",
    last_message_at: daysAgo(1), last_message_preview: "Hola, quería saber si hacéis eventos de empresa",
    unread_count: 0, status: "open", created_at: daysAgo(1), updated_at: daysAgo(1),
  },
  {
    id: "thr_elena", organization_id: "org_brasa", lead_id: "lead_elena", channel: "email",
    external_id: "email-elena@example.com", subject: "Evento 10 personas · Salón privado",
    last_message_at: daysAgo(2.5), last_message_preview: "Confirmado: salón privado · 10 pax · sábado 15:00",
    unread_count: 0, status: "resolved", created_at: daysAgo(3), updated_at: daysAgo(2.5),
  },
];

export const mockMessages: Message[] = [
  // --- Nerea (activa, 3 no leídos) ---
  msg({ thread_id: "thr_nerea", channel: "whatsapp", sender: "lead", sender_name: "Nerea Costa", direction: "inbound", body: "Hola! Quería reservar mesa para el sábado por la noche 😊", at: minutesAgo(30) }),
  msg({ thread_id: "thr_nerea", channel: "whatsapp", sender: "agent", sender_name: "WhatsApp Qualifier Bot", direction: "outbound", body: "¡Hola Nerea! Para el sábado tenemos mesa a las 21:00 y 21:45. ¿Cuál te encaja?", at: minutesAgo(28) }),
  msg({ thread_id: "thr_nerea", channel: "whatsapp", sender: "lead", sender_name: "Nerea Costa", direction: "inbound", body: "A las 21:00 mejor, somos 4", at: minutesAgo(20) }),
  msg({ thread_id: "thr_nerea", channel: "whatsapp", sender: "agent", sender_name: "WhatsApp Qualifier Bot", direction: "outbound", body: "¿Perfecto, 4 personas a las 21:00! ¿Nos dejas un teléfono de contacto para confirmarte la mesa?", at: minutesAgo(18) }),
  msg({ thread_id: "thr_nerea", channel: "whatsapp", sender: "lead", sender_name: "Nerea Costa", direction: "inbound", body: "+34 600 000 009. Gracias!", at: minutesAgo(12) }),

  // --- Marc ---
  msg({ thread_id: "thr_marc", channel: "whatsapp", sender: "lead", sender_name: "Marc Vidal", direction: "inbound", body: "Hola, ¿tenéis hueco para 4 el viernes?", at: hoursAgo(4) }),
  msg({ thread_id: "thr_marc", channel: "whatsapp", sender: "agent", sender_name: "WhatsApp Qualifier Bot", direction: "outbound", body: "Buenas Marc, déjame mirar disponibilidad del viernes…", at: hoursAgo(3.9) }),
  msg({ thread_id: "thr_marc", channel: "whatsapp", sender: "lead", sender_name: "Marc Vidal", direction: "inbound", body: "Perfecto, reserva para 4 el viernes a las 21:00", at: minutesAgo(35) }),

  // --- Laura (Instagram) ---
  msg({ thread_id: "thr_laura", channel: "instagram", sender: "lead", sender_name: "Laura García", direction: "inbound", body: "Hola! Os he visto en Instagram, ¿tenéis terraza?", at: hoursAgo(1.5) }),
  msg({ thread_id: "thr_laura", channel: "instagram", sender: "agent", sender_name: "WhatsApp Qualifier Bot", direction: "outbound", body: "¡Hola Laura! Sí, tenemos terraza cubierta para 20 personas.", at: hoursAgo(1.2) }),
  msg({ thread_id: "thr_laura", channel: "instagram", sender: "lead", sender_name: "Laura García", direction: "inbound", body: "Genial, ¿y se puede reservar por aquí?", at: hoursAgo(1) }),

  // --- Jorge ---
  msg({ thread_id: "thr_jorge", channel: "whatsapp", sender: "lead", sender_name: "Jorge Navarro", direction: "inbound", body: "Hola, es mi aniversario este sábado y quería algo especial", at: hoursAgo(22) }),
  msg({ thread_id: "thr_jorge", channel: "whatsapp", sender: "member", sender_name: "Ana Roca", direction: "outbound", body: "¡Felicidades Jorge! Os preparo la mesa de la esquina con un brindis de cortesía 🥂", at: hoursAgo(21) }),
  msg({ thread_id: "thr_jorge", channel: "whatsapp", sender: "lead", sender_name: "Jorge Navarro", direction: "inbound", body: "¿Cuánto costaría añadir el menú degustación?", at: hoursAgo(20) }),

  // --- Sofía (resuelta) ---
  msg({ thread_id: "thr_sofia", channel: "whatsapp", sender: "lead", sender_name: "Sofía Martínez", direction: "inbound", body: "Buenas, quería una mesa para 2 hoy a las 20:30", at: hoursAgo(7) }),
  msg({ thread_id: "thr_sofia", channel: "whatsapp", sender: "member", sender_name: "Luis Carballo", direction: "outbound", body: "Hola Sofía, sin problema, os reservo la mesa de la esquina.", at: hoursAgo(6.9) }),
  msg({ thread_id: "thr_sofia", channel: "whatsapp", sender: "lead", sender_name: "Sofía Martínez", direction: "inbound", body: "¡Perfecto, gracias!", at: hoursAgo(6) }),

  // --- Anónimo web ---
  msg({ thread_id: "thr_anon_web", channel: "web", sender: "lead", sender_name: "Contacto web", direction: "inbound", body: "Hola, quería saber si hacéis eventos de empresa", at: daysAgo(1) }),
  msg({ thread_id: "thr_anon_web", channel: "web", sender: "agent", sender_name: "WhatsApp Qualifier Bot", direction: "outbound", body: "¡Gracias por tu interés! Para eventos de empresa te pasa nuestro responsable. ¿Me dejas un email?", at: daysAgo(1) }),

  // --- Elena (email, resuelta) ---
  msg({ thread_id: "thr_elena", channel: "email", sender: "lead", sender_name: "Elena Rojas", direction: "inbound", body: "Hola, os escribo para el evento de 10 personas del sábado", at: daysAgo(3) }),
  msg({ thread_id: "thr_elena", channel: "email", sender: "member", sender_name: "Luis Carballo", direction: "outbound", body: "Hola Elena, el salón privado está reservado para vosotros a las 15:00.", at: daysAgo(2.9) }),
  msg({ thread_id: "thr_elena", channel: "email", sender: "lead", sender_name: "Elena Rojas", direction: "inbound", body: "Perfecto, confirmado. Gracias!", at: daysAgo(2.8) }),
  msg({ thread_id: "thr_elena", channel: "email", sender: "agent", sender_name: "WhatsApp Qualifier Bot", direction: "outbound", body: "Confirmado: salón privado · 10 pax · sábado 15:00. ¡Nos vemos!", at: daysAgo(2.5) }),
];

/* ------------------------- Agentes ------------------------- */

export const mockAgents: AiAgent[] = [
  {
    id: "ag_whatsapp", organization_id: "org_brasa", name: "WhatsApp Qualifier Bot",
    model: "claude-sonnet-5", is_active: true,
    system_prompt:
      "Eres el asistente de reservas de Brasa & Carbón. Hablas en español, con tono cercano y eficiente. Objetivos: confirmar mesa, nº de comensales, fecha y hora, y pedir email/teléfono. Nunca inventes disponibilidad.",
    created_at: daysAgo(100), updated_at: daysAgo(2),
  },
  {
    id: "ag_scorer", organization_id: "org_brasa", name: "Lead Scorer (n8n → CRM)",
    model: "gpt-4o-mini", is_active: false,
    system_prompt: "Clasifica cada lead entrante con score 0-100 y etiquetas relevantes para el sector hostelería.",
    created_at: daysAgo(50), updated_at: daysAgo(10),
  },
  {
    id: "ag_review", organization_id: "org_brasa", name: "Reseñas → Respuesta automática",
    model: "claude-haiku-4-5", is_active: true,
    system_prompt: "Redacta una respuesta cortés y personalizada a cada reseña de Google, en tono de marca, sin exceder 140 caracteres.",
    created_at: daysAgo(30), updated_at: daysAgo(5),
  },
];

/* ------------------------- Workflows (Fase A) ------------------------- */

export const mockWorkflows: Workflow[] = [
  {
    id: "wf_welcome",
    organization_id: "org_brasa",
    name: "Bienvenida y cualificación de reservas",
    description: "Saluda al lead entrante, cualifica con el agente y mueve la etapa.",
    trigger_type: "lead_created",
    trigger_config: {},
    nodes: [
      { id: "n_1", type: "send_whatsapp", label: "Enviar WhatsApp", config: { message: "¡Hola {{first_name}}! Gracias por escribirnos. Un momento, te atiende nuestro equipo." } },
      { id: "n_2", type: "call_ai_agent", label: "Llamar agente IA", config: { agent_id: "ag_whatsapp", prompt: "Pide nº de comensales, fecha y hora. Confirma disponibilidad." } },
      { id: "n_3", type: "condition", label: "Condición", config: { field: "status", op: "eq", value: "qualified" } },
      { id: "n_4", type: "move_stage", label: "Mover etapa", config: { to_stage: "Contactado por IA" } },
    ],
    edges: [
      { id: "e_1", from: "n_1", to: "n_2" },
      { id: "e_2", from: "n_2", to: "n_3" },
      { id: "e_3", from: "n_3", to: "n_4" },
    ],
    is_active: true,
    created_at: daysAgo(20),
    updated_at: daysAgo(3),
  },
  {
    id: "wf_winback",
    organization_id: "org_brasa",
    name: "Recuperación de leads sin respuesta",
    description: "Si un lead no responde en 24h, envía un recordatorio por WhatsApp.",
    trigger_type: "schedule",
    trigger_config: { cron: "0 9 * * *" },
    nodes: [
      { id: "n_1", type: "wait", label: "Esperar", config: { amount: 24, unit: "hours" } },
      { id: "n_2", type: "condition", label: "Condición", config: { field: "status", op: "eq", value: "new" } },
      { id: "n_3", type: "send_whatsapp", label: "Enviar WhatsApp", config: { message: "Hola {{first_name}}, ¿seguís interesados en reservar mesa? Tenemos hueco este fin de semana." } },
    ],
    edges: [
      { id: "e_1", from: "n_1", to: "n_2" },
      { id: "e_2", from: "n_2", to: "n_3" },
    ],
    is_active: true,
    created_at: daysAgo(12),
    updated_at: daysAgo(1),
  },
  {
    id: "wf_leads_hot",
    organization_id: "org_baremo",
    name: "Leads calientes → email comercial",
    description: "Envía email a leads con alto valor.",
    trigger_type: "lead_created",
    trigger_config: {},
    nodes: [
      { id: "n_1", type: "condition", label: "Condición", config: { field: "deal_value", op: "gt", value: 500 } },
      { id: "n_2", type: "send_email", label: "Enviar email", config: { subject: "Gracias por tu interés", body: "Hola {{first_name}}, un comercial te contactará en 24h." } },
    ],
    edges: [{ id: "e_1", from: "n_1", to: "n_2" }],
    is_active: false,
    created_at: daysAgo(6),
    updated_at: daysAgo(2),
  },
];

export const mockWorkflowRuns: WorkflowRun[] = [
  {
    id: "run_1",
    organization_id: "org_brasa",
    workflow_id: "wf_welcome",
    lead_id: "lead_marc",
    status: "completed",
    started_at: hoursAgo(3),
    finished_at: hoursAgo(3),
  },
  {
    id: "run_2",
    organization_id: "org_brasa",
    workflow_id: "wf_welcome",
    lead_id: "lead_laura",
    status: "completed",
    started_at: hoursAgo(1),
    finished_at: hoursAgo(1),
  },
  {
    id: "run_3",
    organization_id: "org_brasa",
    workflow_id: "wf_winback",
    lead_id: "lead_nerea",
    status: "running",
    started_at: minutesAgo(12),
    finished_at: null,
  },
];

export const mockWorkflowRunSteps: WorkflowRunStep[] = [
  {
    id: "step_1",
    organization_id: "org_brasa",
    workflow_run_id: "run_1",
    node_id: "n_1",
    input_payload: { lead_id: "lead_marc" },
    output_payload: { channel: "whatsapp", message: "¡Hola Marc! Gracias por escribirnos…", to: "+34 612 000 002" },
    status: "completed",
    error_message: null,
    executed_at: hoursAgo(3),
  },
  {
    id: "step_2",
    organization_id: "org_brasa",
    workflow_run_id: "run_1",
    node_id: "n_2",
    input_payload: { lead_id: "lead_marc", prompt: "Pide nº de comensales…" },
    output_payload: { agent: "WhatsApp Qualifier Bot", reply: "¿Para cuántas personas y qué día?", tokens_used: 96 },
    status: "completed",
    error_message: null,
    executed_at: hoursAgo(3),
  },
  {
    id: "step_3",
    organization_id: "org_brasa",
    workflow_run_id: "run_1",
    node_id: "n_3",
    input_payload: { lead_id: "lead_marc", field: "status", expected: "qualified" },
    output_payload: { branch: "yes", actual: "qualified" },
    status: "completed",
    error_message: null,
    executed_at: hoursAgo(3),
  },
  {
    id: "step_4",
    organization_id: "org_brasa",
    workflow_run_id: "run_1",
    node_id: "n_4",
    input_payload: { lead_id: "lead_marc", to_stage: "Contactado por IA" },
    output_payload: { from: "new", to: "Contactado por IA" },
    status: "completed",
    error_message: null,
    executed_at: hoursAgo(3),
  },
];

export const mockAuditLogs: AiAuditLog[] = [
  {
    id: "aud_1", organization_id: "org_brasa", lead_id: "lead_marc", agent_name: "WhatsApp Qualifier Bot",
    input_payload: { type: "inbound", channel: "whatsapp", message: "Hola, ¿tenéis mesa para 4 el viernes?" },
    output_payload: { action: "confirm_availability", reply: "¡Hola Marc! Sí, tenemos mesa para 4 el viernes a las 21:00. ¿Te reservo?", intent: "booking_request" },
    tokens_used: 412, status: "success", created_at: hoursAgo(0.6),
  },
  {
    id: "aud_2", organization_id: "org_brasa", lead_id: null, agent_name: "WhatsApp Qualifier Bot",
    input_payload: { type: "inbound", channel: "whatsapp", message: "Hola, ¿hacéis menú vegano?" },
    output_payload: { action: "answer_faq", reply: "Sí, tenemos opciones veganas. ¿Te ayudo a reservar?", intent: "faq" },
    tokens_used: 268, status: "success", created_at: hoursAgo(0.4),
  },
  {
    id: "aud_3", organization_id: "org_brasa", lead_id: "lead_sofia", agent_name: "Lead Scorer (n8n → CRM)",
    input_payload: { lead: { email: "sofia@example.com", source: "instagram" } },
    output_payload: { score: 87, tags: ["AI-Qualified", "Alta-intención"], next_step: "contactar_hoy" },
    tokens_used: 150, status: "success", created_at: hoursAgo(0.3),
  },
  {
    id: "aud_4", organization_id: "org_brasa", lead_id: null, agent_name: "WhatsApp Qualifier Bot",
    input_payload: { type: "inbound", channel: "whatsapp", message: "quiero montar un catering" },
    output_payload: null, tokens_used: 96, status: "error", created_at: hoursAgo(0.2),
  },
];

/** Pool para simular el stream en vivo de audit logs (modo demo). */
export const MOCK_AUDIT_STREAM_POOL: Array<Omit<AiAuditLog, "id" | "created_at">> = [
  {
    organization_id: "org_brasa", lead_id: "lead_nerea", agent_name: "WhatsApp Qualifier Bot",
    input_payload: { type: "inbound", channel: "whatsapp", message: "Hola, quería reservar para el sábado por la noche" },
    output_payload: { action: "confirm_availability", reply: "¡Hola Nerea! Para el sábado tenemos mesa a las 21:00 y 21:45. ¿Cuál te encaja?", intent: "booking_request" },
    tokens_used: 355, status: "success",
  },
  {
    organization_id: "org_brasa", lead_id: null, agent_name: "Reseñas → Respuesta automática",
    input_payload: { review: { rating: 5, text: "La mejor brasa de la ciudad, repetiremos" }, source: "google" },
    output_payload: { reply: "¡Gracias por tu reseña! Nos alegra muchísimo que lo disfrutaras. ¡Os esperamos pronto! 🙌" },
    tokens_used: 188, status: "success",
  },
  {
    organization_id: "org_brasa", lead_id: "lead_alex", agent_name: "Lead Scorer (n8n → CRM)",
    input_payload: { lead: { email: "alex@example.com", source: "instagram" } },
    output_payload: { score: 62, tags: ["Media-intención"], next_step: "follow_up_24h" },
    tokens_used: 134, status: "success",
  },
  {
    organization_id: "org_brasa", lead_id: null, agent_name: "WhatsApp Qualifier Bot",
    input_payload: { type: "inbound", channel: "whatsapp", message: "¿tenéis terraza?" },
    output_payload: { action: "answer_faq", reply: "¡Sí! Tenemos terraza cubierta para 20 personas.", intent: "faq" },
    tokens_used: 121, status: "success",
  },
];

/* ------------------------- Forms y funnels (Fase D) ------------------------- */

export const mockForms: MarketingForm[] = [
  {
    id: "form_contacto",
    organization_id: "org_brasa",
    name: "Solicita mesa / contacto",
    slug: "contacta-brasa",
    description: "Formulario de la home y campañas de captación del restaurante.",
    config: {
      fields: [
        { key: "first_name", label: "Nombre", type: "text", required: true },
        { key: "phone", label: "Teléfono", type: "phone", required: true },
        { key: "email", label: "Email", type: "email", required: false },
        { key: "message", label: "¿Qué necesitas?", type: "textarea", required: false },
      ],
      button_text: "Solicitar contacto",
      success_message: "¡Gracias! Te respondemos en menos de 1 hora por WhatsApp.",
      redirect_url: null,
    },
    is_active: true,
    created_at: daysAgo(50),
    updated_at: daysAgo(3),
  },
  {
    id: "form_presupuesto",
    organization_id: "org_brasa",
    name: "Presupuesto eventos",
    slug: "presupuesto-eventos",
    description: "Captación para banquetes y catering (funnel de Eventos).",
    config: {
      fields: [
        { key: "first_name", label: "Nombre", type: "text", required: true },
        { key: "phone", label: "Teléfono", type: "phone", required: true },
        { key: "party_size", label: "Nº de invitados", type: "text", required: false },
        { key: "message", label: "Tipo de evento", type: "textarea", required: false },
      ],
      button_text: "Pedir presupuesto",
      success_message: "Recibido. Un responsable de eventos te llama hoy.",
      redirect_url: null,
    },
    is_active: true,
    created_at: daysAgo(30),
    updated_at: daysAgo(6),
  },
  {
    id: "form_legal",
    organization_id: "org_baremo",
    name: "Solicita consulta legal",
    slug: "solicita-baremo",
    description: "Captación de casos para Baremo Estudio.",
    config: {
      fields: [
        { key: "first_name", label: "Nombre", type: "text", required: true },
        { key: "phone", label: "Teléfono", type: "phone", required: true },
        { key: "email", label: "Email", type: "email", required: false },
        { key: "message", label: "Cuéntanos tu caso", type: "textarea", required: true },
      ],
      button_text: "Enviar consulta",
      success_message: "Caso recibido. Te contacta un abogado en 24 h laborables.",
      redirect_url: null,
    },
    is_active: true,
    created_at: daysAgo(45),
    updated_at: daysAgo(1),
  },
  {
    id: "form_demo",
    organization_id: "org_demo",
    name: "Solicitud de contacto",
    slug: "solicita-demo",
    description: "Formulario demo de la agencia: prueba el botón «abrir en nueva pestaña».",
    config: {
      fields: [
        { key: "first_name", label: "Nombre", type: "text", required: true },
        { key: "email", label: "Email", type: "email", required: true },
        { key: "phone", label: "Teléfono", type: "phone", required: false },
      ],
      button_text: "Enviar",
      success_message: "¡Gracias! Te contactaremos pronto.",
      redirect_url: null,
    },
    is_active: true,
    created_at: daysAgo(30),
    updated_at: daysAgo(2),
  },
];

export const mockFunnels: MarketingFunnel[] = [
  {
    id: "funnel_verano",
    organization_id: "org_brasa",
    name: "Verano en la terraza",
    slug: "verano-terraza",
    description: "Campaña estival: anuncios → formulario de contacto → reserva.",
    landing_form_id: "form_contacto",
    is_active: true,
    created_at: daysAgo(21),
    updated_at: daysAgo(4),
  },
  {
    id: "funnel_eventos",
    organization_id: "org_brasa",
    name: "Banquetes y catering",
    slug: "banquetes-catering",
    description: "Funnel de eventos: formulario de presupuesto + seguimiento por WhatsApp.",
    landing_form_id: "form_presupuesto",
    is_active: true,
    created_at: daysAgo(14),
    updated_at: daysAgo(2),
  },
  {
    id: "funnel_legal",
    organization_id: "org_baremo",
    name: "Consultas legales",
    slug: "consultas-legal",
    description: "Captación de casos legales desde LinkedIn y Google.",
    landing_form_id: "form_legal",
    is_active: true,
    created_at: daysAgo(28),
    updated_at: daysAgo(1),
  },
];

export const mockFormSubmissions: FormSubmission[] = [
  {
    id: "sub_1",
    organization_id: "org_brasa",
    form_id: "form_contacto",
    lead_id: "lead_laura",
    payload: { first_name: "Laura", phone: "+34 612 000 001", email: "laura@example.com", message: "Terraza para 4 el sábado" },
    utm_source: "instagram", utm_medium: "social", utm_campaign: "verano_2026",
    utm_term: null, utm_content: "story_terraza",
    landing_page: "https://brasa-carbon.es/f/contacta", referrer: "instagram.com",
    created_at: hoursAgo(2),
  },
  {
    id: "sub_2",
    organization_id: "org_brasa",
    form_id: "form_contacto",
    lead_id: "lead_alex",
    payload: { first_name: "Álex", phone: "+34 612 000 008", email: "alex@example.com", message: "¿Tenéis menú para cenas de empresa?" },
    utm_source: "google", utm_medium: "cpc", utm_campaign: "seo_brasa",
    utm_term: "restaurante terraza madrid", utm_content: "ad_terraza",
    landing_page: "https://brasa-carbon.es/f/contacta", referrer: "google.com",
    created_at: hoursAgo(1),
  },
  {
    id: "sub_3",
    organization_id: "org_baremo",
    form_id: "form_legal",
    lead_id: "lead_beatriz",
    payload: { first_name: "Beatriz", phone: "+34 611 000 101", email: "beatriz@constructora.com", message: "Reclamación por retraso en obra" },
    utm_source: "linkedin", utm_medium: "paid_social", utm_campaign: "legal_obra",
    utm_term: null, utm_content: "banner_legal",
    landing_page: "https://baremo-estudio.es/f/solicita", referrer: "linkedin.com",
    created_at: hoursAgo(5),
  },
];

/** Mapa slug → contexto del formulario público (modo demo, SSR sin localStorage). */
export const FORM_SLUGS: Record<string, { orgId: string; formId: string }> = {
  "contacta-brasa": { orgId: "org_brasa", formId: "form_contacto" },
  "presupuesto-eventos": { orgId: "org_brasa", formId: "form_presupuesto" },
  "solicita-baremo": { orgId: "org_baremo", formId: "form_legal" },
};

/* ------------------------- Usage Tracking (Fase G) ------------------------- */

const monthKey = () => new Date().toISOString().slice(0, 7); // 'YYYY-MM'
const prevMonthKey = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().slice(0, 7);
};

export const mockOrganizationUsage: OrganizationUsage[] = [
  {
    id: "usage_brasa_curr",
    organization_id: "org_brasa",
    period: monthKey(),
    leads_count: 42,
    messages_count: 1240,
    ai_tokens_count: 185000,
    bookings_count: 38,
    forms_count: 12,
    emails_count: 45,
    created_at: new Date(`${monthKey()}-01`).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usage_brasa_prev",
    organization_id: "org_brasa",
    period: prevMonthKey(),
    leads_count: 38,
    messages_count: 1100,
    ai_tokens_count: 162000,
    bookings_count: 32,
    forms_count: 10,
    emails_count: 38,
    created_at: new Date(`${prevMonthKey()}-01`).toISOString(),
    updated_at: new Date(`${prevMonthKey()}-28`).toISOString(),
  },
  {
    id: "usage_baremo_curr",
    organization_id: "org_baremo",
    period: monthKey(),
    leads_count: 28,
    messages_count: 890,
    ai_tokens_count: 145000,
    bookings_count: 15,
    forms_count: 8,
    emails_count: 62,
    created_at: new Date(`${monthKey()}-01`).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "usage_mamare_curr",
    organization_id: "org_mamare",
    period: monthKey(),
    leads_count: 15,
    messages_count: 340,
    ai_tokens_count: 52000,
    bookings_count: 8,
    forms_count: 4,
    emails_count: 12,
    created_at: new Date(`${monthKey()}-01`).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockUsageLimits: UsageLimits[] = [
  {
    id: "limit_free",
    plan: "free",
    max_leads_monthly: 20,
    max_messages_monthly: 100,
    max_ai_tokens_monthly: 10000,
    max_bookings_monthly: 20,
    max_forms_monthly: 3,
    max_emails_monthly: 20,
    overage_policy: "block",
    overage_price_per_unit: { leads: 0.1, messages: 0.02, ai_tokens: 0.00001, bookings: 0.05, forms: 1.0, emails: 0.01 },
    created_at: daysAgo(400),
    updated_at: daysAgo(10),
  },
  {
    id: "limit_trial",
    plan: "trial",
    max_leads_monthly: 200,
    max_messages_monthly: 1000,
    max_ai_tokens_monthly: 100000,
    max_bookings_monthly: 200,
    max_forms_monthly: 10,
    max_emails_monthly: 200,
    overage_policy: "allow",
    overage_price_per_unit: { leads: 0.1, messages: 0.02, ai_tokens: 0.00001, bookings: 0.05, forms: 1.0, emails: 0.01 },
    created_at: daysAgo(400),
    updated_at: daysAgo(10),
  },
  {
    id: "limit_pro",
    plan: "pro",
    max_leads_monthly: 5000,
    max_messages_monthly: 25000,
    max_ai_tokens_monthly: 2000000,
    max_bookings_monthly: 5000,
    max_forms_monthly: 50,
    max_emails_monthly: 5000,
    overage_policy: "bill",
    overage_price_per_unit: { leads: 0.1, messages: 0.02, ai_tokens: 0.00001, bookings: 0.05, forms: 1.0, emails: 0.01 },
    created_at: daysAgo(400),
    updated_at: daysAgo(10),
  },
  {
    id: "limit_enterprise",
    plan: "enterprise",
    max_leads_monthly: 50000,
    max_messages_monthly: 250000,
    max_ai_tokens_monthly: 50000000,
    max_bookings_monthly: 50000,
    max_forms_monthly: 500,
    max_emails_monthly: 50000,
    overage_policy: "bill",
    overage_price_per_unit: { leads: 0.08, messages: 0.015, ai_tokens: 0.000008, bookings: 0.04, forms: 0.8, emails: 0.008 },
    created_at: daysAgo(400),
    updated_at: daysAgo(10),
  },
];

/* ------------------------- Marketplace de Agencia (Fase G) ------------------------- */

export const mockAgencyMarketplace: AgencyMarketplace[] = [
  {
    id: "mkt_hosteleria",
    snapshot_id: "snap_hosteleria",
    publisher_org_id: "org_demo",
    title: "Restaurante WhatsApp + Web + Reservas",
    description: "Plantilla completa para restaurantes: bot de WhatsApp para reservas, web con carta y reservas online, calendario de mesas. Incluye workflow de bienvenida y recuperación de leads.",
    preview_images: ["/marketplace/restaurant-hero.png", "/marketplace/restaurant-menu.png", "/marketplace/restaurant-booking.png"],
    price_monthly: 0,
    revenue_share_pct: 30,
    status: "published",
    featured: true,
    requirements: "WhatsApp Business API verificado. Dominio propio recomendado.",
    demo_url: "https://demo-rasa-carbon.zimplifai.com",
    installs_count: 142,
    rating_avg: 4.8,
    rating_count: 34,
    created_at: daysAgo(30),
    updated_at: daysAgo(2),
  },
  {
    id: "mkt_servicios",
    snapshot_id: "snap_servicios",
    publisher_org_id: "org_demo",
    title: "Captación Leads Servicios Profesionales",
    description: "Pipeline de ventas para agencias y consultoras: bot cualificador, kanban multi-pipeline, scoring IA, formularios de captación con UTM.",
    preview_images: ["/marketplace/services-hero.png", "/marketplace/services-kanban.png"],
    price_monthly: 0,
    revenue_share_pct: 30,
    status: "published",
    featured: true,
    requirements: "WhatsApp Business API. Cuenta n8n opcional para workflows avanzados.",
    demo_url: "https://demo-baremo.zimplifai.com",
    installs_count: 89,
    rating_avg: 4.6,
    rating_count: 21,
    created_at: daysAgo(25),
    updated_at: daysAgo(1),
  },
  {
    id: "mkt_ecommerce",
    snapshot_id: "snap_ecommerce",
    publisher_org_id: "org_demo",
    title: "E-commerce Automatizado (Carritos + WhatsApp)",
    description: "Recuperación de carritos abandonados, upsell por WhatsApp, soporte post-venta automatizado. Incluye workflows de n8n listos para usar.",
    preview_images: ["/marketplace/ecommerce-hero.png"],
    price_monthly: 49,
    revenue_share_pct: 30,
    status: "published",
    featured: true,
    requirements: "Shopify / WooCommerce + WhatsApp Business API. n8n para workflows.",
    demo_url: null,
    installs_count: 234,
    rating_avg: 4.7,
    rating_count: 56,
    created_at: daysAgo(15),
    updated_at: daysAgo(3),
  },
  {
    id: "mkt_healthcare",
    snapshot_id: "snap_healthcare",
    publisher_org_id: "org_demo",
    title: "Clínica / Citas Médicas",
    description: "Gestión de citas médicas por WhatsApp, recordatorios automáticos, historial de pacientes, bandeja unificada multi-canal.",
    preview_images: ["/marketplace/healthcare-hero.png", "/marketplace/healthcare-calendar.png"],
    price_monthly: 79,
    revenue_share_pct: 30,
    status: "published",
    featured: false,
    requirements: "WhatsApp Business API. Calendario Google/Outlook opcional.",
    demo_url: "https://demo-mamared.zimplifai.com",
    installs_count: 67,
    rating_avg: 4.9,
    rating_count: 18,
    created_at: daysAgo(5),
    updated_at: daysAgo(1),
  },
  {
    id: "mkt_agency_custom",
    snapshot_id: "snap_agencia",
    publisher_org_id: "org_demo",
    title: "Agencia a Medida (Privado)",
    description: "Plantilla base para agencias que quieren partir de cero. Kanban, IA, formularios. No publicado en marketplace.",
    preview_images: [],
    price_monthly: 99,
    revenue_share_pct: 30,
    status: "draft",
    featured: false,
    requirements: "WhatsApp Business API.",
    demo_url: null,
    installs_count: 0,
    rating_avg: null,
    rating_count: 0,
    created_at: daysAgo(30),
    updated_at: daysAgo(10),
  },
];

/* ------------------------- Estadísticas por tenant (admin) ------------------------- */

export const MOCK_TENANT_STATS: Record<
  string,
  { active_agents: number; total_leads: number; members: number; mrr: number; ingested_30d: number }
> = {
  org_brasa: { active_agents: 2, total_leads: 9, members: 2, mrr: 190, ingested_30d: 41 },
  org_baremo: { active_agents: 3, total_leads: 6, members: 3, mrr: 290, ingested_30d: 57 },
  org_mamare: { active_agents: 1, total_leads: 3, members: 1, mrr: 0, ingested_30d: 12 },
  org_kluster: { active_agents: 2, total_leads: 5, members: 2, mrr: 190, ingested_30d: 33 },
  org_tenzo: { active_agents: 0, total_leads: 2, members: 1, mrr: 0, ingested_30d: 4 },
  org_demo: { active_agents: 1, total_leads: 1, members: 1, mrr: 0, ingested_30d: 0 },
};

/* ------------------------- AI Copilot (Fase H) ------------------------- */

export const mockCopilotSessions: CopilotSession[] = [
  {
    id: "cs_1", organization_id: "org_brasa", user_id: "prof_admin",
    title: "Análisis de la semana de reservas", context_type: "analytics", context_id: null,
    is_active: true, created_at: hoursAgo(26), updated_at: minutesAgo(8),
  },
  {
    id: "cs_2", organization_id: "org_brasa", user_id: "prof_admin",
    title: "Lead de Laura García", context_type: "lead", context_id: "lead_laura",
    is_active: true, created_at: hoursAgo(3), updated_at: minutesAgo(30),
  },
  {
    id: "cs_3", organization_id: "org_brasa", user_id: "prof_member",
    title: "Pipeline de eventos", context_type: "pipeline", context_id: "pl_eventos",
    is_active: false, created_at: daysAgo(2), updated_at: daysAgo(1),
  },
];

export const mockCopilotMessages: CopilotMessage[] = [
  {
    id: "cmsg_1", session_id: "cs_1", role: "user",
    content: "¿Cómo fue la semana de reservas? ¿Hay algún día flojo que deba promocionar?",
    tool_calls: null, tool_call_id: null,
    metadata: { model: "claude-sonnet-5", tokens_input: 128, tokens_output: 12 }, created_at: hoursAgo(25.5),
  },
  {
    id: "cmsg_2", session_id: "cs_1", role: "assistant",
    content: "La semana pasada tuviste 38 reservas. El martes fue el día más flojo (2 reservas, 42% de ocupación de las mesas). Te recomiendo una promoción de «martes de brasa» para ese día. El sábado es el pico con 9 reservas.",
    tool_calls: null, tool_call_id: null,
    metadata: { model: "claude-sonnet-5", tokens_input: 512, tokens_output: 184, latency_ms: 920 }, created_at: hoursAgo(25.4),
  },
  {
    id: "cmsg_3", session_id: "cs_1", role: "user",
    content: "Genera un mensaje de WhatsApp para promocionar el martes de brasa a leads que aún no han reservado.",
    tool_calls: [
      { id: "tool_1", name: "fetch_leads", arguments: { status: "new", limit: 50 } },
    ],
    tool_call_id: null,
    metadata: { model: "claude-sonnet-5" }, created_at: hoursAgo(25.3),
  },
  {
    id: "cmsg_4", session_id: "cs_1", role: "tool",
    content: "{\"count\": 12, \"leads\": [{\"id\": \"lead_laura\", \"first_name\": \"Laura\"}]}",
    tool_calls: null, tool_call_id: "tool_1",
    metadata: { tool: "fetch_leads", latency_ms: 210 }, created_at: hoursAgo(25.3),
  },
  {
    id: "cmsg_5", session_id: "cs_1", role: "assistant",
    content: "Listo. He redactado el mensaje y lo he preparado para envío a 12 leads sin reservar. ¿Quieres que lo programe o prefieres revisarlo antes?",
    tool_calls: null, tool_call_id: null,
    metadata: { model: "claude-sonnet-5", tokens_input: 210, tokens_output: 96 }, created_at: hoursAgo(25.2),
  },
  {
    id: "cmsg_6", session_id: "cs_2", role: "user",
    content: "Resume el estado de Laura García y dime cuándo debo hacer el siguiente follow-up.",
    tool_calls: null, tool_call_id: null,
    metadata: { model: "claude-sonnet-5" }, created_at: hoursAgo(2.8),
  },
  {
    id: "cmsg_7", session_id: "cs_2", role: "assistant",
    content: "Laura García (Instagram) está en estado «Nuevo», score 76 (caliente). Vino de la campaña verano_2026. Tienes un follow-up programado para mañana a las 10:00. Sugerencia: ofrece la mesa de la terraza, su mensaje pedía terraza para 4.",
    tool_calls: null, tool_call_id: null,
    metadata: { model: "claude-sonnet-5", tokens_input: 340, tokens_output: 120 }, created_at: hoursAgo(2.7),
  },
  {
    id: "cmsg_8", session_id: "cs_3", role: "user",
    content: "¿Cuántos leads hay en cada etapa del pipeline de Eventos?",
    tool_calls: null, tool_call_id: null,
    metadata: { model: "claude-sonnet-5" }, created_at: daysAgo(2),
  },
  {
    id: "cmsg_9", session_id: "cs_3", role: "assistant",
    content: "En «Solicitud» hay 2, en «Presupuesto enviado» 1, en «Reservado» 1. El valor total de oportunidades abiertas es de 4.200 €.",
    tool_calls: null, tool_call_id: null,
    metadata: { model: "claude-sonnet-5", tokens_input: 265, tokens_output: 74 }, created_at: daysAgo(2),
  },
];

export const mockCopilotTools: CopilotTool[] = [
  { id: "ct_fetch_leads", name: "fetch_leads", description: "Obtiene leads con filtros opcionales", parameters_schema: { type: "object", properties: { status: { type: "string" }, limit: { type: "number", default: 20 } } }, category: "data", is_active: true, created_at: daysAgo(20), updated_at: daysAgo(2) },
  { id: "ct_create_lead", name: "create_lead", description: "Crea un nuevo lead", parameters_schema: { type: "object", properties: { first_name: { type: "string" }, email: { type: "string" }, phone: { type: "string" } }, required: ["first_name"] }, category: "action", is_active: true, created_at: daysAgo(20), updated_at: daysAgo(2) },
  { id: "ct_update_lead", name: "update_lead", description: "Actualiza un lead existente", parameters_schema: { type: "object", properties: { id: { type: "string" }, status: { type: "string" }, deal_value: { type: "number" } }, required: ["id"] }, category: "action", is_active: true, created_at: daysAgo(20), updated_at: daysAgo(2) },
  { id: "ct_fetch_pipeline", name: "fetch_pipeline", description: "Obtiene el pipeline con leads agrupados por etapa", parameters_schema: { type: "object", properties: {} }, category: "data", is_active: true, created_at: daysAgo(20), updated_at: daysAgo(2) },
  { id: "ct_run_workflow", name: "run_workflow", description: "Ejecuta un workflow manualmente sobre un lead", parameters_schema: { type: "object", properties: { workflow_id: { type: "string" }, lead_id: { type: "string" } }, required: ["workflow_id", "lead_id"] }, category: "workflow", is_active: true, created_at: daysAgo(20), updated_at: daysAgo(2) },
  { id: "ct_query_usage", name: "query_usage", description: "Consulta el uso y límites del mes actual", parameters_schema: { type: "object", properties: {} }, category: "analytics", is_active: true, created_at: daysAgo(20), updated_at: daysAgo(2) },
  { id: "ct_fetch_bookings", name: "fetch_bookings", description: "Obtiene reservas con filtros", parameters_schema: { type: "object", properties: { status: { type: "string" }, date_from: { type: "string" } } }, category: "data", is_active: true, created_at: daysAgo(20), updated_at: daysAgo(2) },
];

/* ------------------------- Lead Scoring (Fase H) ------------------------- */

export const mockScoringModels: ScoringModel[] = [
  {
    id: "sm_default", organization_id: "org_brasa", name: "Modelo Hostelería",
    description: "Pondera engagement del lead con el bot, recencia, ajuste al perfil de cliente y señal de intención de reserva.",
    version: "1.2.0", is_active: true,
    factors: { engagement: 0.30, recency: 0.20, fit: 0.25, intent: 0.25 },
    thresholds: { hot: 80, warm: 50, cold: 0 },
    created_at: daysAgo(60), updated_at: daysAgo(5),
  },
  {
    id: "sm_legal", organization_id: "org_baremo", name: "Modelo Servicios Legales",
    description: "Prioriza leads con necesidad clara de asesoría y presupuesto alto.",
    version: "1.0.0", is_active: true,
    factors: { engagement: 0.20, recency: 0.15, fit: 0.35, intent: 0.30 },
    thresholds: { hot: 85, warm: 60, cold: 0 },
    created_at: daysAgo(30), updated_at: daysAgo(3),
  },
];

export const mockLeadScores: LeadScore[] = [
  { id: "ls_1", organization_id: "org_brasa", lead_id: "lead_laura", model_id: "sm_default", score: 76, label: "warm", factors_breakdown: { engagement: { score: 80, details: { replies: 3, speed_min: 5 } }, recency: { score: 92, details: { last_activity_hours: 2 } }, fit: { score: 70, details: { matches_segment: true } }, intent: { score: 66, details: { asked_booking: true } } }, calculated_at: minutesAgo(18) },
  { id: "ls_2", organization_id: "org_brasa", lead_id: "lead_marc", model_id: "sm_default", score: 88, label: "hot", factors_breakdown: { engagement: { score: 90, details: { replies: 4, speed_min: 8 } }, recency: { score: 85, details: { last_activity_hours: 0.6 } }, fit: { score: 88, details: { matches_segment: true } }, intent: { score: 90, details: { asked_booking: true } } }, calculated_at: hoursAgo(1) },
  { id: "ls_3", organization_id: "org_brasa", lead_id: "lead_jorge", model_id: "sm_default", score: 61, label: "warm", factors_breakdown: { engagement: { score: 55, details: { replies: 2, speed_min: 60 } }, recency: { score: 40, details: { last_activity_hours: 26 } }, fit: { score: 80, details: { matches_segment: true } }, intent: { score: 70, details: { special_occasion: true } } }, calculated_at: hoursAgo(6) },
  { id: "ls_4", organization_id: "org_brasa", lead_id: "lead_alex", model_id: "sm_default", score: 34, label: "cold", factors_breakdown: { engagement: { score: 30, details: { replies: 0, speed_min: null } }, recency: { score: 55, details: { last_activity_hours: 1 } }, fit: { score: 25, details: { matches_segment: false } }, intent: { score: 20, details: { asked_booking: false } } }, calculated_at: minutesAgo(45) },
  { id: "ls_5", organization_id: "org_baremo", lead_id: "lead_beatriz", model_id: "sm_legal", score: 91, label: "hot", factors_breakdown: { engagement: { score: 88, details: { replies: 3 } }, recency: { score: 90, details: { last_activity_hours: 1 } }, fit: { score: 95, details: { case_clarity: true } }, intent: { score: 92, details: { budget_high: true } } }, calculated_at: hoursAgo(1) },
];

export const mockLeadScoreHistory: LeadScoreHistory[] = [
  { id: "lsh_1", organization_id: "org_brasa", lead_id: "lead_laura", model_id: "sm_default", previous_score: null, new_score: 72, previous_label: null, new_label: "warm", trigger: "auto", metadata: { source: "webhook_ingest" }, created_at: hoursAgo(2) },
  { id: "lsh_2", organization_id: "org_brasa", lead_id: "lead_laura", model_id: "sm_default", previous_score: 72, new_score: 76, previous_label: "warm", new_label: "warm", trigger: "activity", metadata: { event: "whatsapp_reply" }, created_at: minutesAgo(18) },
  { id: "lsh_3", organization_id: "org_brasa", lead_id: "lead_marc", model_id: "sm_default", previous_score: 80, new_score: 88, previous_label: "hot", new_label: "hot", trigger: "activity", metadata: { event: "booking_request" }, created_at: hoursAgo(1) },
  { id: "lsh_4", organization_id: "org_brasa", lead_id: "lead_jorge", model_id: "sm_default", previous_score: 68, new_score: 61, previous_label: "warm", new_label: "warm", trigger: "auto", metadata: { reason: "decay_recency" }, created_at: hoursAgo(6) },
];

/* ------------------------- Cost Dashboard (Fase H) ------------------------- */

export const mockUnitCosts: UnitCost[] = [
  { id: "uc_1", organization_id: null, resource_type: "ai_tokens_input", unit: "1k_tokens", cost_per_unit: 0.0015, currency: "EUR", is_active: true, effective_from: "2026-01-01", effective_to: null, created_at: daysAgo(200), updated_at: daysAgo(30) },
  { id: "uc_2", organization_id: null, resource_type: "ai_tokens_output", unit: "1k_tokens", cost_per_unit: 0.006, currency: "EUR", is_active: true, effective_from: "2026-01-01", effective_to: null, created_at: daysAgo(200), updated_at: daysAgo(30) },
  { id: "uc_3", organization_id: null, resource_type: "whatsapp_message", unit: "message", cost_per_unit: 0.005, currency: "EUR", is_active: true, effective_from: "2026-01-01", effective_to: null, created_at: daysAgo(200), updated_at: daysAgo(30) },
  { id: "uc_4", organization_id: null, resource_type: "whatsapp_session", unit: "session", cost_per_unit: 0.02, currency: "EUR", is_active: true, effective_from: "2026-01-01", effective_to: null, created_at: daysAgo(200), updated_at: daysAgo(30) },
  { id: "uc_5", organization_id: null, resource_type: "email_sent", unit: "email", cost_per_unit: 0.0005, currency: "EUR", is_active: true, effective_from: "2026-01-01", effective_to: null, created_at: daysAgo(200), updated_at: daysAgo(30) },
  { id: "uc_6", organization_id: null, resource_type: "sms_sent", unit: "message", cost_per_unit: 0.05, currency: "EUR", is_active: true, effective_from: "2026-01-01", effective_to: null, created_at: daysAgo(200), updated_at: daysAgo(30) },
  { id: "uc_7", organization_id: null, resource_type: "voice_minute", unit: "minute", cost_per_unit: 0.015, currency: "EUR", is_active: true, effective_from: "2026-01-01", effective_to: null, created_at: daysAgo(200), updated_at: daysAgo(30) },
];

export const mockResourceUsage: ResourceUsage[] = [
  { id: "ru_1", organization_id: "org_brasa", resource_type: "ai_tokens_input", quantity: 1500, unit: "1k_tokens", cost_eur: 0.00225, related_id: "cs_2", related_type: "copilot_session", metadata: { model: "claude-sonnet-5" }, occurred_at: hoursAgo(3), created_at: hoursAgo(3) },
  { id: "ru_2", organization_id: "org_brasa", resource_type: "ai_tokens_output", quantity: 184, unit: "1k_tokens", cost_eur: 0.0011, related_id: "cs_1", related_type: "copilot_session", metadata: { model: "claude-sonnet-5" }, occurred_at: hoursAgo(25), created_at: hoursAgo(25) },
  { id: "ru_3", organization_id: "org_brasa", resource_type: "whatsapp_message", quantity: 1240, unit: "message", cost_eur: 6.2, related_id: "thr_nerea", related_type: "message", metadata: {}, occurred_at: minutesAgo(10), created_at: minutesAgo(10) },
  { id: "ru_4", organization_id: "org_brasa", resource_type: "whatsapp_session", quantity: 5, unit: "session", cost_eur: 0.1, related_id: null, related_type: null, metadata: { day: "2026-08-09" }, occurred_at: hoursAgo(1), created_at: hoursAgo(1) },
  { id: "ru_5", organization_id: "org_brasa", resource_type: "email_sent", quantity: 45, unit: "email", cost_eur: 0.0225, related_id: "wf_leads_hot", related_type: "workflow_run", metadata: {}, occurred_at: daysAgo(1), created_at: daysAgo(1) },
  { id: "ru_6", organization_id: "org_baremo", resource_type: "whatsapp_message", quantity: 890, unit: "message", cost_eur: 4.45, related_id: "thr_beatriz", related_type: "message", metadata: {}, occurred_at: hoursAgo(2), created_at: hoursAgo(2) },
];

const dayKeyISO = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

export const mockDailyCosts: DailyCosts[] = [
  { id: "dc_1", organization_id: "org_brasa", date: dayKeyISO(-6), ai_tokens_input: 125000, ai_tokens_output: 32000, whatsapp_messages: 156, whatsapp_sessions: 8, emails_sent: 5, sms_sent: 2, voice_minutes: 0, total_cost_eur: 2.42, breakdown: { ai_tokens_input: 0.1875, ai_tokens_output: 0.192, whatsapp_message: 0.78, whatsapp_session: 0.16, email_sent: 0.0025, sms_sent: 0.1 }, created_at: daysAgo(6), updated_at: daysAgo(6) },
  { id: "dc_2", organization_id: "org_brasa", date: dayKeyISO(-5), ai_tokens_input: 138000, ai_tokens_output: 41000, whatsapp_messages: 172, whatsapp_sessions: 9, emails_sent: 6, sms_sent: 1, voice_minutes: 0, total_cost_eur: 2.68, breakdown: { ai_tokens_input: 0.207, ai_tokens_output: 0.246, whatsapp_message: 0.86, whatsapp_session: 0.18, email_sent: 0.003, sms_sent: 0.05 }, created_at: daysAgo(5), updated_at: daysAgo(5) },
  { id: "dc_3", organization_id: "org_brasa", date: dayKeyISO(-4), ai_tokens_input: 110000, ai_tokens_output: 28000, whatsapp_messages: 143, whatsapp_sessions: 7, emails_sent: 4, sms_sent: 3, voice_minutes: 0, total_cost_eur: 2.21, breakdown: { ai_tokens_input: 0.165, ai_tokens_output: 0.168, whatsapp_message: 0.715, whatsapp_session: 0.14, email_sent: 0.002, sms_sent: 0.15 }, created_at: daysAgo(4), updated_at: daysAgo(4) },
  { id: "dc_4", organization_id: "org_brasa", date: dayKeyISO(-3), ai_tokens_input: 152000, ai_tokens_output: 47000, whatsapp_messages: 184, whatsapp_sessions: 10, emails_sent: 7, sms_sent: 2, voice_minutes: 5, total_cost_eur: 3.06, breakdown: { ai_tokens_input: 0.228, ai_tokens_output: 0.282, whatsapp_message: 0.92, whatsapp_session: 0.2, email_sent: 0.0035, sms_sent: 0.1, voice_minute: 0.075 }, created_at: daysAgo(3), updated_at: daysAgo(3) },
  { id: "dc_5", organization_id: "org_brasa", date: dayKeyISO(-2), ai_tokens_input: 121000, ai_tokens_output: 31000, whatsapp_messages: 148, whatsapp_sessions: 8, emails_sent: 5, sms_sent: 1, voice_minutes: 0, total_cost_eur: 2.35, breakdown: { ai_tokens_input: 0.1815, ai_tokens_output: 0.186, whatsapp_message: 0.74, whatsapp_session: 0.16, email_sent: 0.0025, sms_sent: 0.05 }, created_at: daysAgo(2), updated_at: daysAgo(2) },
  { id: "dc_6", organization_id: "org_brasa", date: dayKeyISO(-1), ai_tokens_input: 139000, ai_tokens_output: 39000, whatsapp_messages: 162, whatsapp_sessions: 9, emails_sent: 6, sms_sent: 2, voice_minutes: 0, total_cost_eur: 2.61, breakdown: { ai_tokens_input: 0.2085, ai_tokens_output: 0.234, whatsapp_message: 0.81, whatsapp_session: 0.18, email_sent: 0.003, sms_sent: 0.1 }, created_at: daysAgo(1), updated_at: daysAgo(1) },
  { id: "dc_7", organization_id: "org_brasa", date: dayKeyISO(0), ai_tokens_input: 145000, ai_tokens_output: 42000, whatsapp_messages: 171, whatsapp_sessions: 10, emails_sent: 8, sms_sent: 1, voice_minutes: 0, total_cost_eur: 2.83, breakdown: { ai_tokens_input: 0.2175, ai_tokens_output: 0.252, whatsapp_message: 0.855, whatsapp_session: 0.2, email_sent: 0.004, sms_sent: 0.05 }, created_at: hoursAgo(1), updated_at: hoursAgo(1) },
  { id: "dc_8", organization_id: "org_baremo", date: dayKeyISO(0), ai_tokens_input: 98000, ai_tokens_output: 25000, whatsapp_messages: 120, whatsapp_sessions: 6, emails_sent: 4, sms_sent: 0, voice_minutes: 0, total_cost_eur: 1.86, breakdown: { ai_tokens_input: 0.147, ai_tokens_output: 0.15, whatsapp_message: 0.6, whatsapp_session: 0.12, email_sent: 0.002 }, created_at: hoursAgo(1), updated_at: hoursAgo(1) },
];

/* ------------------------- Snapshot de costes por lead (helper) ------------------------- */

/** Coste estimado en EUR de un lead según su actividad (para el dashboard). */
export function estimateLeadCost(leadId: string): number {
  const usage = mockResourceUsage.filter((r) => r.related_id === leadId || r.metadata.lead_id === leadId);
  return usage.reduce((acc, r) => acc + r.cost_eur, 0);
}

/* ------------------------- Facturación (Fase E2) ------------------------- */

export const mockQuoteItems: QuoteItem[] = [
  { id: "qi_1", quote_id: "q_1", description: "Catering celebración 40 invitados", quantity: 40, unit_price_eur: 42, line_total_eur: 1680, created_at: daysAgo(12) },
  { id: "qi_2", quote_id: "q_1", description: "Servicio de montaje y personal", quantity: 1, unit_price_eur: 480, line_total_eur: 480, created_at: daysAgo(12) },
  { id: "qi_3", quote_id: "q_2", description: "Planificación de evento corporativo", quantity: 1, unit_price_eur: 1900, line_total_eur: 1900, created_at: daysAgo(5) },
  { id: "qi_4", quote_id: "q_2", description: "Barra libre premium (60 pax)", quantity: 60, unit_price_eur: 28, line_total_eur: 1680, created_at: daysAgo(5) },
  { id: "qi_5", quote_id: "q_3", description: "Asesoría legal laboral anual", quantity: 1, unit_price_eur: 2400, line_total_eur: 2400, created_at: daysAgo(3) },
];

export const mockQuotes: Quote[] = [
  { id: "q_1", organization_id: "org_brasa", number: "PR-2026-001", customer_id: "comp_catering", customer_name: "Catering Deluxe", status: "sent", currency: "EUR", tax_rate: 21, subtotal_eur: 2160, tax_eur: 453.6, total_eur: 2613.6, valid_until: dayKeyISO(10), notes: "Incluye degustación previa para 2 personas.", created_at: daysAgo(12), updated_at: daysAgo(12) },
  { id: "q_2", organization_id: "org_brasa", number: "PR-2026-002", customer_id: "comp_techcorp", customer_name: "TechCorp Events", status: "accepted", currency: "EUR", tax_rate: 21, subtotal_eur: 3580, tax_eur: 751.8, total_eur: 4331.8, valid_until: dayKeyISO(8), notes: "Aceptado → pendiente de emitir factura.", created_at: daysAgo(5), updated_at: daysAgo(4) },
  { id: "q_3", organization_id: "org_baremo", number: "PR-2026-003", customer_id: "comp_constructora", customer_name: "Constructora Levante", status: "draft", currency: "EUR", tax_rate: 21, subtotal_eur: 2400, tax_eur: 504, total_eur: 2904, valid_until: null, notes: "Pendiente de revisión interna.", created_at: daysAgo(3), updated_at: daysAgo(3) },
];

export const mockInvoiceItems: InvoiceItem[] = [
  { id: "ii_1", invoice_id: "inv_1", description: "Reserva de salón + catering (evento abril)", quantity: 1, unit_price_eur: 2400, line_total_eur: 2400, created_at: daysAgo(20) },
  { id: "ii_2", invoice_id: "inv_1", description: "Servicio de montaje y personal", quantity: 1, unit_price_eur: 650, line_total_eur: 650, created_at: daysAgo(20) },
  { id: "ii_3", invoice_id: "inv_2", description: "Cuota mensual soporte CRM + WhatsApp", quantity: 1, unit_price_eur: 149, line_total_eur: 149, created_at: daysAgo(15) },
  { id: "ii_4", invoice_id: "inv_3", description: "Evento corporativo TechCorp (junio)", quantity: 1, unit_price_eur: 4331.8, line_total_eur: 4331.8, created_at: daysAgo(6) },
  { id: "ii_5", invoice_id: "inv_4", description: "Mantenimiento web + dominio", quantity: 1, unit_price_eur: 89, line_total_eur: 89, created_at: daysAgo(2) },
];

export const mockInvoices: Invoice[] = [
  { id: "inv_1", organization_id: "org_brasa", number: "FC-2026-012", quote_id: null, customer_id: "comp_bodas_r", customer_name: "Bodas & Receptions", status: "paid", currency: "EUR", tax_rate: 21, subtotal_eur: 3050, tax_eur: 640.5, total_eur: 3690.5, issue_date: dayKeyISO(-20), due_date: dayKeyISO(-5), paid_at: daysAgo(8), notes: null, created_at: daysAgo(20), updated_at: daysAgo(8) },
  { id: "inv_2", organization_id: "org_brasa", number: "FC-2026-013", quote_id: null, customer_id: null, customer_name: "Restaurante Brasa & Carbón", status: "sent", currency: "EUR", tax_rate: 21, subtotal_eur: 149, tax_eur: 31.29, total_eur: 180.29, issue_date: dayKeyISO(-15), due_date: dayKeyISO(15), paid_at: null, notes: "Cuota mensual de plataforma.", created_at: daysAgo(15), updated_at: daysAgo(15) },
  { id: "inv_3", organization_id: "org_brasa", number: "FC-2026-014", quote_id: "q_2", customer_id: "comp_techcorp", customer_name: "TechCorp Events", status: "sent", currency: "EUR", tax_rate: 21, subtotal_eur: 3580, tax_eur: 751.8, total_eur: 4331.8, issue_date: dayKeyISO(-6), due_date: dayKeyISO(14), paid_at: null, notes: "Factura del presupuesto PR-2026-002.", created_at: daysAgo(6), updated_at: daysAgo(6) },
  { id: "inv_4", organization_id: "org_baremo", number: "FC-2026-003", quote_id: null, customer_id: "comp_constructora", customer_name: "Constructora Levante", status: "paid", currency: "EUR", tax_rate: 21, subtotal_eur: 89, tax_eur: 18.69, total_eur: 107.69, issue_date: dayKeyISO(-2), due_date: dayKeyISO(28), paid_at: daysAgo(1), notes: null, created_at: daysAgo(2), updated_at: daysAgo(1) },
];

export const mockPayments: Payment[] = [
  { id: "pay_1", organization_id: "org_brasa", invoice_id: "inv_1", amount_eur: 3690.5, method: "transfer", reference: "IBAN …8821", paid_at: daysAgo(8), created_at: daysAgo(8) },
  { id: "pay_2", organization_id: "org_brasa", invoice_id: "inv_3", amount_eur: 2165.9, method: "card", reference: "trx_card_9f3a", paid_at: daysAgo(2), created_at: daysAgo(2) },
  { id: "pay_3", organization_id: "org_baremo", invoice_id: "inv_4", amount_eur: 107.69, method: "link", reference: "pay_link_mamare", paid_at: daysAgo(1), created_at: daysAgo(1) },
];

/* ------------------------- Reputación (Fase F) ------------------------- */

export const mockReviews: Review[] = [
  { id: "rev_1", organization_id: "org_brasa", source: "google", rating: 5, customer_name: "Marta G.", content: "Servicio espectacular para nuestro evento. El equipo lo cuidó todo al detalle.", reply_text: "¡Gracias Marta! Fue un placer.", status: "published", created_at: daysAgo(21), updated_at: daysAgo(18) },
  { id: "rev_2", organization_id: "org_brasa", source: "google", rating: 4, customer_name: "Javi R.", content: "Muy buena experiencia. La terraza es preciosa y el trato cercano.", reply_text: null, status: "published", created_at: daysAgo(12), updated_at: daysAgo(12) },
  { id: "rev_3", organization_id: "org_brasa", source: "whatsapp", rating: 5, customer_name: "Nerea Costa", content: "Reservamos por WhatsApp y todo perfecto, muy rápido.", reply_text: "¡Gracias Nerea! Te esperamos pronto.", status: "published", created_at: daysAgo(6), updated_at: daysAgo(5) },
  { id: "rev_4", organization_id: "org_brasa", source: "web", rating: 3, customer_name: "Sergio L.", content: "Bien en general, pero la espera fue un poco larga.", reply_text: null, status: "pending", created_at: hoursAgo(9), updated_at: hoursAgo(9) },
  { id: "rev_5", organization_id: "org_brasa", source: "google", rating: 5, customer_name: "Laura García", content: "Celebramos el cumpleaños de mi madre y no pudo salir mejor.", reply_text: null, status: "pending", created_at: minutesAgo(40), updated_at: minutesAgo(40) },
  { id: "rev_6", organization_id: "org_baremo", source: "google", rating: 5, customer_name: "Beatriz H.", content: "Asesoramiento legal impecable y muy transparente.", reply_text: null, status: "published", created_at: daysAgo(10), updated_at: daysAgo(10) },
];

export const mockReviewRequests: ReviewRequest[] = [
  { id: "rr_1", organization_id: "org_brasa", contact_id: "comp_bodas_r", contact_name: "Bodas & Receptions", channel: "whatsapp", status: "sent", sent_at: daysAgo(7), responded_at: null, created_at: daysAgo(7) },
  { id: "rr_2", organization_id: "org_brasa", contact_id: null, contact_name: "Marta G.", channel: "email", status: "responded", sent_at: daysAgo(20), responded_at: daysAgo(21), created_at: daysAgo(20) },
  { id: "rr_3", organization_id: "org_baremo", contact_id: "comp_constructora", contact_name: "Constructora Levante", channel: "whatsapp", status: "pending", sent_at: null, responded_at: null, created_at: daysAgo(1) },
];

/* ------------------------- Timeline unificado (Fase J) ------------------------- */

export const mockTimelineEvents: TimelineEvent[] = [
  { id: "te_1", organization_id: "org_brasa", lead_id: "lead_jorge", event_type: "whatsapp_received", title: "Nuevo mensaje de WhatsApp", description: "Jorge pide mesa para 4 esta noche.", payload: { channel: "whatsapp", from: "+34 612 000 001", body: "Hola, ¿tenéis mesa para 4 esta noche?" }, created_at: hoursAgo(1) },
  { id: "te_2", organization_id: "org_brasa", lead_id: "lead_jorge", event_type: "whatsapp_sent", title: "Respuesta automática enviada", description: "El agente IA confirmó disponibilidad en terraza.", payload: { channel: "whatsapp", to: "+34 612 000 001", template: "availability" }, created_at: minutesAgo(58) },
  { id: "te_3", organization_id: "org_brasa", lead_id: "lead_jorge", event_type: "booking_created", title: "Reserva creada", description: "4 personas · Terraza · esta noche 21:00.", payload: { booking_id: "bk_1", calendar_id: "cal_terraza", party_size: 4 }, created_at: minutesAgo(52) },
  { id: "te_4", organization_id: "org_brasa", lead_id: "lead_jorge", event_type: "booking_confirmed", title: "Reserva confirmada", description: "Confirmación automática por WhatsApp.", payload: { booking_id: "bk_1" }, created_at: minutesAgo(48) },
  { id: "te_5", organization_id: "org_brasa", lead_id: null, event_type: "qr_scanned", title: "QR escaneado", description: "Acceso al menú digital desde la mesa 12.", payload: { table: "M12", site_slug: "brasa-carbon" }, created_at: hoursAgo(3) },
  { id: "te_6", organization_id: "org_brasa", lead_id: null, event_type: "menu_viewed", title: "Menú digital visto", description: "Sesión de 2 min 14 s en la carta.", payload: { session_ms: 134000, items_viewed: 6 }, created_at: hoursAgo(3) },
  { id: "te_7", organization_id: "org_brasa", lead_id: "lead_elena", event_type: "voice_note", title: "Nota de voz recibida", description: "Elena deja audio sobre evento de 10 pax.", payload: { channel: "whatsapp", duration_s: 23 }, created_at: hoursAgo(2) },
  { id: "te_8", organization_id: "org_brasa", lead_id: "lead_elena", event_type: "ai_action", title: "El agente extrajo requisitos del audio", description: "Detectado: 10 pax, salón privado, catering.", payload: { tool: "entity_extraction", entities: { party_size: 10, venue: "salón privado", catering: true } }, created_at: hoursAgo(2) },
  { id: "te_9", organization_id: "org_brasa", lead_id: "lead_ivan", event_type: "sla_breach", title: "SLA en riesgo: 4 min sin respuesta", description: "Lead entrante de formulario sin primer contacto.", payload: { speed_to_lead_seconds: 240, threshold_minutes: 5 }, created_at: minutesAgo(40) },
  { id: "te_10", organization_id: "org_brasa", lead_id: "lead_ivan", event_type: "sla_rescued", title: "IA rescató el lead", description: "Mensaje automático enviado a los 6 min.", payload: { speed_to_lead_seconds: 360, auto_action: true }, created_at: minutesAgo(34) },
  { id: "te_11", organization_id: "org_brasa", lead_id: "lead_marc", event_type: "stage_changed", title: "Lead movido a 'En conversación'", description: "Avance en el pipeline comercial.", payload: { from_stage: "Nuevo", to_stage: "En conversación", actor: "Agente IA" }, created_at: hoursAgo(5) },
  { id: "te_12", organization_id: "org_brasa", lead_id: "lead_laura", event_type: "form_submitted", title: "Formulario de reserva enviado", description: "Origen: campaña 'Verano 2026' (UTM).", payload: { utm_campaign: "verano-2026", channel: "instagram" }, created_at: hoursAgo(8) },
  { id: "te_13", organization_id: "org_brasa", lead_id: "lead_sofia", event_type: "deposit_requested", title: "Depósito solicitado", description: "Alto riesgo de no-show (75) · 10 € por persona.", payload: { amount_eur: 40, risk_score: 75, booking_id: "bk_2" }, created_at: hoursAgo(6) },
  { id: "te_14", organization_id: "org_brasa", lead_id: "lead_sofia", event_type: "deposit_paid", title: "Depósito pagado", description: "Link de pago cobrado (card) · 40 €.", payload: { amount_eur: 40, payment_intent: "pi_mock_9f3a" }, created_at: hoursAgo(4) },
  { id: "te_15", organization_id: "org_brasa", lead_id: "lead_nerea", event_type: "lead_created", title: "Lead creado", description: "Nerea Costa llega desde reseña de Google.", payload: { source: "google_review", campaign: null }, created_at: hoursAgo(9) },
  { id: "te_16", organization_id: "org_brasa", lead_id: "lead_nerea", event_type: "whatsapp_received", title: "Nuevo mensaje de WhatsApp", description: "Nerea agradece y pregunta por menú vegano.", payload: { channel: "whatsapp", body: "¿Tenéis opciones veganas?" }, created_at: minutesAgo(12) },
  { id: "te_17", organization_id: "org_baremo", lead_id: "lead_beatriz", event_type: "whatsapp_received", title: "Nuevo mensaje de WhatsApp", description: "Beatriz consulta sobre asesoría laboral.", payload: { channel: "whatsapp", body: "Hola, ¿hacéis contratos de alta dirección?" }, created_at: hoursAgo(2) },
  { id: "te_18", organization_id: "org_baremo", lead_id: "lead_david", event_type: "booking_cancelled", title: "Cita cancelada", description: "David cancela la consulta del jueves.", payload: { booking_id: "bk_baremo_2", reason: "conflicto agenda" }, created_at: hoursAgo(7) },
  { id: "te_19", organization_id: "org_brasa", lead_id: null, event_type: "whatsapp_received", title: "Mensaje no clasificado", description: "Solicitud genérica sin intención clara.", payload: { channel: "whatsapp" }, created_at: minutesAgo(5) },
];

/* ------------------------- Momentos AI (Fase J) ------------------------- */

export const mockInsightsMoments: InsightsMoment[] = [
  { id: "im_1", organization_id: "org_brasa", lead_id: "lead_sofia", severity: "urgent", title: "Depósito pendiente de confirmación", reasoning: "El pago se inició pero lleva 2 h sin confirmarse. Un recordatorio por WhatsApp reduce el no-show.", suggested_action: { type: "charge_deposit", payload: { booking_id: "bk_2", amount_eur: 40 } }, is_resolved: false, created_at: hoursAgo(4) },
  { id: "im_2", organization_id: "org_brasa", lead_id: "lead_elena", severity: "opportunity", title: "Evento corporativo con alto valor", reasoning: "Elena pidió 10 pax con salón privado y catering. Histórico de Bodas & Receptions: ticket medio 2.900 €.", suggested_action: { type: "send_whatsapp", payload: { template: "evento_catering", body: "Te preparamos una propuesta de catering para 10 personas…" } }, is_resolved: false, created_at: hoursAgo(2) },
  { id: "im_3", organization_id: "org_brasa", lead_id: "lead_ivan", severity: "warning", title: "Lead sin respuesta a las 24 h", reasoning: "Iván entró por formulario y solo recibió el mensaje automático. Riesgo de enfriamiento.", suggested_action: { type: "follow_up", payload: { channel: "whatsapp", delay_hours: 0 } }, is_resolved: false, created_at: hoursAgo(6) },
  { id: "im_4", organization_id: "org_brasa", lead_id: "lead_nerea", severity: "info", title: "Interés por menú vegano", reasoning: "Nerea preguntó por opciones veganas. Sugerir la carta vegana puede acelerar la conversión.", suggested_action: { type: "send_whatsapp", payload: { template: "menu_vegano" } }, is_resolved: false, created_at: minutesAgo(10) },
  { id: "im_5", organization_id: "org_brasa", lead_id: "lead_marc", severity: "opportunity", title: "Cumpleaños en los próximos 7 días", reasoning: "Marc celebró aquí su cumpleaños el año pasado. Reenganche ideal con oferta de celebración.", suggested_action: { type: "send_whatsapp", payload: { template: "cumpleanos_aniversario" } }, is_resolved: false, created_at: hoursAgo(7) },
  { id: "im_6", organization_id: "org_baremo", lead_id: "lead_beatriz", severity: "opportunity", title: "Consulta de alta dirección", reasoning: "Servicio de alto margen (2.400 €). Responder en menos de 30 min duplica la conversión.", suggested_action: { type: "send_whatsapp", payload: { template: "asesoria_laboral" } }, is_resolved: false, created_at: hoursAgo(2) },
];

/* ------------------------- Métricas diarias (Fase J) ------------------------- */

function buildMetricsDaily(): MetricsDaily[] {
  const rows: MetricsDaily[] = [];
  const today = dayKey(0);
  // Patrón semanal realista: fin de semana pico en restaurante, laborable en estudio.
  for (let i = 29; i >= 0; i--) {
    const date = dayKey(-i);
    const dow = new Date(`${date}T12:00:00Z`).getUTCDay();
    const weekend = dow === 0 || dow === 6;
    const base = i === 0 ? 1 : 0; // hoy: parcial
    const totalLeads = weekend ? 14 + ((i * 7) % 5) : 7 + ((i * 3) % 5);
    const bookedRatio = 0.55 + ((i * 13) % 30) / 100;
    rows.push({
      id: `md_${date}`,
      organization_id: "org_brasa",
      date,
      total_leads: totalLeads + base,
      total_bookings: Math.round((totalLeads + base) * bookedRatio),
      attributed_revenue: Math.round((weekend ? 900 + (i % 6) * 140 : 380 + (i % 5) * 95) * 100) / 100,
      ai_hours_saved: Math.round(((totalLeads + base) * 0.38 + (i % 3) * 0.4) * 100) / 100,
      ai_tokens_used: (totalLeads + base) * (weekend ? 3200 : 2100) + ((i * 97) % 900),
      speed_to_lead_avg_seconds: 120 + ((i * 47) % 480),
      created_at: date === today ? minutesAgo(30) : hoursAgo(24 * i + 3),
    });
  }
  return rows;
}

export const mockMetricsDaily: MetricsDaily[] = buildMetricsDaily();
