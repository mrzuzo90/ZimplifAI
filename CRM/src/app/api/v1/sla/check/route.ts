import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";

/**
 * GET /api/v1/sla/check
 * SLA Rescue Radar: detecta leads en riesgo de respuesta lenta.
 * Umbrales por defecto: alerta a los 5 min, auto-rescate a los 10 min.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("org_id") ?? "org_brasa";

  const sb = getServiceSupabase();
  const demo = !sb;

  let atRisk: Array<{
    id: string;
    name: string;
    age_seconds: number;
    threshold_minutes: number;
    status: "warning" | "danger" | "rescued";
    source: string;
  }> = [];

  if (sb) {
    // En producción se calcula a partir de eventos de timeline / primer contacto real.
    const { data, error } = await sb
      .from("timeline_events")
      .select("*")
      .eq("organization_id", orgId)
      .in("event_type", ["sla_breach", "sla_rescued"])
      .order("created_at", { ascending: false })
      .limit(20);
    if (!error && data) {
      atRisk = data.map((e) => ({
        id: e.id,
        name: e.payload?.lead_name as string ?? "Lead",
        age_seconds: e.payload?.speed_to_lead_seconds as number ?? 300,
        threshold_minutes: 5,
        status: e.event_type === "sla_rescued" ? "rescued" : "danger",
        source: e.payload?.channel as string ?? "whatsapp",
      }));
    }
  } else {
    // Simulación demo: leads recientes con tiempos de respuesta variados.
    const mk = (id: string, name: string, ageSeconds: number, source: string, status: "warning" | "danger" | "rescued") => ({
      id,
      name,
      age_seconds: ageSeconds,
      threshold_minutes: 5,
      status,
      source,
    });
    atRisk = [
      mk("lead_ivan", "Iván Soler", 284, "form", "warning"),
      mk("lead_nerea", "Nerea Costa", 612, "whatsapp", "danger"),
      mk("lead_laura", "Laura García", 720, "instagram", "danger"),
      mk("lead_paula", "Paula Díaz", 96, "whatsapp", "warning"),
      mk("lead_alex", "Álex Rubio", 360, "google_review", "rescued"),
    ];
  }

  return NextResponse.json({
    demo,
    config: { alert_minutes: 5, auto_rescue_minutes: 10 },
    leads_at_risk: atRisk,
    generated_at: new Date().toISOString(),
  });
}
