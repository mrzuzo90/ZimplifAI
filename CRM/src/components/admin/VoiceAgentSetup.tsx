"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, KeyRound, Loader2, PhoneCall, PlugZap, Unplug, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { connectVoiceAgent, isDemoMode } from "@/lib/data-access";
import { cn } from "@/lib/utils";

// Catálogo estático de voces para el selector (datos, no lógica server).
const VOICE_OPTIONS: Array<{ id: string; label: string; provider: "elevenlabs" | "deepgram" }> = [
  { id: "JBFqnCBsd6RMkjVDRZzb", label: "Rachel (multilingüe, femenina)", provider: "elevenlabs" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah (multilingüe, femenina)", provider: "elevenlabs" },
  { id: "IKne3meq5aSn9XLyUdCD", label: "Charlie (multilingüe, masculina)", provider: "elevenlabs" },
  { id: "aura-luna-es", label: "Luna (español, femenina)", provider: "deepgram" },
  { id: "aura-sunshine-es", label: "Sunshine (español, femenina)", provider: "deepgram" },
  { id: "aura-asteria-en", label: "Asteria (inglés, femenina)", provider: "deepgram" },
  { id: "aura-arcas-en", label: "Arcas (inglés, masculina)", provider: "deepgram" },
];

/**
 * Conexión del agente de llamadas IA desde el perfil de agencia.
 * La subcuenta solo aporta lo exclusivo del cliente (nombre, tono, reglas,
 * cerebro LLM y voz TTS): el resto (servicios, precios, horarios, historial)
 * se lee del propio CRM en tiempo de conversación.
 */
export function VoiceAgentSetup({
  orgId,
  settings,
  onUpdated,
}: {
  orgId: string;
  settings: Record<string, unknown>;
  onUpdated: (settings: Record<string, unknown>) => void;
}) {
  const [agentName, setAgentName] = useState(String(settings.agent_name ?? "Recepción"));
  const [tone, setTone] = useState(String(settings.tone ?? "cercano, natural y profesional"));
  const [customRules, setCustomRules] = useState(String(settings.custom_rules ?? ""));
  const [llmProvider, setLlmProvider] = useState(String(settings.llm_provider ?? "demo"));
  const [llmApiKey, setLlmApiKey] = useState(String(settings.llm_api_key ?? ""));
  const [ttsProvider, setTtsProvider] = useState(String(settings.tts_provider ?? "demo"));
  const [ttsApiKey, setTtsApiKey] = useState(String(settings.tts_api_key ?? ""));
  const [voiceId, setVoiceId] = useState(String(settings.voice_id ?? ""));
  const [phoneNumber, setPhoneNumber] = useState(String(settings.phone_number ?? ""));
  const [busy, setBusy] = useState(false);

  const status = String(settings.status ?? "disconnected");
  const connected = status === "connected";
  const demo = isDemoMode();
  const showLlmKey = llmProvider !== "demo";
  const showTts = ttsProvider !== "demo";

  // Voice ID: si no coincide con un preset conocido, se trata como "custom".
  const voicePresetKnown = VOICE_OPTIONS.some((v) => v.id === voiceId);
  const voiceIsCustom = showTts && voiceId !== "" && !voicePresetKnown;

  const connect = async () => {
    if (showLlmKey && !llmApiKey.trim()) {
      toast.error("El proveedor LLM elegido necesita su API key");
      return;
    }
    if (showTts && !ttsApiKey.trim()) {
      toast.error("El proveedor de voz elegido necesita su API key");
      return;
    }
    if (showTts && !voiceId.trim()) {
      toast.error("Elige una voz para el agente");
      return;
    }
    setBusy(true);
    try {
      const res = await connectVoiceAgent(orgId, "connect", {
        agent_name: agentName.trim() || "Recepción",
        tone: tone.trim() || "cercano, natural y profesional",
        custom_rules: customRules.trim() || undefined,
        llm_provider: llmProvider,
        llm_api_key: showLlmKey ? llmApiKey.trim() : undefined,
        tts_provider: ttsProvider,
        tts_api_key: showTts ? ttsApiKey.trim() : undefined,
        voice_id: showTts ? voiceId.trim() : undefined,
        phone_number: phoneNumber.trim() || undefined,
      });
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo conectar el agente");
        return;
      }
      // En demo no hay Supabase: las claves y el secret se guardan en settings
      // para que el panel de pruebas pueda responder. En producción quedan en DB.
      onUpdated({
        ...settings,
        status: "connected",
        agent_name: agentName.trim() || "Recepción",
        tone: tone.trim() || "cercano, natural y profesional",
        custom_rules: customRules.trim(),
        llm_provider: llmProvider,
        llm_api_key: demo && showLlmKey ? llmApiKey.trim() : "",
        tts_provider: ttsProvider,
        tts_api_key: demo && showTts ? ttsApiKey.trim() : "",
        voice_id: showTts ? voiceId.trim() : "",
        phone_number: phoneNumber.trim(),
        webhook_secret: demo ? (res.webhook_secret ?? "") : "",
        last_error: "",
      });
      toast.success(res.demo ? "Agente conectado (demo) — estado guardado en settings" : "Agente de llamadas conectado ✅");
    } catch {
      toast.error("Error al conectar el agente de voz");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      const storedSecret = settings.webhook_secret as string | undefined;
      const res = await connectVoiceAgent(orgId, "disconnect", {
        webhook_secret: storedSecret,
      });
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo desconectar");
        return;
      }
      onUpdated({
        ...settings,
        status: "disconnected",
        webhook_secret: "",
        last_error: "",
      });
      toast.success("Agente desconectado");
    } catch {
      toast.error("Error al desconectar");
    } finally {
      setBusy(false);
    }
  };

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/v1/voice/turn`
    : `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/v1/voice/turn`;

  return (
    <div className="space-y-3 rounded-lg border border-border/80 bg-surface/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PhoneCall className="h-4 w-4 text-[var(--tenant-primary)]" />
          <span className="text-sm font-medium text-foreground">Agente de llamadas</span>
        </div>
        {connected ? (
          <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Conectado
          </Badge>
        ) : status === "error" ? (
          <Badge className="gap-1 bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        ) : (
          <Badge variant="outline">Desconectado</Badge>
        )}
      </div>

      {connected ? (
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            El agente <span className="font-medium text-foreground">{agentName || "Recepción"}</span> está activo.
            Sus respuestas se generan con los datos del CRM (servicios, precios, horarios, historial del llamante).
          </p>
          <div className="rounded-md border border-border bg-background/60 px-2.5 py-2">
            <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">Webhook del orquestador (Vapi / Retell)</p>
            <p className="mt-0.5 break-all font-mono text-[11px] text-foreground">{webhookUrl}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              Conecta esta URL como server de voz del orquestador y envía el webhook_secret como cabecera.
            </p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={disconnect} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />}
            Desconectar
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-mono text-[10px] text-muted-foreground">Nombre del agente</Label>
                <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="p. ej. Ariadna" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-mono text-[10px] text-muted-foreground">Tono / personalidad</Label>
                <Input value={tone} onChange={(e) => setTone(e.target.value)} placeholder="cercano y profesional" className="h-8 text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-mono text-[10px] text-muted-foreground">Reglas de negocio (opcional)</Label>
              <Textarea
                value={customRules}
                onChange={(e) => setCustomRules(e.target.value)}
                rows={2}
                placeholder="p. ej. El salón privado requiere mínimo 6 personas y 48h de antelación."
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-mono text-[10px] text-muted-foreground">Cerebro (LLM)</Label>
                <Select value={llmProvider} onValueChange={setLlmProvider}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Demo (sin API key)</SelectItem>
                    <SelectItem value="gemini">Google Gemini (gratis)</SelectItem>
                    <SelectItem value="groq">Groq (gratis)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-mono text-[10px] text-muted-foreground">Voz (TTS)</Label>
                <Select value={ttsProvider} onValueChange={setTtsProvider}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Demo (texto, sin audio)</SelectItem>
                    <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                    <SelectItem value="deepgram">Deepgram</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showLlmKey && (
              <div className="space-y-1">
                <Label className="text-mono text-[10px] text-muted-foreground">API key del LLM</Label>
                <Input
                  type="password"
                  value={llmApiKey}
                  onChange={(e) => setLlmApiKey(e.target.value)}
                  placeholder="Clave privada (se guarda cifrada)"
                  className="h-8 font-mono text-xs"
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            )}

            {showTts && (
              <>
                <div className="space-y-1">
                  <Label className="text-mono text-[10px] text-muted-foreground">API key de voz (TTS)</Label>
                  <Input
                    type="password"
                    value={ttsApiKey}
                    onChange={(e) => setTtsApiKey(e.target.value)}
                    placeholder="Clave privada (se guarda cifrada)"
                    className="h-8 font-mono text-xs"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-mono text-[10px] text-muted-foreground">Voz</Label>
                  <Select value={voiceIsCustom ? "custom" : voiceId} onValueChange={(v) => setVoiceId(v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Elegir voz" /></SelectTrigger>
                    <SelectContent>
                      {VOICE_OPTIONS.filter((v) => v.provider === ttsProvider).map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                      ))}
                      <SelectItem value="custom">Mi propio Voice ID…</SelectItem>
                    </SelectContent>
                  </Select>
                  {voiceIsCustom && (
                    <Input
                      value={voiceId}
                      onChange={(e) => setVoiceId(e.target.value)}
                      placeholder="Pega tu Voice ID"
                      className="mt-1 h-8 font-mono text-xs"
                      spellCheck={false}
                    />
                  )}
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label className="text-mono text-[10px] text-muted-foreground">Teléfono del negocio (opcional)</Label>
              <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+34 910 000 000" className="h-8 text-xs" />
            </div>
          </div>

          <Button size="sm" className="gap-1.5 text-xs" onClick={connect} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
            Guardar y conectar
          </Button>

          <p className={cn("text-mono text-[10px] text-muted-foreground")}>
            <KeyRound className="mr-1 inline h-3 w-3" />
            El resto (servicios, precios, horarios, historial) se lee automáticamente del CRM.
          </p>
        </div>
      )}
    </div>
  );
}
