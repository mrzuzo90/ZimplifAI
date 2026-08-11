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
  InsightsMoment,
  Invoice,
  InvoiceItem,
  Lead,
  LeadActivity,
  MetricsDaily,
  MessagingBot,
  LeadScore,
  LeadScoreHistory,
  MarketingForm,
  MarketingFunnel,
  Message,
  MessageTemplate,
  MessageThread,
  ModuleKey,
  Organization,
  OrganizationModule,
  OrganizationUsage,
  Payment,
  Pipeline,
  PipelineStage,
  Quote,
  QuoteItem,
  ResourceUsage,
  Review,
  ReviewRequest,
  ScoringModel,
  Task,
  TenantSite,
  TimelineEvent,
  UnitCost,
  UsageLimits,
  UserRole,
  VerticalSnapshot,
  Workflow,
  WorkflowRun,
  WorkflowRunStep,
} from "@/types/database";
import {
  mockActiveOrg,
  mockActivity,
  mockAgencyMarketplace,
  mockAgents,
  mockAuditLogs,
  mockAvailabilityRules,
  mockBookings,
  mockCalendars,
  mockCompanies,
  mockCopilotMessages,
  mockCopilotSessions,
  mockCopilotTools,
  mockDailyCosts,
  mockFormSubmissions,
  mockForms,
  mockFunnels,
  mockInsightsMoments,
  mockInvoiceItems,
  mockInvoices,
  mockLeadScoreHistory,
  mockLeadScores,
  mockLeads,
  mockMessageTemplates,
  mockMessages,
  mockModules,
  mockOrganizations,
  mockOrganizationUsage,
  mockPayments,
  mockPipelineStages,
  mockPipelines,
  mockQuoteItems,
  mockQuotes,
  mockResourceUsage,
  mockMetricsDaily,
  mockReviewRequests,
  mockReviews,
  mockScoringModels,
  mockTimelineEvents,
  mockSites,
  mockSnapshots,
  mockTasks,
  mockThreads,
  mockUnitCosts,
  mockUsageLimits,
  mockWorkflowRuns,
  mockWorkflowRunSteps,
  mockWorkflows,
} from "./mock-data";
import { MODULE_DEFAULT_SETTINGS } from "./modules";

/**
 * Tienda mock con persistencia en localStorage + pub/sub.
 * Permite interactividad offline real (mover leads, toggles, stream de audit)
 * y simula realtime sin backend.
 */

export interface MockDb {
  organizations: Organization[];
  leads: Lead[];
  bookings: Booking[];
  calendars: Calendar[];
  availabilityRules: AvailabilityRule[];
  agents: AiAgent[];
  audit: AiAuditLog[];
  activity: LeadActivity[];
  modules: OrganizationModule[];
  workflows: Workflow[];
  workflowRuns: WorkflowRun[];
  workflowRunSteps: WorkflowRunStep[];
  sites: TenantSite[];
  threads: MessageThread[];
  messages: Message[];
  messageTemplates: MessageTemplate[];
  companies: Company[];
  pipelines: Pipeline[];
  pipelineStages: PipelineStage[];
  tasks: Task[];
  forms: MarketingForm[];
  formSubmissions: FormSubmission[];
  funnels: MarketingFunnel[];
  organizationUsage: OrganizationUsage[];
  usageLimits: UsageLimits[];
  agencyMarketplace: AgencyMarketplace[];
  verticalSnapshots: VerticalSnapshot[];
  copilotSessions: CopilotSession[];
  copilotMessages: CopilotMessage[];
  copilotTools: CopilotTool[];
  scoringModels: ScoringModel[];
  leadScores: LeadScore[];
  leadScoreHistory: LeadScoreHistory[];
  unitCosts: UnitCost[];
  resourceUsage: ResourceUsage[];
  dailyCosts: DailyCosts[];
  quotes: Quote[];
  quoteItems: QuoteItem[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  payments: Payment[];
  reviews: Review[];
  reviewRequests: ReviewRequest[];
  timelineEvents: TimelineEvent[];
  insightsMoments: InsightsMoment[];
  metricsDaily: MetricsDaily[];
  messagingBots: MessagingBot[];
  activeOrgId: string;
  demoRole: UserRole;
  impersonatingOrgId: string | null;
}

const KEY = "zimplifai-crm-mock-v1";

function buildSeed(): MockDb {
  return {
    organizations: [...mockOrganizations],
    leads: [...mockLeads],
    bookings: [...mockBookings],
    calendars: [...mockCalendars],
    availabilityRules: [...mockAvailabilityRules],
    agents: [...mockAgents],
    audit: [...mockAuditLogs],
    activity: [...mockActivity],
    modules: [...mockModules],
    workflows: [...mockWorkflows],
    workflowRuns: [...mockWorkflowRuns],
    workflowRunSteps: [...mockWorkflowRunSteps],
    sites: [...mockSites],
    threads: [...mockThreads],
    messages: [...mockMessages],
    messageTemplates: [...mockMessageTemplates],
    companies: [...mockCompanies],
    pipelines: [...mockPipelines],
    pipelineStages: [...mockPipelineStages],
    tasks: [...mockTasks],
    forms: [...mockForms],
    formSubmissions: [...mockFormSubmissions],
    funnels: [...mockFunnels],
    organizationUsage: [...mockOrganizationUsage],
    usageLimits: [...mockUsageLimits],
    agencyMarketplace: [...mockAgencyMarketplace],
    verticalSnapshots: [...mockSnapshots],
    copilotSessions: [...mockCopilotSessions],
    copilotMessages: [...mockCopilotMessages],
    copilotTools: [...mockCopilotTools],
    scoringModels: [...mockScoringModels],
    leadScores: [...mockLeadScores],
    leadScoreHistory: [...mockLeadScoreHistory],
    unitCosts: [...mockUnitCosts],
    resourceUsage: [...mockResourceUsage],
    dailyCosts: [...mockDailyCosts],
    quotes: [...mockQuotes],
    quoteItems: [...mockQuoteItems],
    invoices: [...mockInvoices],
    invoiceItems: [...mockInvoiceItems],
    payments: [...mockPayments],
    reviews: [...mockReviews],
    reviewRequests: [...mockReviewRequests],
    timelineEvents: [...mockTimelineEvents],
    insightsMoments: [...mockInsightsMoments],
    metricsDaily: [...mockMetricsDaily],
    messagingBots: [],
    activeOrgId: mockActiveOrg.id,
    demoRole: "client_admin",
    impersonatingOrgId: null,
  };
}

let cache: MockDb | null = null;
const listeners = new Set<() => void>();

function persist(db: MockDb) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* cuota excedida: ignorar */
  }
}

export function getDb(): MockDb {
  if (cache) return cache;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MockDb;
        // Backfill de colecciones/campos añadidos en versiones posteriores del seed.
        if (!Array.isArray(parsed.activity)) parsed.activity = [...mockActivity];
        if (!Array.isArray(parsed.workflows)) parsed.workflows = [...mockWorkflows];
        if (!Array.isArray(parsed.workflowRuns)) parsed.workflowRuns = [...mockWorkflowRuns];
        if (!Array.isArray(parsed.workflowRunSteps)) parsed.workflowRunSteps = [...mockWorkflowRunSteps];
        if (!Array.isArray(parsed.sites)) parsed.sites = [...mockSites];
        if (!Array.isArray(parsed.threads)) parsed.threads = [...mockThreads];
        if (!Array.isArray(parsed.messages)) parsed.messages = [...mockMessages];
        if (!Array.isArray(parsed.messageTemplates)) parsed.messageTemplates = [...mockMessageTemplates];
        if (!Array.isArray(parsed.calendars)) parsed.calendars = [...mockCalendars];
        if (!Array.isArray(parsed.availabilityRules)) parsed.availabilityRules = [...mockAvailabilityRules];
        if (!Array.isArray(parsed.companies)) parsed.companies = [...mockCompanies];
        if (!Array.isArray(parsed.pipelines)) parsed.pipelines = [...mockPipelines];
        if (!Array.isArray(parsed.pipelineStages)) parsed.pipelineStages = [...mockPipelineStages];
        if (!Array.isArray(parsed.tasks)) parsed.tasks = [...mockTasks];
        if (!Array.isArray(parsed.forms)) parsed.forms = [...mockForms];
        if (!Array.isArray(parsed.formSubmissions)) parsed.formSubmissions = [...mockFormSubmissions];
        if (!Array.isArray(parsed.funnels)) parsed.funnels = [...mockFunnels];
        if (!Array.isArray(parsed.verticalSnapshots)) parsed.verticalSnapshots = [...mockSnapshots];
        if (!Array.isArray(parsed.copilotSessions)) parsed.copilotSessions = [...mockCopilotSessions];
        if (!Array.isArray(parsed.copilotMessages)) parsed.copilotMessages = [...mockCopilotMessages];
        if (!Array.isArray(parsed.copilotTools)) parsed.copilotTools = [...mockCopilotTools];
        if (!Array.isArray(parsed.scoringModels)) parsed.scoringModels = [...mockScoringModels];
        if (!Array.isArray(parsed.leadScores)) parsed.leadScores = [...mockLeadScores];
        if (!Array.isArray(parsed.leadScoreHistory)) parsed.leadScoreHistory = [...mockLeadScoreHistory];
        if (!Array.isArray(parsed.unitCosts)) parsed.unitCosts = [...mockUnitCosts];
        if (!Array.isArray(parsed.resourceUsage)) parsed.resourceUsage = [...mockResourceUsage];
        if (!Array.isArray(parsed.dailyCosts)) parsed.dailyCosts = [...mockDailyCosts];
        if (!Array.isArray(parsed.quotes)) parsed.quotes = [...mockQuotes];
        if (!Array.isArray(parsed.quoteItems)) parsed.quoteItems = [...mockQuoteItems];
        if (!Array.isArray(parsed.invoices)) parsed.invoices = [...mockInvoices];
        if (!Array.isArray(parsed.invoiceItems)) parsed.invoiceItems = [...mockInvoiceItems];
        if (!Array.isArray(parsed.payments)) parsed.payments = [...mockPayments];
        if (!Array.isArray(parsed.reviews)) parsed.reviews = [...mockReviews];
        if (!Array.isArray(parsed.reviewRequests)) parsed.reviewRequests = [...mockReviewRequests];
        if (!Array.isArray(parsed.timelineEvents)) parsed.timelineEvents = [...mockTimelineEvents];
        if (!Array.isArray(parsed.insightsMoments)) parsed.insightsMoments = [...mockInsightsMoments];
        if (!Array.isArray(parsed.metricsDaily)) parsed.metricsDaily = [...mockMetricsDaily];
        if (!Array.isArray(parsed.messagingBots)) parsed.messagingBots = [];
        if (Array.isArray(parsed.bookings)) {
          parsed.bookings.forEach((b) => {
            // Backfill: seeds antiguos sin calendario/token/source.
            const booking = b as Partial<Booking>;
            if (booking.calendar_id === undefined) booking.calendar_id = "cal_mesa";
            if (booking.token === undefined) booking.token = `bk_${booking.id}`;
            if (booking.source === undefined) booking.source = "manual";
          });
        }
        if (Array.isArray(parsed.leads)) {
          parsed.leads.forEach((l) => {
            // Backfill: seeds antiguos sin los campos de seguimiento/CRM.
            const lead = l as Partial<Lead>;
            if (lead.next_follow_up_at === undefined) lead.next_follow_up_at = null;
            if (lead.company_id === undefined) lead.company_id = null;
            if (lead.pipeline_id === undefined) lead.pipeline_id = null;
            if (lead.utm_source === undefined) lead.utm_source = null;
            if (lead.utm_medium === undefined) lead.utm_medium = null;
            if (lead.utm_campaign === undefined) lead.utm_campaign = null;
            if (lead.utm_term === undefined) lead.utm_term = null;
            if (lead.utm_content === undefined) lead.utm_content = null;
            if (lead.landing_page === undefined) lead.landing_page = null;
            if (lead.referrer === undefined) lead.referrer = null;
          });
        }
        cache = parsed;
        return cache;
      }
    } catch {
      /* corrupto: regenerar */
    }
  }
  cache = buildSeed();
  persist(cache);
  return cache;
}

function mutate(mutator: (db: MockDb) => void) {
  const db = getDb();
  mutator(db);
  persist(db);
  listeners.forEach((cb) => cb());
}

/** Suscripción a cambios del store mock (simula realtime). Devuelve unsub. */
export function subscribeDb(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Reinicia los datos demo a su estado inicial. */
export function resetMockDb() {
  cache = buildSeed();
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      /* noop */
    }
  }
  listeners.forEach((cb) => cb());
}

/* ---------- Org activa ---------- */

export function getActiveOrgId(): string {
  return getDb().activeOrgId;
}

export function setActiveOrgId(orgId: string) {
  mutate((db) => {
    db.activeOrgId = orgId;
  });
}

export function getImpersonatingOrgId(): string | null {
  return getDb().impersonatingOrgId;
}

export function setImpersonatingOrgId(orgId: string | null) {
  mutate((db) => {
    db.impersonatingOrgId = orgId;
  });
}

export function getDemoRole(): UserRole {
  return getDb().demoRole;
}

export function setDemoRole(role: UserRole) {
  mutate((db) => {
    db.demoRole = role;
  });
}

/* ---------- Colecciones ---------- */

export function listOrgs(): Organization[] {
  return getDb().organizations;
}

export function getOrg(id: string): Organization | undefined {
  return getDb().organizations.find((o) => o.id === id);
}

export function upsertOrg(org: Organization) {
  mutate((db) => {
    const idx = db.organizations.findIndex((o) => o.id === org.id);
    if (idx >= 0) db.organizations[idx] = org;
    else db.organizations.unshift(org);
  });
}

export function listLeads(orgId: string): Lead[] {
  return getDb().leads.filter((l) => l.organization_id === orgId);
}

export function patchLead(id: string, patch: Partial<Lead>) {
  mutate((db) => {
    const idx = db.leads.findIndex((l) => l.id === id);
    if (idx >= 0) db.leads[idx] = { ...db.leads[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function addLead(lead: Lead) {
  mutate((db) => {
    db.leads.unshift(lead);
  });
}

export function listBookings(orgId: string): Booking[] {
  return getDb().bookings.filter((b) => b.organization_id === orgId);
}

export function patchBooking(id: string, patch: Partial<Booking>) {
  mutate((db) => {
    const idx = db.bookings.findIndex((b) => b.id === id);
    if (idx >= 0) db.bookings[idx] = { ...db.bookings[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function addBooking(booking: Booking) {
  mutate((db) => {
    db.bookings.unshift(booking);
  });
}

/** Busca una reserva por token de gestión público (cross-tenant por token). */
export function findBookingByToken(token: string): Booking | undefined {
  return getDb().bookings.find((b) => b.token === token);
}

export function listAgents(orgId: string): AiAgent[] {
  return getDb().agents.filter((a) => a.organization_id === orgId);
}

export function patchAgent(id: string, patch: Partial<AiAgent>) {
  mutate((db) => {
    const idx = db.agents.findIndex((a) => a.id === id);
    if (idx >= 0) db.agents[idx] = { ...db.agents[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function addAgent(agent: AiAgent) {
  mutate((db) => {
    db.agents.push(agent);
  });
}

export function listAudit(orgId: string): AiAuditLog[] {
  return getDb()
    .audit.filter((a) => a.organization_id === orgId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function prependAudit(entry: AiAuditLog) {
  mutate((db) => {
    db.audit.unshift(entry);
  });
}

/* ---------- Actividad (timeline por lead) ---------- */

export function listActivity(orgId: string, leadId: string): LeadActivity[] {
  return getDb()
    .activity.filter((a) => a.organization_id === orgId && a.lead_id === leadId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function pushActivity(entry: LeadActivity) {
  mutate((db) => {
    db.activity.unshift(entry);
  });
}

/* ---------- Workflows (Fase A) ---------- */

export function listWorkflows(orgId: string): Workflow[] {
  return getDb()
    .workflows.filter((w) => w.organization_id === orgId)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export function addWorkflow(workflow: Workflow) {
  mutate((db) => {
    db.workflows.push(workflow);
  });
}

export function patchWorkflow(id: string, patch: Partial<Workflow>) {
  mutate((db) => {
    const idx = db.workflows.findIndex((w) => w.id === id);
    if (idx >= 0) db.workflows[idx] = { ...db.workflows[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

/** Elimina un workflow y sus runs/steps (cascada como en PostgreSQL). */
export function removeWorkflow(id: string) {
  mutate((db) => {
    db.workflows = db.workflows.filter((w) => w.id !== id);
    const runIds = db.workflowRuns.filter((r) => r.workflow_id === id).map((r) => r.id);
    db.workflowRuns = db.workflowRuns.filter((r) => r.workflow_id !== id);
    db.workflowRunSteps = db.workflowRunSteps.filter((s) => !runIds.includes(s.workflow_run_id));
  });
}

export function listWorkflowRuns(orgId: string, workflowId?: string): WorkflowRun[] {
  return getDb()
    .workflowRuns.filter(
      (r) => r.organization_id === orgId && (workflowId ? r.workflow_id === workflowId : true)
    )
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
}

export function addWorkflowRun(run: WorkflowRun) {
  mutate((db) => {
    db.workflowRuns.unshift(run);
  });
}

export function patchWorkflowRun(id: string, patch: Partial<WorkflowRun>) {
  mutate((db) => {
    const idx = db.workflowRuns.findIndex((r) => r.id === id);
    if (idx >= 0) db.workflowRuns[idx] = { ...db.workflowRuns[idx], ...patch };
  });
}

export function listWorkflowRunSteps(orgId: string, runId: string): WorkflowRunStep[] {
  return getDb()
    .workflowRunSteps.filter((s) => s.organization_id === orgId && s.workflow_run_id === runId)
    .sort((a, b) => new Date(a.executed_at ?? a.id).getTime() - new Date(b.executed_at ?? b.id).getTime());
}

export function addWorkflowRunStep(step: WorkflowRunStep) {
  mutate((db) => {
    db.workflowRunSteps.push(step);
  });
}

export function patchWorkflowRunStep(id: string, patch: Partial<WorkflowRunStep>) {
  mutate((db) => {
    const idx = db.workflowRunSteps.findIndex((s) => s.id === id);
    if (idx >= 0) db.workflowRunSteps[idx] = { ...db.workflowRunSteps[idx], ...patch };
  });
}

/* ---------- Sitios web verticales (light_web_editor) ---------- */

export function listSites(orgId: string): TenantSite[] {
  return getDb().sites.filter((s) => s.organization_id === orgId);
}

export function getSiteBySlug(slug: string): TenantSite | undefined {
  return getDb().sites.find((s) => s.slug === slug);
}

/** Solo sitios publicados (lectura pública). */
export function getPublishedSiteBySlug(slug: string): TenantSite | undefined {
  const site = getSiteBySlug(slug);
  return site && site.is_published ? site : undefined;
}

export function upsertSite(site: TenantSite) {
  mutate((db) => {
    const idx = db.sites.findIndex((s) => s.id === site.id);
    if (idx >= 0) db.sites[idx] = { ...site, updated_at: new Date().toISOString() };
    else db.sites.push(site);
  });
}

export function patchSite(id: string, patch: Partial<TenantSite>) {
  mutate((db) => {
    const idx = db.sites.findIndex((s) => s.id === id);
    if (idx >= 0) db.sites[idx] = { ...db.sites[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function setSitePublished(id: string, isPublished: boolean) {
  patchSite(id, { is_published: isPublished });
}

/* ---------- Bandeja unificada (Fase B) ---------- */

export function listThreads(orgId: string): MessageThread[] {
  return getDb()
    .threads.filter((t) => t.organization_id === orgId)
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
}

export function getThread(orgId: string, threadId: string): MessageThread | undefined {
  return getDb().threads.find((t) => t.organization_id === orgId && t.id === threadId);
}

export function patchThread(threadId: string, patch: Partial<MessageThread>) {
  mutate((db) => {
    const idx = db.threads.findIndex((t) => t.id === threadId);
    if (idx >= 0) db.threads[idx] = { ...db.threads[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function addThread(thread: MessageThread) {
  mutate((db) => {
    db.threads.push(thread);
  });
}

export function listMessages(orgId: string, threadId: string): Message[] {
  return getDb()
    .messages.filter((m) => m.organization_id === orgId && m.thread_id === threadId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function addMessage(message: Message) {
  mutate((db) => {
    db.messages.push(message);
    // Mantiene el preview + timestamp del último mensaje del hilo.
    const thread = db.threads.find((t) => t.id === message.thread_id);
    if (thread) {
      thread.last_message_at = message.created_at;
      thread.last_message_preview = message.body;
      thread.updated_at = message.created_at;
    }
  });
}

export function listMessageTemplates(orgId: string): MessageTemplate[] {
  return getDb()
    .messageTemplates.filter((t) => t.organization_id === orgId)
    .sort((a, b) => b.category.localeCompare(a.category) || a.name.localeCompare(b.name));
}

export function addMessageTemplate(template: MessageTemplate) {
  mutate((db) => {
    db.messageTemplates.push(template);
  });
}

export function patchMessageTemplate(id: string, patch: Partial<MessageTemplate>) {
  mutate((db) => {
    const idx = db.messageTemplates.findIndex((t) => t.id === id);
    if (idx >= 0) db.messageTemplates[idx] = { ...db.messageTemplates[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function removeMessageTemplate(id: string) {
  mutate((db) => {
    db.messageTemplates = db.messageTemplates.filter((t) => t.id !== id);
  });
}

/* ---------- Calendarios de citas (Fase C) ---------- */

export function listCalendars(orgId: string): Calendar[] {
  return getDb().calendars.filter((c) => c.organization_id === orgId);
}

export function getCalendar(id: string): Calendar | undefined {
  return getDb().calendars.find((c) => c.id === id);
}

export function addCalendar(calendar: Calendar) {
  mutate((db) => {
    db.calendars.push(calendar);
  });
}

export function patchCalendar(id: string, patch: Partial<Calendar>) {
  mutate((db) => {
    const idx = db.calendars.findIndex((c) => c.id === id);
    if (idx >= 0) db.calendars[idx] = { ...db.calendars[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

/** Elimina un calendario y sus franjas de disponibilidad (cascada). */
export function removeCalendar(id: string) {
  mutate((db) => {
    db.calendars = db.calendars.filter((c) => c.id !== id);
    db.availabilityRules = db.availabilityRules.filter((r) => r.calendar_id !== id);
  });
}

export function listAvailabilityRules(orgId: string, calendarId?: string): AvailabilityRule[] {
  return getDb().availabilityRules.filter(
    (r) => r.organization_id === orgId && (calendarId ? r.calendar_id === calendarId : true)
  );
}

export function addAvailabilityRule(rule: AvailabilityRule) {
  mutate((db) => {
    db.availabilityRules.push(rule);
  });
}

export function patchAvailabilityRule(id: string, patch: Partial<AvailabilityRule>) {
  mutate((db) => {
    const idx = db.availabilityRules.findIndex((r) => r.id === id);
    if (idx >= 0) db.availabilityRules[idx] = { ...db.availabilityRules[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function removeAvailabilityRule(id: string) {
  mutate((db) => {
    db.availabilityRules = db.availabilityRules.filter((r) => r.id !== id);
  });
}

/* ---------- Módulos (feature flags) ---------- */

export function listModules(orgId: string): OrganizationModule[] {
  return getDb().modules.filter((m) => m.organization_id === orgId);
}

export function getModule(orgId: string, moduleKey: ModuleKey): OrganizationModule | undefined {
  return getDb().modules.find((m) => m.organization_id === orgId && m.module_key === moduleKey);
}

export function setModuleEnabled(orgId: string, moduleKey: ModuleKey, isEnabled: boolean) {
  mutate((db) => {
    const idx = db.modules.findIndex((m) => m.organization_id === orgId && m.module_key === moduleKey);
    if (idx >= 0) db.modules[idx] = { ...db.modules[idx], is_enabled: isEnabled };
  });
}

export function setModuleSettings(orgId: string, moduleKey: ModuleKey, settings: Record<string, unknown>) {
  mutate((db) => {
    const idx = db.modules.findIndex((m) => m.organization_id === orgId && m.module_key === moduleKey);
    if (idx >= 0) db.modules[idx] = { ...db.modules[idx], settings };
  });
}

/**
 * Crea las 5 filas de módulo de una subcuenta habilitando las dadas.
 * Usado por el motor de provisión (modo demo).
 */
export function ensureOrgModules(orgId: string, enabledKeys: ModuleKey[]) {
  mutate((db) => {
    (Object.keys(MODULE_DEFAULT_SETTINGS) as ModuleKey[]).forEach((key) => {
      if (db.modules.some((m) => m.organization_id === orgId && m.module_key === key)) return;
      db.modules.push({
        id: `mod_${orgId}_${key}`,
        organization_id: orgId,
        module_key: key,
        is_enabled: enabledKeys.includes(key),
        settings: MODULE_DEFAULT_SETTINGS[key],
        created_at: new Date().toISOString(),
      });
    });
  });
}

/* ---------- Empresas (Fase E1) ---------- */

export function listCompanies(orgId: string): Company[] {
  return getDb()
    .companies.filter((c) => c.organization_id === orgId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getCompany(id: string): Company | undefined {
  return getDb().companies.find((c) => c.id === id);
}

export function addCompany(company: Company) {
  mutate((db) => {
    db.companies.push(company);
  });
}

export function patchCompany(id: string, patch: Partial<Company>) {
  mutate((db) => {
    const idx = db.companies.findIndex((c) => c.id === id);
    if (idx >= 0) db.companies[idx] = { ...db.companies[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function removeCompany(id: string) {
  mutate((db) => {
    db.companies = db.companies.filter((c) => c.id !== id);
    // Los leads asociados pasan a no tener empresa (on delete set null).
    db.leads = db.leads.map((l) => (l.company_id === id ? { ...l, company_id: null } : l));
    db.tasks = db.tasks.map((t) => (t.company_id === id ? { ...t, company_id: null } : t));
  });
}

/* ---------- Pipelines + etapas (Fase E1) ---------- */

export function listPipelines(orgId: string): Pipeline[] {
  return getDb()
    .pipelines.filter((p) => p.organization_id === orgId)
    .sort((a, b) => Number(b.is_default) - Number(a.is_default) || a.name.localeCompare(b.name));
}

export function getPipeline(id: string): Pipeline | undefined {
  return getDb().pipelines.find((p) => p.id === id);
}

export function addPipeline(pipeline: Pipeline) {
  mutate((db) => {
    db.pipelines.push(pipeline);
  });
}

export function patchPipeline(id: string, patch: Partial<Pipeline>) {
  mutate((db) => {
    const idx = db.pipelines.findIndex((p) => p.id === id);
    if (idx >= 0) db.pipelines[idx] = { ...db.pipelines[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

/** Elimina un pipeline y sus etapas (cascada). */
export function removePipeline(id: string) {
  mutate((db) => {
    db.pipelines = db.pipelines.filter((p) => p.id !== id);
    db.pipelineStages = db.pipelineStages.filter((s) => s.pipeline_id !== id);
    db.leads = db.leads.map((l) => (l.pipeline_id === id ? { ...l, pipeline_id: null } : l));
  });
}

export function listPipelineStages(orgId: string, pipelineId?: string): PipelineStage[] {
  return getDb()
    .pipelineStages.filter(
      (s) => s.organization_id === orgId && (pipelineId ? s.pipeline_id === pipelineId : true)
    )
    .sort((a, b) => a.position - b.position);
}

export function addPipelineStage(stage: PipelineStage) {
  mutate((db) => {
    db.pipelineStages.push(stage);
  });
}

export function patchPipelineStage(id: string, patch: Partial<PipelineStage>) {
  mutate((db) => {
    const idx = db.pipelineStages.findIndex((s) => s.id === id);
    if (idx >= 0) db.pipelineStages[idx] = { ...db.pipelineStages[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function removePipelineStage(id: string) {
  mutate((db) => {
    db.pipelineStages = db.pipelineStages.filter((s) => s.id !== id);
  });
}

/* ---------- Tareas (Fase E1 · widget Mi Día) ---------- */

export function listTasks(orgId: string): Task[] {
  return getDb()
    .tasks.filter((t) => t.organization_id === orgId)
    .sort((a, b) => {
      // Orden: pendientes antes que hechas; dentro, por fecha límite.
      const done = (t: Task) => (t.status === "done" ? 1 : 0);
      if (done(a) !== done(b)) return done(a) - done(b);
      return String(a.due_date ?? "9999-99-99").localeCompare(String(b.due_date ?? "9999-99-99"));
    });
}

export function addTask(task: Task) {
  mutate((db) => {
    db.tasks.push(task);
  });
}

export function patchTask(id: string, patch: Partial<Task>) {
  mutate((db) => {
    const idx = db.tasks.findIndex((t) => t.id === id);
    if (idx >= 0) db.tasks[idx] = { ...db.tasks[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function removeTask(id: string) {
  mutate((db) => {
    db.tasks = db.tasks.filter((t) => t.id !== id);
  });
}

/* ------------------------- Forms, funnels y submissions (Fase D) ------------------------- */

export function listForms(orgId: string): MarketingForm[] {
  return getDb().forms.filter((f) => f.organization_id === orgId);
}

export function getForm(id: string): MarketingForm | undefined {
  return getDb().forms.find((f) => f.id === id);
}

/** Busca un formulario activo por slug público (cualquier organización). */
export function getFormBySlug(slug: string): MarketingForm | undefined {
  return getDb().forms.find((f) => f.slug === slug && f.is_active);
}

export function addForm(form: MarketingForm) {
  mutate((db) => {
    db.forms.push(form);
  });
}

export function patchForm(id: string, patch: Partial<MarketingForm>) {
  mutate((db) => {
    const idx = db.forms.findIndex((f) => f.id === id);
    if (idx >= 0) db.forms[idx] = { ...db.forms[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function removeForm(id: string) {
  mutate((db) => {
    db.forms = db.forms.filter((f) => f.id !== id);
    // Desvincula el formulario de funnels y submissions sin borrarlos.
    db.funnels = db.funnels.map((fn) =>
      fn.landing_form_id === id ? { ...fn, landing_form_id: null } : fn
    );
    db.formSubmissions = db.formSubmissions.map((s) =>
      s.form_id === id ? { ...s, form_id: null } : s
    );
  });
}

export function listFunnels(orgId: string): MarketingFunnel[] {
  return getDb().funnels.filter((f) => f.organization_id === orgId);
}

export function addFunnel(funnel: MarketingFunnel) {
  mutate((db) => {
    db.funnels.push(funnel);
  });
}

export function patchFunnel(id: string, patch: Partial<MarketingFunnel>) {
  mutate((db) => {
    const idx = db.funnels.findIndex((f) => f.id === id);
    if (idx >= 0) db.funnels[idx] = { ...db.funnels[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function removeFunnel(id: string) {
  mutate((db) => {
    db.funnels = db.funnels.filter((f) => f.id !== id);
  });
}

export function listFormSubmissions(orgId: string, formId?: string): FormSubmission[] {
  const db = getDb();
  const rows = db.formSubmissions.filter(
    (s) => s.organization_id === orgId && (!formId || s.form_id === formId)
  );
  return rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function addFormSubmission(submission: FormSubmission) {
  mutate((db) => {
    db.formSubmissions.push(submission);
  });
}

/* ---------- Usage Tracking (Fase G) ---------- */

export function listUsage(orgId: string): OrganizationUsage[] {
  return getDb()
    .organizationUsage.filter((u) => u.organization_id === orgId)
    .sort((a, b) => b.period.localeCompare(a.period));
}

export function getCurrentUsage(orgId: string): OrganizationUsage | undefined {
  const period = new Date().toISOString().slice(0, 7);
  return getDb().organizationUsage.find(
    (u) => u.organization_id === orgId && u.period === period
  );
}

export function upsertUsage(usage: OrganizationUsage) {
  mutate((db) => {
    const idx = db.organizationUsage.findIndex(
      (u) => u.organization_id === usage.organization_id && u.period === usage.period
    );
    if (idx >= 0) db.organizationUsage[idx] = { ...usage, updated_at: new Date().toISOString() };
    else db.organizationUsage.unshift(usage);
  });
}

export function incrementUsage(
  orgId: string,
  field: keyof Pick<OrganizationUsage, "leads_count" | "messages_count" | "ai_tokens_count" | "bookings_count" | "forms_count" | "emails_count">,
  delta: number = 1
) {
  mutate((db) => {
    const period = new Date().toISOString().slice(0, 7);
    let record = db.organizationUsage.find((u) => u.organization_id === orgId && u.period === period);
    if (!record) {
      record = {
        id: `usage_${orgId}_${period}`,
        organization_id: orgId,
        period,
        leads_count: 0,
        messages_count: 0,
        ai_tokens_count: 0,
        bookings_count: 0,
        forms_count: 0,
        emails_count: 0,
        created_at: new Date(`${period}-01`).toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.organizationUsage.unshift(record);
    }
    (record as OrganizationUsage)[field] = Math.max(0, (record as OrganizationUsage)[field] + delta);
    record.updated_at = new Date().toISOString();
  });
}

/* ---------- Usage Limits (Fase G) ---------- */

export function getUsageLimits(plan: UsageLimits["plan"]): UsageLimits | undefined {
  return getDb().usageLimits.find((l) => l.plan === plan);
}

export function listUsageLimits(): UsageLimits[] {
  return getDb().usageLimits;
}

/* ---------- Marketplace de Agencia (Fase G) ---------- */

export function listMarketplace(status?: AgencyMarketplace["status"], publisherOrgId?: string): AgencyMarketplace[] {
  return getDb()
    .agencyMarketplace
    .filter((m) => (!status || m.status === status) && (!publisherOrgId || m.publisher_org_id === publisherOrgId))
    .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.installs_count - a.installs_count);
}

export function getMarketplaceItem(id: string): AgencyMarketplace | undefined {
  return getDb().agencyMarketplace.find((m) => m.id === id);
}

export function addMarketplaceItem(item: AgencyMarketplace) {
  mutate((db) => {
    db.agencyMarketplace.push(item);
  });
}

export function patchMarketplaceItem(id: string, patch: Partial<AgencyMarketplace>) {
  mutate((db) => {
    const idx = db.agencyMarketplace.findIndex((m) => m.id === id);
    if (idx >= 0) db.agencyMarketplace[idx] = { ...db.agencyMarketplace[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function removeMarketplaceItem(id: string) {
  mutate((db) => {
    db.agencyMarketplace = db.agencyMarketplace.filter((m) => m.id !== id);
  });
}

export function listPublishedMarketplace(): AgencyMarketplace[] {
  return listMarketplace("published");
}

/* ---------- Snapshots (Fase G) ---------- */

export function listSnapshots(orgId: string): VerticalSnapshot[] {
  return getDb().verticalSnapshots?.filter((s) => s.organization_id === orgId) ?? [];
}

export function getSnapshot(id: string): VerticalSnapshot | undefined {
  return getDb().verticalSnapshots?.find((s) => s.id === id);
}

export function addSnapshot(snapshot: VerticalSnapshot) {
  mutate((db) => {
    if (!db.verticalSnapshots) db.verticalSnapshots = [];
    db.verticalSnapshots.unshift(snapshot);
  });
}

export function patchSnapshot(id: string, patch: Partial<VerticalSnapshot>) {
  mutate((db) => {
    if (!db.verticalSnapshots) return;
    const idx = db.verticalSnapshots.findIndex((s) => s.id === id);
    if (idx >= 0) db.verticalSnapshots[idx] = { ...db.verticalSnapshots[idx], ...patch };
  });
}

/* ---------- AI Copilot (Fase H) ---------- */

export function listCopilotSessions(orgId: string): CopilotSession[] {
  return getDb()
    .copilotSessions?.filter((s) => s.organization_id === orgId)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()) ?? [];
}

export function getCopilotSession(id: string): CopilotSession | undefined {
  return getDb().copilotSessions?.find((s) => s.id === id);
}

export function addCopilotSession(session: CopilotSession) {
  mutate((db) => {
    if (!db.copilotSessions) db.copilotSessions = [];
    db.copilotSessions.unshift(session);
  });
}

export function patchCopilotSession(id: string, patch: Partial<CopilotSession>) {
  mutate((db) => {
    if (!db.copilotSessions) return;
    const idx = db.copilotSessions.findIndex((s) => s.id === id);
    if (idx >= 0) db.copilotSessions[idx] = { ...db.copilotSessions[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function listCopilotMessages(sessionId: string): CopilotMessage[] {
  return getDb()
    .copilotMessages?.filter((m) => m.session_id === sessionId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) ?? [];
}

export function addCopilotMessage(message: CopilotMessage) {
  mutate((db) => {
    if (!db.copilotMessages) db.copilotMessages = [];
    db.copilotMessages.push(message);
    // Actualiza updated_at de la sesión.
    const session = db.copilotSessions?.find((s) => s.id === message.session_id);
    if (session) session.updated_at = message.created_at;
  });
}

export function listCopilotTools(): CopilotTool[] {
  return getDb().copilotTools ?? [];
}

/* ---------- Lead Scoring (Fase H) ---------- */

export function listScoringModels(orgId: string): ScoringModel[] {
  return getDb().scoringModels?.filter((m) => m.organization_id === orgId) ?? [];
}

export function addScoringModel(model: ScoringModel) {
  mutate((db) => {
    if (!db.scoringModels) db.scoringModels = [];
    db.scoringModels.push(model);
  });
}

export function patchScoringModel(id: string, patch: Partial<ScoringModel>) {
  mutate((db) => {
    if (!db.scoringModels) return;
    const idx = db.scoringModels.findIndex((m) => m.id === id);
    if (idx >= 0) db.scoringModels[idx] = { ...db.scoringModels[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function listLeadScores(orgId: string, leadId?: string): LeadScore[] {
  return getDb()
    .leadScores?.filter((s) => s.organization_id === orgId && (!leadId || s.lead_id === leadId)) ?? [];
}

export function upsertLeadScore(score: LeadScore) {
  mutate((db) => {
    if (!db.leadScores) db.leadScores = [];
    const idx = db.leadScores.findIndex(
      (s) => s.organization_id === score.organization_id && s.lead_id === score.lead_id && s.model_id === score.model_id
    );
    if (idx >= 0) db.leadScores[idx] = { ...score, calculated_at: new Date().toISOString() };
    else db.leadScores.unshift(score);
  });
}

export function listLeadScoreHistory(orgId: string, leadId?: string): LeadScoreHistory[] {
  return getDb()
    .leadScoreHistory?.filter((h) => h.organization_id === orgId && (!leadId || h.lead_id === leadId))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) ?? [];
}

export function addLeadScoreHistory(entry: LeadScoreHistory) {
  mutate((db) => {
    if (!db.leadScoreHistory) db.leadScoreHistory = [];
    db.leadScoreHistory.unshift(entry);
  });
}

/* ---------- Cost Dashboard (Fase H) ---------- */

export function listUnitCosts(): UnitCost[] {
  return getDb().unitCosts ?? [];
}

export function listResourceUsage(orgId: string): ResourceUsage[] {
  return getDb()
    .resourceUsage?.filter((r) => r.organization_id === orgId)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime()) ?? [];
}

export function addResourceUsage(entry: ResourceUsage) {
  mutate((db) => {
    if (!db.resourceUsage) db.resourceUsage = [];
    db.resourceUsage.unshift(entry);
  });
}

export function listDailyCosts(orgId: string): DailyCosts[] {
  return getDb()
    .dailyCosts?.filter((d) => d.organization_id === orgId)
    .sort((a, b) => a.date.localeCompare(b.date)) ?? [];
}

export function upsertDailyCosts(entry: DailyCosts) {
  mutate((db) => {
    if (!db.dailyCosts) db.dailyCosts = [];
    const idx = db.dailyCosts.findIndex(
      (d) => d.organization_id === entry.organization_id && d.date === entry.date
    );
    if (idx >= 0) db.dailyCosts[idx] = { ...entry, updated_at: new Date().toISOString() };
    else db.dailyCosts.push(entry);
  });
}

/* ---------- Facturación (Fase E2) ---------- */

export function listQuotes(orgId: string): Quote[] {
  return getDb()
    .quotes?.filter((q) => q.organization_id === orgId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) ?? [];
}

export function addQuote(quote: Quote) {
  mutate((db) => {
    if (!db.quotes) db.quotes = [];
    db.quotes.unshift(quote);
  });
}

export function patchQuote(id: string, patch: Partial<Quote>) {
  mutate((db) => {
    if (!db.quotes) return;
    const idx = db.quotes.findIndex((q) => q.id === id);
    if (idx >= 0) db.quotes[idx] = { ...db.quotes[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function listQuoteItems(quoteId: string): QuoteItem[] {
  return getDb().quoteItems?.filter((i) => i.quote_id === quoteId) ?? [];
}

export function addQuoteItem(item: QuoteItem) {
  mutate((db) => {
    if (!db.quoteItems) db.quoteItems = [];
    db.quoteItems.push(item);
  });
}

export function listInvoices(orgId: string): Invoice[] {
  return getDb()
    .invoices?.filter((inv) => inv.organization_id === orgId)
    .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()) ?? [];
}

export function addInvoice(invoice: Invoice) {
  mutate((db) => {
    if (!db.invoices) db.invoices = [];
    db.invoices.unshift(invoice);
  });
}

export function patchInvoice(id: string, patch: Partial<Invoice>) {
  mutate((db) => {
    if (!db.invoices) return;
    const idx = db.invoices.findIndex((inv) => inv.id === id);
    if (idx >= 0) db.invoices[idx] = { ...db.invoices[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function listInvoiceItems(invoiceId: string): InvoiceItem[] {
  return getDb().invoiceItems?.filter((i) => i.invoice_id === invoiceId) ?? [];
}

export function addInvoiceItem(item: InvoiceItem) {
  mutate((db) => {
    if (!db.invoiceItems) db.invoiceItems = [];
    db.invoiceItems.push(item);
  });
}

export function listPayments(orgId: string): Payment[] {
  return getDb()
    .payments?.filter((p) => p.organization_id === orgId)
    .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime()) ?? [];
}

export function addPayment(payment: Payment) {
  mutate((db) => {
    if (!db.payments) db.payments = [];
    db.payments.unshift(payment);
  });
}

/* ---------- Reputación (Fase F) ---------- */

export function listReviews(orgId: string): Review[] {
  return getDb()
    .reviews?.filter((r) => r.organization_id === orgId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) ?? [];
}

export function addReview(review: Review) {
  mutate((db) => {
    if (!db.reviews) db.reviews = [];
    db.reviews.unshift(review);
  });
}

export function patchReview(id: string, patch: Partial<Review>) {
  mutate((db) => {
    if (!db.reviews) return;
    const idx = db.reviews.findIndex((r) => r.id === id);
    if (idx >= 0) db.reviews[idx] = { ...db.reviews[idx], ...patch, updated_at: new Date().toISOString() };
  });
}

export function listReviewRequests(orgId: string): ReviewRequest[] {
  return getDb()
    .reviewRequests?.filter((r) => r.organization_id === orgId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) ?? [];
}

export function addReviewRequest(request: ReviewRequest) {
  mutate((db) => {
    if (!db.reviewRequests) db.reviewRequests = [];
    db.reviewRequests.unshift(request);
  });
}

export function patchReviewRequest(id: string, patch: Partial<ReviewRequest>) {
  mutate((db) => {
    if (!db.reviewRequests) return;
    const idx = db.reviewRequests.findIndex((r) => r.id === id);
    if (idx >= 0) db.reviewRequests[idx] = { ...db.reviewRequests[idx], ...patch };
  });
}

/* ---------- Timeline unificado, Insights y Métricas (Fase J) ---------- */

export function listTimelineEvents(orgId: string, leadId?: string | null): TimelineEvent[] {
  return getDb()
    .timelineEvents?.filter(
      (t) => t.organization_id === orgId && (leadId ? t.lead_id === leadId : true)
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) ?? [];
}

export function addTimelineEvent(event: TimelineEvent) {
  mutate((db) => {
    if (!db.timelineEvents) db.timelineEvents = [];
    db.timelineEvents.unshift(event);
  });
}

export function listInsightsMoments(orgId: string): InsightsMoment[] {
  return getDb()
    .insightsMoments?.filter((m) => m.organization_id === orgId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) ?? [];
}

export function addInsightsMoment(moment: InsightsMoment) {
  mutate((db) => {
    if (!db.insightsMoments) db.insightsMoments = [];
    db.insightsMoments.unshift(moment);
  });
}

export function resolveInsightMoment(id: string) {
  mutate((db) => {
    if (!db.insightsMoments) return;
    const idx = db.insightsMoments.findIndex((m) => m.id === id);
    if (idx >= 0) db.insightsMoments[idx] = { ...db.insightsMoments[idx], is_resolved: true };
  });
}

export function listMetricsDaily(orgId: string, dateFrom?: string, dateTo?: string): MetricsDaily[] {
  return getDb()
    .metricsDaily?.filter((m) => {
      if (m.organization_id !== orgId) return false;
      if (dateFrom && m.date < dateFrom) return false;
      if (dateTo && m.date > dateTo) return false;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date)) ?? [];
}

export function upsertMetricsDaily(row: MetricsDaily) {
  mutate((db) => {
    if (!db.metricsDaily) db.metricsDaily = [];
    const idx = db.metricsDaily.findIndex(
      (m) => m.organization_id === row.organization_id && m.date === row.date
    );
    if (idx >= 0) db.metricsDaily[idx] = row;
    else db.metricsDaily.push(row);
  });
}

export function listMessagingBots(orgId: string): MessagingBot[] {
  return getDb().messagingBots?.filter((b) => b.organization_id === orgId) ?? [];
}

export function upsertMessagingBot(bot: MessagingBot) {
  mutate((db) => {
    if (!db.messagingBots) db.messagingBots = [];
    const idx = db.messagingBots.findIndex(
      (b) => b.organization_id === bot.organization_id && b.channel === bot.channel
    );
    if (idx >= 0) db.messagingBots[idx] = bot;
    else db.messagingBots.push(bot);
  });
}

export function deleteMessagingBot(orgId: string, channel: MessagingBot["channel"]) {
  mutate((db) => {
    if (!db.messagingBots) return;
    db.messagingBots = db.messagingBots.filter(
      (b) => !(b.organization_id === orgId && b.channel === channel)
    );
  });
}
