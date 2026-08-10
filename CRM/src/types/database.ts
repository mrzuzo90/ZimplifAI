/**
 * ZimplifAI CRM — Tipos de base de datos (Supabase PostgreSQL).
 * Espejo de `supabase/migrations/01_init_schema.sql`.
 * Los literales son los valores de los enums de PostgreSQL.
 */

/* ============================= Enums ============================= */

export const USER_ROLES = ["super_admin", "client_admin", "client_member"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ORGANIZATION_STATUSES = ["active", "suspended", "trial"] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export const VERTICAL_TYPES = ["restaurant_booking", "service_lead_gen", "custom_agency"] as const;
export type VerticalType = (typeof VERTICAL_TYPES)[number];

export const LEAD_STATUSES = [
  "new",
  "ai_contacted",
  "qualified",
  "booked",
  "closed_won",
  "closed_lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const AUDIT_STATUSES = ["success", "error"] as const;
export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export const TIMELINE_EVENT_TYPES = [
  "whatsapp_received", "whatsapp_sent", "voice_note", "qr_scanned",
  "menu_viewed", "booking_created", "booking_confirmed", "booking_cancelled",
  "ai_action", "sla_breach", "sla_rescued", "form_submitted",
  "lead_created", "stage_changed", "deposit_requested", "deposit_paid",
] as const;
export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export const INSIGHT_SEVERITIES = ["info", "warning", "opportunity", "urgent"] as const;
export type InsightSeverity = (typeof INSIGHT_SEVERITIES)[number];

export const DEPOSIT_STATUSES = ["none", "pending", "paid", "refunded"] as const;
export type DepositStatus = (typeof DEPOSIT_STATUSES)[number];

export const DEFAULT_VERTICAL_COLORS: Record<VerticalType, string> = {
  restaurant_booking: "#CEFF00",
  service_lead_gen: "#6AB7FF",
  custom_agency: "#CEFF00",
};

export const VERTICAL_LABELS: Record<VerticalType, string> = {
  restaurant_booking: "Hostelería / Reservas",
  service_lead_gen: "Captación de leads",
  custom_agency: "Agencia a medida",
};

/** Claves canónicas de módulos verticales (feature flags por subcuenta). */
export const MODULE_KEYS = [
  "whatsapp_bot",
  "booking_calendar",
  "light_web_menu",
  "sales_kanban",
  "ai_logs",
  "workflow_automation",
  "unified_inbox",
  "calendar_scheduler",
  "sales_crm",
  "marketing_forms",
  "ai_copilot",
  "finance_suite",
  "reputation_mgmt",
  "roi_dashboard",
] as const;
export type ModuleKey = (typeof MODULE_KEYS)[number];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  whatsapp_bot: "Bot de WhatsApp",
  booking_calendar: "Calendario de reservas",
  light_web_menu: "Web ligera / Menú",
  sales_kanban: "Kanban de ventas",
  ai_logs: "Logs de IA",
  workflow_automation: "Workflows visuales",
  unified_inbox: "Bandeja unificada",
  calendar_scheduler: "Calendarios de citas",
  sales_crm: "CRM avanzado",
  marketing_forms: "Formularios y funnels",
  ai_copilot: "Copilot IA",
  finance_suite: "Facturación y cobros",
  reputation_mgmt: "Reputación online",
  roi_dashboard: "Dashboard ROI",
};

/** Tipos de evento del timeline de actividad por lead. */
export const ACTIVITY_EVENT_TYPES = [
  "lead_created",
  "stage_changed",
  "comment",
  "whatsapp_reply",
  "booking_confirmed",
  "follow_up_set",
] as const;
export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

export const ACTIVITY_LABELS: Record<ActivityEventType, string> = {
  lead_created: "Lead creado",
  stage_changed: "Cambio de estado",
  comment: "Nota",
  whatsapp_reply: "Respuesta de WhatsApp",
  booking_confirmed: "Reserva confirmada",
  follow_up_set: "Seguimiento programado",
};

/** Módulos por defecto por vertical: la sidebar y la provisión se adaptan a estos. */
export const VERTICAL_MODULES: Record<VerticalType, ModuleKey[]> = {
  restaurant_booking: [
    "whatsapp_bot",
    "booking_calendar",
    "light_web_menu",
    "workflow_automation",
    "calendar_scheduler",
    "unified_inbox",
    "finance_suite",
    "reputation_mgmt",
    "roi_dashboard",
  ],
  service_lead_gen: [
    "whatsapp_bot",
    "sales_kanban",
    "ai_logs",
    "workflow_automation",
    "unified_inbox",
    "sales_crm",
    "marketing_forms",
    "ai_copilot",
    "finance_suite",
    "reputation_mgmt",
    "roi_dashboard",
  ],
  custom_agency: [
    "whatsapp_bot",
    "sales_kanban",
    "ai_logs",
    "workflow_automation",
    "unified_inbox",
    "sales_crm",
    "marketing_forms",
    "ai_copilot",
    "finance_suite",
    "reputation_mgmt",
    "roi_dashboard",
  ],
};

/* ============================= Rows ============================= */

export type Organization = {
  id: string;
  name: string;
  slug: string;
  vertical_type: VerticalType;
  logo_url: string | null;
  primary_color: string;
  custom_domain: string | null;
  status: OrganizationStatus;
  api_key_hash: string | null;
  created_at: string;
}

export type Profile = {
  id: string; // referencia auth.users.id
  organization_id: string | null;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type Lead = {
  id: string;
  organization_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  deal_value: number | null;
  assigned_to: string | null;
  tags: string[];
  next_follow_up_at: string | null;
  company_id: string | null;
  pipeline_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  landing_page: string | null;
  referrer: string | null;
  created_at: string;
  updated_at: string;
}

/* ============================= CRM extendido (Fase E1) ============================= */

/** Empresa B2B a la que se asocian leads/contactos. */
export type Company = {
  id: string;
  organization_id: string;
  name: string;
  website: string | null;
  industry: string | null;
  phone: string | null;
  city: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Embuto de ventas configurable por subcuenta (Ventas, Eventos, Soporte…). */
export type Pipeline = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Etapa de un pipeline: referencia un LeadStatus canónico con nombre/orden propios. */
export type PipelineStage = {
  id: string;
  organization_id: string;
  pipeline_id: string;
  name: string;
  status: LeadStatus;
  position: number;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "medium", "high"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/** Tarea personal o vinculada a lead/empresa (alimenta el widget "Mi Día"). */
export type Task = {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  lead_id: string | null;
  company_id: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export type Booking = {
  id: string;
  organization_id: string;
  lead_id: string | null;
  calendar_id: string | null;
  booking_date: string;
  party_size_or_service: string | null;
  status: BookingStatus;
  notes: string | null;
  token: string | null;
  source: string | null;
  risk_score?: number;
  deposit_status?: DepositStatus;
  stripe_payment_intent_id?: string | null;
  created_at: string;
  updated_at: string;
}

/** Servicio/agenda concreto del negocio (Mesa, Terraza, Consulta legal…). */
export type Calendar = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  service_duration_min: number;
  color: string;
  is_active: boolean;
  settings: Record<string, unknown>;
  requires_deposit_on_high_risk?: boolean;
  deposit_amount_eur?: number;
  created_at: string;
  updated_at: string;
}

/** Franja de disponibilidad semanal de un calendario. */
export const CALENDAR_DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;
export type AvailabilityRule = {
  id: string;
  organization_id: string;
  calendar_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AiAgent = {
  id: string;
  organization_id: string;
  name: string;
  model: string;
  system_prompt: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AiAuditLog = {
  id: string;
  organization_id: string;
  lead_id: string | null;
  agent_name: string;
  input_payload: Record<string, unknown> | null;
  output_payload: Record<string, unknown> | null;
  tokens_used: number | null;
  status: AuditStatus;
  created_at: string;
}

/** Feature flag de un módulo dentro de una subcuenta. */
export type OrganizationModule = {
  id: string;
  organization_id: string;
  module_key: ModuleKey;
  is_enabled: boolean;
  settings: Record<string, unknown>;
  created_at: string;
}

/* ============================= Workflows (Fase A) ============================= */

/** Trigger que dispara un workflow. */
export const WORKFLOW_TRIGGERS = [
  "lead_created",
  "stage_changed",
  "booking_created",
  "message_incoming",
  "webhook",
  "schedule",
] as const;
export type WorkflowTriggerType = (typeof WORKFLOW_TRIGGERS)[number];

/** Tipos de nodo (acción) dentro de un workflow. */
export const WORKFLOW_NODE_TYPES = [
  "send_whatsapp",
  "send_email",
  "wait",
  "condition",
  "move_stage",
  "call_ai_agent",
  "webhook_out",
] as const;
export type WorkflowNodeType = (typeof WORKFLOW_NODE_TYPES)[number];

export const WORKFLOW_RUN_STATUSES = ["running", "completed", "failed"] as const;
export type WorkflowRunStatus = (typeof WORKFLOW_RUN_STATUSES)[number];

export const WORKFLOW_STEP_STATUSES = ["running", "completed", "failed", "skipped"] as const;
export type WorkflowStepStatus = (typeof WORKFLOW_STEP_STATUSES)[number];

/** Nodo de un workflow (trigger/acción/condición). */
export type WorkflowNode = {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config: Record<string, unknown>;
};

/** Arista entre nodos (flujo de ejecución). */
export type WorkflowEdge = {
  id: string;
  from: string;
  to: string;
};

export type Workflow = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  trigger_type: WorkflowTriggerType;
  trigger_config: Record<string, unknown>;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Ejecución de un workflow sobre un lead. */
export type WorkflowRun = {
  id: string;
  organization_id: string;
  workflow_id: string | null;
  lead_id: string | null;
  status: WorkflowRunStatus;
  started_at: string;
  finished_at: string | null;
}

/** Paso (nodo) ejecutado dentro de una run, con payloads re-ejecutables. */
export type WorkflowRunStep = {
  id: string;
  organization_id: string;
  workflow_run_id: string;
  node_id: string;
  input_payload: Record<string, unknown> | null;
  output_payload: Record<string, unknown> | null;
  status: WorkflowStepStatus;
  error_message: string | null;
  executed_at: string | null;
}

/** Plantilla vertical de workflow (copiada a subcuentas al provisionar). */
export type WorkflowTemplate = {
  id: string;
  name: string;
  vertical_type: VerticalType;
  trigger_type: WorkflowTriggerType;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/* ============================= Snapshots versionados, Usage y Marketplace (Fase G) ============================= */

/** Snapshot vertical con versionado y campos de marketplace. */
export type VerticalSnapshot = {
  id: string;
  organization_id: string;
  name: string;
  vertical_type: VerticalType;
  default_pipeline_stages: string[];
  default_ai_prompt: string | null;
  enabled_modules: string[];
  version: string;
  changelog: string | null;
  is_published: boolean;
  parent_snapshot_id: string | null;
  marketplace_category: string | null;
  marketplace_tags: string[];
  marketplace_price_monthly: number | null;
  marketplace_rating: number | null;
  marketplace_installs: number;
  created_at: string;
}

/** Contadores de uso mensual por tenant. */
export type OrganizationUsage = {
  id: string;
  organization_id: string;
  period: string; // 'YYYY-MM'
  leads_count: number;
  messages_count: number;
  ai_tokens_count: number;
  bookings_count: number;
  forms_count: number;
  emails_count: number;
  created_at: string;
  updated_at: string;
}

/** Límites de uso por plan. */
export type UsageLimits = {
  id: string;
  plan: 'free' | 'trial' | 'pro' | 'enterprise';
  max_leads_monthly: number;
  max_messages_monthly: number;
  max_ai_tokens_monthly: number;
  max_bookings_monthly: number;
  max_forms_monthly: number;
  max_emails_monthly: number;
  overage_policy: 'block' | 'allow' | 'bill';
  overage_price_per_unit: Record<string, number>;
  created_at: string;
  updated_at: string;
}

/** Marketplace de agencia: plantillas compartibles entre agencias. */
export type AgencyMarketplace = {
  id: string;
  snapshot_id: string;
  publisher_org_id: string;
  title: string;
  description: string | null;
  preview_images: string[];
  price_monthly: number;
  revenue_share_pct: number;
  status: 'draft' | 'pending_review' | 'published' | 'rejected' | 'archived';
  featured: boolean;
  requirements: string | null;
  demo_url: string | null;
  installs_count: number;
  rating_avg: number | null;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

/** Evento del timeline de un lead (quién hizo qué y cuándo). */
export type LeadActivity = {
  id: string;
  organization_id: string;
  lead_id: string | null;
  actor_id: string | null;
  actor_name: string | null;
  event_type: ActivityEventType;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/* ============================= Timeline unificado, Insights y Métricas (Fase J) ============================= */

/** Evento del timeline unificado (whatsapp, voice, QR, booking, AI, SLA). */
export type TimelineEvent = {
  id: string;
  organization_id: string;
  lead_id: string | null;
  event_type: TimelineEventType;
  title: string;
  description: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

/** Momento AI: sugerencia inteligente del agent runtime. */
export type InsightsMoment = {
  id: string;
  organization_id: string;
  lead_id: string | null;
  severity: InsightSeverity;
  title: string;
  reasoning: string;
  suggested_action: Record<string, unknown>;
  is_resolved: boolean;
  created_at: string;
}

/** Métricas diarias agregadas por tenant. */
export type MetricsDaily = {
  id: string;
  organization_id: string;
  date: string; // YYYY-MM-DD
  total_leads: number;
  total_bookings: number;
  attributed_revenue: number;
  ai_hours_saved: number;
  ai_tokens_used: number;
  speed_to_lead_avg_seconds: number;
  created_at: string;
}

/* ============================= AI Copilot, Scoring y Cost Dashboard (Fase H) ============================= */

// --- AI Copilot ---

/** Sesión de chat del AI Copilot. */
export type CopilotSession = {
  id: string;
  organization_id: string;
  user_id: string;
  title: string | null;
  context_type: 'general' | 'lead' | 'pipeline' | 'booking' | 'workflow' | 'analytics';
  context_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Mensaje individual dentro de una sesión del Copilot. */
export type CopilotMessage = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls: Array<Record<string, unknown>> | null;
  tool_call_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Tool/función disponible para el Copilot. */
export type CopilotTool = {
  id: string;
  name: string;
  description: string;
  parameters_schema: Record<string, unknown>;
  category: 'data' | 'action' | 'analytics' | 'workflow';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// --- Lead Scoring ---

/** Modelo de scoring configurable por tenant. */
export type ScoringModel = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  version: string;
  is_active: boolean;
  factors: Record<string, number>; // pesos: { engagement: 0.30, recency: 0.20, fit: 0.25, intent: 0.25 }
  thresholds: Record<string, number>; // umbrales: { hot: 80, warm: 50, cold: 0 }
  created_at: string;
  updated_at: string;
}

/** Score calculado para un lead según un modelo. */
export type LeadScore = {
  id: string;
  organization_id: string;
  lead_id: string;
  model_id: string;
  score: number; // 0-100
  label: 'hot' | 'warm' | 'cold';
  factors_breakdown: Record<string, unknown>; // detalle por factor
  calculated_at: string;
}

/** Historial de cambios de score para auditoría/tendencias. */
export type LeadScoreHistory = {
  id: string;
  organization_id: string;
  lead_id: string;
  model_id: string;
  previous_score: number | null;
  new_score: number;
  previous_label: string | null;
  new_label: 'hot' | 'warm' | 'cold';
  trigger: 'manual' | 'auto' | 'activity' | 'workflow';
  metadata: Record<string, unknown>;
  created_at: string;
}

// --- Cost Dashboard ---

/** Coste unitario por recurso (global o por tenant). */
export type UnitCost = {
  id: string;
  organization_id: string | null; // null = global/default
  resource_type: 'ai_tokens_input' | 'ai_tokens_output' | 'whatsapp_message' | 'whatsapp_session' | 'email_sent' | 'sms_sent' | 'voice_minute';
  unit: '1k_tokens' | 'message' | 'session' | 'email' | 'minute';
  cost_per_unit: number; // en EUR
  currency: string;
  is_active: boolean;
  effective_from: string; // date
  effective_to: string | null; // date
  created_at: string;
  updated_at: string;
}

/** Registro de consumo de un recurso (para cálculo de costes en tiempo real). */
export type ResourceUsage = {
  id: string;
  organization_id: string;
  resource_type: UnitCost['resource_type'];
  quantity: number;
  unit: UnitCost['unit'];
  cost_eur: number;
  related_id: string | null;
  related_type: 'lead' | 'message' | 'workflow_run' | 'booking' | 'email' | 'copilot_session' | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
  created_at: string;
}

/** Agregado diario de costes por tenant (materializado para dashboards rápidos). */
export type DailyCosts = {
  id: string;
  organization_id: string;
  date: string; // YYYY-MM-DD
  ai_tokens_input: number;
  ai_tokens_output: number;
  whatsapp_messages: number;
  whatsapp_sessions: number;
  emails_sent: number;
  sms_sent: number;
  voice_minutes: number;
  total_cost_eur: number;
  breakdown: Record<string, unknown>; // desglose por resource_type
  created_at: string;
  updated_at: string;
}

/* ============================= Facturación (Fase E2) ============================= */

export const QUOTE_STATUSES = ["draft", "sent", "accepted", "declined"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue", "cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const PAYMENT_METHODS = ["card", "transfer", "cash", "link"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Borrador",
  sent: "Enviado",
  accepted: "Aceptado",
  declined: "Rechazado",
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  card: "Tarjeta",
  transfer: "Transferencia",
  cash: "Efectivo",
  link: "Link de pago",
};

/** Presupuesto comercial (snapshot del cliente + líneas + totales). */
export type Quote = {
  id: string;
  organization_id: string;
  number: string;
  customer_id: string | null;
  customer_name: string;
  status: QuoteStatus;
  currency: string;
  tax_rate: number;
  subtotal_eur: number;
  tax_eur: number;
  total_eur: number;
  valid_until: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type QuoteItem = {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price_eur: number;
  line_total_eur: number;
  created_at: string;
}

/** Factura emitida al cliente; su estado avanza draft → sent → paid/overdue. */
export type Invoice = {
  id: string;
  organization_id: string;
  number: string;
  quote_id: string | null;
  customer_id: string | null;
  customer_name: string;
  status: InvoiceStatus;
  currency: string;
  tax_rate: number;
  subtotal_eur: number;
  tax_eur: number;
  total_eur: number;
  issue_date: string;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price_eur: number;
  line_total_eur: number;
  created_at: string;
}

/** Pago aplicado a una factura. */
export type Payment = {
  id: string;
  organization_id: string;
  invoice_id: string;
  amount_eur: number;
  method: PaymentMethod;
  reference: string | null;
  paid_at: string;
  created_at: string;
}

/* ============================= Reputación (Fase F) ============================= */

export const REVIEW_SOURCES = ["google", "whatsapp", "web"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

export const REVIEW_STATUSES = ["pending", "published", "archived"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const REVIEW_REQUEST_STATUSES = ["pending", "sent", "responded"] as const;
export type ReviewRequestStatus = (typeof REVIEW_REQUEST_STATUSES)[number];

export const REVIEW_SOURCE_LABELS: Record<ReviewSource, string> = {
  google: "Google",
  whatsapp: "WhatsApp",
  web: "Web",
};

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: "Pendiente",
  published: "Publicada",
  archived: "Archivada",
};

/** Reseña del negocio recogida de Google/WhatsApp/web, con respuesta opcional. */
export type Review = {
  id: string;
  organization_id: string;
  source: ReviewSource;
  rating: number;
  customer_name: string;
  content: string | null;
  reply_text: string | null;
  status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

/** Solicitud de reseña enviada a un cliente por un canal concreto. */
export type ReviewRequest = {
  id: string;
  organization_id: string;
  contact_id: string | null;
  contact_name: string;
  channel: "whatsapp" | "email" | "sms";
  status: ReviewRequestStatus;
  sent_at: string | null;
  responded_at: string | null;
  created_at: string;
}

/* ============================= Bandeja unificada (Fase B) ============================= */

/** Canales de mensajería de un hilo. */
export const MESSAGE_CHANNELS = ["whatsapp", "email", "instagram", "web"] as const;
export type MessageChannel = (typeof MESSAGE_CHANNELS)[number];

export const CHANNEL_LABELS: Record<MessageChannel, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  instagram: "Instagram",
  web: "Web",
};

/** Remitente de un mensaje. */
export const MESSAGE_SENDERS = ["lead", "agent", "member"] as const;
export type MessageSender = (typeof MESSAGE_SENDERS)[number];

export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export type MessageDirection = (typeof MESSAGE_DIRECTIONS)[number];

export const MESSAGE_STATUSES = ["sent", "delivered", "read", "failed"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const THREAD_STATUSES = ["open", "resolved"] as const;
export type ThreadStatus = (typeof THREAD_STATUSES)[number];

/** Conversación entre un lead (o contacto anónimo) y la subcuenta por un canal. */
export type MessageThread = {
  id: string;
  organization_id: string;
  lead_id: string | null;
  channel: MessageChannel;
  external_id: string | null;
  subject: string | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_count: number;
  status: ThreadStatus;
  created_at: string;
  updated_at: string;
}

/** Mensaje individual dentro de un hilo. */
export type Message = {
  id: string;
  organization_id: string;
  thread_id: string;
  channel: MessageChannel;
  sender: MessageSender;
  sender_name: string | null;
  direction: MessageDirection;
  body: string;
  status: MessageStatus;
  metadata: Record<string, unknown>;
  created_at: string;
}

/** Respuesta rápida reutilizable con variables {{var}}. */
export type MessageTemplate = {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  channel: MessageChannel;
  body: string;
  variables: string[];
  created_at: string;
  updated_at: string;
}

/** Hilo enriquecido con el lead vinculado (para la sidebar del inbox). */
export type MessageThreadWithLead = MessageThread & {
  lead?: Pick<Lead, "id" | "first_name" | "last_name" | "email" | "phone" | "status" | "tags" | "created_at"> | null;
}

/* ============================= Sitio web vertical (Fase light_web_editor) ============================= */

/** Plantillas de micro-website por vertical. */
export const SITE_VERTICAL_TEMPLATES = ["restaurant_menu", "service_catalog", "lead_funnel"] as const;
export type SiteVerticalTemplate = (typeof SITE_VERTICAL_TEMPLATES)[number];

export const SITE_TEMPLATE_LABELS: Record<SiteVerticalTemplate, string> = {
  restaurant_menu: "Gastronomía / Carta",
  service_catalog: "Servicios con precios",
  lead_funnel: "Captación de leads",
};

export type SiteHero = {
  headline: string;
  subheadline: string;
  badge: string;
  bg_image: string;
  cta_text: string;
};

export type SiteSectionFlags = {
  show_menu: boolean;
  show_hours: boolean;
  show_location: boolean;
  show_booking: boolean;
};

export type SiteMenuItem = {
  category: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type SiteBusinessHours = {
  day: string;
  hours: string;
};

export type SiteContact = {
  address: string;
  phone: string;
  whatsapp: string;
  google_maps_url: string;
};

export type TenantSiteContent = {
  hero: SiteHero;
  sections: SiteSectionFlags;
  menu_items: SiteMenuItem[];
  business_hours: SiteBusinessHours[];
  contact: SiteContact;
  /** URL pública del PDF de la carta / menú (se embebe en la web). */
  menu_pdf_url: string;
};

/** Micro-website white-label de una subcuenta. */
export type TenantSite = {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  vertical_template: SiteVerticalTemplate;
  is_published: boolean;
  custom_domain: string | null;
  seo_metadata: Record<string, unknown>;
  content_payload: TenantSiteContent;
  created_at: string;
  updated_at: string;
}

/* ============================= Forms y funnels (Fase D) ============================= */

/** Tipos de campo de un formulario de captación. */
export const FORM_FIELD_TYPES = ["text", "email", "phone", "textarea"] as const;
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

/** Campo configurable de un formulario. */
export type FormField = {
  key: string;
  label: string;
  type: FormFieldType;
  required: boolean;
};

/** Config de un formulario: campos + textos del botón / éxito. */
export type FormConfig = {
  fields: FormField[];
  button_text: string;
  success_message: string;
  redirect_url: string | null;
};

export const FORM_FIELD_LABELS: Record<FormFieldType, string> = {
  text: "Texto",
  email: "Email",
  phone: "Teléfono",
  textarea: "Área de texto",
};

/** Formulario de captación (standalone o embebido). */
export type MarketingForm = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  config: FormConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Atribución UTM de una captura. */
export type UtmAttribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  landing_page: string | null;
  referrer: string | null;
}

/** Envío de un formulario: lead creado + payload + atribución. */
export type FormSubmission = UtmAttribution & {
  id: string;
  organization_id: string;
  form_id: string | null;
  lead_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

/** Embudo de marketing: apunta a un formulario de captación. */
export type MarketingFunnel = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  landing_form_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/* ============================= Enriquecidos (joins UI) ============================= */

export type LeadWithProfile = Lead & {
  assigned_profile?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
}

export type BookingWithLead = Booking & {
  lead?: Pick<Lead, "id" | "first_name" | "last_name" | "email" | "phone"> | null;
}

export type OrganizationWithStats = Organization & {
  active_agents: number;
  total_leads: number;
  members: number;
  /** Módulos del tenant (para badges y feature management). */
  modules: OrganizationModule[];
}

export interface AdminOverview {
  totalOrganizations: number;
  /** Nº de módulos habilitados en todo el sistema. */
  activeModules: number;
  activeAgents: number;
  mrr: number;
  ingestedLeads30d: number;
  tenants: OrganizationWithStats[];
}

/* ============================= Database (Supabase genérico) ============================= */

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Partial<Organization>;
        Update: Partial<Organization>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      leads: {
        Row: Lead;
        Insert: Partial<Lead>;
        Update: Partial<Lead>;
        Relationships: [];
      };
      bookings: {
        Row: Booking;
        Insert: Partial<Booking>;
        Update: Partial<Booking>;
        Relationships: [];
      };
      calendars: {
        Row: Calendar;
        Insert: Partial<Calendar>;
        Update: Partial<Calendar>;
        Relationships: [];
      };
      availability_rules: {
        Row: AvailabilityRule;
        Insert: Partial<AvailabilityRule>;
        Update: Partial<AvailabilityRule>;
        Relationships: [];
      };
      ai_agents: {
        Row: AiAgent;
        Insert: Partial<AiAgent>;
        Update: Partial<AiAgent>;
        Relationships: [];
      };
      ai_audit_logs: {
        Row: AiAuditLog;
        Insert: Partial<AiAuditLog>;
        Update: Partial<AiAuditLog>;
        Relationships: [];
      };
      vertical_snapshots: {
        Row: VerticalSnapshot;
        Insert: Partial<VerticalSnapshot>;
        Update: Partial<VerticalSnapshot>;
        Relationships: [];
      };
      organization_usage: {
        Row: OrganizationUsage;
        Insert: Partial<OrganizationUsage>;
        Update: Partial<OrganizationUsage>;
        Relationships: [];
      };
      usage_limits: {
        Row: UsageLimits;
        Insert: Partial<UsageLimits>;
        Update: Partial<UsageLimits>;
        Relationships: [];
      };
      agency_marketplace: {
        Row: AgencyMarketplace;
        Insert: Partial<AgencyMarketplace>;
        Update: Partial<AgencyMarketplace>;
        Relationships: [];
      };
      organization_modules: {
        Row: OrganizationModule;
        Insert: Partial<OrganizationModule>;
        Update: Partial<OrganizationModule>;
        Relationships: [];
      };
      lead_activity: {
        Row: LeadActivity;
        Insert: Partial<LeadActivity>;
        Update: Partial<LeadActivity>;
        Relationships: [];
      };
      workflows: {
        Row: Workflow;
        Insert: Partial<Workflow>;
        Update: Partial<Workflow>;
        Relationships: [];
      };
      tenant_sites: {
        Row: TenantSite;
        Insert: Partial<TenantSite>;
        Update: Partial<TenantSite>;
        Relationships: [];
      };
      message_threads: {
        Row: MessageThread;
        Insert: Partial<MessageThread>;
        Update: Partial<MessageThread>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Partial<Message>;
        Update: Partial<Message>;
        Relationships: [];
      };
      message_templates: {
        Row: MessageTemplate;
        Insert: Partial<MessageTemplate>;
        Update: Partial<MessageTemplate>;
        Relationships: [];
      };
      workflow_runs: {
        Row: WorkflowRun;
        Insert: Partial<WorkflowRun>;
        Update: Partial<WorkflowRun>;
        Relationships: [];
      };
      workflow_run_steps: {
        Row: WorkflowRunStep;
        Insert: Partial<WorkflowRunStep>;
        Update: Partial<WorkflowRunStep>;
        Relationships: [];
      };
      companies: {
        Row: Company;
        Insert: Partial<Company>;
        Update: Partial<Company>;
        Relationships: [];
      };
      pipelines: {
        Row: Pipeline;
        Insert: Partial<Pipeline>;
        Update: Partial<Pipeline>;
        Relationships: [];
      };
      pipeline_stages: {
        Row: PipelineStage;
        Insert: Partial<PipelineStage>;
        Update: Partial<PipelineStage>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: Partial<Task>;
        Update: Partial<Task>;
        Relationships: [];
      };
      forms: {
        Row: MarketingForm;
        Insert: Partial<MarketingForm>;
        Update: Partial<MarketingForm>;
        Relationships: [];
      };
      form_submissions: {
        Row: FormSubmission;
        Insert: Partial<FormSubmission>;
        Update: Partial<FormSubmission>;
        Relationships: [];
      };
      funnels: {
        Row: MarketingFunnel;
        Insert: Partial<MarketingFunnel>;
        Update: Partial<MarketingFunnel>;
        Relationships: [];
      };
      copilot_sessions: {
        Row: CopilotSession;
        Insert: Partial<CopilotSession>;
        Update: Partial<CopilotSession>;
        Relationships: [];
      };
      copilot_messages: {
        Row: CopilotMessage;
        Insert: Partial<CopilotMessage>;
        Update: Partial<CopilotMessage>;
        Relationships: [];
      };
      copilot_tools: {
        Row: CopilotTool;
        Insert: Partial<CopilotTool>;
        Update: Partial<CopilotTool>;
        Relationships: [];
      };
      scoring_models: {
        Row: ScoringModel;
        Insert: Partial<ScoringModel>;
        Update: Partial<ScoringModel>;
        Relationships: [];
      };
      lead_scores: {
        Row: LeadScore;
        Insert: Partial<LeadScore>;
        Update: Partial<LeadScore>;
        Relationships: [];
      };
      lead_score_history: {
        Row: LeadScoreHistory;
        Insert: Partial<LeadScoreHistory>;
        Update: Partial<LeadScoreHistory>;
        Relationships: [];
      };
      unit_costs: {
        Row: UnitCost;
        Insert: Partial<UnitCost>;
        Update: Partial<UnitCost>;
        Relationships: [];
      };
      resource_usage: {
        Row: ResourceUsage;
        Insert: Partial<ResourceUsage>;
        Update: Partial<ResourceUsage>;
        Relationships: [];
      };
      daily_costs: {
        Row: DailyCosts;
        Insert: Partial<DailyCosts>;
        Update: Partial<DailyCosts>;
        Relationships: [];
      };
      quotes: {
        Row: Quote;
        Insert: Partial<Quote>;
        Update: Partial<Quote>;
        Relationships: [];
      };
      quote_items: {
        Row: QuoteItem;
        Insert: Partial<QuoteItem>;
        Update: Partial<QuoteItem>;
        Relationships: [];
      };
      invoices: {
        Row: Invoice;
        Insert: Partial<Invoice>;
        Update: Partial<Invoice>;
        Relationships: [];
      };
      invoice_items: {
        Row: InvoiceItem;
        Insert: Partial<InvoiceItem>;
        Update: Partial<InvoiceItem>;
        Relationships: [];
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment>;
        Update: Partial<Payment>;
        Relationships: [];
      };
      reviews: {
        Row: Review;
        Insert: Partial<Review>;
        Update: Partial<Review>;
        Relationships: [];
      };
      review_requests: {
        Row: ReviewRequest;
        Insert: Partial<ReviewRequest>;
        Update: Partial<ReviewRequest>;
        Relationships: [];
      };
      timeline_events: {
        Row: TimelineEvent;
        Insert: Partial<TimelineEvent>;
        Update: Partial<TimelineEvent>;
        Relationships: [];
      };
      insights_moments: {
        Row: InsightsMoment;
        Insert: Partial<InsightsMoment>;
        Update: Partial<InsightsMoment>;
        Relationships: [];
      };
      metrics_daily: {
        Row: MetricsDaily;
        Insert: Partial<MetricsDaily>;
        Update: Partial<MetricsDaily>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      impersonate_organization: { Args: { target_org_id: string }; Returns: void };
      current_org_id: { Args: Record<string, never>; Returns: string };
      is_super_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      organization_status: OrganizationStatus;
      vertical_type: VerticalType;
      lead_status: LeadStatus;
      booking_status: BookingStatus;
      audit_status: AuditStatus;
    };
  };
}
