"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Plus, LayoutGrid, Table as TableIcon, CalendarDays, List } from "lucide-react";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { fetchLeads, fetchPipelineStages, fetchPipelines, updateLeadStatus } from "@/lib/data-access";
import { LoadingState, ErrorState } from "@/components/shared/States";
import { Button } from "@/components/ui/button";
import { columnsFromStages, fallbackColumns } from "./config";
import { PipelineSelector } from "./PipelineSelector";
import { LeadDialog } from "./LeadDialog";
import { NewLeadDialog } from "./NewLeadDialog";
import { KanbanView } from "./views/KanbanView";
import { TableView } from "./views/TableView";
import { CalendarView } from "./views/CalendarView";
import { ListView } from "./views/ListView";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/database";

const VIEWS = [
  { key: "kanban", label: "Kanban", icon: LayoutGrid },
  { key: "table", label: "Tabla", icon: TableIcon },
  { key: "calendar", label: "Calendario", icon: CalendarDays },
  { key: "list", label: "Lista", icon: List },
] as const;
type ViewKey = (typeof VIEWS)[number]["key"];
const VIEW_KEYS: readonly ViewKey[] = ["kanban", "table", "calendar", "list"];
const VIEW_STORAGE_KEY = "zimplifai:pipeline-view";

/**
 * Contenedor del pipeline multi-embudo: leads en tiempo real expuestos en
 * 4 vistas. El kanban toma sus columnas de las etapas del pipeline activo;
 * los leads sin pipeline asignado pertenecen al pipeline por defecto.
 */
export function PipelineView({ orgId }: { orgId: string }) {
  const { data, loading, error, refresh } = useRealtimeCollection(fetchLeads, orgId, {
    table: "leads",
    filter: `organization_id=eq.${orgId}`,
    sortKey: (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  });

  const fetchPipes = useCallback((o: string) => fetchPipelines(o), []);
  const pipelines = useRealtimeCollection(fetchPipes, orgId, {
    table: "pipelines",
    filter: `organization_id=eq.${orgId}`,
    sortKey: (a, b) => Number(b.is_default) - Number(a.is_default),
  });

  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const fetchStages = useCallback(
    (o: string) => fetchPipelineStages(o, activePipelineId ?? undefined),
    [activePipelineId]
  );
  const stages = useRealtimeCollection(fetchStages, orgId, {
    table: "pipeline_stages",
    filter: activePipelineId
      ? `organization_id=eq.${orgId}&pipeline_id=eq.${activePipelineId}`
      : `organization_id=eq.${orgId}`,
    sortKey: (a, b) => a.position - b.position,
  });

  const [leads, setLeads] = useState<Lead[]>([]);
  const [prevData, setPrevData] = useState(data);

  // Ajuste de estado durante el render: sincroniza el dataset con lo recibido
  // del hook sin perder el optimismo local (drag & drop, edición inline).
  if (data !== prevData) {
    setPrevData(data);
    setLeads(data);
  }

  const { view, selectView } = useLocalStorage(VIEW_STORAGE_KEY, "kanban", VIEW_KEYS);

  const [selected, setSelected] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDraft, setNewDraft] = useState<{ open: boolean; status: LeadStatus; followUp: string | null }>({
    open: false,
    status: "new",
    followUp: null,
  });

  const openLead = (lead: Lead) => {
    setSelected(lead);
    setDialogOpen(true);
  };
  const openNew = (status: LeadStatus = "new", followUp: string | null = null) =>
    setNewDraft({ open: true, status, followUp });

  // Pipeline resuelto: el elegido por el usuario, o el por defecto del org.
  const defaultPipelineId = useMemo(() => {
    const ps = pipelines.data;
    return ps.find((p) => p.is_default)?.id ?? ps[0]?.id ?? null;
  }, [pipelines.data]);
  const resolvedPipelineId = activePipelineId ?? defaultPipelineId;

  // Solo los leads de este pipeline; sin pipeline = pipeline por defecto.
  const visibleLeads = useMemo(() => {
    if (!resolvedPipelineId) return leads;
    return leads.filter(
      (l) =>
        l.pipeline_id === resolvedPipelineId ||
        (l.pipeline_id == null && resolvedPipelineId === defaultPipelineId)
    );
  }, [leads, resolvedPipelineId, defaultPipelineId]);

  const columns = useMemo(() => {
    const cols = columnsFromStages(stages.data);
    return cols.length > 0 ? cols : fallbackColumns();
  }, [stages.data]);

  const byStatus = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const col of columns) map[col.status] = [];
    for (const lead of visibleLeads) map[lead.status]?.push(lead);
    return map;
  }, [visibleLeads, columns]);

  const totals = useMemo(() => {
    const open = visibleLeads.filter((l) => !["closed_won", "closed_lost"].includes(l.status));
    const won = visibleLeads.filter((l) => l.status === "closed_won");
    const openValue = open.reduce((acc, l) => acc + (l.deal_value ?? 0), 0);
    return {
      total: visibleLeads.length,
      openValue,
      winRate: visibleLeads.length ? Math.round((won.length / visibleLeads.length) * 100) : 0,
    };
  }, [visibleLeads]);

  const move = async (leadId: string, status: LeadStatus) => {
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === leadId ? { ...l, status } : l)));
    try {
      await updateLeadStatus(orgId, leadId, status);
    } catch {
      setLeads(prev);
      toast.error("No se pudo mover el lead");
    }
  };

  if (loading || pipelines.loading) return <LoadingState label="Cargando pipeline" />;
  if (error || pipelines.error)
    return <ErrorState message={error?.message ?? pipelines.error?.message} onRetry={refresh} />;

  return (
    <div>
      {/* Toolbar: selector de pipeline + switcher de vistas + nueva lead */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <PipelineSelector
            orgId={orgId}
            pipelines={pipelines.data}
            stages={stages.data}
            activeId={resolvedPipelineId}
            onSelect={setActivePipelineId}
            onChanged={() => {
              pipelines.refresh();
              stages.refresh();
            }}
          />
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
            {VIEWS.map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.key}
                  onClick={() => selectView(v.key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    view === v.key
                      ? "bg-[var(--tenant-primary)] text-pitch"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <Button onClick={() => openNew()}>
          <Plus />
          Nuevo lead
        </Button>
      </div>

      {view === "kanban" && (
        <KanbanView
          columns={columns}
          leads={leads}
          byStatus={byStatus}
          totals={totals}
          onOpenLead={openLead}
          onMove={move}
          onAddColumn={(status) => openNew(status)}
        />
      )}
      {view === "table" && <TableView orgId={orgId} leads={visibleLeads} onOpenLead={openLead} onMove={move} />}
      {view === "calendar" && <CalendarView leads={visibleLeads} onOpenLead={openLead} onNewOnDay={openNew} />}
      {view === "list" && <ListView leads={visibleLeads} totals={totals} onOpenLead={openLead} />}

      <NewLeadDialog
        orgId={orgId}
        onCreated={() => {
          refresh();
          stages.refresh();
        }}
        open={newDraft.open}
        onOpenChange={(o) => setNewDraft((d) => ({ ...d, open: o }))}
        initialStatus={newDraft.status}
        initialFollowUp={newDraft.followUp}
        initialPipelineId={resolvedPipelineId}
      />
      <LeadDialog
        lead={selected}
        orgId={orgId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onChanged={refresh}
      />
    </div>
  );
}

/** Valor persistido en localStorage con useSyncExternalStore (sin hydration mismatch). */
function useLocalStorage<T extends string>(key: string, fallback: T, valid: readonly T[]) {
  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    return (valid as readonly string[]).includes(raw ?? "") ? (raw as T) : fallback;
  }, [key, fallback, valid]);

  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("storage", cb);
    return () => window.removeEventListener("storage", cb);
  }, []);

  const view = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  const selectView = useCallback(
    (v: T) => {
      localStorage.setItem(key, v);
      // El evento storage no se dispara en la misma pestaña → lo emitimos
      // manualmente para que el snapshot se actualice al instante.
      window.dispatchEvent(new StorageEvent("storage", { key, newValue: v }));
    },
    [key]
  );

  return { view, selectView };
}
