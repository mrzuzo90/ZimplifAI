"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeftRight,
  CalendarCheck,
  Clock,
  MessageCircle,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Inbox,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { useBranding } from "@/hooks/useBranding";
import { fetchActivity, addActivity } from "@/lib/data-access";
import { summarizeActivity } from "@/lib/activity";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityEventType } from "@/types/database";

const EVENT_ICON: Record<ActivityEventType, React.ComponentType<{ className?: string }>> = {
  lead_created: Plus,
  stage_changed: ArrowLeftRight,
  comment: MessageSquare,
  whatsapp_reply: MessageCircle,
  booking_confirmed: CalendarCheck,
  follow_up_set: Clock,
};

/** Timeline de actividad de un lead (quién hizo qué y cuándo) + añadir nota. */
export function ActivityTimeline({ orgId, leadId }: { orgId: string; leadId: string }) {
  const fetcher = useCallback((oid: string) => fetchActivity(oid, leadId), [leadId]);
  const { data: events, loading, error } = useRealtimeCollection(fetcher, orgId, {
    table: "lead_activity",
    filter: `lead_id=eq.${leadId}`,
    sortKey: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  });
  const { profile } = useBranding();
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const text = note.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await addActivity(orgId, {
        lead_id: leadId,
        actor_id: profile?.id ?? null,
        actor_name: profile?.full_name ?? null,
        event_type: "comment",
        summary: text,
      });
      setNote("");
    } catch {
      toast.error("No se pudo añadir la nota");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Actividad
        </h3>
        <span className="text-mono text-[10px] text-muted-foreground/70">
          {loading ? "…" : `${events.length} eventos`}
        </span>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-0 px-1">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Cargando actividad…</span>
            </div>
          )}
          {!loading && error && (
            <p className="px-3 py-6 text-center text-xs text-destructive">
              No se pudo cargar la actividad.
            </p>
          )}
          {!loading && !error && events.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
              <Inbox className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">
                Aún no hay actividad para este lead.
              </p>
              <p className="text-[11px] text-muted-foreground/70">
                Los cambios de estado y las notas quedarán registrados aquí.
              </p>
            </div>
          )}
          {!loading &&
            !error &&
            events.map((event, i) => {
              const Icon = EVENT_ICON[event.event_type];
              const isLast = i === events.length - 1;
              return (
                <div key={event.id} className="relative flex gap-2.5 pb-4">
                  {!isLast && (
                    <span className="absolute left-[11px] top-6 bottom-0 w-px bg-border" aria-hidden />
                  )}
                  <span
                    className={cn(
                      "z-10 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border border-border bg-surface text-muted-foreground",
                      event.event_type === "comment" && "text-[var(--tenant-primary)]"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-[13px] leading-snug text-foreground">
                      {event.event_type === "stage_changed"
                        ? summarizeActivity(event.event_type, event.metadata)
                        : event.summary}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {event.actor_name ?? "Sistema"} · {formatRelative(event.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </ScrollArea>

      <div className="mt-2 space-y-2 border-t border-border pt-3">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Añadir nota a este lead…"
          className="min-h-16 resize-none text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <Button size="sm" className="w-full" onClick={submit} disabled={sending || !note.trim()}>
          {sending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <MessageSquarePlus className="h-3.5 w-3.5" />
          )}
          Añadir nota
        </Button>
      </div>
    </div>
  );
}
