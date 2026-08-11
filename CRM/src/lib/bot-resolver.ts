import { getServiceSupabase, isAdminConfigured } from "@/lib/supabase/admin";
import { decryptCredential } from "@/lib/telegram";
import { generateBookingToken } from "@/lib/booking";
import { fireWorkflowTriggers } from "@/lib/workflow-runtime";
import type { BotOrgContext, BookingInput } from "@/lib/bot-brain";
import { mockOrganizations, mockCalendars, mockAvailabilityRules, mockBookings } from "@/lib/mock-data";

/**
 * Resolución server-side de la subcuenta del cliente para el bot.
 *
 * El bot NO guarda configuración propia: cada campo del contexto se lee
 * de la organización real (name, booking_calendar.open_hours, calendarios,
 * franjas, reservas y micro-sitio). Así la activación desde la agencia se
 * reduce a introducir el token: el comportamiento se construye solo.
 */

export interface ResolvedBot {
  botId: string;
  organizationId: string;
  channel: string;
  externalId: string;
  token: string;
}

/** Resuelve qué bot (y por tanto qué organización) envió un update del webhook. */
export async function resolveBotBySecret(secret: string): Promise<ResolvedBot | null> {
  const sb = getServiceSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("messaging_bots")
    .select("id, organization_id, channel, external_id, credential_encrypted")
    .eq("webhook_secret", secret)
    .maybeSingle();
  if (error || !data) return null;
  return {
    botId: data.id,
    organizationId: data.organization_id,
    channel: data.channel,
    externalId: data.external_id,
    token: decryptCredential(data.credential_encrypted),
  };
}

/** Carga el contexto completo de la subcuenta para la conversación. */
export async function loadOrgContext(orgId: string, origin: string): Promise<BotOrgContext | null> {
  const sb = getServiceSupabase();
  if (!sb) return null;

  const [orgRes, modRes, calRes, ruleRes, bookingRes, siteRes] = await Promise.all([
    sb.from("organizations").select("id, name").eq("id", orgId).maybeSingle(),
    sb
      .from("organization_modules")
      .select("module_key, is_enabled, settings")
      .eq("organization_id", orgId),
    sb.from("calendars").select("*").eq("organization_id", orgId).eq("is_active", true),
    sb.from("availability_rules").select("*").eq("organization_id", orgId),
    sb
      .from("bookings")
      .select("*")
      .eq("organization_id", orgId)
      .gte("booking_date", new Date(Date.now() - 1 * 86_400_000).toISOString()),
    sb
      .from("tenant_sites")
      .select("*")
      .eq("organization_id", orgId)
      .eq("is_published", true)
      .maybeSingle(),
  ]);

  if (orgRes.error || !orgRes.data) return null;

  const bookingCal = (modRes.data ?? []).find(
    (m) => m.module_key === "booking_calendar" && m.is_enabled
  );
  const site = siteRes.data ?? null;
  const siteUrl = site
    ? site.custom_domain
      ? `https://${site.custom_domain}`
      : `${origin}/s/${site.slug}`
    : "";

  return {
    orgId,
    businessName: orgRes.data.name,
    openHours: String(bookingCal?.settings?.open_hours ?? ""),
    siteUrl,
    calendars: calRes.data ?? [],
    rules: ruleRes.data ?? [],
    bookings: bookingRes.data ?? [],
  };
}

/** Crea una reserva confirmada en la subcuenta + lead del cliente de Telegram. */
export async function saveBotBooking(
  orgId: string,
  input: BookingInput
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const sb = getServiceSupabase();
  if (!sb) return { ok: false, error: "Supabase no configurado" };

  const parts = input.customerName.trim().split(/\s+/);
  const phone = input.telegramUsername ? `tg:${input.telegramUsername}` : `tg:${input.telegramUserId}`;

  // Lead deduplicado por teléfono (tg:@usuario o tg:ID) para no duplicar clientes.
  let leadId: string | null = null;
  const { data: existing } = await sb
    .from("leads")
    .select("id")
    .eq("organization_id", orgId)
    .eq("phone", phone)
    .maybeSingle();
  if (existing) {
    leadId = existing.id;
  } else {
    const { data: created, error: leadErr } = await sb
      .from("leads")
      .insert({
        organization_id: orgId,
        first_name: parts[0],
        last_name: parts.slice(1).join(" ") || null,
        phone,
        status: "new",
        tags: ["telegram"],
      })
      .select("id")
      .single();
    if (leadErr) return { ok: false, error: leadErr.message };
    leadId = created.id;
    // Automatización: lead nuevo entrante por Telegram.
    await fireWorkflowTriggers(orgId, "lead_created", { leadId: created.id }, sb);
  }

  const token = generateBookingToken();
  const bookingDate = new Date(`${input.date}T${input.time}:00`).toISOString();
  const { data: bookingData, error } = await sb
    .from("bookings")
    .insert({
      organization_id: orgId,
      lead_id: leadId,
      booking_date: bookingDate,
      party_size_or_service: String(input.partySize),
      status: "confirmed",
      token,
      source: "telegram",
      notes: `Reserva por bot de Telegram · ${input.customerName}`,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  // Automatización: reserva confirmada (dispara los workflows booking_created del cliente).
  await fireWorkflowTriggers(
    orgId,
    "booking_created",
    { leadId, bookingId: bookingData.id, meta: { source: "telegram" } },
    sb
  );

  // Timeline de auditoría (best-effort).
  try {
    await sb.from("timeline_events").insert({
      organization_id: orgId,
      lead_id: leadId,
      event_type: "booking_confirmed",
      title: "Reserva por bot de Telegram",
      description: `${input.partySize} personas · ${input.date} ${input.time} · ${input.customerName}`,
      payload: { source: "telegram", token },
    });
  } catch {
    // No bloquea la reserva si el timeline falla.
  }

  return { ok: true, token };
}

/* ============================ Modo demo (sin Supabase) ============================ */

/** Contexto demo con los datos de la org de ejemplo para probar el wiring del webhook. */
export async function demoOrgContext(): Promise<BotOrgContext> {
  const org = mockOrganizations.find((o) => o.id === "org_brasa");
  const site = {
    id: "site_brasa",
    organization_id: "org_brasa",
    title: "Brasa & Carbón",
    slug: "brasa-carbon",
    vertical_template: "restaurant_menu" as const,
    is_published: true,
    custom_domain: null,
    seo_metadata: {},
    content_payload: {
      hero: {
        headline: "Brasa & Carbón",
        subheadline: "Cocina de brasa y reservas online.",
        badge: "Reserva online disponible",
        cta_text: "Reservar Mesa",
      },
      sections: {
        show_menu: true,
        show_hours: true,
        show_location: true,
        show_booking: true,
      },
      menu_items: [],
      business_hours: [],
      contact: {
        address: "Calle Mayor 12, Madrid",
        phone: "+34 910 000 000",
        whatsapp: "+34 910 000 000",
        google_maps_url: "",
      },
      menu_pdf_url: "",
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  return {
    orgId: org?.id ?? "org_brasa",
    businessName: org?.name ?? "Brasa & Carbón · Restaurante",
    openHours: "12:00–16:00, 20:00–23:30",
    siteUrl: "https://zimplifai.app/s/brasa-carbon",
    calendars: mockCalendars.filter((c) => c.organization_id === "org_brasa"),
    rules: mockAvailabilityRules.filter((r) => r.organization_id === "org_brasa"),
    bookings: mockBookings.filter((b) => b.organization_id === "org_brasa"),
  };
}

/** Acción de guardado en demo: confirma sin persistir y devuelve un token ficticio. */
export async function demoCreateBooking(input: BookingInput) {
  void input;
  return { ok: true as const, token: `bk_demo_${generateBookingToken().slice(3)}` };
}

/** Indica si el entorno tiene Supabase admin configurado (modo real vs demo). */
export function botBackendConfigured(): boolean {
  return isAdminConfigured();
}

/* ============================ Registro demo en memoria ============================ */

/**
 * Registro en memoria secret → token para el modo demo (sin Supabase).
 * Permite probar de extremo a extremo con un bot real: el connect guarda
 * aquí la credencial y el webhook puede responder. Se pierde al reiniciar
 * el proceso (Vercel serverless), que es exactamente el modo demo.
 */
const demoBots = new Map<string, string>();

export function registerDemoBot(secret: string, token: string) {
  demoBots.set(secret, token);
}

export function unregisterDemoBot(secret: string) {
  demoBots.delete(secret);
}

/** Devuelve el token si el secret pertenece a un bot registrado en demo. */
export function resolveDemoBot(secret: string): string | null {
  return demoBots.get(secret) ?? null;
}
