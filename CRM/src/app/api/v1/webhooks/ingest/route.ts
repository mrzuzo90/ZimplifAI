import { NextResponse } from "next/server";
import { getServiceSupabase, isAdminConfigured } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/provisioning";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { shortId } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/database";

const VALID_STATUSES = new Set<LeadStatus>([
  "new",
  "ai_contacted",
  "qualified",
  "booked",
  "closed_won",
  "closed_lost",
]);

/**
 * POST /api/v1/webhooks/ingest?org_id=...&key=...
 * Endpoint de ingesta cifrado: valida la API key de la org y crea
 * un lead + entrada de audit del agente IA que lo generó.
 * Body esperado (form-urlencoded o JSON):
 *   { phone, first_name?, last_name?, email?, message?, status?, source? }
 */
export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Entorno Supabase no configurado" }, { status: 503 });
  }
  const sb = getServiceSupabase();
  if (!sb) return NextResponse.json({ error: "Service role no configurado" }, { status: 503 });

  // Rate-limit por IP para cortar ráfagas y scraping.
  const limit = rateLimit(`ingest:${clientIp(req)}`, 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiadas peticiones, inténtalo más tarde" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("org_id");
  const apiKey = searchParams.get("key");

  if (!orgId || !apiKey) {
    return NextResponse.json({ error: "Faltan org_id o key" }, { status: 400 });
  }

  // 1. Valida la API key contra el hash de la organización.
  const { data: org, error: orgError } = await sb
    .from("organizations")
    .select("id, name, slug, api_key_hash, status")
    .eq("id", orgId)
    .single();
  if (orgError || !org) {
    return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
  }
  if (!verifyApiKey(apiKey, org.api_key_hash)) {
    return NextResponse.json({ error: "API key inválida" }, { status: 401 });
  }

  // 2. Parsea el payload (JSON o form-urlencoded).
  const contentType = req.headers.get("content-type") ?? "";
  let payload: Record<string, unknown>;
  try {
    payload = contentType.includes("application/json")
      ? ((await req.json()) as Record<string, unknown>)
      : Object.fromEntries(await req.formData());
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const phone = String(payload.phone ?? "").trim();
  if (!phone) {
    return NextResponse.json({ error: "Campo phone obligatorio" }, { status: 400 });
  }

  const status = VALID_STATUSES.has(payload.status as LeadStatus)
    ? (payload.status as LeadStatus)
    : "new";

  // 3. Crea el lead.
  const leadId = `lead_${shortId()}`;
  const agentName = payload.agent_name ? String(payload.agent_name) : "Webhook Ingest";
  const lead: Lead = {
    id: leadId,
    organization_id: orgId,
    first_name: payload.first_name ? String(payload.first_name) : null,
    last_name: payload.last_name ? String(payload.last_name) : null,
    email: payload.email ? String(payload.email) : null,
    phone,
    status,
    deal_value: null,
    assigned_to: null,
    tags: Array.isArray(payload.tags) ? payload.tags.map(String) : [],
    next_follow_up_at: null,
    company_id: null,
    pipeline_id: null,
    utm_source: payload.utm_source ? String(payload.utm_source) : null,
    utm_medium: payload.utm_medium ? String(payload.utm_medium) : null,
    utm_campaign: payload.utm_campaign ? String(payload.utm_campaign) : null,
    utm_term: payload.utm_term ? String(payload.utm_term) : null,
    utm_content: payload.utm_content ? String(payload.utm_content) : null,
    landing_page: payload.landing_page ? String(payload.landing_page) : null,
    referrer: payload.referrer ? String(payload.referrer) : null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error: leadError } = await sb.from("leads").insert(lead);
  if (leadError) {
    return NextResponse.json({ error: leadError.message }, { status: 400 });
  }

  // 3b. Timeline: registro del evento de creación (quién lo trajo: el agente de ingesta).
  await sb.from("lead_activity").insert({
    id: `act_${shortId()}`,
    organization_id: orgId,
    lead_id: leadId,
    actor_id: null,
    actor_name: agentName,
    event_type: "lead_created",
    summary: `Lead creado vía webhook (${payload.source ?? "ingesta"})`,
    metadata: { source: payload.source ?? null },
    created_at: new Date().toISOString(),
  });

  // 4. Auditoría del evento de ingesta.
  await sb.from("ai_audit_logs").insert({
    id: `aud_${shortId()}`,
    organization_id: orgId,
    lead_id: leadId,
    agent_name: agentName,
    input_payload: { phone, message: payload.message ?? null, source: payload.source ?? null },
    output_payload: { result: "lead_created", status },
    tokens_used: payload.tokens_used ? Number(payload.tokens_used) : null,
    status: "success",
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, leadId, organization: org.slug });
}
