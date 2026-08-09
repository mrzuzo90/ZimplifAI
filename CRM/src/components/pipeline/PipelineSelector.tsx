"use client";

import { useState } from "react";
import { Layers, Pencil, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PipelineDialog } from "./PipelineDialog";
import { cn } from "@/lib/utils";
import type { Pipeline, PipelineStage } from "@/types/database";

/**
 * Selector de pipeline (multi-embudo) para el toolbar del kanban:
 * cambia el embudo activo y abre el editor (crear / editar / borrar).
 */
export function PipelineSelector({
  orgId,
  pipelines,
  stages,
  activeId,
  onSelect,
  onChanged,
}: {
  orgId: string;
  pipelines: Pipeline[];
  stages: PipelineStage[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<{ pipeline: Pipeline | null; open: boolean }>({
    pipeline: null,
    open: false,
  });
  const active = pipelines.find((p) => p.id === activeId) ?? null;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-1.5">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" />
        <Select value={activeId ?? undefined} onValueChange={onSelect}>
          <SelectTrigger className="h-6 w-[160px] border-0 bg-transparent px-0 text-xs font-medium shadow-none focus:ring-0">
            <SelectValue placeholder="Sin pipelines" />
          </SelectTrigger>
          <SelectContent>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                <span className="flex items-center gap-2">
                  {p.name}
                  {p.is_default && <span className="text-mono text-[9px] uppercase text-muted-foreground">· predet.</span>}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setEditing({ pipeline: active, open: true })}
            disabled={!active}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground transition-colors",
              active
                ? "hover:border-border-strong hover:text-foreground"
                : "cursor-not-allowed opacity-40"
            )}
            aria-label="Editar pipeline"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Editar pipeline</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setEditing({ pipeline: null, open: true })}
            className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:border-[var(--tenant-primary)]/50 hover:text-foreground"
            aria-label="Nuevo pipeline"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Nuevo pipeline</TooltipContent>
      </Tooltip>

      <PipelineDialog
        orgId={orgId}
        pipeline={editing.pipeline}
        stages={editing.pipeline ? stages : []}
        open={editing.open}
        onOpenChange={(o) => setEditing((s) => ({ ...s, open: o }))}
        onSaved={onChanged}
      />
    </div>
  );
}
