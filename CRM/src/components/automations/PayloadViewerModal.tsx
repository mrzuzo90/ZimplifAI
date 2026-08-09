"use client";

import { Braces, CornerDownLeft, CornerUpRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatTokens } from "@/lib/format";
import type { AiAuditLog } from "@/types/database";

function JsonBlock({ title, icon: Icon, data }: { title: string; icon: typeof Braces; data: unknown }) {
  return (
    <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-pitch">
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      <pre className="max-h-64 overflow-auto p-3 text-mono text-[11px] leading-relaxed text-foreground">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

/** Visor crudo del payload de una acción de IA (entrada / salida). */
export function PayloadViewerModal({
  log,
  open,
  onOpenChange,
}: {
  log: AiAuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!log) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Braces className="h-4 w-4 text-[var(--tenant-primary)]" />
            <span className="text-mono text-sm">{log.agent_name}</span>
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span>{formatDateTime(log.created_at)}</span>
            <Badge variant={log.status === "success" ? "success" : "destructive"}>
              {log.status === "success" ? "Success" : "Error"}
            </Badge>
            <span className="text-mono text-[10px] text-muted-foreground">
              {formatTokens(log.tokens_used)} tokens
            </span>
            <span className="text-mono text-[10px] text-muted-foreground">{log.id.slice(0, 8)}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <JsonBlock title="Input payload" icon={CornerUpRight} data={log.input_payload ?? {}} />
          <JsonBlock title="Output payload" icon={CornerDownLeft} data={log.output_payload ?? {}} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
