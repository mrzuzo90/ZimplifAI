"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChannelBadge, ChannelIcon } from "./ChannelBadge";
import { formatRelative } from "@/lib/format";
import { threadPreview } from "@/lib/inbox";
import type { MessageThreadWithLead } from "@/types/database";
import { cn } from "@/lib/utils";
import { es } from "@/lib/i18n/es";

interface Props {
  threads: MessageThreadWithLead[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Lista de hilos de la bandeja (búsqueda + badges de canal + no-leídos). */
export function ThreadList({ threads, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) =>
      [t.lead?.first_name, t.lead?.last_name, t.subject, t.last_message_preview, t.channel]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [threads, query]);

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-border bg-background">
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={es.inbox.search}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <p className="mt-2 px-1 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {es.inbox.threads} · {filtered.length}
        </p>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm font-medium text-foreground">{es.inbox.empty}</p>
            <p className="mt-1 text-xs text-muted-foreground">{es.inbox.emptyHint}</p>
          </div>
        ) : (
          <div className="space-y-0.5 p-2">
            {filtered.map((t) => {
              const active = t.id === selectedId;
              const unread = t.unread_count > 0;
              const name = t.lead?.first_name
                ? `${t.lead.first_name} ${t.lead.last_name ?? ""}`.trim()
                : (t.subject ?? es.inbox.noLead);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelect(t.id)}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors",
                    active ? "bg-accent" : "hover:bg-muted/60",
                    t.status === "resolved" && "opacity-55"
                  )}
                >
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-surface">
                    <ChannelIcon channel={t.channel} className="h-3.5 w-3.5 text-[var(--tenant-primary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-xs font-semibold", unread ? "text-foreground" : "text-muted-foreground")}>
                        {name}
                      </p>
                      <span className="shrink-0 text-mono text-[10px] text-muted-foreground">
                        {formatRelative(t.last_message_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {threadPreview(t.last_message_preview)}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <ChannelBadge channel={t.channel} />
                      {t.status === "resolved" && <Check className="h-3 w-3 text-muted-foreground" />}
                      {unread && (
                        <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-[var(--tenant-primary)] px-1 text-[10px] font-bold text-[#0B0D0C]">
                          {t.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
