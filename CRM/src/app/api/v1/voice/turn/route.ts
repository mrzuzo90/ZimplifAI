import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { isAdminConfigured } from "@/lib/supabase/admin";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { runVoiceTurn, type VoiceCaller, type VoiceSession } from "@/lib/voice-brain";
import { runVoiceTurnWithLlm } from "@/lib/voice-agent";
import {
  loadVoiceAgentConfig,
  loadVoiceContext,
  resolveOrgByVoiceSecret,
  saveVoiceBooking,
  demoVoiceContext,
  demoCreateVoiceBooking,
  resolveDemoVoiceAgent,
} from "@/lib/voice-resolver";
import type { VoiceTurnRequest, VoiceTurnResponse } from "@/types/database";

/**
 * POST /api/v1/voice/turn
 *
 * Turno de conversación del agente de llamadas IA. Endpoint genérico:
 * sirve a TODAS las organizaciones. Recibe la transcripción del cliente
 * (el orquestador de voz —Vapi/Retell— ya hizo el STT) y devuelve la
 * respuesta del agente + la acción a ejecutar.
 *
 * Body (VoiceTurnRequest):
 *   { org_id, transcript, phone?, session_id?, webhook_secret? }
 *
 * - Si la subcuenta configuró un LLM real (Gemini/Groq), se construye el
 *   system prompt con el contexto del CRM y se llama al modelo.
 * - Sin LLM (demo), un motor determinista responde con la misma lógica.
 * - Si el agente decide reservar, se persiste lead + reserva en el CRM y
 *   se disparan los workflows del cliente.
 *
 * Autenticación:
 *  - Orquestador de voz: manda `webhook_secret` (validado por agente).
 *  - Panel de pruebas del CRM: sesión autenticada (super_admin o miembro).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as VoiceTurnRequest & {
    // Overrides de personalidad/credenciales para el modo demo (sin Supabase).
    agent_name?: string;
    tone?: string;
    custom_rules?: string;
    llm_provider?: string;
    llm_api_key?: string;
    tts_provider?: string;
    tts_api_key?: string;
    voice_id?: string;
    session_id?: string;
    // Estado de la conversación reenviado por el cliente (demo determinista).
    session_state?: VoiceSession;
  };
  const orgId = body.org_id;
  const transcript = (body.transcript ?? "").trim();
  const caller: VoiceCaller = { phone: body.phone || null, name: null };
  const isFirstTurn = (body.session_state?.turnCount ?? 0) === 0;

  // El primer turno puede ir vacío (el orquestador saluda sin haber oído nada);
  // a partir de ahí siempre debe haber transcripción.
  if (!orgId || (!transcript && !isFirstTurn)) {
    return NextResponse.json({ error: "Faltan org_id o transcript" }, { status: 400 });
  }

  const backend = isAdminConfigured();
  const demo = !backend;
  const sb = getServiceSupabase();
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // ---- Autenticación ----
  if (backend) {
    if (body.webhook_secret) {
      // Llamada de un orquestador de voz: validar el secret del agente.
      const resolvedOrg = await resolveOrgByVoiceSecret(body.webhook_secret);
      if (resolvedOrg !== orgId) {
        return NextResponse.json({ error: "webhook_secret inválido" }, { status: 401 });
      }
    } else {
      // Panel de pruebas del CRM: sesión autenticada con acceso a la org.
      const supabase = await createServerSupabase();
      const { data: auth } = await supabase.auth.getUser();
      const meta = auth?.user?.app_metadata as Record<string, unknown> | undefined;
      const role = meta?.role as string | undefined;
      const userOrg = meta?.organization_id as string | undefined;
      if (role !== "super_admin" && userOrg !== orgId) {
        return NextResponse.json({ error: "No autorizado para este agente de voz" }, { status: 403 });
      }
    }
  } else if (body.webhook_secret) {
    // Demo con secret: el agente debe estar registrado en memoria.
    if (resolveDemoVoiceAgent(body.webhook_secret) !== orgId) {
      return NextResponse.json({ error: "webhook_secret inválido" }, { status: 401 });
    }
  }

  // ---- Config del agente ----
  let agentConfig: {
    agentName: string;
    tone: string;
    customRules: string | null;
    llmProvider: string;
    llmApiKey: string | null;
    ttsProvider: string;
    ttsApiKey: string | null;
    voiceId: string | null;
  };

  if (backend) {
    const config = await loadVoiceAgentConfig(orgId);
    if (!config) {
      return NextResponse.json({ error: "Agente de voz no configurado para esta organización" }, { status: 400 });
    }
    agentConfig = {
      agentName: config.agentName,
      tone: config.tone,
      customRules: config.customRules,
      llmProvider: config.llmProvider,
      llmApiKey: config.llmApiKey,
      ttsProvider: config.ttsProvider,
      ttsApiKey: config.ttsApiKey,
      voiceId: config.voiceId,
    };
  } else {
    // Demo: la config viaja en el body (la UI la guarda en settings del módulo).
    agentConfig = {
      agentName: body.agent_name || "Recepción",
      tone: body.tone || "cercano, natural y profesional",
      customRules: body.custom_rules || null,
      llmProvider: body.llm_provider || "demo",
      llmApiKey: body.llm_api_key || null,
      ttsProvider: body.tts_provider || "demo",
      ttsApiKey: body.tts_api_key || null,
      voiceId: body.voice_id || null,
    };
  }

  // ---- Contexto del CRM ----
  const ctx = backend
    ? await loadVoiceContext(orgId, caller, origin, {
        agentName: agentConfig.agentName,
        tone: agentConfig.tone,
        customRules: agentConfig.customRules,
      })
    : await demoVoiceContext({
        agentName: agentConfig.agentName,
        tone: agentConfig.tone,
        customRules: agentConfig.customRules,
      });
  if (!ctx) {
    return NextResponse.json({ error: "No se pudo cargar el contexto de la organización" }, { status: 500 });
  }

  // ---- Turno ----
  let reply: string;
  let tool: { tool: string; payload: Record<string, unknown> } | null = null;
  let nextSession: VoiceSession | undefined;
  const useLlm = agentConfig.llmProvider !== "demo" && !!agentConfig.llmApiKey;
  const llmProvider = agentConfig.llmProvider === "gemini" || agentConfig.llmProvider === "groq"
    ? agentConfig.llmProvider
    : null;

  if (useLlm && llmProvider) {
    try {
      const llm = await runVoiceTurnWithLlm(
        llmProvider,
        agentConfig.llmApiKey as string,
        ctx,
        caller,
        transcript
      );
      reply = llm.reply;
      tool = llm.tool?.tool === "create_booking" ? llm.tool : null;
    } catch (e) {
      // Si el LLM falla, cae al motor determinista para no cortar la llamada.
      const demoResult = runVoiceTurn(ctx, caller, transcript, body.session_state ?? EMPTY_SESSION);
      reply = `Disculpa, estoy teniendo un problema técnico. ${demoResult.reply}`;
      tool = demoResult.action.type === "create_booking"
        ? { tool: "create_booking", payload: demoResult.action.payload }
        : null;
      nextSession = demoResult.session;
      void e;
    }
  } else {
    // Demo / sin LLM: el cliente reenvía el estado de la conversación.
    const result = runVoiceTurn(ctx, caller, transcript, body.session_state ?? EMPTY_SESSION);
    reply = result.reply;
    nextSession = result.session;
    tool = result.action.type === "create_booking"
      ? { tool: "create_booking", payload: result.action.payload }
      : null;
  }

  // ---- Ejecutar acción (create_booking) ----
  let booking: VoiceTurnResponse["booking"];
  let timeline_written = false;
  if (tool) {
    const res = backend
      ? await saveVoiceBooking(orgId, tool.payload)
      : await demoCreateVoiceBooking(tool.payload);
    if (res.ok) {
      booking = {
        id: res.bookingId,
        booking_date: new Date(`${String(tool.payload.date)}T${String(tool.payload.time ?? "12:00")}:00`).toISOString(),
        token: res.bookingId.startsWith("bk_demo_") ? res.bookingId : null,
        source: "voice_call",
      };
      timeline_written = true;
    } else {
      reply = `${reply} (No he podido guardar la reserva: ${res.error})`;
    }
  }

  // Auditoría del turno en el timeline (best-effort, solo producción).
  if (backend && sb) {
    try {
      const leadId = tool ? null : null; // los turns sin reserva no siempre tienen lead
      await sb.from("timeline_events").insert({
        organization_id: orgId,
        lead_id: leadId,
        event_type: "ai_action",
        title: "Turno de llamada IA",
        description: transcript.slice(0, 160),
        payload: {
          source: "voice_call",
          reply: reply.slice(0, 160),
          action: tool?.tool ?? "none",
          demo: false,
        },
      });
    } catch {
      // Auditoría best-effort.
    }
  }

  return NextResponse.json<VoiceTurnResponse>({
    reply,
    demo,
    action: {
      type: tool ? "create_booking" : "none",
      payload: tool?.payload ?? {},
    },
    booking,
    timeline_written: timeline_written || demo,
    session: nextSession,
  });
}

/** Sesión inicial: idle / none (vuelve a cero tras una reserva confirmada). */
const EMPTY_SESSION: VoiceSession = {
  intent: "idle",
  step: "none",
  dateStr: null,
  serviceId: null,
  partySize: null,
  time: null,
  customerName: null,
  turnCount: 0,
};
