import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { shortId } from "@/lib/utils";

/**
 * POST /api/v1/voice/parse-action
 * Voice-to-Action: transcribe una nota de voz, extrae entidades y
 * propone una acción ejecutable. En modo demo simula el flujo completo
 * y escribe el evento en el timeline de la org.
 */
export async function POST(req: Request) {
  let body: {
    org_id?: string;
    audio_b64?: string;
    duration_s?: number;
    demo?: boolean;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const orgId = body.org_id?.trim() ?? "org_brasa";

  // Transcripción simulada (demo) — en producción iría vía Whisper/Groq.
  const transcript = body.demo
    ? "Hola, quería reservar mesa para seis el sábado a las nueve y media para el cumpleaños de mi madre."
    : "Se ha recibido una nota de voz sin transcripción real en este entorno.";

  // Extracción de entidades (determinista para demo).
  const entities = {
    party_size: 6,
    day: "sábado",
    time: "21:30",
    occasion: "cumpleaños",
  };

  // Propuesta de acción derivada de las entidades.
  const action = {
    type: "create_booking",
    payload: {
      party_size: entities.party_size,
      datetime: entities.time,
      note: `Cumpleaños (${entities.occasion})`,
      channel: "voice_note",
    },
    confidence: 0.92,
  };

  // Escribe el evento en el timeline si hay Supabase configurado.
  const sb = getServiceSupabase();
  const demo = !sb;
  if (sb) {
    await sb.from("timeline_events").insert({
      id: `te_${shortId()}`,
      organization_id: orgId,
      lead_id: null,
      event_type: "ai_action",
      title: "Voice-to-action procesado",
      description: transcript.slice(0, 160),
      payload: { channel: "voice_note", entities, action },
    });
  }

  return NextResponse.json({
    demo,
    transcript,
    entities,
    action,
    timeline_written: true,
  });
}
