import {
  Bot,
  CalendarClock,
  CalendarDays,
  FormInput,
  Globe,
  Inbox,
  Kanban,
  MessagesSquare,
  Receipt,
  ScrollText,
  Sparkles,
  Star,
  Users,
  Workflow,
  BarChart3,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";
import {
  MODULE_KEYS,
  MODULE_LABELS,
  type ModuleKey,
  type OrganizationModule,
} from "@/types/database";

/** Registro central de módulos verticales: icono + descripción + settings por defecto. */

export const MODULE_ICONS: Record<ModuleKey, LucideIcon> = {
  whatsapp_bot: Bot,
  booking_calendar: CalendarDays,
  light_web_menu: Globe,
  sales_kanban: Kanban,
  ai_logs: ScrollText,
  workflow_automation: Workflow,
  unified_inbox: Inbox,
  calendar_scheduler: CalendarClock,
  sales_crm: Users,
  marketing_forms: FormInput,
  ai_copilot: Sparkles,
  finance_suite: Receipt,
  reputation_mgmt: Star,
  roi_dashboard: BarChart3,
  reservation_bot: MessagesSquare,
  ai_voice_agent: PhoneCall,
};

export const MODULE_DESCRIPTIONS: Record<ModuleKey, string> = {
  whatsapp_bot: "Agente de IA que cualifica y responde por WhatsApp en tiempo real.",
  booking_calendar: "Agenda de reservas y citas con confirmación automática.",
  light_web_menu: "Web ligera / menú digital del negocio, white-label.",
  sales_kanban: "Pipeline kanban de ventas con leads y drag & drop.",
  ai_logs: "Stream de auditoría: cada acción del agente IA, token a token.",
  workflow_automation: "Automatización visual: dispara acciones cuando ocurren eventos en el CRM.",
  unified_inbox: "Bandeja unificada: WhatsApp, email e Instagram en un solo hilo.",
  calendar_scheduler: "Calendarios de citas y disponibilidad para cada miembro del equipo.",
  sales_crm: "CRM extendido: contactos, empresas, pipelines y tareas.",
  marketing_forms: "Formularios, funnels y atribución UTM.",
  ai_copilot: "Copilot IA: sugerencias, scoring de leads y costes.",
  finance_suite: "Facturación, cobros y métricas de agencia.",
  reputation_mgmt: "Reseñas de Google/WhatsApp, respuestas y métricas de reputación.",
  roi_dashboard: "Dashboard de ROI: ingresos atribuidos, costes, horas ahorradas y rescates de IA.",
  reservation_bot:
    "Bot de reservas por Telegram o WhatsApp: disponibilidad, aforo, web y dudas rápidas, configurado desde la subcuenta del cliente.",
  ai_voice_agent:
    "Llamadas IA: agente telefónico que responde, informa de servicios y horarios y crea reservas por voz. El cerebro y la voz se eligen por subcuenta; el resto sale del CRM.",
};

export const MODULE_DEFAULT_SETTINGS: Record<ModuleKey, Record<string, unknown>> = {
  whatsapp_bot: {
    phone: "",
    whatsapp_token: "",
    ai_prompt: "",
    language: "es",
  },
  booking_calendar: {
    open_hours: "12:00–16:00, 20:00–23:30",
    max_capacity: 40,
    confirmation_sms: true,
  },
  light_web_menu: {
    site_url: "",
    has_menu: true,
    cta_phone: "",
  },
  sales_kanban: {
    deal_currency: "EUR",
    default_pipeline: [],
  },
  ai_logs: {
    retention_days: 90,
    stream_enabled: true,
  },
  workflow_automation: {
    max_active_workflows: 10,
    execution_budget_tokens: 50000,
  },
  unified_inbox: {
    whatsapp_linked: false,
    email_linked: false,
    instagram_linked: false,
  },
  calendar_scheduler: {
    timezone: "Europe/Madrid",
    slot_minutes: 30,
    business_hours: "09:00–18:00",
  },
  sales_crm: {
    currencies: ["EUR"],
    default_view: "kanban",
  },
  marketing_forms: {
    capture_utm: true,
    dedupe_by_email: true,
  },
  ai_copilot: {
    enabled_suggestions: true,
    scoring_model: "claude-sonnet-5",
  },
  finance_suite: {
    invoice_series: "FC",
    tax_rate: 21,
  },
  reputation_mgmt: {
    google_connected: false,
    auto_reply: true,
  },
  roi_dashboard: {
    monthly_software_cost: 290,
    sla_alert_minutes: 5,
    sla_auto_rescue_minutes: 10,
    show_simulator: true,
  },
  reservation_bot: {
    channel: "telegram",
    telegram_token: "",
    whatsapp_phone: "",
    status: "disconnected",
    bot_username: "",
    last_error: "",
  },
  ai_voice_agent: {
    status: "disconnected",
    agent_name: "Recepción",
    tone: "cercano, natural y profesional",
    custom_rules: "",
    llm_provider: "demo",
    llm_api_key: "",
    tts_provider: "demo",
    tts_api_key: "",
    voice_id: "",
    phone_number: "",
    webhook_secret: "",
    last_error: "",
  },
};

/**
 * Ruta → módulo requerido para las rutas restringidas.
 * La home `/workspace` se adapta por vertical y nunca se bloquea.
 */
export const MODULE_ROUTES: Record<string, ModuleKey> = {
  "/workspace/bookings": "booking_calendar",
  "/workspace/automations": "whatsapp_bot",
  "/workspace/automations/workflows": "workflow_automation",
  "/workspace/logs": "ai_logs",
  "/workspace/settings/branding": "light_web_menu",
  "/workspace/marketing/site": "light_web_menu",
  "/workspace/inbox": "unified_inbox",
  "/workspace/calendar": "calendar_scheduler",
  "/workspace/sales": "sales_crm",
  "/workspace/forms": "marketing_forms",
  "/workspace/ai": "ai_copilot",
  "/workspace/finance": "finance_suite",
  "/workspace/reputation": "reputation_mgmt",
  "/workspace/analytics/roi": "roi_dashboard",
};

/** Devuelve el módulo requerido por una ruta, si está restringido. */
export function moduleKeyForRoute(pathname: string): ModuleKey | null {
  return MODULE_ROUTES[pathname] ?? null;
}

/** Une los módulos reales de la subcuenta con los defaults del registro. */
export function normalizeModules(rows: OrganizationModule[]): OrganizationModule[] {
  return MODULE_KEYS.map((key) => {
    const row = rows.find((r) => r.module_key === key);
    if (row) return row;
    return {
      id: `mod_${key}`,
      organization_id: "",
      module_key: key,
      is_enabled: false,
      settings: MODULE_DEFAULT_SETTINGS[key],
      created_at: new Date().toISOString(),
    };
  });
}

/** Módulos habilitados de una lista de OrganizationModule. */
export function enabledModuleKeys(rows: OrganizationModule[]): ModuleKey[] {
  return rows.filter((r) => r.is_enabled).map((r) => r.module_key);
}

/** Etiqueta legible de un módulo (con fallback defensivo). */
export function moduleLabel(key: string): string {
  return MODULE_LABELS[key as ModuleKey] ?? key;
}
