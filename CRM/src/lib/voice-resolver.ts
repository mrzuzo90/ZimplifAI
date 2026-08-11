import { getServiceSupabase, isAdminConfigured } from "@/lib/supabase/admin";
import { decryptCredential } from "@/lib/telegram";
import { generateBookingToken } from "@/lib/booking";
import { fireWorkflowTriggers } from "@/lib/workflow-runtime";
import type { VoiceLLMProvider, VoiceTTSProvider } from "@/types/database";
import type { VoiceCaller, VoiceOrgContext } from "@/lib/voice-brain";
import {
  mockOrganizations,
  mockCalendars,
  mockAvailabilityRules,
  mockBookings,
  mockLeads,
  mockThreads,
  mockMessages,
} from "@/lib/mock-data";

/**
 * Resolución server-side de la subcuenta del cliente para el agente de
 * llamadas IA.
 *
 * El agente NO guarda contexto propio: cada campo se lee de la organización
 * real (nombre, horarios, calendarios/servicios con precio, franjas, reservas,
 * lead y su historial). La activación desde la agencia se reduce a elegir el
 * cerebro, la voz, el nombre del agente y las reglas: el comportamiento se
 * construye solo a partir del CRM.
 */

export interface ResolvedVoiceAgent {
  configId: string;
  organizationId: string;
  agentName: string;
  tone: string;
  customRules: string | null;
  llmProvider: Exclude<VoiceLLMProvider, "demo"> | "demo";
  llmApiKey: string | null;
  ttsProvider: Exclude<VoiceTTSProvider, "demo"> | "demo";
  ttsApiKey: string | null;
  voiceId: string | null;
  phoneNumber: string | null;
  webhookSecret: string | null;
  status: string;
  lastError: string | null;
}

/** Carga la config del agente de voz de la subcuenta (producción, con service role). */
export async function loadVoiceAgentConfig(orgId: string): Promise<ResolvedVoiceAgent | null> {
  const sb = getServiceSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("voice_agent_configs")
    .select("*")
    .eq("organization_id", orgId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    configId: data.id,
    organizationId: data.organization_id,
    agentName: data.agent_name,
    tone: data.tone,
    customRules: data.custom_rules,
    llmProvider: data.llm_provider,
    llmApiKey: data.llm_api_key_encrypted ? decryptCredential(data.llm_api_key_encrypted) : null,
    ttsProvider: data.tts_provider,
    ttsApiKey: data.tts_api_key_encrypted ? decryptCredential(data.tts_api_key_encrypted) : null,
    voiceId: data.voice_id,
    phoneNumber: data.phone_number,
    webhookSecret: data.webhook_secret,
    status: data.status,
    lastError: data.last_error,
  };
}

/** Resuelve qué organización envió un turn de voz por su secret token. */
export async function resolveOrgByVoiceSecret(secret: string): Promise<string | null> {
  const sb = getServiceSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("voice_agent_configs")
    .select("organization_id")
    .eq("webhook_secret", secret)
    .maybeSingle();
  if (error || !data) return null;
  return data.organization_id;
}

/* ============================ Contexto CRM ============================ */

export interface VoiceContextInput {
  agentName?: string;
  tone?: string;
  customRules?: string | null;
}

/**
 * Carga el contexto completo de la subcuenta para la conversación:
 * org + horarios + servicios/precios + franjas + reservas + lead + historial.
 */
export async function loadVoiceContext(
  orgId: string,
  caller: VoiceCaller,
  origin: string,
  config?: VoiceContextInput
): Promise<VoiceOrgContext | null> {
  const sb = getServiceSupabase();
  if (!sb) return null;

  const [orgRes, modRes, calRes, ruleRes, bookingRes, siteRes] = await Promise.all([
    sb.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
    sb.from("organization_modules").select("module_key, is_enabled, settings").eq("organization_id", orgId),
    sb.from("calendars").select("*").eq("organization_id", orgId),
    sb.from("availability_rules").select("*").eq("organization_id", orgId),
    sb.from("bookings").select("*").eq("organization_id", orgId),
    sb.from("tenant_sites").select("*").eq("organization_id", orgId).eq("is_published", true).maybeSingle(),
  ]);

  if (orgRes.error || !orgRes.data) return null;

  // Lead del llamante (dedupe por teléfono) + su historial de mensajes.
  let lead: VoiceOrgContext["lead"] = null;
  let recentMessages: VoiceOrgContext["recentMessages"] = [];
  if (caller.phone) {
    const { data: leadRow } = await sb
      .from("leads")
      .select("id, first_name, last_name, phone, status, tags")
      .eq("organization_id", orgId)
      .eq("phone", caller.phone)
      .maybeSingle();
    if (leadRow) {
      lead = {
        firstName: leadRow.first_name,
        lastName: leadRow.last_name,
        phone: leadRow.phone,
        status: leadRow.status,
        tags: leadRow.tags ?? [],
      };
      const { data: thread } = await sb
        .from("message_threads")
        .select("id")
        .eq("organization_id", orgId)
        .eq("lead_id", leadRow.id)
        .order("last_message_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (thread) {
        const { data: msgs } = await sb
          .from("messages")
          .select("sender, body, created_at")
          .eq("thread_id", thread.id)
          .order("created_at", { ascending: true })
          .limit(12);
        recentMessages = (msgs ?? []).map((m) => ({
          sender: m.sender === "lead" ? "client" as const : "agent" as const,
          body: m.body,
        }));
      }
    }
  }

  const bookingCal = (modRes.data ?? []).find(
    (m) => m.module_key === "booking_calendar" && m.is_enabled
  );
  const voiceMod = (modRes.data ?? []).find((m) => m.module_key === "ai_voice_agent");
  const site = siteRes.data ?? null;
  const siteUrl = site
    ? site.custom_domain
      ? `https://${site.custom_domain}`
      : `${origin}/s/${site.slug}`
    : "";
  const calendars = (calRes.data ?? []).filter((c) => c.is_active);

  return {
    orgId,
    businessName: orgRes.data.name,
    agentName: config?.agentName || String(voiceMod?.settings?.agent_name ?? "Recepción"),
    tone: config?.tone || String(voiceMod?.settings?.tone ?? "cercano, natural y profesional"),
    customRules: config?.customRules ?? (voiceMod?.settings?.custom_rules as string | undefined) ?? null,
    openHours: String(bookingCal?.settings?.open_hours ?? ""),
    siteUrl,
    calendars,
    rules: ruleRes.data ?? [],
    bookings: bookingRes.data ?? [],
    services: calendars.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      price_eur: Number(c.settings?.price_eur ?? null) || null,
      duration_min: c.service_duration_min,
    })),
    lead,
    recentMessages,
  };
}

/** Crea una reserva confirmada en la subcuenta + lead del cliente por voz. */
export async function saveVoiceBooking(
  orgId: string,
  payload: Record<string, unknown>
): Promise<{ ok: true; bookingId: string; leadId: string } | { ok: false; error: string }> {
  const sb = getServiceSupabase();
  if (!sb) return { ok: false, error: "Supabase no configurado" };

  const date = String(payload.date ?? "");
  const time = String(payload.time ?? "12:00");
  const party = Number(payload.party_size ?? 1) || 1;
  const serviceId = (payload.service_id as string | null) ?? null;
  const serviceName = (payload.service_name as string | null) ?? null;
  const customerName = String(payload.customer_name ?? "Cliente (llamada)").trim();
  const phone = (payload.phone as string | null) ?? null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Fecha inválida" };

  // Lead deduplicado por teléfono.
  let leadId: string | null = null;
  if (phone) {
    const { data: existing } = await sb
      .from("leads")
      .select("id")
      .eq("organization_id", orgId)
      .eq("phone", phone)
      .maybeSingle();
    if (existing) {
      leadId = existing.id;
    }
  }
  if (!leadId) {
    const parts = customerName.split(/\s+/);
    const { data: created, error: leadErr } = await sb
      .from("leads")
      .insert({
        organization_id: orgId,
        first_name: parts[0],
        last_name: parts.slice(1).join(" ") || null,
        phone: phone ?? `voice:${Date.now()}`,
        status: "new",
        tags: ["voz"],
      })
      .select("id")
      .single();
    if (leadErr) return { ok: false, error: leadErr.message };
    leadId = created.id;
    await fireWorkflowTriggers(orgId, "lead_created", { leadId: created.id }, sb);
  }

  const calendarId = serviceId || (await resolveDefaultCalendar(orgId, sb));
  const token = generateBookingToken();
  const bookingDate = new Date(`${date}T${time}:00`).toISOString();
  const { data: bookingData, error } = await sb
    .from("bookings")
    .insert({
      organization_id: orgId,
      lead_id: leadId,
      calendar_id: calendarId,
      booking_date: bookingDate,
      party_size_or_service: serviceName ? `${party} · ${serviceName}` : String(party),
      status: "confirmed",
      token,
      source: "voice_call",
      notes: `Reserva por llamada IA · ${customerName}${phone ? ` · ${phone}` : ""}`,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await fireWorkflowTriggers(
    orgId,
    "booking_created",
    { leadId, bookingId: bookingData.id, meta: { source: "voice_call" } },
    sb
  );

  try {
    await sb.from("timeline_events").insert({
      organization_id: orgId,
      lead_id: leadId,
      event_type: "booking_confirmed",
      title: "Reserva por llamada IA",
      description: `${party} ${party === 1 ? "persona" : "personas"} · ${date} ${time}${serviceName ? ` · ${serviceName}` : ""} · ${customerName}`,
      payload: { source: "voice_call", token, phone },
    });
  } catch {
    // No bloquea la reserva si el timeline falla.
  }

  return { ok: true, bookingId: bookingData.id, leadId };
}

async function resolveDefaultCalendar(
  orgId: string,
  sb: Awaited<ReturnType<typeof getServiceSupabase>>
): Promise<string | null> {
  if (!sb) return null;
  const { data } = await sb
    .from("calendars")
    .select("id")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

/** Indica si el entorno tiene Supabase admin configurado (modo real vs demo). */
export function voiceBackendConfigured(): boolean {
  return isAdminConfigured();
}

/* ============================ Modo demo (sin Supabase) ============================ */

/** Contexto demo con los datos de la org de ejemplo (Brasa & Carbón). */
export async function demoVoiceContext(config?: VoiceContextInput): Promise<VoiceOrgContext> {
  const org = mockOrganizations.find((o) => o.id === "org_brasa");
  const calendars = mockCalendars.filter((c) => c.organization_id === "org_brasa" && c.is_active);
  return {
    orgId: org?.id ?? "org_brasa",
    businessName: org?.name ?? "Brasa & Carbón · Restaurante",
    agentName: config?.agentName || "Recepción",
    tone: config?.tone || "cercano, natural y profesional",
    customRules: config?.customRules ?? null,
    openHours: "12:00–16:00, 20:00–23:30",
    siteUrl: "https://zimplifai.app/s/brasa-carbon",
    calendars,
    rules: mockAvailabilityRules.filter((r) => r.organization_id === "org_brasa"),
    bookings: mockBookings.filter((b) => b.organization_id === "org_brasa"),
    services: calendars.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      price_eur: Number(c.settings?.price_eur ?? null) || null,
      duration_min: c.service_duration_min,
    })),
    lead: (() => {
      const l = mockLeads.find((x) => x.phone && x.phone.replace(/\D/g, "").endsWith("600000001"));
      if (!l) return null;
      return {
        firstName: l.first_name,
        lastName: l.last_name,
        phone: l.phone,
        status: l.status,
        tags: l.tags ?? [],
      };
    })(),
    recentMessages: (() => {
      const thread = mockThreads.find((th) => th.organization_id === "org_brasa");
      if (!thread) return [];
      return mockMessages
        .filter((m) => m.thread_id === thread.id)
        .slice(-6)
        .map((m) => ({
          sender: m.sender === "lead" ? "client" as const : "agent" as const,
          body: m.body,
        }));
    })(),
  };
}

/** Acción de guardado en demo: confirma sin persistir y devuelve un id ficticio. */
export async function demoCreateVoiceBooking(payload: Record<string, unknown>) {
  void payload;
  return { ok: true as const, bookingId: `bk_demo_${generateBookingToken().slice(3)}`, leadId: "lead_demo" };
}

/* ============================ Registro demo en memoria ============================ */

/** Registro en memoria secret → orgId para el modo demo (sin Supabase). */
const demoVoiceAgents = new Map<string, string>();

export function registerDemoVoiceAgent(secret: string, orgId: string) {
  demoVoiceAgents.set(secret, orgId);
}

export function unregisterDemoVoiceAgent(secret: string) {
  demoVoiceAgents.delete(secret);
}

/** Devuelve el orgId si el secret pertenece a un agente registrado en demo. */
export function resolveDemoVoiceAgent(secret: string): string | null {
  return demoVoiceAgents.get(secret) ?? null;
}
