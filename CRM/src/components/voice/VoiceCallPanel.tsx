"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  CalendarCheck2,
  Loader2,
  Mic,
  PhoneCall,
  Send,
  Sparkles,
  Speaker,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/States";
import { fetchModules, isDemoMode, runVoiceTurn, voiceTts } from "@/lib/data-access";
import type { VoiceSessionState, VoiceTurnResponse } from "@/types/database";
import { cn } from "@/lib/utils";

const EMPTY_SESSION: VoiceSessionState = {
  intent: "idle",
  step: "none",
  dateStr: null,
  serviceId: null,
  partySize: null,
  time: null,
  customerName: null,
  turnCount: 0,
};

const EXAMPLE_PHRASES = [
  "Hola, quiero hacer una reserva",
  "¿Qué horario tenéis?",
  "¿Cuánto cuesta una mesa?",
  "Mañana",
  "A las 21:00",
  "4 personas",
  "Sí, confirma",
];

interface ChatMsg {
  role: "user" | "agent";
  text: string;
}

/**
 * Simulador de llamada del agente de voz IA para el workspace del cliente.
 * Cada turno se envía al orquestador genérico /api/v1/voice/turn con el estado
 * de la sesión; en demo el estado viaja en el body y el motor determinista
 * responde; en producción el servidor lee la configuración de la subcuenta.
 */
export function VoiceCallPanel({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [phone, setPhone] = useState("");
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [session, setSession] = useState<VoiceSessionState>(EMPTY_SESSION);
  const [sending, setSending] = useState(false);
  const [lastReply, setLastReply] = useState<VoiceTurnResponse | null>(null);
  const [talkingId, setTalkingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const demo = isDemoMode();
  const status = String(settings?.status ?? "disconnected");
  const connected = demo || status === "connected";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mods = await fetchModules(orgId);
        const voice = mods.find((m) => m.module_key === "ai_voice_agent");
        if (!cancelled) setSettings(voice?.settings ?? {});
      } catch {
        if (!cancelled) setSettings({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const agentName = String(settings?.agent_name ?? "Recepción");
  const llmProvider = String(settings?.llm_provider ?? "demo");
  const ttsProvider = String(settings?.tts_provider ?? "demo");

  const overrides = {
    agent_name: String(settings?.agent_name ?? "Recepción"),
    tone: String(settings?.tone ?? "cercano, natural y profesional"),
    custom_rules: String(settings?.custom_rules ?? ""),
    llm_provider: llmProvider,
    llm_api_key: String(settings?.llm_api_key ?? ""),
    tts_provider: ttsProvider,
    tts_api_key: String(settings?.tts_api_key ?? ""),
    voice_id: String(settings?.voice_id ?? ""),
    webhook_secret: String(settings?.webhook_secret ?? ""),
  };

  const startCall = async () => {
    setSending(true);
    try {
      const res = await runVoiceTurn(orgId, {
        transcript: "",
        phone: phone || null,
        session_state: EMPTY_SESSION,
        ...overrides,
      });
      setMessages([{ role: "agent", text: res.reply }]);
      setSession(res.session ?? EMPTY_SESSION);
      setLastReply(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo iniciar la llamada");
    } finally {
      setSending(false);
    }
  };

  const sendTurn = async (text?: string) => {
    const input = (text ?? transcript).trim();
    setSending(true);
    try {
      const res = await runVoiceTurn(orgId, {
        transcript: input,
        phone: phone || null,
        session_state: session,
        ...overrides,
      });
      setMessages((cur) => [
        ...cur,
        ...(input ? [{ role: "user" as const, text: input }] : []),
        { role: "agent" as const, text: res.reply },
      ]);
      setSession(res.session ?? session);
      setLastReply(res);
      setTranscript("");
      if (res.booking) {
        toast.success("Reserva confirmada por el agente de voz");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo procesar el turno");
    } finally {
      setSending(false);
    }
  };

  const listen = async (text: string, msgId: number) => {
    if (!text) return;
    setTalkingId(String(msgId));
    try {
      const tts = await voiceTts(orgId, text, {
        tts_provider: ttsProvider,
        tts_api_key: String(settings?.tts_api_key ?? ""),
        voice_id: String(settings?.voice_id ?? ""),
      });
      if (tts.demo || !tts.audioBase64) {
        toast.info("Demo sin audio: el agente contesta por texto");
        return;
      }
      const bytes = atob(tts.audioBase64);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blob = new Blob([arr], { type: tts.contentType ?? "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(url);
      void audioRef.current.play();
    } catch {
      toast.error("No se pudo reproducir la voz");
    } finally {
      setTalkingId(null);
    }
  };

  const payload = lastReply?.action?.type === "create_booking" ? lastReply.action.payload : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--tenant-primary)]" />
        <span className="text-mono text-xs uppercase tracking-wider">Cargando agente de voz…</span>
      </div>
    );
  }

  if (!connected) {
    return (
      <EmptyState
        title="Llamadas IA no activadas"
        description="Tu agencia debe activar el módulo Llamadas IA y configurar el agente desde el panel de gestión antes de poder probarlo aquí."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-accent">
            <PhoneCall className="h-4 w-4 text-[var(--tenant-primary)]" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{agentName}</p>
            <p className="text-xs text-muted-foreground">Agente de llamadas IA</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {demo ? (
            <Badge className="gap-1 bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-3 w-3" /> Demo determinista
            </Badge>
          ) : (
            <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-3 w-3" /> LLM {llmProvider === "demo" ? "demo" : llmProvider}
            </Badge>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface/40 p-3">
        <div className="grid gap-2">
          <label className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Teléfono del llamante (opcional)
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+34 600 000 000"
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Conversación */}
      <div className="min-h-[240px] space-y-2 rounded-lg border border-border bg-background p-3">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-accent">
              <Mic className="h-5 w-5 text-[var(--tenant-primary)]" />
            </div>
            <p className="text-sm text-muted-foreground">
              Pulsa <span className="font-medium text-foreground">Iniciar llamada</span> para que {agentName} te salude.
            </p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  m.role === "user"
                    ? "bg-[var(--tenant-primary)] text-white"
                    : "border border-border bg-surface/60 text-foreground"
                )}
              >
                <div className="mb-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  {m.role === "user" ? (
                    <>
                      <User className="h-3 w-3" /> Llamante
                    </>
                  ) : (
                    <>
                      <Bot className="h-3 w-3 text-[var(--tenant-primary)]" /> {agentName}
                    </>
                  )}
                </div>
                <p className="whitespace-pre-wrap">{m.text}</p>
                {m.role === "agent" && (
                  <button
                    onClick={() => void listen(m.text, i)}
                    disabled={talkingId === String(i)}
                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    {talkingId === String(i) ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Speaker className="h-3 w-3" />
                    )}
                    Escuchar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reserva confirmada */}
      {payload && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
          <CalendarCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          <div>
            <p className="font-medium text-emerald-600 dark:text-emerald-400">Reserva confirmada</p>
            <p className="text-xs text-muted-foreground">
              {String(payload.date ?? "")} a las {String(payload.time ?? "")} · {String(payload.party_size ?? "")}{" "}
              {Number(payload.party_size) === 1 ? "persona" : "personas"} · {String(payload.service_name ?? "")} ·
              a nombre de {String(payload.customer_name ?? "Cliente")}
              {payload.phone ? ` · ${String(payload.phone)}` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Control de turno */}
      <div className="space-y-2 rounded-lg border border-border bg-surface/40 p-3">
        {messages.length === 0 ? (
          <Button size="sm" className="w-full gap-1.5" onClick={() => void startCall()} disabled={sending}>
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PhoneCall className="h-3.5 w-3.5" />}
            Iniciar llamada
          </Button>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PHRASES.map((p) => (
                <button
                  key={p}
                  onClick={() => setTranscript(p)}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-[var(--tenant-primary)] hover:text-foreground"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendTurn();
                  }
                }}
                rows={2}
                placeholder="Escribe lo que diría el llamante…"
                className="text-xs"
              />
              <Button size="sm" className="gap-1.5 self-end" onClick={() => void sendTurn()} disabled={sending}>
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Enviar
              </Button>
            </div>
          </>
        )}
        <p className="text-mono text-[10px] text-muted-foreground">
          En producción, esta URL recibe las llamadas reales del orquestador:{" "}
          <span className="font-mono text-foreground">/api/v1/voice/turn</span>
        </p>
      </div>
    </div>
  );
}
