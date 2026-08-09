"use client";

import { CalendarClock, Mail, Phone, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChannelBadge } from "./ChannelBadge";
import { LEAD_STATUS_LABELS } from "@/lib/activity";
import { formatRelative } from "@/lib/format";
import type { LeadStatus, MessageThreadWithLead } from "@/types/database";
import { cn } from "@/lib/utils";
import { es } from "@/lib/i18n/es";

const STATUS_BADGE: Record<LeadStatus, "warning" | "info" | "volt" | "success" | "muted" | "destructive"> = {
  new: "warning",
  ai_contacted: "info",
  qualified: "volt",
  booked: "success",
  closed_won: "success",
  closed_lost: "muted",
};

/** Panel lateral con los datos del lead vinculado al hilo. */
export function LeadSidebar({ thread }: { thread: MessageThreadWithLead | null }) {
  const lead = thread?.lead ?? null;
  const name = lead?.first_name
    ? `${lead.first_name} ${lead.last_name ?? ""}`.trim()
    : (thread?.subject ?? null);

  return (
    <aside className="hidden min-h-0 flex-col overflow-y-auto border-l border-border bg-background lg:flex">
      <div className="border-b border-border px-4 py-3">
        <p className="text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{es.inbox.leadInfo}</p>
      </div>

      {!lead ? (
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-border bg-surface">
            <User className="h-5 w-5 text-muted-foreground" />
          </span>
          <p className="text-sm font-medium text-foreground">{es.inbox.noLead}</p>
          <p className="text-xs text-muted-foreground">{es.inbox.linkLead}</p>
        </div>
      ) : (
        <div className="space-y-5 px-4 py-4">
          {/* Identidad */}
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black text-[#0B0D0C]" style={{ backgroundColor: "var(--tenant-primary)" }}>
              {(lead.first_name?.[0] ?? "?").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{name}</p>
              <Badge variant={STATUS_BADGE[lead.status]} className="mt-0.5">
                {LEAD_STATUS_LABELS[lead.status]}
              </Badge>
            </div>
          </div>

          {thread && <ChannelBadge channel={thread.channel} className="text-xs" />}

          {/* Contacto */}
          <div className="space-y-1.5">
            {lead.phone && (
              <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{lead.phone}</span>
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{lead.email}</span>
              </a>
            )}
            {lead.created_at && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                {es.inbox.lead} · {formatRelative(lead.created_at)}
              </p>
            )}
          </div>

          {/* Etiquetas */}
          {lead.tags.length > 0 && (
            <div>
              <p className="mb-1.5 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1">
                {lead.tags.map((tag) => (
                  <span key={tag} className={cn("rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground")}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
