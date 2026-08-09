"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import { type PipelineColumn } from "../config";
import { LeadCard } from "../LeadCard";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/database";

export interface PipelineTotals {
  total: number;
  openValue: number;
  winRate: number;
}

/** Punto de color de la columna: hex de la etapa si existe, si no acento canónico. */
function ColumnDot({ column }: { column: PipelineColumn }) {
  if (column.color) {
    return <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: column.color }} />;
  }
  return <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full bg-current", column.accent)} />;
}

/** Vista kanban con drag & drop nativo entre columnas (columnas = etapas del pipeline). */
export function KanbanView({
  columns,
  leads,
  byStatus,
  totals,
  onOpenLead,
  onMove,
  onAddColumn,
}: {
  columns: PipelineColumn[];
  leads: Lead[];
  byStatus: Record<string, Lead[]>;
  totals: PipelineTotals;
  onOpenLead: (lead: Lead) => void;
  onMove: (leadId: string, status: LeadStatus) => void;
  onAddColumn: (status: LeadStatus) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);

  const onDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    setOverColumn(null);
    const id = e.dataTransfer.getData("text/lead-id");
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (lead && lead.status !== status) onMove(id, status);
    setDraggingId(null);
  };

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

      {/* Tablero */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((column) => {
          const items = byStatus[column.status] ?? [];
          const columnValue = items.reduce((acc, l) => acc + (l.deal_value ?? 0), 0);
          return (
            <div
              key={column.stageId}
              onDragOver={(e) => {
                e.preventDefault();
                setOverColumn(column.stageId);
              }}
              onDragLeave={() => setOverColumn((c) => (c === column.stageId ? null : c))}
              onDrop={(e) => onDrop(e, column.status)}
              className={cn(
                "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30 transition-colors",
                overColumn === column.stageId &&
                  "border-[var(--tenant-primary)]/50 bg-[var(--tenant-primary)]/5"
              )}
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                <ColumnDot column={column} />
                <span className="text-xs font-semibold text-foreground">{column.label}</span>
                <span className="text-mono text-[10px] text-muted-foreground">{items.length}</span>
                <span className="ml-auto text-mono text-[10px] font-medium text-muted-foreground">
                  {columnValue > 0 ? formatCurrency(columnValue) : ""}
                </span>
              </div>

              <div className="flex-1 space-y-2 px-2.5 pb-2.5 pt-0.5">
                {items.length === 0 && (
                  <div className="grid h-20 place-items-center rounded-lg border border-dashed border-border-strong text-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                    Vacío
                  </div>
                )}
                {items.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    dragging={draggingId === lead.id}
                    onDragStart={setDraggingId}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={onOpenLead}
                  />
                ))}
              </div>

              <div className="px-2.5 pb-2.5">
                <button
                  onClick={() => onAddColumn(column.status)}
                  className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-border-strong py-1.5 text-[11px] text-muted-foreground transition-colors hover:border-[var(--tenant-primary)]/40 hover:text-foreground"
                >
                  <Plus className="h-3 w-3" />
                  {items.length === 0 ? "Añadir aquí" : "Añadir"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
