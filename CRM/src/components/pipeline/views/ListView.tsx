"use client";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { STATUS_MAP } from "../config";
import type { PipelineTotals } from "./KanbanView";
import type { Lead } from "@/types/database";

/** Vista lista: filas compactas con los totales arriba. */
export function ListView({
  leads,
  totals,
  onOpenLead,
}: {
  leads: Lead[];
  totals: PipelineTotals;
  onOpenLead: (lead: Lead) => void;
}) {
  return (
    <div>
      {/* Métricas rápidas */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          { label: "Leads activos", value: formatNumber(totals.total) },
          { label: "Valor en juego", value: formatCurrency(totals.openValue) },
          { label: "Win rate", value: `${totals.winRate}%` },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border bg-surface px-4 py-3">
            <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
            <p className="mt-0.5 font-display text-lg font-bold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {leads.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Sin leads todavía. Añade el primero con «Nuevo lead».
          </p>
        )}
        <ul className="divide-y divide-border">
          {leads.map((lead) => {
            const status = STATUS_MAP[lead.status];
            const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.email || "Sin nombre";
            const contact = lead.phone ?? lead.email ?? "Sin contacto";
            return (
              <li key={lead.id}>
                <button
                  onClick={() => onOpenLead(lead)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{contact}</p>
                  </div>
                  {lead.deal_value != null && lead.deal_value > 0 && (
                    <span className="hidden text-mono text-xs font-semibold text-[var(--tenant-primary)] sm:block">
                      {formatCurrency(lead.deal_value)}
                    </span>
                  )}
                  <Badge variant={status.badge} className="w-28 justify-center">
                    {status.label}
                  </Badge>
                  <div className="hidden w-32 text-right md:block">
                    {lead.next_follow_up_at ? (
                      <p className="text-mono text-[11px] text-muted-foreground">
                        Seg. {formatRelative(lead.next_follow_up_at)}
                      </p>
                    ) : (
                      <p className="text-mono text-[11px] text-muted-foreground/50">Sin seguimiento</p>
                    )}
                  </div>
                  <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground")} />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
