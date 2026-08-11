import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getServiceSupabase, isAdminConfigured } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { encryptCredential } from "@/lib/telegram";
import { registerDemoVoiceAgent, unregisterDemoVoiceAgent } from "@/lib/voice-resolver";
import type { VoiceLLMProvider, VoiceTTSProvider } from "@/types/database";

const LLM_PROVIDERS = ["gemini", "groq", "demo"];
const TTS_PROVIDERS = ["elevenlabs", "deepgram", "demo"];

/**
 * POST /api/v1/voice/connect
 *
 * Conecta o desconecta el agente de llamadas IA de una organización desde
 * el perfil de agencia. La subcuenta solo aporta lo exclusivo del cliente:
 * nombre del agente, tono, reglas, proveedor del cerebro (LLM) y de la voz
 * (TTS) con sus claves. El resto del comportamiento se resuelve después
 * desde los datos del CRM.
 *
 * Body: { org_id, action: "connect"|"disconnect", agent_name?, tone?,
 *         custom_rules?, llm_provider?, llm_api_key?, tts_provider?,
 *         tts_api_key?, voice_id?, phone_number?, webhook_secret? }
 *
 * - Modo real: valida, cifra las claves y hace upsert en voice_agent_configs.
 * - Modo demo: registra el agente en memoria y devuelve el secret para
 *   que la UI lo guarde en los settings del módulo.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    org_id?: string;
    action?: string;
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
  };
  const orgId = body.org_id;
  const action = body.action;

  if (!orgId || (action !== "connect" && action !== "disconnect")) {
    return NextResponse.json({ error: "Faltan org_id o action" }, { status: 400 });
  }
  const llmProvider = (body.llm_provider ?? "demo") as VoiceLLMProvider;
  const ttsProvider = (body.tts_provider ?? "demo") as VoiceTTSProvider;
  if (!LLM_PROVIDERS.includes(llmProvider)) {
    return NextResponse.json({ error: "llm_provider inválido" }, { status: 400 });
  }
  if (!TTS_PROVIDERS.includes(ttsProvider)) {
    return NextResponse.json({ error: "tts_provider inválido" }, { status: 400 });
  }

  const backend = isAdminConfigured();
  const demo = !backend;

  // Autorización: solo super_admin (agencia) o el propio cliente.
  if (backend) {
    const supabase = await createServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    const meta = auth?.user?.app_metadata as Record<string, unknown> | undefined;
    const role = meta?.role as string | undefined;
    const userOrg = meta?.organization_id as string | undefined;
    if (role !== "super_admin" && userOrg !== orgId) {
      return NextResponse.json({ error: "No autorizado para gestionar este agente" }, { status: 403 });
    }
  }

  const sb = getServiceSupabase();

  try {
    if (action === "connect") {
      const secret = `whsv_${randomBytes(20).toString("hex")}`;

      if (sb) {
        // Conservar claves existentes si no se envían nuevas.
        const { data: existing } = await sb
          .from("voice_agent_configs")
          .select("llm_api_key_encrypted, tts_api_key_encrypted")
          .eq("organization_id", orgId)
          .maybeSingle();

        const llmKeyEnc = body.llm_api_key
          ? encryptCredential(body.llm_api_key.trim())
          : existing?.llm_api_key_encrypted ?? null;
        const ttsKeyEnc = body.tts_api_key
          ? encryptCredential(body.tts_api_key.trim())
          : existing?.tts_api_key_encrypted ?? null;

        const { error } = await sb.from("voice_agent_configs").upsert(
          {
            organization_id: orgId,
            agent_name: body.agent_name || "Recepción",
            tone: body.tone || "cercano, natural y profesional",
            custom_rules: body.custom_rules || null,
            llm_provider: llmProvider,
            llm_api_key_encrypted: llmKeyEnc,
            tts_provider: ttsProvider,
            tts_api_key_encrypted: ttsKeyEnc,
            voice_id: body.voice_id || null,
            phone_number: body.phone_number || null,
            webhook_secret: secret,
            status: "connected",
            connected_at: new Date().toISOString(),
            last_error: null,
          },
          { onConflict: "organization_id" }
        );
        if (error) {
          return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
        }
      } else {
        // Demo: registro en memoria para que /turn pueda responder.
        registerDemoVoiceAgent(secret, orgId);
      }

      return NextResponse.json({
        ok: true,
        demo,
        status: "connected",
        webhook_secret: demo ? secret : undefined,
      });
    }

    // ---- Desconexión ----
    if (sb) {
      const { error } = await sb
        .from("voice_agent_configs")
        .delete()
        .eq("organization_id", orgId);
      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }
    }
    if (body.webhook_secret) {
      unregisterDemoVoiceAgent(body.webhook_secret);
    }

    return NextResponse.json({ ok: true, demo, status: "disconnected" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error conectando el agente de voz";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
