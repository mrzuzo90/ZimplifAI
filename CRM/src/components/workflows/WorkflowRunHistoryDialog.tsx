"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, History, Loader2, RotateCcw, ShieldCheck, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { es } from "@/lib/i18n/es";
import { fetchWorkflowRunSteps, fetchWorkflowRuns, reRunWorkflowStep } from "@/lib/data-access";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Workflow, WorkflowRun, WorkflowRunStep, WorkflowStepStatus } from "@/types/database";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  workflow: Workflow;
}

const RUN_STATUS_STYLE: Record<WorkflowRun["status"], string> = {
  running: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  completed: "bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)] border-[var(--tenant-primary)]/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

const STEP_STATUS_STYLE: Record<WorkflowStepStatus, string> = {
  running: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  completed: "bg-[var(--tenant-primary)]/10 text-[var(--tenant-primary)] border-[var(--tenant-primary)]/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
  skipped: "bg-muted text-muted-foreground border-border",
};

/** Historial de ejecuciones de un workflow con pasos y re-ejecución. */
export function WorkflowRunHistoryDialog({ open, onOpenChange, orgId, workflow }: Props) {
  const fetcher = useCallback((oid: string) => fetchWorkflowRuns(oid, workflow.id), [workflow.id]);
  const { data: runs, loading } = useRealtimeCollection(fetcher, orgId, {
    table: "workflow_runs",
    filter: `workflow_id=eq.${workflow.id}`,
  });
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const toggleRun = (runId: string) => setExpandedRunId((cur) => (cur === runId ? null : runId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-[var(--tenant-primary)]" />
            {es.workflow.runHistory} · {workflow.name}
          </DialogTitle>
          <DialogDescription>{es.workflow.noRuns}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[52vh]">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">{es.common.loading}</span>
            </div>
          )}

          {!loading && runs.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <ShieldCheck className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">{es.workflow.noRuns}</p>
            </div>
          )}

          {!loading &&
            runs.map((run) => {
              const expanded = run.id === expandedRunId;
              return (
                <div key={run.id} className="border-b border-border last:border-0">
                  <button
                    type="button"
                    onClick={() => toggleRun(run.id)}
                    className="flex w-full items-center gap-3 px-1 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-surface">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {run.lead_id ? `Lead ${run.lead_id}` : "Sin lead"}
                      </p>
                      <p className="text-mono text-[10px] text-muted-foreground">
                        {formatRelative(run.started_at)} · {run.id}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn("border", RUN_STATUS_STYLE[run.status])}>
                      {es.workflow[run.status]}
                    </Badge>
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
                    />
                  </button>

                  {expanded && (
                    <div className="space-y-1 pb-4 pl-12 pr-1">
                      <RunSteps key={run.id} orgId={orgId} run={run} />
                    </div>
                  )}
                </div>
              );
            })}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

/** Pasos de una run: carga async + re-ejecución de un nodo con su payload original. */
function RunSteps({ orgId, run }: { orgId: string; run: WorkflowRun }) {
  const [steps, setSteps] = useState<WorkflowRunStep[]>([]);
  const [stepsLoading, setStepsLoading] = useState(true);
  const [reRunningId, setReRunningId] = useState<string | null>(null);

  const loadSteps = useCallback(async (runId: string) => {
    try {
      setSteps(await fetchWorkflowRunSteps(orgId, runId));
    } catch {
      setSteps([]);
    }
  }, [orgId]);

  // Carga inicial de pasos (async IIFE + cancelled — regla react-hooks/set-state-in-effect).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchWorkflowRunSteps(orgId, run.id);
        if (!cancelled) setSteps(rows);
      } catch {
        if (!cancelled) setSteps([]);
      } finally {
        if (!cancelled) setStepsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, run.id]);

  const reRun = async (step: WorkflowRunStep) => {
    setReRunningId(step.id);
    try {
      await reRunWorkflowStep(orgId, run.id, step.id);
      toast.success("Paso re-ejecutado");
      await loadSteps(run.id);
    } catch {
      toast.error(es.workflow.runError);
    } finally {
      setReRunningId(null);
    }
  };

  if (stepsLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="text-xs">{es.common.loading}</span>
      </div>
    );
  }

  if (steps.length === 0) {
    return <p className="py-2 text-xs text-muted-foreground">Sin pasos registrados.</p>;
  }

  return (
    <>
      {steps.map((step) => (
        <div key={step.id} className="rounded-md border border-border bg-surface/50 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-mono text-[11px] text-foreground">{step.node_id}</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("border", STEP_STATUS_STYLE[step.status])}>
                {step.status === "completed"
                  ? es.workflow.completed
                  : step.status === "failed"
                    ? es.workflow.failed
                    : step.status === "skipped"
                      ? es.workflow.skipped
                      : es.workflow.running}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                title={es.workflow.reRun}
                onClick={() => void reRun(step)}
                disabled={reRunningId === step.id}
              >
                {reRunningId === step.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
          {step.error_message && (
            <p className="mt-1 text-[11px] text-destructive">{step.error_message}</p>
          )}
          {(step.input_payload || step.output_payload) && (
            <div className="mt-2 grid gap-1.5">
              {step.input_payload && (
                <details className="group">
                  <summary className="cursor-pointer list-none text-[11px] text-muted-foreground hover:text-foreground">
                    Entrada
                  </summary>
                  <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-pitch/40 p-2 font-mono text-[10px] text-muted-foreground">
                    {JSON.stringify(step.input_payload, null, 2)}
                  </pre>
                </details>
              )}
              {step.output_payload && (
                <details className="group">
                  <summary className="cursor-pointer list-none text-[11px] text-muted-foreground hover:text-foreground">
                    Salida
                  </summary>
                  <pre className="mt-1 max-h-32 overflow-auto rounded-md bg-pitch/40 p-2 font-mono text-[10px] text-muted-foreground">
                    {JSON.stringify(step.output_payload, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
