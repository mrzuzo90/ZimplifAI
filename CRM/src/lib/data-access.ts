import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { fireWorkflowTriggers } from "@/lib/workflow-runtime";
import {
  addAgent,
  addAvailabilityRule,
  addBooking,
  addCalendar,
  addCompany,
  addCopilotMessage,
  addCopilotSession,
  addForm,
  addFormSubmission,
  addFunnel,
  addInsightsMoment,
  addInvoice,
  addInvoiceItem,
  addLead,
  addLeadScoreHistory,
  addMarketplaceItem,
  addMessage,
  addMessageTemplate,
  addPayment,
  addThread,
  addPipeline,
  addPipelineStage,
  addQuote,
  addQuoteItem,
  addResourceUsage,
  addReview,
  addReviewRequest,
  addScoringModel,
  addSnapshot,
  addTask,
  addTimelineEvent,
  addWorkflow,
  addWorkflowRunStep,
  deleteMessagingBot,
  ensureOrgModules,
  findBookingByToken,
  getCopilotSession,
  getCurrentUsage,
  getDb,
  getForm,
  getFormBySlug,
  getImpersonatingOrgId,
  getOrg,
  getSnapshot,
  getThread,
  getUsageLimits,
  incrementUsage,
  listActivity,
  listAgents,
  listAudit,
  listAvailabilityRules,
  listBookings,
  listCalendars,
  listCompanies,
  listCopilotMessages,
  listCopilotSessions,
  listCopilotTools,
  listDailyCosts,
  listFormSubmissions,
  listForms,
  listFunnels,
  listInsightsMoments,
  listInvoiceItems,
  listInvoices,
  listLeadScoreHistory,
  listLeadScores,
  listLeads,
  listMarketplace,
  listMessageTemplates,
  listMessages,
  listMessagingBots,
  listMetricsDaily,
  listModules,
  listOrgs,
  listPayments,
  listPipelineStages,
  listPipelines,
  listPublishedMarketplace,
  listQuoteItems,
  listQuotes,
  listResourceUsage,
  listReviewRequests,
  listReviews,
  listScoringModels,
  listSites,
  listSnapshots,
  listTasks,
  listThreads,
  listTimelineEvents,
  listUnitCosts,
  listUsage,
  listUsageLimits,
  listWorkflowRunSteps,
  listWorkflowRuns,
  listWorkflows,
  patchAgent,
  patchAvailabilityRule,
  patchBooking,
  patchCalendar,
  patchCompany,
  patchCopilotSession,
  patchForm,
  patchFunnel,
  patchInvoice,
  patchLead,
  patchMarketplaceItem,
  patchMessageTemplate,
  patchPipeline,
  patchPipelineStage,
  patchQuote,
  patchReview,
  patchReviewRequest,
  patchScoringModel,
  patchSite,
  patchSnapshot,
  patchTask,
  patchThread,
  patchWorkflow,
  prependAudit,
  pushActivity,
  removeAvailabilityRule as mockRemoveAvailabilityRule,
  removeCalendar as mockRemoveCalendar,
  removeCompany as mockRemoveCompany,
  removeForm as mockRemoveForm,
  removeFunnel as mockRemoveFunnel,
  removeMarketplaceItem,
  removeMessageTemplate,
  removePipeline as mockRemovePipeline,
  removePipelineStage as mockRemovePipelineStage,
  removeTask as mockRemoveTask,
  removeWorkflow,
  resolveInsightMoment,
  setActiveOrgId,
  setImpersonatingOrgId,
  setModuleEnabled as mockSetModuleEnabled,
  setModuleSettings as mockSetModuleSettings,
  setSitePublished as mockSetSitePublished,
  upsertLeadScore,
  upsertMessagingBot,
  upsertMetricsDaily,
  upsertOrg,
  upsertSite,
  upsertUsage,
} from "@/lib/mock-store";
import { FORM_SLUGS, MOCK_API_KEYS, MOCK_TENANT_STATS, mockSnapshots } from "@/lib/mock-data";
import { applySnapshot, generateApiKey, buildWebhookUrl, type ProvisionInput } from "@/lib/provisioning";
import type {
  ActivityEventType,
  AdminOverview,
  AgencyMarketplace,
  AiAgent,
  AiAuditLog,
  AvailabilityRule,
  Booking,
  Calendar,
  Company,
  ConnectVoiceAgentResult,
  CopilotMessage,
  CopilotSession,
  CopilotTool,
  DailyCosts,
  FormSubmission,
  InsightsMoment,
  Invoice,
  InvoiceItem,
  Lead,
  LeadActivity,
  LeadScore,
  LeadScoreHistory,
  MarketingForm,
  MarketingFunnel,
  MetricsDaily,
  MessagingBot,
  MessagingChannel,
  OrganizationUsage,
  UtmAttribution,
  VoiceSessionState,
  VoiceTurnResponse,
  Message,
  MessageChannel,
  MessageTemplate,
  MessageThread,
  MessageThreadWithLead,
  ModuleKey,
  Organization,
  OrganizationModule,
  OrganizationWithStats,
  Payment,
  Pipeline,
  PipelineStage,
  Quote,
  QuoteItem,
  ResourceUsage,
  Review,
  ReviewRequest,
  ScoringModel,
  SiteVerticalTemplate,
  Task,
  TenantSite,
  ThreadStatus,
  TimelineEvent,
  UnitCost,
  UsageLimits,
  VerticalSnapshot,
  Workflow,
  WorkflowRun,
  WorkflowRunStep,
  WorkflowTriggerType,
} from "@/types/database";
import { createVerticalWorkflowTemplate, executeNode } from "@/lib/workflows";
import { SITE_LEAD_SOURCE, defaultContentForTemplate, slugify } from "@/lib/site";
import { generateReplySuggestion, pickActiveAgentName, threadPreview, extractVariables } from "@/lib/inbox";
import { buildDaySlots, generateBookingToken, type DaySlot } from "@/lib/booking";
import { shortId } from "@/lib/utils";

/** La app opera en modo demo cuando Supabase no está configurado. */
export const isDemoMode = () => !isSupabaseConfigured();

/* ========================= Organizaciones ========================= */

export async function fetchOrganizations(): Promise<Organization[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb.from("organizations").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listOrgs();
}

/** Vista agregada para el panel SuperAdmin (KPIs + tabla de tenants). */
export async function fetchAdminOverview(): Promise<AdminOverview> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const [orgs, agents, leads, modules, profiles] = await Promise.all([
      sb.from("organizations").select("*").order("created_at", { ascending: false }),
      sb.from("ai_agents").select("organization_id, is_active"),
      sb.from("leads").select("organization_id, deal_value, status, created_at"),
      sb.from("organization_modules").select("*"),
      sb.from("profiles").select("organization_id"),
    ]);
    if (orgs.error) throw orgs.error;
    const orgRows = orgs.data ?? [];
    const agentRows = agents.data ?? [];
    const leadRows = leads.data ?? [];
    const moduleRows = modules.data ?? [];
    const profileRows = profiles.data ?? [];

    const tenants: OrganizationWithStats[] = orgRows.map((o) => {
      const orgAgents = agentRows.filter((a) => a.organization_id === o.id);
      const orgLeads = leadRows.filter((l) => l.organization_id === o.id);
      return {
        ...o,
        active_agents: orgAgents.filter((a) => a.is_active).length,
        total_leads: orgLeads.length,
        members: profileRows.filter((p) => p.organization_id === o.id).length,
        modules: moduleRows.filter((m) => m.organization_id === o.id),
      };
    });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
    return {
      totalOrganizations: orgRows.length,
      activeModules: moduleRows.filter((m) => m.is_enabled).length,
      activeAgents: agentRows.filter((a) => a.is_active).length,
      mrr: leadRows
        .filter((l) => l.status === "closed_won")
        .reduce((acc, l) => acc + (l.deal_value ?? 0), 0),
      ingestedLeads30d: leadRows.filter((l) => l.created_at >= thirtyDaysAgo).length,
      tenants,
    };
  }

  // --- Modo demo ---
  const orgs = listOrgs();
  const tenants: OrganizationWithStats[] = orgs.map((o) => {
    const stats = MOCK_TENANT_STATS[o.id] ?? { active_agents: 0, total_leads: 0, members: 0, mrr: 0, ingested_30d: 0 };
    return { ...o, ...stats, modules: listModules(o.id) };
  });
  const activeModules = tenants.reduce(
    (acc, t) => acc + t.modules.filter((m) => m.is_enabled).length,
    0
  );
  return {
    totalOrganizations: tenants.length,
    activeModules,
    activeAgents: tenants.reduce((acc, t) => acc + t.active_agents, 0),
    mrr: tenants.reduce((acc, t) => acc + (MOCK_TENANT_STATS[t.id]?.mrr ?? 0), 0),
    ingestedLeads30d: tenants.reduce((acc, t) => acc + (MOCK_TENANT_STATS[t.id]?.ingested_30d ?? 0), 0),
    tenants,
  };
}

export async function fetchOrganization(orgId: string): Promise<Organization> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb.from("organizations").select("*").eq("id", orgId).single();
    if (error) throw error;
    return data;
  }
  const org = getOrg(orgId);
  if (!org) throw new Error("Organización no encontrada");
  return org;
}

/* ========================= Leads ========================= */

export async function fetchLeads(orgId: string): Promise<Lead[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("leads")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listLeads(orgId);
}

export async function updateLeadStatus(orgId: string, leadId: string, status: Lead["status"]) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data: prevRow } = await sb
      .from("leads")
      .select("status")
      .eq("id", leadId)
      .eq("organization_id", orgId)
      .maybeSingle();
    const { error } = await sb
      .from("leads")
      .update({ status })
      .eq("id", leadId)
      .eq("organization_id", orgId);
    if (error) throw error;
    if (prevRow?.status && prevRow.status !== status) {
      await recordLeadActivity(orgId, leadId, "stage_changed", "Cambio de estado", {
        from: prevRow.status,
        to: status,
      });
    }
    return;
  }
  const prev = listLeads(orgId).find((l) => l.id === leadId)?.status;
  patchLead(leadId, { status });
  if (prev && prev !== status) {
    await recordLeadActivity(orgId, leadId, "stage_changed", "Cambio de estado", {
      from: prev,
      to: status,
    });
  }
}

export async function createLead(
  orgId: string,
  input: Omit<
    Lead,
    | "id"
    | "organization_id"
    | "created_at"
    | "updated_at"
    | "next_follow_up_at"
    | "company_id"
    | "pipeline_id"
    | "utm_source"
    | "utm_medium"
    | "utm_campaign"
    | "utm_term"
    | "utm_content"
    | "landing_page"
    | "referrer"
  > & {
    next_follow_up_at?: string | null;
    company_id?: string | null;
    pipeline_id?: string | null;
  } & Partial<UtmAttribution>
) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("leads")
      .insert({ ...input, organization_id: orgId })
      .select()
      .single();
    if (error) throw error;
    await recordLeadActivity(orgId, data.id, "lead_created", "Lead creado");
    await fireWorkflowTriggers(orgId, "lead_created", { leadId: data.id }, sb);
    return data;
  }
  const created: Lead = {
    ...input,
    id: `lead_${shortId()}`,
    organization_id: orgId,
    next_follow_up_at: input.next_follow_up_at ?? null,
    company_id: input.company_id ?? null,
    pipeline_id: input.pipeline_id ?? null,
    utm_source: input.utm_source ?? null,
    utm_medium: input.utm_medium ?? null,
    utm_campaign: input.utm_campaign ?? null,
    utm_term: input.utm_term ?? null,
    utm_content: input.utm_content ?? null,
    landing_page: input.landing_page ?? null,
    referrer: input.referrer ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  addLead(created);
  await recordLeadActivity(orgId, created.id, "lead_created", "Lead creado");
  await fireWorkflowTriggers(orgId, "lead_created", { leadId: created.id }, sb);
  return created;
}

/** Edición inline de un lead (valor, seguimiento, responsable, tags, empresa, pipeline). No dispara evento. */
export async function updateLead(
  orgId: string,
  leadId: string,
  patch: Partial<Pick<
    Lead,
    "status" | "deal_value" | "next_follow_up_at" | "assigned_to" | "tags" | "company_id" | "pipeline_id"
  >>
) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("leads")
      .update(patch)
      .eq("id", leadId)
      .eq("organization_id", orgId);
    if (error) throw error;
    if (patch.status) await fireWorkflowTriggers(orgId, "stage_changed", { leadId }, sb);
    return;
  }
  patchLead(leadId, patch);
  if (patch.status) await fireWorkflowTriggers(orgId, "stage_changed", { leadId }, sb);
}

/* ========================= Actividad (timeline por lead) ========================= */

export async function fetchActivity(orgId: string, leadId: string): Promise<LeadActivity[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("lead_activity")
      .select("*")
      .eq("organization_id", orgId)
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listActivity(orgId, leadId);
}

export async function addActivity(
  orgId: string,
  input: {
    lead_id?: string | null;
    actor_id?: string | null;
    actor_name?: string | null;
    event_type: ActivityEventType;
    summary: string;
    metadata?: Record<string, unknown>;
  }
): Promise<LeadActivity> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("lead_activity")
      .insert({ ...input, organization_id: orgId, metadata: input.metadata ?? {} })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const created: LeadActivity = {
    id: `act_${shortId()}`,
    organization_id: orgId,
    lead_id: input.lead_id ?? null,
    actor_id: input.actor_id ?? null,
    actor_name: input.actor_name ?? null,
    event_type: input.event_type,
    summary: input.summary,
    metadata: input.metadata ?? {},
    created_at: new Date().toISOString(),
  };
  pushActivity(created);
  return created;
}

/** Registra un evento del timeline de un lead (actor por defecto: sistema/agente). */
export async function recordLeadActivity(
  orgId: string,
  leadId: string,
  eventType: ActivityEventType,
  summary: string,
  metadata: Record<string, unknown> = {}
) {
  await addActivity(orgId, {
    lead_id: leadId,
    actor_name: "Sistema",
    event_type: eventType,
    summary,
    metadata,
  });
}

/* ========================= Bookings ========================= */

export async function fetchBookings(orgId: string): Promise<Booking[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("bookings")
      .select("*")
      .eq("organization_id", orgId)
      .order("booking_date", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listBookings(orgId);
}

export async function updateBookingStatus(orgId: string, bookingId: string, status: Booking["status"]) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("bookings")
      .update({ status })
      .eq("id", bookingId)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchBooking(bookingId, { status });
}

/** Actualiza el estado de depósito anti-no-show de una reserva (dual). */
export async function updateBookingDeposit(
  orgId: string,
  bookingId: string,
  depositStatus: NonNullable<Booking["deposit_status"]>
) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("bookings")
      .update({ deposit_status: depositStatus })
      .eq("id", bookingId)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchBooking(bookingId, { deposit_status: depositStatus });
}

/** Ejecuta una acción derivada de una nota de voz: crea lead + reserva + evento de timeline. */
export async function executeVoiceAction(
  orgId: string,
  action: { type: string; payload: Record<string, unknown>; confidence: number }
): Promise<{ type: string; booking?: Booking; event: TimelineEvent; skipped?: string }> {
  // Acciones que no son reserva: solo se registran en el timeline como ai_action.
  if (action.type !== "create_booking") {
    const event = await recordTimelineEvent(orgId, {
      event_type: "ai_action",
      title: `Acción de voz: ${action.type}`,
      description: JSON.stringify(action.payload),
      payload: { channel: "voice_note", action },
    });
    return { type: action.type, event };
  }

  const calendars = await fetchCalendars(orgId);
  const calendar = calendars[0] ?? null;
  if (!calendar) {
    const event = await recordTimelineEvent(orgId, {
      event_type: "ai_action",
      title: "Reserva por voz sin calendario",
      description: "No hay calendario configurado; la acción se registró sin crear reserva.",
      payload: { channel: "voice_note", action },
    });
    return { type: action.type, event, skipped: "no_calendar" };
  }

  const partySize = Math.max(1, Number(action.payload.party_size ?? 2));
  const phone = String(action.payload.phone ?? "+34 600 00 00 00");
  const bookingDate = buildVoiceBookingDate(String(action.payload.datetime ?? ""));
  const note = String(action.payload.note ?? "Reserva por nota de voz");

  const lead = await createLead(orgId, {
    first_name: "Cliente (voz)",
    last_name: null,
    email: null,
    phone,
    status: "booked",
    deal_value: 0,
    assigned_to: null,
    tags: ["Voz"],
  });

  const booking = await createBooking(orgId, {
    lead_id: lead.id,
    calendar_id: calendar.id,
    booking_date: bookingDate.toISOString(),
    party_size_or_service: `${partySize} personas`,
    status: "confirmed",
    notes: note,
    source: "voice",
  });

  const event = await recordTimelineEvent(orgId, {
    lead_id: lead.id,
    event_type: "ai_action",
    title: "Reserva creada por voz",
    description: `Nota de voz → reserva para ${partySize} personas en ${calendar.name}`,
    payload: { channel: "voice_note", action, booking_id: booking.id, calendar_name: calendar.name },
  });

  return { type: action.type, booking, event };
}

/**
 * Resuelve la fecha de reserva de una nota de voz.
 * Si `hhmm` es "21:30" → próximo sábado a esa hora; sin hora válida → mañana a las 12:00.
 */
function buildVoiceBookingDate(hhmm: string): Date {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  const now = new Date();
  if (!match) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d;
  }
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const d = new Date(now);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

export async function createBooking(
  orgId: string,
  booking: Omit<Booking, "id" | "organization_id" | "created_at" | "updated_at" | "calendar_id" | "token" | "source"> & {
    calendar_id?: string | null;
    token?: string | null;
    source?: string;
  }
): Promise<Booking> {
  const normalized: Omit<Booking, "id" | "organization_id" | "created_at" | "updated_at"> = {
    ...booking,
    calendar_id: booking.calendar_id ?? null,
    token: booking.token ?? generateBookingToken(),
    source: booking.source ?? "manual",
  };
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("bookings")
      .insert({ ...normalized, organization_id: orgId })
      .select()
      .single();
    if (error) throw error;
    await recordBookingConfirmed(orgId, normalized, data);
    await fireWorkflowTriggers(
      orgId,
      "booking_created",
      { leadId: normalized.lead_id, bookingId: data.id },
      sb
    );
    return data;
  }
  const created: Booking = {
    ...normalized,
    id: `bk_${shortId()}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  addBooking(created);
  await recordBookingConfirmed(orgId, normalized, created);
  await fireWorkflowTriggers(
    orgId,
    "booking_created",
    { leadId: normalized.lead_id, bookingId: created.id },
    sb
  );
  return created;
}

/** Registra `booking_confirmed` cuando la reserva nace confirmada y ligada a un lead. */
async function recordBookingConfirmed(
  orgId: string,
  input: Omit<Booking, "id" | "organization_id" | "created_at" | "updated_at">,
  created: Booking
) {
  if (input.status !== "confirmed" || !input.lead_id) return;
  await recordLeadActivity(orgId, input.lead_id, "booking_confirmed", "Reserva confirmada", {
    booking_id: created.id,
    party_size_or_service: input.party_size_or_service,
  });
}

/* ========================= Agentes IA ========================= */

export async function fetchAgents(orgId: string): Promise<AiAgent[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("ai_agents")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listAgents(orgId);
}

export async function updateAgent(orgId: string, agentId: string, patch: Partial<Pick<AiAgent, "is_active" | "model" | "system_prompt" | "name">>) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("ai_agents")
      .update(patch)
      .eq("id", agentId)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchAgent(agentId, patch);
}

/* ========================= Audit logs ========================= */

export async function fetchAuditLogs(orgId: string, limit = 60): Promise<AiAuditLog[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("ai_audit_logs")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }
  return listAudit(orgId).slice(0, limit);
}

/** Inserta una entrada de audit (stream de agentes IA). Nunca rompe la acción que la origina. */
export async function pushAuditEntry(entry: Omit<AiAuditLog, "id" | "created_at">) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    try {
      await sb.from("ai_audit_logs").insert(entry);
    } catch (e) {
      console.error("pushAuditEntry falló:", e);
    }
    return;
  }
  prependAudit({
    ...entry,
    id: `aud_${shortId()}`,
    created_at: new Date().toISOString(),
  });
}

/* ========================= Workflows (Fase A) ========================= */

export interface WorkflowInput {
  name: string;
  description?: string | null;
  trigger_type: WorkflowTriggerType;
  trigger_config?: Record<string, unknown>;
  nodes: Workflow["nodes"];
  edges: Workflow["edges"];
  is_active?: boolean;
}

export async function fetchWorkflows(orgId: string): Promise<Workflow[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("workflows")
      .select("*")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listWorkflows(orgId);
}

export async function createWorkflow(orgId: string, input: WorkflowInput): Promise<Workflow> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("workflows")
      .insert({
        organization_id: orgId,
        name: input.name,
        description: input.description ?? null,
        trigger_type: input.trigger_type,
        trigger_config: input.trigger_config ?? {},
        nodes: input.nodes,
        edges: input.edges,
        is_active: input.is_active ?? true,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const now = new Date().toISOString();
  const created: Workflow = {
    id: `wf_${shortId()}`,
    organization_id: orgId,
    name: input.name,
    description: input.description ?? null,
    trigger_type: input.trigger_type,
    trigger_config: input.trigger_config ?? {},
    nodes: input.nodes,
    edges: input.edges,
    is_active: input.is_active ?? true,
    created_at: now,
    updated_at: now,
  };
  addWorkflow(created);
  return created;
}

export async function updateWorkflow(
  orgId: string,
  workflowId: string,
  patch: Partial<Omit<Workflow, "id" | "organization_id" | "created_at" | "updated_at">>
) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("workflows")
      .update(patch)
      .eq("id", workflowId)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchWorkflow(workflowId, patch);
}

export async function toggleWorkflow(orgId: string, workflowId: string, isActive: boolean) {
  await updateWorkflow(orgId, workflowId, { is_active: isActive });
}

export async function deleteWorkflow(orgId: string, workflowId: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("workflows")
      .delete()
      .eq("id", workflowId)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  removeWorkflow(workflowId);
}

export async function fetchWorkflowRuns(orgId: string, workflowId?: string): Promise<WorkflowRun[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    let query = sb.from("workflow_runs").select("*").eq("organization_id", orgId);
    if (workflowId) query = query.eq("workflow_id", workflowId);
    const { data, error } = await query.order("started_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listWorkflowRuns(orgId, workflowId);
}

export async function fetchWorkflowRunSteps(orgId: string, runId: string): Promise<WorkflowRunStep[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("workflow_run_steps")
      .select("*")
      .eq("organization_id", orgId)
      .eq("workflow_run_id", runId)
      .order("executed_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listWorkflowRunSteps(orgId, runId);
}

/** Lead único por id (helper para la re-ejecución de pasos). */
async function fetchLeadById(orgId: string, leadId: string): Promise<Lead | null> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }
  return listLeads(orgId).find((l) => l.id === leadId) ?? null;
}

/**
 * Re-ejecuta un paso de una run con su payload de entrada original.
 * Ejecuta el nodo de forma determinista (modo demo) y persiste el resultado
 * como un nuevo paso con timestamp actual.
 */
export async function reRunWorkflowStep(orgId: string, runId: string, stepId: string): Promise<WorkflowRunStep> {
  const sb = getSupabaseBrowserClient();
  const run = await (sb
    ? (async () => {
        const { data, error } = await sb
          .from("workflow_runs")
          .select("*")
          .eq("id", runId)
          .eq("organization_id", orgId)
          .single();
        if (error) throw error;
        return data;
      })()
    : Promise.resolve(listWorkflowRuns(orgId).find((r) => r.id === runId)));
  if (!run) throw new Error("Run no encontrada");

  const step = await (sb
    ? (async () => {
        const { data, error } = await sb
          .from("workflow_run_steps")
          .select("*")
          .eq("id", stepId)
          .eq("organization_id", orgId)
          .single();
        if (error) throw error;
        return data;
      })()
    : Promise.resolve(listWorkflowRunSteps(orgId, runId).find((s) => s.id === stepId)));
  if (!step) throw new Error("Paso no encontrado");

  const workflow = await (sb
    ? (async () => {
        const { data, error } = await sb
          .from("workflows")
          .select("*")
          .eq("id", run.workflow_id ?? "")
          .eq("organization_id", orgId)
          .maybeSingle();
        if (error) throw error;
        return data ?? null;
      })()
    : Promise.resolve(listWorkflows(orgId).find((w) => w.id === run.workflow_id) ?? null));

  const node = workflow?.nodes.find((n) => n.id === step.node_id);
  if (!node) throw new Error("Nodo no encontrado en el workflow");

  const lead = run.lead_id ? await fetchLeadById(orgId, run.lead_id) : null;
  const agents = await fetchAgents(orgId);
  const result = executeNode(node, lead, { agents });

  if (sb) {
    const { data, error } = await sb
      .from("workflow_run_steps")
      .insert({
        organization_id: orgId,
        workflow_run_id: runId,
        node_id: step.node_id,
        input_payload: step.input_payload,
        output_payload: result.output,
        status: result.status,
        error_message: result.error ?? null,
        executed_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const created: WorkflowRunStep = {
    id: `step_${shortId()}`,
    organization_id: orgId,
    workflow_run_id: runId,
    node_id: step.node_id,
    input_payload: step.input_payload,
    output_payload: result.output,
    status: result.status,
    error_message: result.error ?? null,
    executed_at: new Date().toISOString(),
  };
  addWorkflowRunStep(created);
  return created;
}

/* ========================= Bandeja unificada (Fase B) ========================= */

/** Hilos del tenant enriquecidos con el lead vinculado (ordenados por último mensaje). */
export async function fetchThreads(orgId: string): Promise<MessageThreadWithLead[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const [threadsRes, leadsRes] = await Promise.all([
      sb.from("message_threads").select("*").eq("organization_id", orgId).order("last_message_at", { ascending: false }),
      sb.from("leads").select("id, first_name, last_name, email, phone, status, tags, created_at").eq("organization_id", orgId),
    ]);
    if (threadsRes.error) throw threadsRes.error;
    if (leadsRes.error) throw leadsRes.error;
    const leads = leadsRes.data ?? [];
    return (threadsRes.data ?? []).map((t) => ({
      ...t,
      lead: leads.find((l) => l.id === t.lead_id) ?? null,
    }));
  }
  const leads = listLeads(orgId);
  return listThreads(orgId).map((t) => ({
    ...t,
    lead: t.lead_id ? leads.find((l) => l.id === t.lead_id) ?? null : null,
  }));
}

/** Mensajes de un hilo (ascendentes, para leer en orden). */
export async function fetchMessages(orgId: string, threadId: string): Promise<Message[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("messages")
      .select("*")
      .eq("organization_id", orgId)
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listMessages(orgId, threadId);
}

/** Envía una respuesta al hilo (outbound) y actualiza el preview del hilo. */
export async function sendMessage(
  orgId: string,
  threadId: string,
  input: { body: string; channel: MessageChannel; sender: "member" | "agent"; sender_name: string }
) {
  const body = input.body.trim();
  if (!body) throw new Error("Mensaje vacío");
  const sb = getSupabaseBrowserClient();
  const now = new Date().toISOString();
  const preview = threadPreview(body);

  if (sb) {
    const threadRes = await sb
      .from("message_threads")
      .select("lead_id")
      .eq("id", threadId)
      .eq("organization_id", orgId)
      .maybeSingle();
    const { data, error } = await sb
      .from("messages")
      .insert({
        organization_id: orgId,
        thread_id: threadId,
        channel: input.channel,
        sender: input.sender,
        sender_name: input.sender_name,
        direction: "outbound",
        body,
        status: "sent",
      })
      .select()
      .single();
    if (error) throw error;
    await sb
      .from("message_threads")
      .update({ last_message_at: now, last_message_preview: preview })
      .eq("id", threadId);
    const leadId = threadRes.data?.lead_id ?? null;
    if (leadId) {
      await recordLeadActivity(orgId, leadId, "whatsapp_reply", "Respuesta enviada desde la bandeja", {
        channel: input.channel,
        thread_id: threadId,
      });
    }
    return data;
  }

  const created: Message = {
    id: `msg_${shortId()}`,
    organization_id: orgId,
    thread_id: threadId,
    channel: input.channel,
    sender: input.sender,
    sender_name: input.sender_name,
    direction: "outbound",
    body,
    status: "sent",
    metadata: {},
    created_at: now,
  };
  addMessage(created);
  const leadId = getThread(orgId, threadId)?.lead_id ?? null;
  if (leadId) {
    await recordLeadActivity(orgId, leadId, "whatsapp_reply", "Respuesta enviada desde la bandeja", {
      channel: input.channel,
      thread_id: threadId,
    });
  }
  return created;
}

/** Marca el hilo como leído (unread_count → 0). */
export async function markThreadRead(orgId: string, threadId: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    await sb
      .from("message_threads")
      .update({ unread_count: 0 })
      .eq("id", threadId)
      .eq("organization_id", orgId);
    return;
  }
  patchThread(threadId, { unread_count: 0 });
}

/** Abre o resuelve un hilo. */
export async function setThreadResolved(orgId: string, threadId: string, status: ThreadStatus) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    await sb
      .from("message_threads")
      .update({ status })
      .eq("id", threadId)
      .eq("organization_id", orgId);
    return;
  }
  patchThread(threadId, { status });
}

/** Crea un hilo nuevo (p.ej. al abrir conversación con un lead que no tiene uno). */
export async function createMessageThread(
  orgId: string,
  input: {
    lead_id?: string | null;
    channel: MessageChannel;
    external_id?: string | null;
    subject?: string | null;
    last_message_preview?: string | null;
    unread_count?: number;
    status?: ThreadStatus;
  }
): Promise<MessageThread> {
  const now = new Date().toISOString();
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("message_threads")
      .insert({
        organization_id: orgId,
        lead_id: input.lead_id ?? null,
        channel: input.channel,
        external_id: input.external_id ?? null,
        subject: input.subject ?? null,
        last_message_at: now,
        last_message_preview: input.last_message_preview ?? null,
        unread_count: input.unread_count ?? 0,
        status: input.status ?? "open",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const created: MessageThread = {
    id: `thread_${shortId()}`,
    organization_id: orgId,
    lead_id: input.lead_id ?? null,
    channel: input.channel,
    external_id: input.external_id ?? null,
    subject: input.subject ?? null,
    last_message_at: now,
    last_message_preview: input.last_message_preview ?? null,
    unread_count: input.unread_count ?? 0,
    status: input.status ?? "open",
    created_at: now,
    updated_at: now,
  };
  addThread(created);
  return created;
}

/** Plantillas de respuesta rápida del tenant. */
export async function fetchMessageTemplates(orgId: string): Promise<MessageTemplate[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("message_templates")
      .select("*")
      .eq("organization_id", orgId)
      .order("category", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listMessageTemplates(orgId);
}

export async function saveMessageTemplate(
  orgId: string,
  input: { name: string; category: string; channel: MessageChannel; body: string }
) {
  const body = input.body.trim();
  const variables = extractVariables(body);
  const sb = getSupabaseBrowserClient();
  const now = new Date().toISOString();
  if (sb) {
    const { data, error } = await sb
      .from("message_templates")
      .insert({
        organization_id: orgId,
        name: input.name.trim(),
        category: input.category.trim() || "general",
        channel: input.channel,
        body,
        variables,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const created: MessageTemplate = {
    id: `tpl_${shortId()}`,
    organization_id: orgId,
    name: input.name.trim(),
    category: input.category.trim() || "general",
    channel: input.channel,
    body,
    variables,
    created_at: now,
    updated_at: now,
  };
  addMessageTemplate(created);
  return created;
}

export async function deleteMessageTemplate(orgId: string, templateId: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    await sb.from("message_templates").delete().eq("id", templateId).eq("organization_id", orgId);
    return;
  }
  removeMessageTemplate(templateId);
}

/** Actualiza una plantilla (name/category/channel/body) re-extrae variables si cambia el body. */
export async function updateMessageTemplate(
  orgId: string,
  templateId: string,
  input: Partial<Pick<MessageTemplate, "name" | "category" | "channel" | "body">>
) {
  const body = input.body?.trim();
  const patch: Partial<MessageTemplate> = { ...input };
  if (input.name) patch.name = input.name.trim();
  if (input.category) patch.category = input.category.trim() || "general";
  if (body !== undefined) {
    patch.body = body;
    patch.variables = extractVariables(body);
  }
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("message_templates")
      .update(patch)
      .eq("id", templateId)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchMessageTemplate(templateId, patch);
}

export interface ReplySuggestionResult {
  reply: string;
  intent: string;
  intentLabel: string;
  tokens: number;
  agentName: string | null;
}

/**
 * Copilot IA: genera una sugerencia de respuesta para el último mensaje
 * entrante usando el contexto del hilo, el lead y el agente activo.
 * Registra la consulta en los audit logs (mismo rastro que el agente).
 */
export async function suggestAiReply(orgId: string, threadId: string, businessName: string): Promise<ReplySuggestionResult> {
  const sb = getSupabaseBrowserClient();
  const thread = await (sb
    ? (async () => {
        const { data, error } = await sb
          .from("message_threads")
          .select("*")
          .eq("id", threadId)
          .eq("organization_id", orgId)
          .single();
        if (error) throw error;
        return data as MessageThread;
      })()
    : Promise.resolve(getThread(orgId, threadId)));
  if (!thread) throw new Error("Hilo no encontrado");

  const messages = await fetchMessages(orgId, threadId);
  const lead = thread.lead_id ? await fetchLeadById(orgId, thread.lead_id) : null;
  const agents = await fetchAgents(orgId);
  const agentName = pickActiveAgentName(agents);

  const { reply, intent, intentLabel, tokens } = generateReplySuggestion({
    thread,
    messages,
    lead,
    agentName,
    businessName,
  });

  await pushAuditEntry({
    organization_id: orgId,
    lead_id: thread.lead_id,
    agent_name: agentName ?? "AI Reply Copilot",
    input_payload: { type: "suggest_reply", channel: thread.channel, last_inbound: messages.at(-1)?.body ?? null },
    output_payload: { reply, intent, tokens_used: tokens },
    tokens_used: tokens,
    status: "success",
  });

  return { reply, intent, intentLabel, tokens, agentName };
}

/* ========================= Sitio web vertical (light_web_editor) ========================= */

export interface TenantSiteInput {
  title?: string;
  slug?: string;
  vertical_template?: SiteVerticalTemplate;
  seo_metadata?: Record<string, unknown>;
  content_payload?: TenantSite["content_payload"];
}

/** Devuelve el sitio de la subcuenta (uno por tenant) o null. */
export async function fetchTenantSite(orgId: string): Promise<TenantSite | null> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("tenant_sites")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }
  return listSites(orgId)[0] ?? null;
}

/** Crea el sitio por defecto de la subcuenta (si no existe). */
export async function ensureTenantSite(orgId: string, template: SiteVerticalTemplate = "restaurant_menu", title?: string): Promise<TenantSite> {
  const existing = await fetchTenantSite(orgId);
  if (existing) return existing;

  const slug = slugify(title ?? "mi-sitio-web");
  const content = defaultContentForTemplate(template);
  const now = new Date().toISOString();

  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("tenant_sites")
      .insert({
        organization_id: orgId,
        title: title ?? "Mi Sitio Web",
        slug: `${slug}-${orgId.slice(0, 6)}`,
        vertical_template: template,
        is_published: true,
        custom_domain: null,
        seo_metadata: { meta_title: title ?? "Mi Sitio Web", meta_description: content.hero.subheadline },
        content_payload: content,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const site: TenantSite = {
    id: `site_${orgId}`,
    organization_id: orgId,
    title: title ?? "Mi Sitio Web",
    slug: `${slug}-${orgId.slice(0, 6)}`,
    vertical_template: template,
    is_published: true,
    custom_domain: null,
    seo_metadata: { meta_title: title ?? "Mi Sitio Web", meta_description: content.hero.subheadline },
    content_payload: content,
    created_at: now,
    updated_at: now,
  };
  upsertSite(site);
  return site;
}

export async function updateTenantSite(orgId: string, siteId: string, patch: TenantSiteInput) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("tenant_sites")
      .update(patch)
      .eq("id", siteId)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchSite(siteId, patch);
}

export async function setSitePublished(orgId: string, siteId: string, isPublished: boolean) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("tenant_sites")
      .update({ is_published: isPublished })
      .eq("id", siteId)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  mockSetSitePublished(siteId, isPublished);
}

/** Crea un lead desde el formulario del sitio público. */
export async function createSiteLead(
  orgId: string,
  input: { first_name: string; phone: string; email?: string; message?: string }
) {
  const sb = getSupabaseBrowserClient();
  const base = {
    first_name: input.first_name.trim() || null,
    last_name: null,
    email: input.email?.trim() || null,
    phone: input.phone.trim() || null,
    status: "new" as const,
    deal_value: null,
    assigned_to: null,
    tags: [SITE_LEAD_SOURCE],
    next_follow_up_at: null,
  };
  if (sb) {
    const { error } = await sb.from("leads").insert({ ...base, organization_id: orgId });
    if (error) throw error;
    return;
  }
  await createLead(orgId, base);
  return;
}

/* ========================= Snapshots ========================= */

/* ========================= Módulos (feature flags) ========================= */

export async function fetchModules(orgId: string): Promise<OrganizationModule[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("organization_modules")
      .select("*")
      .eq("organization_id", orgId);
    if (error) throw error;
    return data ?? [];
  }
  return listModules(orgId);
}

export async function setModuleEnabled(orgId: string, moduleKey: ModuleKey, isEnabled: boolean) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data: existing } = await sb
      .from("organization_modules")
      .select("id, settings")
      .eq("organization_id", orgId)
      .eq("module_key", moduleKey)
      .maybeSingle();
    if (existing) {
      const { error } = await sb
        .from("organization_modules")
        .update({ is_enabled: isEnabled })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await sb.from("organization_modules").insert({
        organization_id: orgId,
        module_key: moduleKey,
        is_enabled: isEnabled,
      });
      if (error) throw error;
    }
    return;
  }
  mockSetModuleEnabled(orgId, moduleKey, isEnabled);
}

export async function setModuleSettings(orgId: string, moduleKey: ModuleKey, settings: Record<string, unknown>) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data: existing } = await sb
      .from("organization_modules")
      .select("id")
      .eq("organization_id", orgId)
      .eq("module_key", moduleKey)
      .maybeSingle();
    if (existing) {
      const { error } = await sb
        .from("organization_modules")
        .update({ settings })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await sb.from("organization_modules").insert({
        organization_id: orgId,
        module_key: moduleKey,
        is_enabled: true,
        settings,
      });
      if (error) throw error;
    }
    return;
  }
  mockSetModuleSettings(orgId, moduleKey, settings);
}

/** Info del webhook de ingesta para copiar desde el directorio de agencia. */
export async function getIngestWebhookInfo(orgId: string): Promise<{ webhookUrl: string; apiKey: string | null }> {
  if (!isSupabaseConfigured()) {
    const apiKey = MOCK_API_KEYS[orgId] ?? null;
    return { webhookUrl: buildWebhookUrl(orgId, apiKey ?? ""), apiKey };
  }
  // En producción la API key plana solo se muestra una vez en provisión.
  return { webhookUrl: buildWebhookUrl(orgId, ""), apiKey: null };
}

/* ========================= Provisión 1-Click ========================= */

export async function provisionOrganization(input: ProvisionInput) {
  if (!isSupabaseConfigured()) {
    // --- Modo demo: simula la provisión localmente ---
    await new Promise((r) => setTimeout(r, 900)); // latencia del motor
    const snapshot = mockSnapshots.find((s) => s.id === input.snapshotId) ?? mockSnapshots[0];
    const config = applySnapshot(snapshot);
    const { plain, hash } = generateApiKey();
    const org: Organization = {
      id: `org_${shortId()}`,
      name: input.clientName,
      slug: input.slug,
      vertical_type: snapshot.vertical_type,
      logo_url: null,
      primary_color: "#CEFF00",
      custom_domain: null,
      status: "trial",
      api_key_hash: hash,
      created_at: new Date().toISOString(),
    };
    upsertOrg(org);
    ensureOrgModules(org.id, config.enabledModules as ModuleKey[]);
    config.agents.forEach((agent) =>
      addAgent({
        id: `ag_${shortId()}`,
        organization_id: org.id,
        name: agent.name,
        model: agent.model,
        system_prompt: agent.system_prompt,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    );
    // Fase A: copia la plantilla de workflow por defecto de la vertical.
    if ((config.enabledModules as string[]).includes("workflow_automation")) {
      const template = createVerticalWorkflowTemplate(snapshot.vertical_type);
      const now = new Date().toISOString();
      addWorkflow({
        id: `wf_${shortId()}`,
        organization_id: org.id,
        name: template.name,
        description: template.description,
        trigger_type: template.trigger_type,
        trigger_config: template.trigger_config,
        nodes: template.nodes,
        edges: template.edges,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }
    // Fase light_web_editor: crea el micro-website por defecto de la vertical.
    if ((config.enabledModules as string[]).includes("light_web_menu")) {
      await ensureTenantSite(
        org.id,
        snapshot.vertical_type === "restaurant_booking" ? "restaurant_menu" : "service_catalog",
        org.name
      );
    }
    const webhookUrl = `/api/v1/webhooks/ingest?org_id=${org.id}&key=${plain}`;
    return {
      organization: org,
      pipelineStages: config.pipelineStages,
      agents: config.agents,
      enabledModules: config.enabledModules,
      webhookUrl,
      apiKey: plain,
    };
  }

  const res = await fetch("/api/provision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error ?? "Error al aprovisionar");
  return payload;
}

/* ========================= Impersonación ========================= */

export async function impersonate(orgId: string) {
  if (!isSupabaseConfigured()) {
    setImpersonatingOrgId(orgId);
    setActiveOrgId(orgId);
    return { ok: true, orgId };
  }
  const res = await fetch("/api/admin/impersonate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orgId }),
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error ?? "Error al impersonar");
  return payload;
}

export async function stopImpersonating() {
  if (!isSupabaseConfigured()) {
    setImpersonatingOrgId(null);
    return { ok: true };
  }
  const res = await fetch("/api/admin/impersonate", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  const payload = await res.json();
  if (!res.ok) throw new Error(payload.error ?? "Error al salir de impersonación");
  return payload;
}

export function currentImpersonation(): string | null {
  return getImpersonatingOrgId();
}

/* ========================= Calendarios de citas (Fase C) ========================= */

/** Calendarios de un tenant (servicios/agendas). */
export async function fetchCalendars(orgId: string): Promise<Calendar[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("calendars")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listCalendars(orgId);
}

export async function saveCalendar(
  orgId: string,
  input: Omit<Calendar, "id" | "organization_id" | "created_at" | "updated_at">
): Promise<Calendar> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("calendars")
      .insert({ ...input, organization_id: orgId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const created: Calendar = {
    ...input,
    id: `cal_${shortId()}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  addCalendar(created);
  return created;
}

export async function updateCalendar(orgId: string, id: string, patch: Partial<Calendar>) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("calendars").update(patch).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchCalendar(id, patch);
}

export async function removeCalendar(orgId: string, id: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("calendars").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  mockRemoveCalendar(id);
}

/** Franjas de disponibilidad de un calendario (o de todos si no se filtra). */
export async function fetchAvailabilityRules(orgId: string, calendarId?: string): Promise<AvailabilityRule[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    let query = sb.from("availability_rules").select("*").eq("organization_id", orgId).order("day_of_week");
    if (calendarId) query = query.eq("calendar_id", calendarId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }
  return listAvailabilityRules(orgId, calendarId);
}

export async function saveAvailabilityRule(
  orgId: string,
  input: Omit<AvailabilityRule, "id" | "organization_id" | "created_at" | "updated_at">
): Promise<AvailabilityRule> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("availability_rules")
      .insert({ ...input, organization_id: orgId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const created: AvailabilityRule = {
    ...input,
    id: `rule_${shortId()}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  addAvailabilityRule(created);
  return created;
}

export async function updateAvailabilityRule(orgId: string, id: string, patch: Partial<AvailabilityRule>) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("availability_rules").update(patch).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchAvailabilityRule(id, patch);
}

export async function removeAvailabilityRule(orgId: string, id: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("availability_rules").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  mockRemoveAvailabilityRule(id);
}

/* ---------- Reserva pública /b/[slug] ---------- */

/** Contexto público de reserva de un negocio por slug (organización + calendarios activos). */
export async function fetchPublicBookingContext(slug: string): Promise<{
  org: Organization;
  calendars: Calendar[];
} | null> {
  const sb = getServiceSupabase();
  if (sb) {
    const { data: org, error } = await sb
      .from("organizations")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!org) return null;
    const { data: calendars } = await sb
      .from("calendars")
      .select("*")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("created_at");
    return { org, calendars: calendars ?? [] };
  }
  const org = getOrg(slugToOrgId(slug));
  if (!org) return null;
  return { org, calendars: listCalendars(org.id).filter((c) => c.is_active) };
}

/** Mapa slug → id de organización para el modo demo (el mock usa ids estables). */
function slugToOrgId(slug: string): string {
  const byName: Record<string, string> = {
    "brasa-carbon": "org_brasa",
    "baremo-estudio": "org_baremo",
    "mamared-dental": "org_mamare",
    "kluster-gym": "org_kluster",
    "tenzo-sushi": "org_tenzo",
    "demo-agency": "org_demo",
  };
  return byName[slug] ?? slug;
}

/** Slots disponibles de un calendario en una fecha concreta (público). */
export async function fetchPublicAvailability(
  orgId: string,
  calendarId: string,
  date: string
): Promise<DaySlot[]> {
  const dayOfWeek = new Date(date + "T12:00:00").getDay();
  const sb = getServiceSupabase();
  if (sb) {
    const calendar = await sb.from("calendars").select("*").eq("id", calendarId).maybeSingle();
    const rulesRes = await sb
      .from("availability_rules")
      .select("*")
      .eq("organization_id", orgId)
      .eq("calendar_id", calendarId)
      .eq("is_active", true);
    const bookingsRes = await sb
      .from("bookings")
      .select("*")
      .eq("organization_id", orgId)
      .eq("calendar_id", calendarId)
      .not("status", "eq", "cancelled");
    if (rulesRes.error) throw rulesRes.error;
    const duration = (calendar.data?.service_duration_min ?? 60) as number;
    const slotMinutes = (calendar.data?.settings?.slot_minutes ?? 30) as number;
    const dayBookings = (bookingsRes.data ?? []).filter(
      (b) => new Date(b.booking_date).toISOString().slice(0, 10) === date
    );
    return buildDaySlots({
      rules: rulesRes.data ?? [],
      dayOfWeek,
      bookings: dayBookings,
      durationMin: duration,
      slotMinutes,
    });
  }
  const calendar = listCalendars(orgId).find((c) => c.id === calendarId);
  const rules = listAvailabilityRules(orgId, calendarId).filter((r) => r.is_active);
  const dayBookings = listBookings(orgId).filter(
    (b) => b.calendar_id === calendarId && b.status !== "cancelled" && b.booking_date.slice(0, 10) === date
  );
  return buildDaySlots({
    rules,
    dayOfWeek,
    bookings: dayBookings,
    durationMin: calendar?.service_duration_min ?? 60,
    slotMinutes: Number(calendar?.settings?.slot_minutes ?? 30),
  });
}

export interface PublicBookingInput {
  calendar_id: string;
  first_name: string;
  last_name?: string;
  phone: string;
  email?: string;
  party_size: number;
  date: string;
  time: string;
}

/** Crea una reserva pública: localiza/crea el lead por teléfono y genera el token de gestión. */
export async function createPublicBooking(
  orgId: string,
  input: PublicBookingInput
): Promise<Booking> {
  const bookingDate = new Date(`${input.date}T${input.time}:00`).toISOString();
  const party = input.party_size > 1 ? `${input.party_size} personas` : "1 persona";

  // 1) Lead (dedupe por teléfono dentro del tenant).
  let leadId: string | null = null;
  const sb = getServiceSupabase();
  if (sb) {
    const { data: existing } = await sb
      .from("leads")
      .select("id")
      .eq("organization_id", orgId)
      .eq("phone", input.phone)
      .maybeSingle();
    if (existing) {
      leadId = existing.id as string;
    } else {
      const { data: lead, error: leadError } = await sb
        .from("leads")
        .insert({
          organization_id: orgId,
          first_name: input.first_name,
          last_name: input.last_name ?? null,
          phone: input.phone,
          email: input.email ?? null,
          status: "booked",
          tags: ["Web"],
          deal_value: null,
        })
        .select("id")
        .single();
      if (leadError) throw leadError;
      leadId = lead.id as string;
    }
  } else {
    const existing = listLeads(orgId).find((l) => l.phone === input.phone);
    if (existing) {
      leadId = existing.id;
      patchLead(existing.id, { status: "booked" });
    } else {
      const created = await createLead(orgId, {
        first_name: input.first_name,
        last_name: input.last_name ?? null,
        email: input.email ?? null,
        phone: input.phone,
        status: "booked",
        deal_value: 0,
        assigned_to: null,
        tags: ["Web"],
      });
      leadId = created.id;
    }
  }

  // 2) Reserva con token + source público.
  const booking = await createBooking(orgId, {
    lead_id: leadId,
    calendar_id: input.calendar_id,
    booking_date: bookingDate,
    party_size_or_service: party,
    status: "confirmed",
    notes: "Reserva online",
    source: "public",
  });

  await recordLeadActivity(orgId, leadId, "booking_confirmed", "Reserva confirmada online", {
    booking_id: booking.id,
    party_size: party,
  });

  return booking;
}

/** Devuelve una reserva por token de gestión (con calendario y negocio para mostrarla). */
export async function fetchBookingByToken(token: string): Promise<
  | (Booking & { calendar_name: string | null; org_name: string })
  | null
> {
  const sb = getServiceSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("bookings")
      .select("*, calendars(name), organizations(name)")
      .eq("token", token)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const booking = data as unknown as Booking;
    const calendarName = (data as unknown as { calendars?: { name?: string } | null }).calendars?.name ?? null;
    const orgName = (data as unknown as { organizations?: { name?: string } | null }).organizations?.name ?? "";
    return { ...booking, calendar_name: calendarName, org_name: orgName };
  }
  const booking = findBookingByToken(token);
  if (!booking) return null;
  const calendar = listCalendars(booking.organization_id).find((c) => c.id === booking.calendar_id);
  const org = getOrg(booking.organization_id);
  return {
    ...booking,
    calendar_name: calendar?.name ?? null,
    org_name: org?.name ?? "",
  };
}

/** Cancela una reserva pública por token (solo si sigue pendiente/confirmada). */
export async function cancelBookingByToken(token: string): Promise<Booking> {
  const sb = getServiceSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("token", token)
      .in("status", ["pending", "confirmed"])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const booking = findBookingByToken(token);
  if (!booking) throw new Error("Reserva no encontrada");
  patchBooking(booking.id, { status: "cancelled" });
  return { ...booking, status: "cancelled" };
}

/** Reagenda una reserva pública por token a una nueva fecha/hora. */
export async function rescheduleBookingByToken(token: string, newDate: string, newTime: string): Promise<Booking> {
  const bookingDate = new Date(`${newDate}T${newTime}:00`).toISOString();
  const sb = getServiceSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("bookings")
      .update({ booking_date: bookingDate, status: "confirmed" })
      .eq("token", token)
      .in("status", ["pending", "confirmed"])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const booking = findBookingByToken(token);
  if (!booking) throw new Error("Reserva no encontrada");
  patchBooking(booking.id, { booking_date: bookingDate, status: "confirmed" });
  return { ...booking, booking_date: bookingDate, status: "confirmed" };
}

/* ========================= CRM extendido (Fase E1) ========================= */

type CompanyInput = Omit<Company, "id" | "organization_id" | "created_at" | "updated_at">;

export async function fetchCompanies(orgId: string): Promise<Company[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("companies")
      .select("*")
      .eq("organization_id", orgId)
      .order("name");
    if (error) throw error;
    return data ?? [];
  }
  return listCompanies(orgId);
}

export async function saveCompany(orgId: string, input: CompanyInput): Promise<Company> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("companies")
      .insert({ ...input, organization_id: orgId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const company: Company = {
    ...input,
    id: `comp_${shortId()}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  addCompany(company);
  return company;
}

export async function updateCompany(orgId: string, id: string, patch: Partial<CompanyInput>) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("companies")
      .update(patch)
      .eq("id", id)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchCompany(id, patch);
}

export async function removeCompany(orgId: string, id: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("companies").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  mockRemoveCompany(id);
}

/* ----- Pipelines + etapas ----- */

export async function fetchPipelines(orgId: string): Promise<Pipeline[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("pipelines")
      .select("*")
      .eq("organization_id", orgId)
      .order("is_default", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listPipelines(orgId);
}

export async function fetchPipelineStages(orgId: string, pipelineId?: string): Promise<PipelineStage[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    let q = sb
      .from("pipeline_stages")
      .select("*")
      .eq("organization_id", orgId)
      .order("position");
    if (pipelineId) q = q.eq("pipeline_id", pipelineId);
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  }
  return listPipelineStages(orgId, pipelineId);
}

/** Crea un pipeline y sus etapas iniciales en una sola operación (demo y prod). */
export async function savePipeline(
  orgId: string,
  input: Omit<Pipeline, "id" | "organization_id" | "is_default" | "created_at" | "updated_at"> & {
    is_default?: boolean;
    stages: { name: string; status: PipelineStage["status"]; position: number; color?: string | null }[];
  }
): Promise<Pipeline> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { stages, ...pipelineFields } = input;
    const { data, error } = await sb
      .from("pipelines")
      .insert({
        ...pipelineFields,
        organization_id: orgId,
        is_default: input.is_default ?? false,
      })
      .select()
      .single();
    if (error) throw error;
    if (stages.length > 0) {
      await sb.from("pipeline_stages").insert(
        stages.map((s) => ({
          organization_id: orgId,
          pipeline_id: data.id,
          name: s.name,
          status: s.status,
          position: s.position,
          color: s.color ?? null,
        }))
      );
    }
    return data;
  }
  const pipeline: Pipeline = {
    id: `pl_${shortId()}`,
    organization_id: orgId,
    name: input.name,
    description: input.description ?? null,
    is_default: input.is_default ?? false,
    is_active: input.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  addPipeline(pipeline);
  input.stages.forEach((s, i) =>
    addPipelineStage({
      id: `stg_${pipeline.id}_${i}`,
      organization_id: orgId,
      pipeline_id: pipeline.id,
      name: s.name,
      status: s.status,
      position: s.position,
      color: s.color ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
  );
  return pipeline;
}

export async function updatePipeline(orgId: string, id: string, patch: Partial<Pipeline>) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("pipelines").update(patch).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchPipeline(id, patch);
}

export async function removePipeline(orgId: string, id: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("pipelines").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  mockRemovePipeline(id);
}

export async function createPipelineStage(
  orgId: string,
  pipelineId: string,
  input: { name: string; status: PipelineStage["status"]; position: number; color?: string | null }
): Promise<PipelineStage> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("pipeline_stages")
      .insert({ ...input, organization_id: orgId, pipeline_id: pipelineId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const stage: PipelineStage = {
    id: `stg_${pipelineId}_${shortId()}`,
    organization_id: orgId,
    pipeline_id: pipelineId,
    name: input.name,
    status: input.status,
    position: input.position,
    color: input.color ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  addPipelineStage(stage);
  return stage;
}

export async function updatePipelineStage(orgId: string, id: string, patch: Partial<PipelineStage>) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("pipeline_stages")
      .update(patch)
      .eq("id", id)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchPipelineStage(id, patch);
}

export async function removePipelineStage(orgId: string, id: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("pipeline_stages").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  mockRemovePipelineStage(id);
}

/* ----- Tareas (widget "Mi Día") ----- */

type TaskInput = Omit<Task, "id" | "organization_id" | "created_at" | "updated_at">;

export async function fetchTasks(orgId: string): Promise<Task[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("tasks")
      .select("*")
      .eq("organization_id", orgId)
      .order("due_date", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listTasks(orgId);
}

export async function saveTask(orgId: string, input: TaskInput): Promise<Task> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("tasks")
      .insert({ ...input, organization_id: orgId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const task: Task = {
    ...input,
    id: `task_${shortId()}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  addTask(task);
  return task;
}

export async function updateTask(orgId: string, id: string, patch: Partial<TaskInput>) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("tasks").update(patch).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchTask(id, patch);
}

export async function removeTask(orgId: string, id: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("tasks").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  mockRemoveTask(id);
}

/* ============================================================
   Fase D — Forms, funnels y atribución UTM
   ============================================================ */

type FormInput = Omit<MarketingForm, "id" | "organization_id" | "created_at" | "updated_at">;

export async function fetchForms(orgId: string): Promise<MarketingForm[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("forms")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listForms(orgId);
}

export async function saveForm(orgId: string, input: FormInput): Promise<MarketingForm> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("forms")
      .insert({ ...input, organization_id: orgId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const form: MarketingForm = {
    ...input,
    id: `form_${shortId()}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  addForm(form);
  return form;
}

export async function updateForm(orgId: string, id: string, patch: Partial<FormInput>) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("forms").update(patch).eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchForm(id, patch);
}

export async function removeForm(orgId: string, id: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("forms").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  mockRemoveForm(id);
}

type FunnelInput = Omit<MarketingFunnel, "id" | "organization_id" | "created_at" | "updated_at">;

export async function fetchFunnels(orgId: string): Promise<MarketingFunnel[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("funnels")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listFunnels(orgId);
}

export async function saveFunnel(orgId: string, input: FunnelInput): Promise<MarketingFunnel> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("funnels")
      .insert({ ...input, organization_id: orgId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const funnel: MarketingFunnel = {
    ...input,
    id: `funnel_${shortId()}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  addFunnel(funnel);
  return funnel;
}

export async function updateFunnel(orgId: string, id: string, patch: Partial<FunnelInput>) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("funnels")
      .update(patch)
      .eq("id", id)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchFunnel(id, patch);
}

export async function removeFunnel(orgId: string, id: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("funnels").delete().eq("id", id).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  mockRemoveFunnel(id);
}

export async function fetchFormSubmissions(orgId: string, formId?: string): Promise<FormSubmission[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    let query = sb.from("form_submissions").select("*").eq("organization_id", orgId);
    if (formId) query = query.eq("form_id", formId);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listFormSubmissions(orgId, formId);
}

/** Contexto público de un formulario por slug (para la página /f/[slug]). */
export async function fetchPublicFormContext(slug: string): Promise<{
  org: Organization;
  form: MarketingForm;
} | null> {
  const sb = getServiceSupabase();
  if (sb) {
    const { data: form, error } = await sb.from("forms").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!form) return null;
    const { data: org } = await sb
      .from("organizations")
      .select("*")
      .eq("id", form.organization_id)
      .maybeSingle();
    if (!org) return null;
    return { org, form };
  }
  // 1) Formularios creados en demo: se resuelven por slug desde el store mock,
  //    de modo que cualquier form nuevo del workspace funciona en /f/<slug>.
  const formBySlug = getFormBySlug(slug);
  if (formBySlug) {
    const org = getOrg(formBySlug.organization_id);
    if (org) return { org, form: formBySlug };
    return null;
  }
  // 2) Fallback a los slugs demo predefinidos (FORM_SLUGS).
  const mapped = FORM_SLUGS[slug];
  if (!mapped) return null;
  const org = getOrg(mapped.orgId);
  const form = getForm(mapped.formId);
  if (!org || !form || !form.is_active) return null;
  return { org, form };
}

/* ----- Envío público de formularios ----- */

export type PublicFormSubmitInput = {
  orgId: string;
  formId: string;
  formSlug: string;
  payload: Record<string, unknown>;
  attribution: Partial<UtmAttribution>;
};

export type PublicFormSubmitResult = {
  leadId: string | null;
  submissionId: string;
  created: boolean;
};

/** Normaliza teléfono para dedupe (solo dígitos, con prefijo 34 si falta). */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return `34${digits}`;
  return digits;
}

function leadFromPayload(payload: Record<string, unknown>) {
  const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
  const first_name =
    str(payload.first_name) ?? str(payload.nombre) ?? str(payload.name) ?? str(payload.full_name) ?? null;
  const last_name = str(payload.last_name) ?? str(payload.apellidos) ?? str(payload.apellido) ?? null;
  const email = str(payload.email) ?? null;
  const phone = str(payload.phone) ?? str(payload.telefono) ?? str(payload.tel) ?? null;
  const message = str(payload.message) ?? str(payload.mensaje) ?? str(payload.comentario) ?? null;
  return { first_name, last_name, email, phone, message };
}

/**
 * Rama demo del envío público: dedupe por email/teléfono, crea el lead con
 * atribución UTM + tag "Web" y registra la submission.
 */
async function submitPublicFormDemo(
  orgId: string,
  formId: string,
  payload: Record<string, unknown>,
  attribution: Partial<UtmAttribution>
): Promise<PublicFormSubmitResult> {
  const { first_name, last_name, email, phone, message } = leadFromPayload(payload);

  // Dedupe: si ya existe un lead con ese email o teléfono, reutilizarlo.
  const existing = listLeads(orgId).find((l) => {
    if (email && l.email && l.email.toLowerCase() === email.toLowerCase()) return true;
    if (phone && l.phone && normalizePhone(l.phone) === normalizePhone(phone)) return true;
    return false;
  });

  let leadId = existing?.id ?? null;
  if (!existing) {
    const created = await createLead(orgId, {
      first_name,
      last_name,
      email,
      phone,
      status: "new",
      deal_value: null,
      assigned_to: null,
      tags: ["Web"],
      ...attribution,
    });
    leadId = created.id;
    if (message) {
      await recordLeadActivity(orgId, created.id, "comment", `Mensaje del formulario: ${message}`);
    }
  } else if (message) {
    await recordLeadActivity(orgId, existing.id, "comment", `Mensaje del formulario: ${message}`);
  }

  const submission: FormSubmission = {
    id: `sub_${shortId()}`,
    organization_id: orgId,
    form_id: formId,
    lead_id: leadId,
    payload,
    utm_source: attribution.utm_source ?? null,
    utm_medium: attribution.utm_medium ?? null,
    utm_campaign: attribution.utm_campaign ?? null,
    utm_term: attribution.utm_term ?? null,
    utm_content: attribution.utm_content ?? null,
    landing_page: attribution.landing_page ?? null,
    referrer: attribution.referrer ?? null,
    created_at: new Date().toISOString(),
  };
  addFormSubmission(submission);

  return { leadId, submissionId: submission.id, created: !existing };
}

/**
 * Envío de un formulario público (visitante anónimo). En demo actúa en el mock;
 * en producción delega en la API route con service role para bypassear RLS.
 */
export async function submitPublicForm(input: PublicFormSubmitInput): Promise<PublicFormSubmitResult> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const res = await fetch("/api/v1/forms/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? `Error al enviar el formulario (${res.status})`);
    }
    return (await res.json()) as PublicFormSubmitResult;
  }
  return submitPublicFormDemo(input.orgId, input.formId, input.payload, input.attribution);
}

/* ============================================================
   Fase G — Snapshots versionados, Usage limits y Marketplace
   ============================================================ */

/* ---- Vertical Snapshots (versionado + marketplace) ---- */

export async function fetchSnapshots(orgId: string, options?: { publishedOnly?: boolean }): Promise<VerticalSnapshot[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    let query = sb
      .from("vertical_snapshots")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (options?.publishedOnly) query = query.eq("is_published", true);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }
  return listSnapshots(orgId).filter(s => !options?.publishedOnly || s.is_published);
}

export async function fetchPublishedSnapshots(): Promise<VerticalSnapshot[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("vertical_snapshots")
      .select("*")
      .eq("is_published", true)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  // En demo, filtrar snapshots publicados de mock-data
  return mockSnapshots.filter(s => s.is_published);
}

export async function fetchSnapshot(orgId: string, id: string): Promise<VerticalSnapshot | null> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("vertical_snapshots")
      .select("*")
      .eq("id", id)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  return getSnapshot(id) ?? null;
}

export async function saveSnapshot(
  orgId: string,
  input: Omit<VerticalSnapshot, "id" | "organization_id" | "created_at" | "updated_at">
): Promise<VerticalSnapshot> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("vertical_snapshots")
      .insert({ ...input, organization_id: orgId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const snapshot: VerticalSnapshot = {
    ...input,
    id: `snap_${shortId()}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
  };
  addSnapshot(snapshot);
  return snapshot;
}

export async function updateSnapshot(
  orgId: string,
  id: string,
  patch: Partial<Omit<VerticalSnapshot, "id" | "organization_id" | "created_at">>
) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("vertical_snapshots")
      .update(patch)
      .eq("id", id)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchSnapshot(id, patch);
}

export async function publishSnapshot(orgId: string, id: string, isPublished: boolean) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("vertical_snapshots")
      .update({ is_published: isPublished })
      .eq("id", id)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchSnapshot(id, { is_published: isPublished });
}

/* ---- Organization Usage (contadores mensuales) ---- */

export async function fetchUsage(orgId: string, period?: string): Promise<OrganizationUsage[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    let query = sb
      .from("organization_usage")
      .select("*")
      .eq("organization_id", orgId)
      .order("period", { ascending: false });
    if (period) query = query.eq("period", period);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }
  return listUsage(orgId);
}

export async function fetchCurrentUsage(orgId: string): Promise<OrganizationUsage | null> {
  const sb = getSupabaseBrowserClient();
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (sb) {
    const { data, error } = await sb
      .from("organization_usage")
      .select("*")
      .eq("organization_id", orgId)
      .eq("period", period)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }
  return getCurrentUsage(orgId) ?? null;
}

export async function fetchUsageLimits(plan: UsageLimits["plan"]): Promise<UsageLimits | null> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("usage_limits")
      .select("*")
      .eq("plan", plan)
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  }
  return getUsageLimits(plan) ?? null;
}

export async function listAllUsageLimits(): Promise<UsageLimits[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb.from("usage_limits").select("*").order("plan");
    if (error) throw error;
    return data ?? [];
  }
  return listUsageLimits();
}

export async function incrementUsageCounter(
  orgId: string,
  counter: "leads_count" | "messages_count" | "ai_tokens_count" | "bookings_count" | "forms_count" | "emails_count",
  delta: number = 1
) {
  const sb = getSupabaseBrowserClient();
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (sb) {
    // Upsert usando onConflict - leemos primero para incrementar
    const { data: existing, error: readError } = await sb
      .from("organization_usage")
      .select("*")
      .eq("organization_id", orgId)
      .eq("period", period)
      .maybeSingle();
    if (readError) throw readError;

    const currentValue = existing?.[counter] ?? 0;
    const upsertData: Partial<OrganizationUsage> = {
      organization_id: orgId,
      period,
      [counter]: currentValue + delta,
    };
    const { error } = await sb
      .from("organization_usage")
      .upsert(upsertData, {
        onConflict: "organization_id,period",
        ignoreDuplicates: false,
      });
    if (error) throw error;
    return;
  }
  incrementUsage(orgId, counter, delta);
}

export async function upsertUsageRecord(input: Omit<OrganizationUsage, "id" | "created_at" | "updated_at">) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("organization_usage")
      .upsert(input, { onConflict: "organization_id,period" });
    if (error) throw error;
    return;
  }
  // En demo: construimos el objeto completo
  const fullUsage: OrganizationUsage = {
    ...input,
    id: `usage_${input.organization_id}_${input.period}`,
    created_at: new Date(`${input.period}-01`).toISOString(),
    updated_at: new Date().toISOString(),
  };
  upsertUsage(fullUsage);
}

/* ---- Agency Marketplace (plantillas compartibles) ---- */

export async function fetchMarketplace(options?: {
  status?: AgencyMarketplace["status"];
  category?: string;
  publisherOrgId?: string;
  featured?: boolean;
}): Promise<AgencyMarketplace[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    let query = sb
      .from("agency_marketplace")
      .select("*")
      .order("created_at", { ascending: false });
    if (options?.status) query = query.eq("status", options.status);
    // category filtering requires joining with vertical_snapshots - skip for now
    if (options?.publisherOrgId) query = query.eq("publisher_org_id", options.publisherOrgId);
    if (options?.featured !== undefined) query = query.eq("featured", options.featured);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }
  if (options?.status === "published") return listPublishedMarketplace();
  return listMarketplace(options?.status, options?.publisherOrgId);
}

export async function fetchMarketplaceItem(id: string): Promise<AgencyMarketplace | null> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("agency_marketplace")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  const all = listMarketplace();
  return all.find(m => m.id === id) ?? null;
}

export async function saveMarketplaceItem(
  orgId: string,
  input: Omit<AgencyMarketplace, "id" | "publisher_org_id" | "created_at" | "updated_at" | "installs_count" | "rating_avg" | "rating_count">
): Promise<AgencyMarketplace> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("agency_marketplace")
      .insert({ ...input, publisher_org_id: orgId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const item: AgencyMarketplace = {
    ...input,
    id: `mkt_${shortId()}`,
    publisher_org_id: orgId,
    installs_count: 0,
    rating_avg: null,
    rating_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  addMarketplaceItem(item);
  return item;
}

export async function updateMarketplaceItem(
  orgId: string,
  id: string,
  patch: Partial<Omit<AgencyMarketplace, "id" | "publisher_org_id" | "created_at">>
) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("agency_marketplace")
      .update(patch)
      .eq("id", id)
      .eq("publisher_org_id", orgId);
    if (error) throw error;
    return;
  }
  patchMarketplaceItem(id, patch);
}

export async function deleteMarketplaceItem(orgId: string, id: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("agency_marketplace")
      .delete()
      .eq("id", id)
      .eq("publisher_org_id", orgId);
    if (error) throw error;
    return;
  }
  removeMarketplaceItem(id);
}

export async function incrementMarketplaceInstalls(id: string) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    // Leemos y actualizamos directamente (incremento atómico via select + update)
    const { data: item, error: readError } = await sb
      .from("agency_marketplace")
      .select("installs_count")
      .eq("id", id)
      .single();
    if (readError) throw readError;

    const { error } = await sb
      .from("agency_marketplace")
      .update({ installs_count: (item?.installs_count ?? 0) + 1 })
      .eq("id", id);
    if (error) throw error;
    return;
  }
  // En demo: usamos mock-store
  const db = getDb();
  const item = db.agencyMarketplace.find((m: AgencyMarketplace) => m.id === id);
  if (item) {
    patchMarketplaceItem(id, { installs_count: item.installs_count + 1 });
  }
}

/* ============================================================
   Fase H — AI Copilot, Scoring y Dashboard de costes
   ============================================================ */

/* ---- AI Copilot: sesiones y mensajes ---- */

export async function fetchCopilotSessions(orgId: string): Promise<CopilotSession[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("copilot_sessions")
      .select("*")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listCopilotSessions(orgId);
}

export async function fetchCopilotSession(id: string): Promise<CopilotSession | null> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("copilot_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }
  return getCopilotSession(id) ?? null;
}

export async function fetchCopilotMessages(sessionId: string): Promise<CopilotMessage[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("copilot_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listCopilotMessages(sessionId);
}

export async function createCopilotSession(
  orgId: string,
  userId: string,
  input: Partial<Omit<CopilotSession, "id" | "organization_id" | "user_id" | "created_at" | "updated_at">>
): Promise<CopilotSession> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("copilot_sessions")
      .insert({ ...input, organization_id: orgId, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const now = new Date().toISOString();
  const session: CopilotSession = {
    id: `cs_${shortId()}`,
    organization_id: orgId,
    user_id: userId,
    title: input.title ?? null,
    context_type: input.context_type ?? "general",
    context_id: input.context_id ?? null,
    is_active: input.is_active ?? true,
    created_at: now,
    updated_at: now,
  };
  addCopilotSession(session);
  return session;
}

export async function updateCopilotSession(
  orgId: string,
  id: string,
  patch: Partial<Omit<CopilotSession, "id" | "organization_id" | "created_at">>
) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("copilot_sessions")
      .update(patch)
      .eq("id", id)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchCopilotSession(id, patch);
}

export async function sendCopilotMessage(
  orgId: string,
  sessionId: string,
  input: { role: CopilotMessage["role"]; content: string; tool_calls?: CopilotMessage["tool_calls"]; tool_call_id?: string | null; metadata?: Record<string, unknown> }
): Promise<CopilotMessage> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("copilot_messages")
      .insert({
        session_id: sessionId,
        role: input.role,
        content: input.content,
        tool_calls: input.tool_calls ?? null,
        tool_call_id: input.tool_call_id ?? null,
        metadata: input.metadata ?? {},
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const message: CopilotMessage = {
    id: `cmsg_${shortId()}`,
    session_id: sessionId,
    role: input.role,
    content: input.content,
    tool_calls: input.tool_calls ?? null,
    tool_call_id: input.tool_call_id ?? null,
    metadata: input.metadata ?? {},
    created_at: new Date().toISOString(),
  };
  addCopilotMessage(message);
  // touch de la sesión para que suba en el listado.
  patchCopilotSession(sessionId, {});
  return message;
}

export async function fetchCopilotTools(): Promise<CopilotTool[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("copilot_tools")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listCopilotTools();
}

/** Simula la respuesta del modelo en demo (sin LLM real) para que el chat sea usable. */
export function demoAssistantReply(userMessage: string): { content: string; tool_calls: CopilotMessage["tool_calls"] } {
  const lower = userMessage.toLowerCase();
  if (lower.includes("reserva") || lower.includes("booking")) {
    return {
      content: "He revisado tus reservas: tienes 38 confirmadas esta semana, el sábado es el pico (9). El martes está al 42% de ocupación; te recomiendo una promoción de «martes de brasa».",
      tool_calls: [{ id: `tool_${Date.now()}`, name: "fetch_bookings", arguments: { status: "confirmed" } }],
    };
  }
  if (lower.includes("lead") || lower.includes("lead") || lower.includes("pipeline")) {
    return {
      content: "En tu pipeline de Ventas hay 9 leads: 3 nuevos, 2 contactados por IA, 1 cualificado, 1 reservado, 1 ganado y 1 perdido. El valor total de oportunidades abiertas es de 1.210 €. El lead más caliente ahora mismo es Marc Vidal (score 88).",
      tool_calls: [{ id: `tool_${Date.now()}`, name: "fetch_pipeline", arguments: {} }],
    };
  }
  if (lower.includes("cost") || lower.includes("coste") || lower.includes("uso")) {
    return {
      content: "Hoy llevas 2,83 € en costes de operación: 1.450k tokens de entrada, 420k de salida, 171 mensajes de WhatsApp y 10 sesiones. En los últimos 7 días acumulas ~18,16 €. Todo dentro del plan Trial.",
      tool_calls: [{ id: `tool_${Date.now()}`, name: "query_usage", arguments: {} }],
    };
  }
  return {
    content: "He procesado tu petición. Para una respuesta más precisa, prueba con preguntas sobre reservas, leads/pipeline o costes de uso del mes.",
    tool_calls: null,
  };
}

/* ---- Lead Scoring ---- */

export async function fetchScoringModels(orgId: string): Promise<ScoringModel[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("scoring_models")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listScoringModels(orgId);
}

export async function saveScoringModel(
  orgId: string,
  input: Omit<ScoringModel, "id" | "organization_id" | "created_at" | "updated_at">
): Promise<ScoringModel> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("scoring_models")
      .insert({ ...input, organization_id: orgId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const now = new Date().toISOString();
  const model: ScoringModel = {
    ...input,
    id: `sm_${shortId()}`,
    organization_id: orgId,
    created_at: now,
    updated_at: now,
  };
  addScoringModel(model);
  return model;
}

export async function updateScoringModel(
  orgId: string,
  id: string,
  patch: Partial<Omit<ScoringModel, "id" | "organization_id" | "created_at">>
) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("scoring_models")
      .update(patch)
      .eq("id", id)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchScoringModel(id, patch);
}

export async function fetchLeadScores(orgId: string, leadId?: string): Promise<LeadScore[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    let query = sb
      .from("lead_scores")
      .select("*")
      .eq("organization_id", orgId)
      .order("calculated_at", { ascending: false });
    if (leadId) query = query.eq("lead_id", leadId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }
  return listLeadScores(orgId, leadId);
}

export async function fetchLeadScoreHistory(orgId: string, leadId?: string): Promise<LeadScoreHistory[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    let query = sb
      .from("lead_score_history")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (leadId) query = query.eq("lead_id", leadId);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }
  return listLeadScoreHistory(orgId, leadId);
}

/** Recalcula (simula) el score de un lead con el modelo activo y registra el evento. */
export async function recalculateLeadScore(orgId: string, leadId: string): Promise<LeadScore | null> {
  const sb = getSupabaseBrowserClient();
  const models = await fetchScoringModels(orgId);
  const active = models.find((m) => m.is_active);
  if (!active) return null;

  if (sb) {
    const { data, error } = await sb
      .from("lead_scores")
      .select("*")
      .eq("organization_id", orgId)
      .eq("lead_id", leadId)
      .maybeSingle();
    if (error) throw error;

    const score = 60 + Math.round(Math.random() * 35);
    const label: LeadScore["label"] = score >= active.thresholds.hot ? "hot" : score >= active.thresholds.warm ? "warm" : "cold";
    const next: LeadScore = {
      id: data?.id ?? `ls_${shortId()}`,
      organization_id: orgId,
      lead_id: leadId,
      model_id: active.id,
      score,
      label,
      factors_breakdown: {
        engagement: { score: Math.round(score * 0.9), details: {} },
        recency: { score: Math.round(score * 0.8), details: {} },
        fit: { score: Math.round(score * 1.05), details: {} },
        intent: { score: Math.round(score * 0.95), details: {} },
      },
      calculated_at: new Date().toISOString(),
    };
    const { error: upsertError } = await sb
      .from("lead_scores")
      .upsert(next, { onConflict: "lead_id,model_id" });
    if (upsertError) throw upsertError;
    await sb
      .from("lead_score_history")
      .insert({
        organization_id: orgId,
        lead_id: leadId,
        model_id: active.id,
        previous_score: data?.score ?? null,
        new_score: score,
        previous_label: data?.label ?? null,
        new_label: label,
        trigger: "manual",
        metadata: {},
      });
    return next;
  }

  // --- Demo: mock-store ---
  const scores = listLeadScores(orgId, leadId);
  const previous = scores[0];
  const score = 60 + Math.round(Math.random() * 35);
  const label: LeadScore["label"] = score >= active.thresholds.hot ? "hot" : score >= active.thresholds.warm ? "warm" : "cold";
  const next: LeadScore = {
    id: previous?.id ?? `ls_${shortId()}`,
    organization_id: orgId,
    lead_id: leadId,
    model_id: active.id,
    score,
    label,
    factors_breakdown: {
      engagement: { score: Math.round(score * 0.9), details: {} },
      recency: { score: Math.round(score * 0.8), details: {} },
      fit: { score: Math.round(score * 1.05), details: {} },
      intent: { score: Math.round(score * 0.95), details: {} },
    },
    calculated_at: new Date().toISOString(),
  };
  // upsert del score del lead (mantiene el último score por lead+modelo)
  upsertLeadScore(next);
  addLeadScoreHistory({
    id: `lsh_${shortId()}`,
    organization_id: orgId,
    lead_id: leadId,
    model_id: active.id,
    previous_score: previous?.score ?? null,
    new_score: score,
    previous_label: previous?.label ?? null,
    new_label: label,
    trigger: "manual",
    metadata: {},
    created_at: new Date().toISOString(),
  });
  return next;
}

/* ---- Cost Dashboard ---- */

export async function fetchUnitCosts(): Promise<UnitCost[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("unit_costs")
      .select("*")
      .eq("is_active", true)
      .order("resource_type", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listUnitCosts();
}

export async function fetchResourceUsage(orgId: string): Promise<ResourceUsage[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("resource_usage")
      .select("*")
      .eq("organization_id", orgId)
      .order("occurred_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  }
  return listResourceUsage(orgId);
}

/** Registra un evento de consumo de recurso (para el dashboard de costes). */
export async function recordResourceUsage(
  orgId: string,
  input: { resource_type: ResourceUsage["resource_type"]; quantity: number; unit: ResourceUsage["unit"]; cost_eur: number; related_id?: string | null; related_type?: ResourceUsage["related_type"]; metadata?: Record<string, unknown> }
) {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("resource_usage")
      .insert({
        organization_id: orgId,
        resource_type: input.resource_type,
        quantity: input.quantity,
        unit: input.unit,
        cost_eur: input.cost_eur,
        related_id: input.related_id ?? null,
        related_type: input.related_type ?? null,
        metadata: input.metadata ?? {},
      });
    if (error) throw error;
    return;
  }
  addResourceUsage({
    id: `ru_${shortId()}`,
    organization_id: orgId,
    resource_type: input.resource_type,
    quantity: input.quantity,
    unit: input.unit,
    cost_eur: input.cost_eur,
    related_id: input.related_id ?? null,
    related_type: input.related_type ?? null,
    metadata: input.metadata ?? {},
    occurred_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
}

export async function fetchDailyCosts(orgId: string): Promise<DailyCosts[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("daily_costs")
      .select("*")
      .eq("organization_id", orgId)
      .order("date", { ascending: true })
      .limit(60);
    if (error) throw error;
    return data ?? [];
  }
  return listDailyCosts(orgId);
}

/* ==========================================================================
   Fase E2/F — Facturación (finance_suite) y Reputación (reputation_mgmt)
   ========================================================================== */

/** Calcula subtotal, impuesto y total a partir de las líneas y el IVA. */
function computeTotals(items: Array<{ quantity: number; unit_price_eur: number }>, taxRate: number) {
  const subtotal = items.reduce((acc, i) => acc + i.quantity * i.unit_price_eur, 0);
  const tax = subtotal * (taxRate / 100);
  return { subtotal_eur: Math.round(subtotal * 100) / 100, tax_eur: Math.round(tax * 100) / 100, total_eur: Math.round((subtotal + tax) * 100) / 100 };
}

/* ------------------------- Presupuestos ------------------------- */

export async function fetchQuotes(orgId: string): Promise<Quote[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("quotes")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listQuotes(orgId);
}

export async function fetchQuoteItems(quoteId: string): Promise<QuoteItem[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("quote_items")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listQuoteItems(quoteId);
}

export async function createQuote(
  orgId: string,
  input: { number: string; customer_name: string; tax_rate: number; valid_until?: string | null; notes?: string | null; items: Array<{ description: string; quantity: number; unit_price_eur: number }> }
): Promise<Quote> {
  const totals = computeTotals(input.items, input.tax_rate);
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("quotes")
      .insert({
        organization_id: orgId,
        number: input.number,
        customer_name: input.customer_name,
        status: "draft",
        currency: "EUR",
        tax_rate: input.tax_rate,
        ...totals,
        valid_until: input.valid_until ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    for (const item of input.items) {
      const { error: itemError } = await sb.from("quote_items").insert({
        quote_id: data.id,
        description: item.description,
        quantity: item.quantity,
        unit_price_eur: item.unit_price_eur,
        line_total_eur: Math.round(item.quantity * item.unit_price_eur * 100) / 100,
      });
      if (itemError) throw itemError;
    }
    return data;
  }
  const now = new Date().toISOString();
  const quote: Quote = {
    id: `q_${shortId()}`,
    organization_id: orgId,
    number: input.number,
    customer_id: null,
    customer_name: input.customer_name,
    status: "draft",
    currency: "EUR",
    tax_rate: input.tax_rate,
    ...totals,
    valid_until: input.valid_until ?? null,
    notes: input.notes ?? null,
    created_at: now,
    updated_at: now,
  };
  addQuote(quote);
  for (const item of input.items) {
    addQuoteItem({
      id: `qi_${shortId()}`,
      quote_id: quote.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_eur: item.unit_price_eur,
      line_total_eur: Math.round(item.quantity * item.unit_price_eur * 100) / 100,
      created_at: now,
    });
  }
  return quote;
}

export async function updateQuoteStatus(orgId: string, quoteId: string, status: Quote["status"]): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("quotes").update({ status }).eq("id", quoteId).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchQuote(quoteId, { status });
}

/** Convierte un presupuesto aceptado en una factura (reutilizando líneas y totales). */
export async function acceptQuoteAndCreateInvoice(orgId: string, quoteId: string): Promise<Invoice> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data: quote, error } = await sb.from("quotes").select("*").eq("id", quoteId).eq("organization_id", orgId).single();
    if (error || !quote) throw error ?? new Error("Presupuesto no encontrado");
    const { data: items } = await sb.from("quote_items").select("*").eq("quote_id", quoteId);
    const { data: invoice, error: invError } = await sb
      .from("invoices")
      .insert({
        organization_id: orgId,
        number: `FC-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
        quote_id: quote.id,
        customer_id: quote.customer_id,
        customer_name: quote.customer_name,
        status: "sent",
        currency: quote.currency,
        tax_rate: quote.tax_rate,
        subtotal_eur: quote.subtotal_eur,
        tax_eur: quote.tax_eur,
        total_eur: quote.total_eur,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (invError) throw invError;
    for (const item of items ?? []) {
      await sb.from("invoice_items").insert({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price_eur: item.unit_price_eur,
        line_total_eur: item.line_total_eur,
      });
    }
    return invoice;
  }
  const quote = listQuotes(orgId).find((q) => q.id === quoteId);
  if (!quote) throw new Error("Presupuesto no encontrado");
  const items = listQuoteItems(quoteId);
  const now = new Date().toISOString();
  const invoice: Invoice = {
    id: `inv_${shortId()}`,
    organization_id: orgId,
    number: `FC-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`,
    quote_id: quote.id,
    customer_id: quote.customer_id,
    customer_name: quote.customer_name,
    status: "sent",
    currency: quote.currency,
    tax_rate: quote.tax_rate,
    subtotal_eur: quote.subtotal_eur,
    tax_eur: quote.tax_eur,
    total_eur: quote.total_eur,
    issue_date: now.slice(0, 10),
    due_date: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    paid_at: null,
    notes: `Factura del presupuesto ${quote.number}.`,
    created_at: now,
    updated_at: now,
  };
  addInvoice(invoice);
  for (const item of items) {
    addInvoiceItem({ ...item, id: `ii_${shortId()}`, invoice_id: invoice.id });
  }
  patchQuote(quoteId, { status: "accepted" });
  return invoice;
}

/* ------------------------- Facturas ------------------------- */

export async function fetchInvoices(orgId: string): Promise<Invoice[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("invoices")
      .select("*")
      .eq("organization_id", orgId)
      .order("issue_date", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listInvoices(orgId);
}

export async function fetchInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listInvoiceItems(invoiceId);
}

export async function createInvoice(
  orgId: string,
  input: { number: string; customer_name: string; tax_rate: number; due_date?: string | null; notes?: string | null; items: Array<{ description: string; quantity: number; unit_price_eur: number }> }
): Promise<Invoice> {
  const totals = computeTotals(input.items, input.tax_rate);
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("invoices")
      .insert({
        organization_id: orgId,
        number: input.number,
        customer_name: input.customer_name,
        status: "draft",
        currency: "EUR",
        tax_rate: input.tax_rate,
        ...totals,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: input.due_date ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    for (const item of input.items) {
      const { error: itemError } = await sb.from("invoice_items").insert({
        invoice_id: data.id,
        description: item.description,
        quantity: item.quantity,
        unit_price_eur: item.unit_price_eur,
        line_total_eur: Math.round(item.quantity * item.unit_price_eur * 100) / 100,
      });
      if (itemError) throw itemError;
    }
    return data;
  }
  const now = new Date().toISOString();
  const invoice: Invoice = {
    id: `inv_${shortId()}`,
    organization_id: orgId,
    number: input.number,
    quote_id: null,
    customer_id: null,
    customer_name: input.customer_name,
    status: "draft",
    currency: "EUR",
    tax_rate: input.tax_rate,
    ...totals,
    issue_date: now.slice(0, 10),
    due_date: input.due_date ?? null,
    paid_at: null,
    notes: input.notes ?? null,
    created_at: now,
    updated_at: now,
  };
  addInvoice(invoice);
  for (const item of input.items) {
    addInvoiceItem({
      id: `ii_${shortId()}`,
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_eur: item.unit_price_eur,
      line_total_eur: Math.round(item.quantity * item.unit_price_eur * 100) / 100,
      created_at: now,
    });
  }
  return invoice;
}

export async function updateInvoiceStatus(orgId: string, invoiceId: string, status: Invoice["status"]): Promise<void> {
  const patch: Partial<Invoice> = { status };
  if (status === "paid") patch.paid_at = new Date().toISOString();
  if (status === "sent") patch.paid_at = null;
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("invoices").update(patch).eq("id", invoiceId).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchInvoice(invoiceId, patch);
}

/* ------------------------- Cobros ------------------------- */

export async function fetchPayments(orgId: string): Promise<Payment[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("payments")
      .select("*")
      .eq("organization_id", orgId)
      .order("paid_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listPayments(orgId);
}

/** Registra un cobro y marca la factura como pagada. */
export async function recordPayment(
  orgId: string,
  input: { invoice_id: string; amount_eur: number; method: Payment["method"]; reference?: string | null }
): Promise<Payment> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("payments")
      .insert({
        organization_id: orgId,
        invoice_id: input.invoice_id,
        amount_eur: input.amount_eur,
        method: input.method,
        reference: input.reference ?? null,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    await sb.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", input.invoice_id);
    return data;
  }
  const now = new Date().toISOString();
  const payment: Payment = {
    id: `pay_${shortId()}`,
    organization_id: orgId,
    invoice_id: input.invoice_id,
    amount_eur: input.amount_eur,
    method: input.method,
    reference: input.reference ?? null,
    paid_at: now,
    created_at: now,
  };
  addPayment(payment);
  patchInvoice(input.invoice_id, { status: "paid", paid_at: now });
  return payment;
}

/* ------------------------- Reseñas ------------------------- */

export async function fetchReviews(orgId: string): Promise<Review[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("reviews")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listReviews(orgId);
}

/** Crea una reseña (entrada pública desde Google/WhatsApp/web). */
export async function createReview(
  orgId: string,
  input: { source: Review["source"]; rating: number; customer_name: string; content?: string | null }
): Promise<Review> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("reviews")
      .insert({
        organization_id: orgId,
        source: input.source,
        rating: input.rating,
        customer_name: input.customer_name,
        content: input.content ?? null,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const now = new Date().toISOString();
  const review: Review = {
    id: `rev_${shortId()}`,
    organization_id: orgId,
    source: input.source,
    rating: input.rating,
    customer_name: input.customer_name,
    content: input.content ?? null,
    reply_text: null,
    status: "pending",
    created_at: now,
    updated_at: now,
  };
  addReview(review);
  return review;
}

/** Actualiza una reseña: respuesta del negocio, estado (publicar/archivar). */
export async function updateReview(orgId: string, reviewId: string, patch: Partial<Pick<Review, "reply_text" | "status">>): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("reviews").update(patch).eq("id", reviewId).eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchReview(reviewId, patch);
}

/* ------------------------- Solicitudes de reseña ------------------------- */

export async function fetchReviewRequests(orgId: string): Promise<ReviewRequest[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("review_requests")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listReviewRequests(orgId);
}

/** Crea una solicitud de reseña para un contacto por canal. */
export async function createReviewRequest(
  orgId: string,
  input: { contact_name: string; channel: ReviewRequest["channel"]; contact_id?: string | null }
): Promise<ReviewRequest> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("review_requests")
      .insert({
        organization_id: orgId,
        contact_id: input.contact_id ?? null,
        contact_name: input.contact_name,
        channel: input.channel,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const now = new Date().toISOString();
  const request: ReviewRequest = {
    id: `rr_${shortId()}`,
    organization_id: orgId,
    contact_id: input.contact_id ?? null,
    contact_name: input.contact_name,
    channel: input.channel,
    status: "pending",
    sent_at: null,
    responded_at: null,
    created_at: now,
  };
  addReviewRequest(request);
  return request;
}

/** Marca una solicitud como enviada. */
export async function sendReviewRequest(orgId: string, requestId: string): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("review_requests")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  patchReviewRequest(requestId, { status: "sent", sent_at: new Date().toISOString() });
}

/* ========================= Timeline unificado, Insights y Métricas (Fase J) ========================= */

/** Eventos del timeline unificado de una org (opcionalmente de un lead). */
export async function fetchTimelineEvents(
  orgId: string,
  leadId?: string | null
): Promise<TimelineEvent[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    let query = sb.from("timeline_events").select("*").eq("organization_id", orgId);
    if (leadId) query = query.eq("lead_id", leadId);
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listTimelineEvents(orgId, leadId);
}

/** Registra un evento de timeline (patrón dual). */
export async function recordTimelineEvent(
  orgId: string,
  input: {
    lead_id?: string | null;
    event_type: TimelineEvent["event_type"];
    title: string;
    description?: string | null;
    payload?: Record<string, unknown>;
  }
): Promise<TimelineEvent> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("timeline_events")
      .insert({
        organization_id: orgId,
        lead_id: input.lead_id ?? null,
        event_type: input.event_type,
        title: input.title,
        description: input.description ?? null,
        payload: input.payload ?? {},
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const event: TimelineEvent = {
    id: `te_${shortId()}`,
    organization_id: orgId,
    lead_id: input.lead_id ?? null,
    event_type: input.event_type,
    title: input.title,
    description: input.description ?? null,
    payload: input.payload ?? {},
    created_at: new Date().toISOString(),
  };
  addTimelineEvent(event);
  return event;
}

/** Momentos AI de una org, pendientes primero. */
export async function fetchInsightsMoments(orgId: string): Promise<InsightsMoment[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("insights_moments")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  }
  return listInsightsMoments(orgId);
}

/** Registra un momento AI nuevo (p.ej. SLA breach detectado o lead de alto valor). */
export async function createInsightMoment(
  orgId: string,
  input: Omit<InsightsMoment, "id" | "organization_id" | "created_at">
): Promise<InsightsMoment> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("insights_moments")
      .insert({ ...input, organization_id: orgId })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const created: InsightsMoment = {
    ...input,
    id: `ins_${shortId()}`,
    organization_id: orgId,
    created_at: new Date().toISOString(),
  };
  addInsightsMoment(created);
  return created;
}

/** Marca un momento AI como resuelto. */
export async function resolveInsightMomentData(orgId: string, insightId: string): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb
      .from("insights_moments")
      .update({ is_resolved: true })
      .eq("id", insightId)
      .eq("organization_id", orgId);
    if (error) throw error;
    return;
  }
  resolveInsightMoment(insightId);
}

/** Métricas diarias en un rango de fechas (inclusive). */
export async function fetchMetricsDaily(
  orgId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<MetricsDaily[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    let query = sb.from("metrics_daily").select("*").eq("organization_id", orgId);
    if (dateFrom) query = query.gte("date", dateFrom);
    if (dateTo) query = query.lte("date", dateTo);
    const { data, error } = await query.order("date", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  return listMetricsDaily(orgId, dateFrom, dateTo);
}

/** Upsert de una fila de métricas diarias (patrón dual). */
export async function upsertMetricsDailyRow(orgId: string, row: Omit<MetricsDaily, "id" | "organization_id" | "created_at">): Promise<void> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { error } = await sb.from("metrics_daily").upsert(
      { ...row, organization_id: orgId },
      { onConflict: "organization_id,date" }
    );
    if (error) throw error;
    return;
  }
  upsertMetricsDaily({ ...row, id: `md_${shortId()}`, organization_id: orgId, created_at: new Date().toISOString() });
}

/* ------------------------- Bot de reservas (Fase K) ------------------------- */

/**
 * Bots de mensajería conectados a una organización (patrón dual).
 * Nunca expone la credencial ni el webhook_secret.
 */
export async function fetchMessagingBots(orgId: string): Promise<MessagingBot[]> {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    const { data, error } = await sb
      .from("messaging_bots")
      .select("id, organization_id, channel, external_id, webhook_secret, status, last_error, connected_at, created_at, updated_at")
      .eq("organization_id", orgId);
    if (error) throw error;
    return (data ?? []) as MessagingBot[];
  }
  return listMessagingBots(orgId);
}

export interface ConnectBotResult {
  ok: boolean;
  externalId?: string;
  error?: string;
  /** true si el entorno no tiene Supabase (conexión demo, sin persistencia). */
  demo?: boolean;
  /** Secret del webhook (solo demo) para poder desconectar después. */
  webhook_secret?: string;
}

/**
 * Conecta (o desconecta) el bot de reservas de una organización. Llama al
 * endpoint que valida el token vía Telegram, registra el webhook y guarda
 * la fila en messaging_bots.
 */
export async function connectReservationBot(
  orgId: string,
  channel: MessagingChannel,
  action: "connect" | "disconnect",
  token?: string,
  webhookSecret?: string
): Promise<ConnectBotResult> {
  try {
    const res = await fetch("/api/v1/telegram/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: orgId, channel, action, token, webhook_secret: webhookSecret }),
    });
    const data = (await res.json().catch(() => ({}))) as ConnectBotResult;
    return { ...data, ok: res.ok };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor" };
  }
}

/* ------------------------- No-Show Risk Engine ------------------------- */

export interface NoShowRiskInput {
  party_size_or_service?: string | null;
  source?: string | null;
  booking_date?: string | null;
  previous_no_shows?: number;
  previous_bookings?: number;
  lead_age_days?: number;
}

/**
 * Algoritmo determinista de riesgo de no-show (0–100).
 * RiskScore = f(lead history, franja horaria, tamaño del grupo, canal).
 */
export function calculateNoShowRisk(input: NoShowRiskInput): number {
  let score = 20;

  // Tamaño del grupo: grupos grandes = más variables que cancelan.
  const party = parseInt(input.party_size_or_service ?? "", 10) || 2;
  score += Math.max(0, party - 2) * 6;

  // Canal de origen: sin confirmación humana pesa más.
  const source = (input.source ?? "").toLowerCase();
  if (["public", "web", "form"].some((s) => source.includes(s))) score += 14;
  else if (source.includes("whatsapp")) score -= 8;
  else if (source.includes("phone") || source.includes("voice")) score -= 5;

  // Franja horaria: viernes/sábado noche = pico de no-show.
  if (input.booking_date) {
    const d = new Date(input.booking_date);
    const dow = d.getDay();
    const hour = d.getHours();
    if ((dow === 5 || dow === 6) && hour >= 20) score += 14;
    else if (hour >= 21) score += 8;
    else if (dow === 0 && hour >= 14) score += 6;
  }

  // Historial del lead.
  score += Math.min(30, (input.previous_no_shows ?? 0) * 25);
  score -= Math.min(20, (input.previous_bookings ?? 0) * 5);

  // Lead reciente y caliente = menor riesgo.
  if (input.lead_age_days !== undefined) {
    if (input.lead_age_days <= 1) score -= 6;
    else if (input.lead_age_days > 14) score += 8;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/* ------------------------- ROI Dashboard ------------------------- */

export interface ROIDashboardData {
  revenue_attributed_30d: number;
  software_cost_month: number;
  net_roi_pct: number;
  ai_hours_saved_30d: number;
  ai_tokens_30d: number;
  speed_to_lead_avg_seconds: number;
  leads_30d: number;
  bookings_30d: number;
  sla_rescues_30d: number;
  deposits_charged_30d: number;
  timeline: MetricsDaily[];
  recent_leads: Array<{ id: string; name: string; speed_to_lead_seconds: number; created_at: string; stage: string }>;
}

/** Agrega métricas_daily + costes + rescates para el Dashboard ROI. */
export async function fetchROIDashboard(orgId: string): Promise<ROIDashboardData> {
  const dateFrom = new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10);
  const dateTo = new Date().toISOString().slice(0, 10);

  const [timeline, leads, events] = await Promise.all([
    fetchMetricsDaily(orgId, dateFrom, dateTo),
    fetchLeads(orgId),
    fetchTimelineEvents(orgId),
  ]);

  // Coste mensual de software desde settings del módulo roi_dashboard (default 290 €).
  let softwareCost = 290;
  const modules = await fetchModules(orgId).catch(() => []);
  const roiModule = modules.find((m) => m.module_key === "roi_dashboard");
  const costSetting = roiModule?.settings?.monthly_software_cost as number | undefined;
  if (typeof costSetting === "number") softwareCost = costSetting;

  const revenue = timeline.reduce((acc, m) => acc + m.attributed_revenue, 0);
  const hoursSaved = timeline.reduce((acc, m) => acc + m.ai_hours_saved, 0);
  const tokens = timeline.reduce((acc, m) => acc + m.ai_tokens_used, 0);
  const totalLeads = timeline.reduce((acc, m) => acc + m.total_leads, 0);
  const totalBookings = timeline.reduce((acc, m) => acc + m.total_bookings, 0);
  const speedSamples = timeline.filter((m) => m.speed_to_lead_avg_seconds > 0);
  const speedAvg =
    speedSamples.length > 0
      ? Math.round(speedSamples.reduce((acc, m) => acc + m.speed_to_lead_avg_seconds, 0) / speedSamples.length)
      : 0;

  const slaRescues = events.filter((e) => e.event_type === "sla_rescued").length;
  const deposits = events.filter((e) => e.event_type === "deposit_paid").length;

  const netRoi = softwareCost > 0 ? Math.round(((revenue - softwareCost) / softwareCost) * 100) : 0;

  const recentLeads = leads
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map((l) => ({
      id: l.id,
      name: `${l.first_name} ${l.last_name ?? ""}`.trim(),
      speed_to_lead_seconds: speedAvg || 120,
      created_at: l.created_at,
      stage: l.status,
    }));

  return {
    revenue_attributed_30d: Math.round(revenue * 100) / 100,
    software_cost_month: softwareCost,
    net_roi_pct: netRoi,
    ai_hours_saved_30d: Math.round(hoursSaved * 100) / 100,
    ai_tokens_30d: tokens,
    speed_to_lead_avg_seconds: speedAvg,
    leads_30d: totalLeads,
    bookings_30d: totalBookings,
    sla_rescues_30d: slaRescues,
    deposits_charged_30d: deposits,
    timeline,
    recent_leads: recentLeads,
  };
}

/* ------------------------- Agente de llamadas IA (Fase L) ------------------------- */

/** Config de conexión del agente de voz (sin claves en el JSON editable). */
export interface VoiceAgentConnectInput {
  agent_name?: string;
  tone?: string;
  custom_rules?: string;
  llm_provider?: string;
  llm_api_key?: string;
  tts_provider?: string;
  tts_api_key?: string;
  voice_id?: string;
  phone_number?: string;
  webhook_secret?: string;
}

/** Puente HTTP: conecta o desconecta el agente de llamadas IA de la subcuenta. */
export async function connectVoiceAgent(
  orgId: string,
  action: "connect" | "disconnect",
  input: VoiceAgentConnectInput
): Promise<ConnectVoiceAgentResult> {
  try {
    const res = await fetch("/api/v1/voice/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: orgId, action, ...input }),
    });
    const data = (await res.json().catch(() => ({}))) as ConnectVoiceAgentResult;
    return { ...data, ok: res.ok };
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor" };
  }
}

/** Turno de llamada IA desde el panel de pruebas (overrides en modo demo). */
export async function runVoiceTurn(
  orgId: string,
  input: {
    transcript: string;
    phone?: string | null;
    session_id?: string | null;
    session_state?: VoiceSessionState;
    agent_name?: string;
    tone?: string;
    custom_rules?: string;
    llm_provider?: string;
    llm_api_key?: string;
    tts_provider?: string;
    tts_api_key?: string;
    voice_id?: string;
  }
): Promise<VoiceTurnResponse> {
  const res = await fetch("/api/v1/voice/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ org_id: orgId, ...input }),
  });
  const data = (await res.json().catch(() => ({}))) as VoiceTurnResponse & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "No se pudo procesar el turno de voz");
  return data;
}

/** Sintetiza la respuesta del agente a audio (o marca demo si no hay TTS). */
export async function voiceTts(
  orgId: string,
  text: string,
  overrides?: { tts_provider?: string; tts_api_key?: string; voice_id?: string }
): Promise<{ audioBase64?: string; contentType?: string; demo: boolean; reply: string }> {
  try {
    const res = await fetch("/api/v1/voice/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: orgId, text, ...overrides }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      audioBase64?: string;
      contentType?: string;
      demo?: boolean;
      reply?: string;
    };
    return {
      audioBase64: data.audioBase64,
      contentType: data.contentType,
      demo: data.demo ?? false,
      reply: data.reply ?? text,
    };
  } catch {
    return { demo: true, reply: text };
  }
}
