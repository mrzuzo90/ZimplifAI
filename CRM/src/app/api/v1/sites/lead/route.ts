import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { SITE_LEAD_SOURCE } from "@/lib/site";
import { shortId } from "@/lib/utils";

/**
 * POST /api/v1/sites/lead
 * Captación de leads desde el formulario del micro-website público
 * (service role, bypass RLS). Etiqueta el lead con SITE_LEAD_SOURCE
 * para atribución del canal web.
 */
export async function POST(req: Request) {
  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Entorno Supabase no configurado" }, { status: 503 });
  }

  let body: { org_id?: string; first_name?: string; phone?: string; email?: string; message?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const orgId = body.org_id?.trim();
  const firstName = body.first_name?.trim();
  const phone = body.phone?.trim();
  if (!orgId || !firstName || !phone) {
    return NextResponse.json({ error: "org_id, first_name y phone son obligatorios" }, { status: 400 });
  }

  const email = body.email?.trim() || null;
  const message = body.message?.trim() || null;

  const { data: lead, error } = await sb
    .from("leads")
    .insert({
      organization_id: orgId,
      first_name: firstName,
      last_name: null,
      email,
      phone,
      status: "new",
      deal_value: null,
      assigned_to: null,
      tags: [SITE_LEAD_SOURCE],
      next_follow_up_at: null,
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Timeline: lead creado desde el sitio web.
  await sb.from("lead_activity").insert({
    id: `act_${shortId()}`,
    organization_id: orgId,
    lead_id: lead.id,
    actor_id: null,
    actor_name: "Sitio web",
    event_type: "lead_created",
    summary: `Lead captado desde el sitio web${message ? `: ${message}` : ""}`,
    metadata: { source: SITE_LEAD_SOURCE },
  });

  return NextResponse.json({ ok: true, lead_id: lead.id }, { status: 201 });
}
