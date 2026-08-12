"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Plus, Send, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { useBranding } from "@/hooks/useBranding";
import {
  createCopilotSession,
  demoAssistantReply,
  fetchCopilotMessages,
  fetchCopilotSessions,
  isDemoMode,
  sendCopilotMessage,
} from "@/lib/data-access";
import { formatTime } from "@/lib/format";
import type { CopilotMessage, CopilotSession } from "@/types/database";

const SUGGESTIONS = [
  "¿Cómo fue la semana de reservas?",
  "Resume el estado de mis leads",
  "¿Cuánto me cuesta operar este mes?",
];

/** Chat del AI Copilot: sesiones + conversación + envío (con reply simulado en demo). */
export function CopilotChat({ orgId }: { orgId: string }) {
  const { profile } = useBranding();
  const { data: sessions, loading, error } = useRealtimeCollection<CopilotSession>(
    useCallback((orgId) => fetchCopilotSessions(orgId), []),
    orgId,
    { table: "copilot_sessions", filter: `organization_id=eq.${orgId}` }
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mensajes de la sesión activa: realtime en prod, subscribeDb en demo.
  const {
    data: rawMessages,
    loading: messagesLoading,
    refresh: refreshMessages,
  } = useRealtimeCollection<CopilotMessage>(
    useCallback((sessionId) => fetchCopilotMessages(sessionId), []),
    activeSessionId,
    {
      table: "copilot_messages",
      filter: activeSessionId ? `session_id=eq.${activeSessionId}` : undefined,
    }
  );
  const messages = useMemo(
    () => [...rawMessages].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [rawMessages]
  );

  // Auto-scroll al final.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, activeSessionId]);

  const selectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const startNewSession = async () => {
    if (creating) return null;
    setCreating(true);
    try {
      const session = await createCopilotSession(orgId, profile?.id ?? "demo_user", {
        title: "Nueva conversación",
        context_type: "general",
      });
      setActiveSessionId(session.id);
      return session;
    } catch {
      /* noop */
      return null;
    } finally {
      setCreating(false);
    }
  };

  // `sessionId` es un override explícito: cuando se envía desde una sugerencia tras
  // crear sesión, `activeSessionId` aún no se ha aplicado en el render actual.
  const handleSend = async (text?: string, sessionId?: string) => {
    const target = sessionId ?? activeSessionId;
    const content = (text ?? input).trim();
    if (!content || !target || sending) return;
    setSending(true);
    setInput("");
    try {
      await sendCopilotMessage(orgId, target, { role: "user", content });
      // En demo, el asistente responde de forma determinista (sin LLM real).
      if (isDemoMode()) {
        const reply = demoAssistantReply(content);
        await new Promise((r) => setTimeout(r, 450));
        await sendCopilotMessage(orgId, target, {
          role: "assistant",
          content: reply.content,
          tool_calls: reply.tool_calls,
          metadata: { model: "claude-sonnet-5", simulated: true },
        });
      }
      await refreshMessages();
    } catch {
      /* noop */
    } finally {
      setSending(false);
    }
  };

  if (loading) return <LoadingState label="Abriendo copilot" />;
  if (error) return <ErrorState message={error.message} />;

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="grid overflow-hidden rounded-xl border border-border bg-surface lg:grid-cols-[260px_1fr]">
      {/* Columna de sesiones */}
      <aside className="border-b border-border lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-border px-3 py-3">
          <span className="text-sm font-semibold text-foreground">Sesiones</span>
          <Button variant="ghost" size="iconSm" onClick={startNewSession} disabled={creating} title="Nueva conversación">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2 lg:max-h-[460px]">
          {sessions.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-muted-foreground">
              Sin sesiones. Crea una para empezar.
            </p>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => selectSession(s.id)}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left transition-colors",
                s.id === activeSessionId
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <p className="truncate text-xs font-medium">{s.title ?? "Conversación"}</p>
              <p className="mt-0.5 text-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                {s.context_type}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {/* Conversación */}
      <div className="flex min-h-[460px] flex-col">
        {!activeSession ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent">
              <Sparkles className="h-7 w-7 text-[var(--tenant-primary)]" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">AI Copilot</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Pregúntale sobre tus leads, reservas, pipeline o costes de operación. Crea una sesión o abre una existente.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    void (async () => {
                      const session = await startNewSession();
                      if (session) await handleSend(s, session.id);
                    })();
                  }}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[var(--tenant-primary)] hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Bot className="h-4 w-4 text-[var(--tenant-primary)]" />
              <span className="truncate text-sm font-semibold text-foreground">{activeSession.title}</span>
              <span className="ml-auto text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {activeSession.context_type}
              </span>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messagesLoading ? (
                <LoadingState label="Cargando mensajes" />
              ) : messages.length === 0 ? (
                <EmptyState
                  icon={Wand2}
                  title="Empieza la conversación"
                  description="Haz una pregunta sobre tu negocio y el copilot te responde con datos reales."
                />
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm",
                        m.role === "user"
                          ? "bg-[var(--tenant-primary)] text-[var(--tenant-primary-foreground)]"
                          : m.role === "tool"
                            ? "border border-border bg-muted/50 font-mono text-[11px] text-muted-foreground"
                            : "border border-border bg-background text-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>
                      {m.role === "assistant" && Boolean(m.metadata?.model) && (
                        <p className="mt-1.5 text-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                          {String(m.metadata.model)}
                          {m.metadata?.simulated ? " · demo" : ""}
                        </p>
                      )}
                      <p className="mt-0.5 text-mono text-[9px] text-muted-foreground/70">
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSend();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregunta al copilot… (ej. «resumen de leads»)"
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" size="icon" disabled={sending || !input.trim()} title="Enviar">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
