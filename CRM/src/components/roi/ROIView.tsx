"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock,
  Coins,
  DollarSign,
  Flame,
  Layers,
  Play,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { MetricCard } from "@/components/roi/MetricCard";
import { SLARadar } from "@/components/sla/SLARadar";
import {
  fetchROIDashboard,
  recordTimelineEvent,
  type ROIDashboardData,
} from "@/lib/data-access";
import { formatCurrency, formatNumber, formatTokens, formatDateShort } from "@/lib/format";
import { useBranding } from "@/hooks/useBranding";
import { toast } from "sonner";

/** Bar chart CSS puro para métricas diarias. */
function MiniBars({ data }: { data: { date: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const every = Math.ceil(data.length / 14);
  return (
    <div className="flex h-28 items-end gap-1">
      {data.map((d, i) => (
        <div key={d.date} className="group relative flex h-full flex-1 flex-col justify-end" title={`${formatDateShort(d.date)} · ${formatNumber(Math.round(d.value))}`}>
          <div
            className="w-full rounded-t-[3px] bg-[var(--tenant-primary)]/60 transition-colors group-hover:bg-[var(--tenant-primary)]"
            style={{ height: `${Math.max(3, (d.value / max) * 100)}%` }}
          />
          {i % every === 0 && (
            <span className="mt-1 hidden text-mono text-[9px] text-muted-foreground sm:block">
              {formatDateShort(d.date).slice(0, 5)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/** Dashboard ROI: ingresos atribuidos vs coste, horas ahorradas y rescates. */
export function ROIView() {
  const { organization } = useBranding();
  const orgId = organization?.id;
  const [data, setData] = useState<ROIDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Simulador de lead entrante.
  const [simName, setSimName] = useState("");
  const [simulating, setSimulating] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const d = await fetchROIDashboard(orgId);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando el dashboard");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load, refreshKey]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.timeline.map((m) => ({ date: m.date, value: m.attributed_revenue }));
  }, [data]);

  const simulated = useMemo(() => {
    if (!data) return [];
    const first = data.recent_leads[0] ?? {
      id: "placeholder",
      name: "—",
      speed_to_lead_seconds: data.speed_to_lead_avg_seconds,
      created_at: new Date().toISOString(),
      stage: "new",
    };
    return [first, ...data.recent_leads];
  }, [data]);

  const handleSimulate = async () => {
    if (!orgId) return;
    setSimulating(true);
    try {
      // Registra un lead entrante simulado en el timeline.
      await recordTimelineEvent(orgId, {
        lead_id: null,
        event_type: "lead_created",
        title: "Lead entrante simulado",
        description: simName ? `Lead simulado: ${simName}` : "Lead simulado desde el test bar",
        payload: { simulated: true, source: "roi_simulator" },
      });
      toast.success("Lead simulado registrado en el timeline");
      setSimName("");
      setRefreshKey((k) => k + 1);
    } catch {
      toast.error("No se pudo simular el lead");
    } finally {
      setSimulating(false);
    }
  };

  if (loading && !data) return <LoadingState label="Calculando ROI…" />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <EmptyState title="Sin datos" description="No hay métricas para este período." />;

  const valuePerLead = data.leads_30d > 0 ? data.revenue_attributed_30d / data.leads_30d : 0;

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          icon={DollarSign}
          label="Ingresos atribuidos (30 d)"
          value={formatCurrency(data.revenue_attributed_30d)}
          delta={`${data.leads_30d} leads`}
          deltaTone="neutral"
          hint="Revenue que el CRM atribuye a la captación IA."
        />
        <MetricCard
          icon={Coins}
          label="Coste software (mes)"
          value={formatCurrency(data.software_cost_month)}
          delta="plataforma"
          deltaTone="neutral"
          hint="Cuota mensual del plan. Ajustable en settings."
        />
        <MetricCard
          icon={TrendingUp}
          label="ROI neto"
          value={`${data.net_roi_pct}%`}
          delta={data.net_roi_pct >= 0 ? "positivo" : "negativo"}
          deltaTone={data.net_roi_pct >= 0 ? "positive" : "negative"}
          hint="(Ingresos − coste) / coste × 100."
        />
        <MetricCard
          icon={Clock}
          label="Horas ahorradas (30 d)"
          value={`${formatNumber(Math.round(data.ai_hours_saved_30d))} h`}
          delta="IA"
          deltaTone="positive"
          hint="Tiempo que el agente IA elimina de la operación."
        />
        <MetricCard
          icon={Zap}
          label="Tokens IA (30 d)"
          value={formatTokens(data.ai_tokens_30d)}
          delta={`${data.deposits_charged_30d} depósitos`}
          deltaTone="neutral"
          hint="Uso agregado del runtime del agente."
        />
      </div>

      {/* Gráfico de ingresos + radar SLA */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle>Ingresos atribuidos</CardTitle>
              <CardDescription>Últimos 30 días, agregados por jornada.</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Layers className="h-3 w-3" />
              {formatCurrency(data.revenue_attributed_30d)}
            </Badge>
          </CardHeader>
          <CardContent>
            <MiniBars data={chartData} />
          </CardContent>
        </Card>

        <SLARadar compact />
      </div>

      {/* Simulador + leads recientes */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[var(--tenant-primary)]" />
              Simular lead entrante
            </CardTitle>
            <CardDescription>
              Añade un lead ficticio y observa su impacto en el timeline y las métricas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sim-name" className="text-xs">Nombre del lead (opcional)</Label>
              <Input
                id="sim-name"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                placeholder="p. ej. Clara M."
                disabled={simulating}
              />
            </div>
            <Button className="w-full gap-2" onClick={handleSimulate} disabled={simulating}>
              <Play className="h-4 w-4" />
              {simulating ? "Simulando…" : "Simular lead"}
            </Button>
            <p className="text-mono text-[11px] text-muted-foreground">
              Valor medio por lead: <span className="font-semibold text-foreground">{formatCurrency(valuePerLead)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--tenant-primary)]" />
              Speed-to-lead
            </CardTitle>
            <CardDescription>
              Tiempo medio de primer contacto: <span className="font-semibold text-foreground">{Math.floor(data.speed_to_lead_avg_seconds / 60)} min {data.speed_to_lead_avg_seconds % 60} s</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Lead</th>
                    <th className="pb-2 pr-3 font-medium">Estado</th>
                    <th className="pb-2 pr-3 font-medium">Origen</th>
                    <th className="pb-2 text-right font-medium">Speed-to-lead</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {simulated.map((l, i) => (
                    <tr key={i === 0 ? "simulated" : l.id} className={cn(i === 0 && "bg-[var(--tenant-primary)]/5")}>
                      <td className="py-2 pr-3 font-medium">
                        {i === 0 ? (simName ? simName : "Lead simulado") : l.name}
                        {i === 0 && (
                          <Badge className="ml-2 bg-[var(--tenant-primary)]/15 text-[var(--tenant-primary)]">NUEVO</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{l.stage}</td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        <Badge variant="outline" className="gap-1 text-[10px]">
                          <Sparkles className="h-3 w-3" />
                          {i === 0 ? "simulador" : "IA"}
                        </Badge>
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        <span className={cn("text-mono text-xs", i === 0 ? "font-semibold text-[var(--tenant-primary)]" : "text-muted-foreground")}>
                          {i === 0 ? "—" : `${Math.floor(l.speed_to_lead_seconds / 60)}m ${l.speed_to_lead_seconds % 60}s`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
