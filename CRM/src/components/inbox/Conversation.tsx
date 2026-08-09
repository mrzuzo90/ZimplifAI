"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCheck, FileText, Loader2, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChannelBadge } from "./ChannelBadge";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { fetchMessages, sendMessage, suggestAiReply, type ReplySuggestionResult } from "@/lib/data-access";
import { formatTime } from "@/lib/format";
import type { Message, MessageThreadWithLead, MessageSender } from "@/types/database";
import { cn } from "@/lib/utils";
import { es } from "@/lib/i18n/es";

/** Snippets de variables que se insertan en el mensaje. */
const VARIABLE_SNIPPETS = [
  { key: "first_name", label: "Nombre" },
  { key: "phone", label: "Teléfono" },
  { key: "email", label: "Email" },
  { key: "business", label: "Negocio" },
  { key: "party_size", label: "Comensales" },
  { key: "date", label: "Fecha" },
  { key: "time", label: "Hora" },
  { key: "need", label: "Necesidad" },
];

const SENDER_LABEL: Record<MessageSender, string> = {
  lead: es.inbox.lead,
  member: es.inbox.member,
  agent: es.inbox.agent,
};

interface Props {
  orgId: string;
  thread: MessageThreadWithLead | null;
  businessName: string;
  memberName: string | null;
  onOpenTemplates: () => void;
  onToggleResolved: (threadId: string) => void;
}

export function Conversation({ orgId, thread, businessName, memberName, onOpenTemplates, onToggleResolved }: Props) {
  const threadId = thread?.id ?? "";

  // Fetcher wrapper: el threadId cambia con la selección (no viola hooks).
  const fetcher = useCallback((o: string) => fetchMessages(o, threadId), [threadId]);
  const { data: messages, loading } = useRealtimeCollection(fetcher, thread ? orgId : null, {
    table: "messages",
    filter: threadId ? `thread_id=eq.${threadId}` : undefined,
  });

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [suggestion, setSuggestion] = useState<ReplySuggestionResult | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje.
  useEffect(() => {
    const el = viewportRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, threadId]);

  if (!thread) {
    return (
      <section className="grid min-h-0 flex-1 place-items-center bg-background p-8">
        <div className="max-w-xs text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-border bg-surface">
            <Send className="h-5 w-5 text-[var(--tenant-primary)]" />
          </span>
          <p className="mt-3 font-display text-base font-semibold text-foreground">{es.inbox.noThreadSelected}</p>
          <p className="mt-1 text-sm text-muted-foreground">{es.inbox.noThreadSelectedHint}</p>
        </div>
      </section>
    );
  }

  const insertVariable = (key: string) => {
    const ta = textareaRef.current;
    const start = ta?.selectionStart ?? text.length;
    const end = ta?.selectionEnd ?? text.length;
    const snippet = `{{${key}}}`;
    const next = text.slice(0, start) + snippet + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const pos = start + snippet.length;
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      await sendMessage(orgId, thread.id, {
        body,
        channel: thread.channel,
        sender: "member",
        sender_name: memberName ?? "Equipo",
      });
      setText("");
      setSuggestion(null);
    } catch {
      toast.error(es.inbox.sendError);
    } finally {
      setSending(false);
    }
  };

  const suggest = async () => {
    if (suggesting) return;
    setSuggesting(true);
    try {
      const s = await suggestAiReply(orgId, thread.id, businessName);
      setSuggestion(s);
    } catch {
      toast.error("No se pudo generar la sugerencia");
    } finally {
      setSuggesting(false);
    }
  };

  const name = thread.lead?.first_name
    ? `${thread.lead.first_name} ${thread.lead.last_name ?? ""}`.trim()
    : (thread.subject ?? es.inbox.noLead);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      {/* Cabecera del hilo */}
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="truncate font-display text-sm font-bold text-foreground">{name}</h2>
            <ChannelBadge channel={thread.channel} />
          </div>
          <p className="mt-0.5 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {thread.status === "resolved" ? es.inbox.resolved : es.inbox.open}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onOpenTemplates}>
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{es.inbox.templates}</span>
          </Button>
          <Button
            size="sm"
            variant={thread.status === "resolved" ? "outline" : "ghost"}
            className="h-7 text-xs"
            onClick={() => onToggleResolved(thread.id)}
            title={thread.status === "resolved" ? es.inbox.reopen : es.inbox.markResolved}
          >
            {thread.status === "resolved" ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{es.inbox.reopen}</span>
              </>
            ) : (
              <>
                <CheckCheck className="h-3.5 w-3.5 text-success" />
                <span className="hidden sm:inline">{es.inbox.markResolved}</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Mensajes */}
      <div ref={viewportRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {loading ? (
          <p className="py-6 text-center text-xs text-muted-foreground">{es.common.loading}</p>
        ) : messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">{es.inbox.emptyMessages}</p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      {/* Sugerencia del copilot IA */}
      {suggestion && (
        <div className="mx-3 mb-2 flex items-start gap-2.5 rounded-lg border border-[var(--tenant-primary)]/30 bg-[var(--tenant-primary)]/5 p-3">
          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--tenant-primary)]/15">
            <Sparkles className="h-3.5 w-3.5 text-[var(--tenant-primary)]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold text-foreground">
                {suggestion.agentName ?? "AI Reply Copilot"}
              </p>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-mono text-[10px] text-muted-foreground">
                {suggestion.intentLabel}
              </span>
              <span className="text-mono text-[10px] text-muted-foreground">~{suggestion.tokens} tokens</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-foreground/90">{suggestion.reply}</p>
            <p className="mt-1 text-mono text-[10px] text-muted-foreground">{es.inbox.suggestionNote}</p>
            <div className="mt-2 flex gap-1.5">
              <Button size="sm" className="h-6 px-2 text-[11px]" onClick={() => setText(suggestion.reply)}>
                <CheckCheck className="h-3 w-3" /> {es.inbox.insertSuggestion}
              </Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setSuggestion(null)}>
                <X className="h-3 w-3" /> {es.inbox.discardSuggestion}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Redactor */}
      <div className="border-t border-border p-3">
        <div className="mb-2 flex flex-wrap items-center gap-1">
          <span className="mr-1 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {es.inbox.variables}
          </span>
          {VARIABLE_SNIPPETS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className="rounded-full border border-border bg-surface px-2 py-0.5 text-mono text-[10px] text-muted-foreground transition-colors hover:border-[var(--tenant-primary)]/40 hover:text-[var(--tenant-primary)]"
            >
              {`{{${v.key}}}`}
            </button>
          ))}
          <button
            type="button"
            onClick={suggest}
            disabled={suggesting}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-[var(--tenant-primary)]/40 bg-[var(--tenant-primary)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--tenant-primary)] transition-colors hover:bg-[var(--tenant-primary)]/20 disabled:opacity-60"
          >
            {suggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {suggesting ? es.inbox.suggesting : es.inbox.suggest}
          </button>
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={es.inbox.compose}
            className="min-h-20 flex-1 resize-none text-sm"
          />
          <Button
            onClick={() => void send()}
            disabled={sending || !text.trim()}
            className="h-10 w-10 shrink-0 p-0"
            style={{ backgroundColor: "var(--tenant-primary)", color: "#0B0D0C" }}
            aria-label={es.inbox.send}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </section>
  );
}

/** Burbuja de mensaje individual. */
function MessageBubble({ message }: { message: Message }) {
  const inbound = message.direction === "inbound";
  const isAgent = message.sender === "agent";
  const isMember = message.sender === "member";

  return (
    <div className={cn("flex", inbound ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5",
          inbound && "border border-border bg-surface text-foreground",
          isMember && "rounded-br-md bg-[var(--tenant-primary)] text-[#0B0D0C]",
          isAgent && "rounded-br-md border border-[var(--tenant-primary)]/40 bg-[var(--tenant-primary)]/10 text-foreground"
        )}
      >
        {!inbound && (
          <p className={cn("mb-0.5 text-mono text-[10px] font-bold uppercase tracking-wider", isMember ? "text-[#0B0D0C]/70" : "text-[var(--tenant-primary)]")}>
            {message.sender_name ?? SENDER_LABEL[message.sender]}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.body}</p>
        <p
          className={cn(
            "mt-1 text-mono text-[10px]",
            isMember ? "text-[#0B0D0C]/60" : "text-muted-foreground"
          )}
        >
          {formatTime(message.created_at)}
          {!inbound && message.status === "read" ? " · ✓✓" : ""}
          {!inbound && message.status === "failed" ? ` · ${es.inbox.failed}` : ""}
        </p>
      </div>
    </div>
  );
}
