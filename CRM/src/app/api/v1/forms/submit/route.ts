import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { recordLeadActivity } from "@/lib/data-access";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

type PublicFormSubmitInput = {
  orgId: string;
  formId: string;
  formSlug: string;
  payload: Record<string, unknown>;
  attribution: Record<string, string | null>;
};

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return `34${digits}`;
  return digits;
}

function leadFromPayload(payload: Record<string, unknown>) {
  const str = (v: unknown): string | null =>
    typeof v === "string" && v.trim() ? v.trim() : null;
  const first_name =
    str(payload.first_name) ??
    str(payload.nombre) ??
    str(payload.name) ??
    str(payload.full_name) ??
    null;
  const last_name =
    str(payload.last_name) ?? str(payload.apellidos) ?? str(payload.apellido) ?? null;
  const email = str(payload.email) ?? null;
  const phone = str(payload.phone) ?? str(payload.telefono) ?? str(payload.tel) ?? null;
  const message = str(payload.message) ?? str(payload.mensaje) ?? str(payload.comentario) ?? null;
  return { first_name, last_name, email, phone, message };
}

export async function POST(req: NextRequest) {
  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Supabase no configurado" }, { status: 503 });
  }

  // Rate-limit por IP: los formularios públicos son objetivo de spam.
  const limit = rateLimit(`forms:${clientIp(req)}`, 15, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Demasiadas peticiones, inténtalo más tarde" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    );
  }

  let input: PublicFormSubmitInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { orgId, formId, payload, attribution } = input;

  // Validación básica
  if (!orgId || !formId) {
    return NextResponse.json({ error: "Faltan orgId o formId" }, { status: 400 });
  }

  const { first_name, last_name, email, phone, message } = leadFromPayload(payload);

  // Dedupe: buscar lead existente por email o teléfono en esta org
  let leadId: string | null = null;
  let created = false;

  if (email || phone) {
    let query = sb.from("leads").select("id").eq("organization_id", orgId);
    if (email) query = query.eq("email", email);
    if (phone) {
      const normPhone = normalizePhone(phone);
      query = query.or(`phone.eq.${normPhone},phone.eq.${phone}`);
    }
    const { data: existing } = await query.maybeSingle();
    if (existing) leadId = existing.id;
  }

  // Crear lead si no existe
  if (!leadId) {
    const { data: newLead, error: leadError } = await sb
      .from("leads")
      .insert({
        organization_id: orgId,
        first_name,
        last_name,
        email,
        phone,
        status: "new",
        deal_value: null,
        assigned_to: null,
        tags: ["Web"],
        utm_source: attribution.utm_source ?? null,
        utm_medium: attribution.utm_medium ?? null,
        utm_campaign: attribution.utm_campaign ?? null,
        utm_term: attribution.utm_term ?? null,
        utm_content: attribution.utm_content ?? null,
        landing_page: attribution.landing_page ?? null,
        referrer: attribution.referrer ?? null,
      })
      .select()
      .single();

    if (leadError) {
      return NextResponse.json({ error: leadError.message }, { status: 500 });
    }
    leadId = newLead.id;
    created = true;

    // Registrar actividad "lead_created"
    await recordLeadActivity(orgId, leadId, "lead_created", "Lead creado desde formulario público");
  }

  // Si hay mensaje, registrar como comentario
  if (message) {
    await recordLeadActivity(orgId, leadId, "comment", `Mensaje del formulario: ${message}`);
  }

  // Registrar submission
  const { data: submission, error: subError } = await sb
    .from("form_submissions")
    .insert({
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
    })
    .select()
    .single();

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 });
  }

  return NextResponse.json({
    leadId,
    submissionId: submission.id,
    created,
  });
}