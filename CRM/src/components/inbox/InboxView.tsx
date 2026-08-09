"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ThreadList } from "./ThreadList";
import { Conversation } from "./Conversation";
import { LeadSidebar } from "./LeadSidebar";
import { TemplatesDialog } from "./TemplatesDialog";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { useBranding } from "@/hooks/useBranding";
import { fetchThreads, markThreadRead, setThreadResolved } from "@/lib/data-access";
import { LoadingState, ErrorState } from "@/components/shared/States";
import { es } from "@/lib/i18n/es";

/** Bandeja unificada de 3 columnas: hilos · conversación · lead. */
export function InboxView({ orgId }: { orgId: string }) {
  const { organization, profile, loading: brandingLoading } = useBranding();

  const { data: threads, loading, error, refresh } = useRealtimeCollection(fetchThreads, orgId, {
    table: "message_threads",
    filter: `organization_id=eq.${orgId}`,
    sortKey: (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
  });

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // El hilo seleccionado se deriva de la colección viva: si lo borran en
  // realtime, la conversación vuelve al placeholder sin estados raros.
  const selected = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? null,
    [threads, selectedThreadId]
  );

  const select = async (id: string) => {
    setSelectedThreadId(id);
    const thread = threads.find((t) => t.id === id);
    if (thread && thread.unread_count > 0) {
      try {
        await markThreadRead(orgId, id);
      } catch {
        // No crítico: la marca de no leído se recalcula al recargar.
      }
    }
  };

  const toggleResolved = async (threadId: string) => {
    const thread = threads.find((t) => t.id === threadId);
    if (!thread) return;
    try {
      await setThreadResolved(orgId, threadId, thread.status === "resolved" ? "open" : "resolved");
      toast.success(thread.status === "resolved" ? es.inbox.reopen : es.inbox.markResolved);
    } catch {
      toast.error(es.inbox.saveError);
    }
  };

  if (brandingLoading) return <LoadingState label={es.common.loading} />;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[520px] overflow-hidden rounded-xl border border-border bg-background">
      <ThreadList threads={threads} selectedId={selectedThreadId} onSelect={(id) => void select(id)} />

      {loading ? (
        <section className="grid min-h-0 flex-1 place-items-center bg-background">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--tenant-primary)]" />
            {es.common.loading}
          </p>
        </section>
      ) : (
        <Conversation
          orgId={orgId}
          thread={selected}
          businessName={organization?.name ?? "Mi negocio"}
          memberName={profile?.full_name ?? null}
          onOpenTemplates={() => setTemplatesOpen(true)}
          onToggleResolved={(id) => void toggleResolved(id)}
        />
      )}

      <LeadSidebar thread={selected} />
      <TemplatesDialog orgId={orgId} open={templatesOpen} onOpenChange={setTemplatesOpen} />
    </div>
  );
}
