"use client";

import { useCallback, useMemo, useState } from "react";
import { BrainCircuit, Flame, RefreshCw, Snowflake, SunMedium, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import {
  fetchLeadScores,
  fetchLeads,
  fetchScoringModels,
  recalculateLeadScore,
} from "@/lib/data-access";
import { formatRelative } from "@/lib/format";
import { toast } from "sonner";
import type { Lead, LeadScore } from "@/types/database";

const SCORE_META: Record<LeadScore["label"], { label: string; color: string; icon: typeof Flame }> = {
  hot: { label: "Caliente", color: "bg-orange-500/10 text-orange-400", icon: Flame },
  warm: { label: "Tibio", color: "bg-yellow-500/10 text-yellow-400", icon: SunMedium },
  cold: { label: "Frío", color: "bg-sky-500/10 text-sky-400", icon: Snowflake },
};

/** Dashboard de Lead Scoring: modelos activos + scores por lead + recálculo manual. */
export function ScoringView({ orgId }: { orgId: string }) {
  const { data: models, loading: modelsLoading, error: modelsError } = useRealtimeCollection(
    useCallback((orgId) => fetchScoringModels(orgId), []),
    orgId,
    { table: "scoring_models", filter: `organization_id=eq.${orgId}` }
  );
  const { data: scores, refresh: refreshScores } = useRealtimeCollection<LeadScore>(
    useCallback((orgId) => fetchLeadScores(orgId), []),
    orgId,
    { table: "lead_scores", filter: `organization_id=eq.${orgId}` }
  );
  const { data: leads } = useRealtimeCollection<Lead>(
    useCallback((orgId) => fetchLeads(orgId), []),
    orgId,
    { table: "leads", filter: `organization_id=eq.${orgId}` }
  );
  const [recalculating, setRecalculating] = useState<string | null>(null);

  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);
  const activeModel = models.find((m) => m.is_active);

  const hotCount = scores.filter((s) => s.label === "hot").length;
  const warmCount = scores.filter((s) => s.label === "warm").length;
  const coldCount = scores.filter((s) => s.label === "cold").length;

  const handleRecalc = async (leadId: string) => {
    setRecalculating(leadId);
    try {
      await recalculateLeadScore(orgId, leadId);
      toast.success("Score recalculado");
      refreshScores();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al recalcular");
    } finally {
      setRecalculating(null);
    }
  };

  if (modelsLoading) return <LoadingState label="Cargando modelos de scoring" />;
  if (modelsError) return <ErrorState message={modelsError.message} />;

  return (
    <div className="space-y-6">
      {/* Métricas de distribución */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />
            <span className="text-xs text-muted-foreground">Calientes</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{hotCount}</p>
          <p className="text-mono text-[10px] text-muted-foreground">listos para contactar hoy</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <SunMedium className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-muted-foreground">Tibios</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{warmCount}</p>
          <p className="text-mono text-[10px] text-muted-foreground">requieren seguimiento</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Snowflake className="h-4 w-4 text-sky-400" />
            <span className="text-xs text-muted-foreground">Fríos</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{coldCount}</p>
          <p className="text-mono text-[10px] text-muted-foreground">baja prioridad</p>
        </div>
      </div>

      {/* Modelo activo */}
      {activeModel && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-[var(--tenant-primary)]" />
            <span className="text-sm font-semibold text-foreground">{activeModel.name}</span>
            <Badge variant="muted" className="text-[10px]">v{activeModel.version}</Badge>
            <span className="ml-auto text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Modelo activo
            </span>
          </div>
          {activeModel.description && (
            <p className="mt-1 text-xs text-muted-foreground">{activeModel.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4">
            {Object.entries(activeModel.factors).map(([key, weight]) => (
              <div key={key} className="min-w-[120px]">
                <div className="flex items-center justify-between text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>{key}</span>
                  <span>{(weight * 100).toFixed(0)}%</span>
                </div>
                <Progress value={weight * 100} className="mt-1 h-1.5" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de scores */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Scores por lead</span>
          <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {scores.length} leads puntuados
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5">Lead</th>
                <th className="px-4 py-2.5">Score</th>
                <th className="px-4 py-2.5">Estado</th>
                <th className="px-4 py-2.5">Calculado</th>
                <th className="px-4 py-2.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {scores.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12">
                    <EmptyState
                      icon={Target}
                      title="Sin scores todavía"
                      description="Pulsa «Recalcular» en un lead para puntuarlo con el modelo activo."
                    />
                  </td>
                </tr>
              )}
              {scores.map((s) => {
                const lead = leadById.get(s.lead_id);
                const meta = SCORE_META[s.label];
                const Icon = meta.icon;
                return (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">
                        {lead ? `${lead.first_name} ${lead.last_name ?? ""}`.trim() : "Lead desconocido"}
                      </p>
                      <p className="text-mono text-[10px] text-muted-foreground">{s.lead_id.slice(0, 12)}…</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-bold text-foreground">{s.score}</span>
                        <Progress value={s.score} className="h-1.5 w-20" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", meta.color)}>
                        <Icon className="h-3 w-3" />
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatRelative(s.calculated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="iconSm"
                        disabled={recalculating === s.lead_id}
                        onClick={() => handleRecalc(s.lead_id)}
                        title="Recalcular score"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", recalculating === s.lead_id && "animate-spin")} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
