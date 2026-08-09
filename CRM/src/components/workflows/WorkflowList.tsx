"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { History, Loader2, Pencil, Plus, Trash2, Workflow as WorkflowIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { useCollection } from "@/hooks/useCollection";
import { useBranding } from "@/hooks/useBranding";
import { es } from "@/lib/i18n/es";
import { TRIGGER_LABEL } from "@/lib/workflows";
import { deleteWorkflow, fetchAgents, fetchWorkflows, toggleWorkflow } from "@/lib/data-access";
import { formatRelative } from "@/lib/format";
import { WorkflowEditorDialog } from "@/components/workflows/WorkflowEditorDialog";
import { WorkflowRunHistoryDialog } from "@/components/workflows/WorkflowRunHistoryDialog";
import { cn } from "@/lib/utils";
import type { Workflow } from "@/types/database";

/** Lista de workflows del tenant con crear/editar/borrar + historial. */
export function WorkflowList({ orgId }: { orgId: string }) {
  const fetcher = useCallback((oid: string) => fetchWorkflows(oid), []);
  const { data: workflows, loading, error } = useRealtimeCollection(fetcher, orgId, {
    table: "workflows",
    filter: `organization_id=eq.${orgId}`,
  });
  const { data: agents } = useCollection((oid) => fetchAgents(oid), orgId);
  const { organization } = useBranding();

  const [editing, setEditing] = useState<Workflow | null | "new">(null);
  const [history, setHistory] = useState<Workflow | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Workflow | null>(null);

  const vertical = organization?.vertical_type ?? "custom_agency";

  const onToggle = async (wf: Workflow, active: boolean) => {
    try {
      await toggleWorkflow(orgId, wf.id, active);
    } catch {
      toast.error("No se pudo actualizar el workflow");
    }
  };

  const onDelete = async (wf: Workflow) => {
    try {
      await deleteWorkflow(orgId, wf.id);
      toast.success("Workflow eliminado");
    } catch {
      toast.error("No se pudo eliminar el workflow");
    }
  };

  const editorOpen = editing !== null;
  const editingWorkflow = editing === "new" ? null : (editing as Workflow | null);

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            {workflows.length} {es.workflow.title.toLowerCase()}
          </p>
          <Button size="sm" onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" />
            {es.workflow.new}
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-14 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">{es.common.loading}</span>
          </div>
        )}
        {!loading && error && (
          <p className="py-10 text-center text-xs text-destructive">{es.workflow.runError}</p>
        )}
        {!loading && !error && workflows.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface/40 px-6 py-14 text-center">
            <WorkflowIcon className="h-7 w-7 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">{es.workflow.empty}</p>
              <p className="mt-1 text-xs text-muted-foreground">{es.workflow.emptyHint}</p>
            </div>
            <Button size="sm" onClick={() => setEditing("new")}>
              <Plus className="h-3.5 w-3.5" />
              {es.workflow.new}
            </Button>
          </div>
        )}

        <ScrollArea className="max-h-[56vh]">
          <div className="grid gap-3 pr-1 sm:grid-cols-2">
            {!loading &&
              !error &&
              workflows.map((wf) => (
                <div
                  key={wf.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border bg-surface p-4 transition-colors",
                    wf.is_active ? "border-border" : "border-border/60 opacity-80"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <WorkflowIcon
                          className={cn(
                            "h-4 w-4 shrink-0",
                            wf.is_active ? "text-[var(--tenant-primary)]" : "text-muted-foreground/50"
                          )}
                        />
                        <h3 className="truncate text-sm font-semibold text-foreground">{wf.name}</h3>
                      </div>
                      {wf.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{wf.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title={es.workflow.runHistory}
                        onClick={() => setHistory(wf)}
                      >
                        <History className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title={es.common.edit}
                        onClick={() => setEditing(wf)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        title={es.common.delete}
                        onClick={() => setConfirmingDelete(wf)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="border-border text-muted-foreground">
                        {TRIGGER_LABEL[wf.trigger_type]}
                      </Badge>
                      <span className="text-mono text-[10px] text-muted-foreground/60">
                        {wf.nodes.length} nodos
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-mono text-[10px] text-muted-foreground/60">
                        {formatRelative(wf.updated_at)}
                      </span>
                      <Switch checked={wf.is_active} onCheckedChange={(v) => void onToggle(wf, v)} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>

      <WorkflowEditorDialog
        open={editorOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
        }}
        orgId={orgId}
        vertical={vertical}
        agents={agents}
        initial={editingWorkflow}
      />

      <WorkflowRunHistoryDialog
        open={history !== null}
        onOpenChange={(o) => {
          if (!o) setHistory(null);
        }}
        orgId={orgId}
        workflow={history ?? ({ id: "", name: "", nodes: [] } as unknown as Workflow)}
      />

      <Dialog open={confirmingDelete !== null} onOpenChange={(o) => !o && setConfirmingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar workflow</DialogTitle>
            <DialogDescription>{es.workflow.deleteConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmingDelete(null)}>
              {es.common.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (confirmingDelete) void onDelete(confirmingDelete);
                setConfirmingDelete(null);
              }}
            >
              {es.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
