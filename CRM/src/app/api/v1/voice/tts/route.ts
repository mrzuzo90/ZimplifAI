import { NextResponse } from "next/server";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { synthesizeSpeech } from "@/lib/voice-agent";
import { loadVoiceAgentConfig } from "@/lib/voice-resolver";

/**
 * POST /api/v1/voice/tts
 *
 * Sintetiza la respuesta del agente a audio (para el panel de pruebas y
 * para el orquestador de voz si este no hace el TTS). Usa la voz y la
 * clave configuradas en la subcuenta; en demo sin TTS devuelve `demo: true`.
 *
 * Body: { org_id, text, tts_provider?, tts_api_key?, voice_id? }
 *   (los overrides se usan en modo demo, cuando la UI guarda las claves
 *   en los settings del módulo).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    org_id?: string;
    text?: string;
    tts_provider?: string;
    tts_api_key?: string;
    voice_id?: string;
  };
  const orgId = body.org_id;
  const text = (body.text ?? "").trim();
  if (!orgId || !text) {
    return NextResponse.json({ error: "Faltan org_id o text" }, { status: 400 });
  }

  const backend = isAdminConfigured();

  let provider: string;
  let apiKey: string | null;
  let voiceId: string | null;

  if (backend) {
    const config = await loadVoiceAgentConfig(orgId);
    if (!config) {
      return NextResponse.json({ error: "Agente de voz no configurado" }, { status: 400 });
    }
    provider = config.ttsProvider;
    apiKey = config.ttsApiKey;
    voiceId = config.voiceId;
  } else {
    provider = body.tts_provider || "demo";
    apiKey = body.tts_api_key || null;
    voiceId = body.voice_id || null;
  }

  if (provider === "demo" || !apiKey || !voiceId) {
    return NextResponse.json({ demo: true, reply: text });
  }

  const ttsProvider = provider === "elevenlabs" || provider === "deepgram" ? provider : null;
  if (!ttsProvider) {
    return NextResponse.json({ error: "tts_provider inválido" }, { status: 400 });
  }

  try {
    const { audioBase64, contentType } = await synthesizeSpeech(ttsProvider, apiKey, voiceId, text);
    return NextResponse.json({ audioBase64, contentType, demo: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de síntesis de voz";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
