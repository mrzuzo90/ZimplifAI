"use client";

import { useEffect, useState } from "react";
import { Activity, Braces } from "lucide-react";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { fetchAuditLogs, isDemoMode, pushAuditEntry } from "@/lib/data-access";
import { MOCK_AUDIT_STREAM_POOL } from "@/lib/mock-data";
import { formatRelative, formatTokens } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PayloadViewerModal } from "./PayloadViewerModal";
import type { AiAuditLog } from "@/types/database";

function simulateEntry(): AiAuditLog {
  const pool = MOCK_AUDIT_STREAM_POOL;
  const template = pool[Math.floor(Math.random() * pool.length)];
  return {
    ...template,
    id: `aud_${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
  } as AiAuditLog;
}

/** Stream en vivo de acciones de los agentes. En demo simula entradas periódicas. */
export function AuditLogStream({ orgId }: { orgId: string }) {
  const { data, loading, error } = useRealtimeCollection<AiAuditLog>(fetchAuditLogs, orgId, {
    table: "ai_audit_logs",
    filter: `organization_id=eq.${orgId}`,
    sortKey: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  });
  const [selected, setSelected] = useState<AiAuditLog | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Simulación de realtime (modo demo)
  useEffect(() => {
    if (!isDemoMode()) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      timer = setTimeout(() => {
        if (!alive) return;
        const entry = simulateEntry();
        pushAuditEntry({
          organization_id: orgId,
          lead_id: entry.lead_id,
          agent_name: entry.agent_name,
          input_payload: entry.input_payload,
          output_payload: entry.output_payload,
          tokens_used: entry.tokens_used,
          status: Math.random() > 0.12 ? "success" : "error",
        });
        tick();
      }, 5500 + Math.random() * 4000);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [orgId]);

  const totalTokens = data.reduce((acc, l) => acc + (l.tokens_used ?? 0), 0);

  if (loading) return <LoadingState label="Abriendo stream" />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--tenant-primary)]" />
          <span className="text-sm font-semibold text-foreground">Stream de audit</span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
        </div>
        <div className="flex items-center gap-3 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>{data.length} eventos</span>
          <span>{formatTokens(totalTokens)} tokens</span>
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-28">Hora</TableHead>
              <TableHead>Agente</TableHead>
              <TableHead className="w-24">Tokens</TableHead>
              <TableHead className="w-24">Estado</TableHead>
              <TableHead className="w-20 text-right">Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10">
                  <EmptyState
                    icon={Activity}
                    title="Sin eventos todavía"
                    description="Las acciones de los agentes aparecerán aquí en tiempo real."
                  />
                </TableCell>
              </TableRow>
            )}
            {data.slice(0, 30).map((log) => (
              <TableRow key={log.id} className="group">
                <TableCell className="text-mono text-[11px] text-muted-foreground">
                  {formatRelative(log.created_at)}
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-foreground">{log.agent_name}</span>
                  <span className="ml-2 text-mono text-[10px] text-muted-foreground">
                    {log.lead_id ? `lead ${log.lead_id.slice(0, 8)}` : "—"}
                  </span>
                </TableCell>
                <TableCell className="text-mono text-[11px] text-muted-foreground">
                  {formatTokens(log.tokens_used)}
                </TableCell>
                <TableCell>
                  <Badge variant={log.status === "success" ? "success" : "destructive"} className="text-[10px]">
                    {log.status === "success" ? "Success" : "Error"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="iconSm"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => {
                      setSelected(log);
                      setModalOpen(true);
                    }}
                    aria-label="Ver payload"
                  >
                    <Braces className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PayloadViewerModal log={selected} open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
