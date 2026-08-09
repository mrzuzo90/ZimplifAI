"use client";

import { AtSign, Mail, MessageCircle, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatRelative } from "@/lib/format";
import type { Lead } from "@/types/database";
import { STATUS_MAP } from "./config";

function sourceIcons(tags: string[]) {
  const icons: React.ReactNode[] = [];
  if (tags.includes("WhatsApp")) icons.push(<MessageCircle key="wa" className="h-3 w-3 text-success" />);
  if (tags.includes("Ig") || tags.includes("Instagram")) icons.push(<AtSign key="ig" className="h-3 w-3 text-info" />);
  return icons;
}

/** Tarjeta de lead arrastrable para el kanban. */
export function LeadCard({
  lead,
  dragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  lead: Lead;
  dragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onClick: (lead: Lead) => void;
}) {
  const status = STATUS_MAP[lead.status];
  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.email || "Sin nombre";
  const assignedName = lead.assigned_to ? lead.assigned_to.slice(0, 2).toUpperCase() : null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/lead-id", lead.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(lead.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onClick(lead)}
      className={cn(
        "group cursor-grab rounded-lg border border-border bg-surface p-3 transition-all active:cursor-grabbing",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg hover:shadow-black/30",
        dragging && "rotate-2 opacity-40",
        "focus-visible:outline-none"
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(lead);
        }
      }}
      aria-label={`Lead ${fullName}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{fullName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {lead.email ?? lead.phone ?? "Sin contacto"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {sourceIcons(lead.tags)}
        </div>
      </div>

      {lead.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {lead.deal_value != null && lead.deal_value > 0 && (
            <span className="text-mono text-xs font-semibold text-[var(--tenant-primary)]">
              {formatCurrency(lead.deal_value)}
            </span>
          )}
          <span className={cn("text-mono text-[10px] text-muted-foreground", status.accent)}>
            {formatRelative(lead.created_at)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {status.label}
          </span>
          {assignedName && (
            <span
              className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold text-pitch"
              style={{ backgroundColor: "var(--tenant-primary)" }}
              title="Asignado"
            >
              {assignedName}
            </span>
          )}
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        {lead.phone && <Phone className="h-3 w-3 text-muted-foreground" />}
        {lead.email && <Mail className="h-3 w-3 text-muted-foreground" />}
        <span className="ml-auto text-mono text-[10px] text-muted-foreground">arrastrar ⇢</span>
      </div>
    </div>
  );
}
