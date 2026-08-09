"use client";

import { useCallback, useMemo } from "react";
import { Coins, MessageSquare, Phone, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import {
  fetchDailyCosts,
  fetchResourceUsage,
  fetchUnitCosts,
} from "@/lib/data-access";
import { formatCurrency, formatNumber, formatTokens } from "@/lib/format";
import type { DailyCosts, ResourceUsage } from "@/types/database";

const RESOURCE_LABELS: Record<string, string> = {
  ai_tokens_input: "Tokens IA (input)",
  ai_tokens_output: "Tokens IA (output)",
  whatsapp_message: "Mensajes WhatsApp",
  whatsapp_session: "Sesiones WhatsApp",
  email_sent: "Emails enviados",
  sms_sent: "SMS enviados",
  voice_minute: "Minutos de voz",
};

/** Dashboard de costes: consumo por recurso, serie diaria y tarifas unitarias. */
export function CostDashboard({ orgId }: { orgId: string }) {
  const { data: daily, loading, error } = useRealtimeCollection<DailyCosts>(
    useCallback((orgId) => fetchDailyCosts(orgId), []),
    orgId,
    { table: "daily_costs", filter: `organization_id=eq.${orgId}` }
  );
  const { data: usage } = useRealtimeCollection<ResourceUsage>(
    useCallback((orgId) => fetchResourceUsage(orgId), []),
    orgId,
    { table: "resource_usage", filter: `organization_id=eq.${orgId}` }
  );
  const { data: unitCosts } = useRealtimeCollection(
    useCallback(() => fetchUnitCosts(), []),
    orgId,
    { table: "unit_costs", filter: `is_active=eq.true` }
  );

  const totals = useMemo(() => {
    const byResource: Record<string, { quantity: number; cost: number }> = {};
    let total = 0;
    usage.forEach((r) => {
      const key = r.resource_type;
      byResource[key] = byResource[key] ?? { quantity: 0, cost: 0 };
      byResource[key].quantity += r.quantity;
      byResource[key].cost += r.cost_eur;
      total += r.cost_eur;
    });
    return { byResource, total };
  }, [usage]);

  const periodTotal = useMemo(
    () => daily.reduce((acc, d) => acc + d.total_cost_eur, 0),
    [daily]
  );

  const maxDaily = useMemo(
    () => daily.reduce((acc, d) => Math.max(acc, d.total_cost_eur), 0),
    [daily]
  );

  if (loading) return <LoadingState label="Cargando costes" />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-[var(--tenant-primary)]" />
            <span className="text-xs text-muted-foreground">Coste hoy</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {formatCurrency(daily[daily.length - 1]?.total_cost_eur ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--tenant-primary)]" />
            <span className="text-xs text-muted-foreground">Periodo ({daily.length} días)</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">{formatCurrency(periodTotal)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--tenant-primary)]" />
            <span className="text-xs text-muted-foreground">Consumo IA (tokens)</span>
          </div>
          <p className="mt-1 font-display text-2xl font-bold text-foreground">
            {formatTokens(daily[daily.length - 1]?.ai_tokens_input ?? 0)}
          </p>
        </div>
      </div>

      {/* Serie diaria */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Coste diario (EUR)</span>
          <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            últimos {daily.length} días
          </span>
        </div>
        {daily.length === 0 ? (
          <EmptyState icon={Coins} title="Sin datos de coste" description="El consumo se registrará aquí automáticamente." />
        ) : (
          <div className="mt-4 flex h-32 items-end gap-1.5">
            {daily.map((d) => (
              <div key={d.id} className="group relative flex-1" title={`${d.date} · ${formatCurrency(d.total_cost_eur)}`}>
                <div
                  className="w-full rounded-t bg-[var(--tenant-primary)]/70 transition-all group-hover:bg-[var(--tenant-primary)]"
                  style={{ height: `${Math.max(8, (d.total_cost_eur / Math.max(maxDaily, 0.01)) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desglose por recurso */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Consumo por recurso</span>
          </div>
          <div className="divide-y divide-border">
            {Object.entries(totals.byResource).length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">Sin consumo registrado.</p>
            )}
            {Object.entries(totals.byResource).map(([key, v]) => (
              <div key={key} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm text-foreground">{RESOURCE_LABELS[key] ?? key}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-foreground">{formatCurrency(v.cost)}</p>
                  <p className="text-mono text-[10px] text-muted-foreground">
                    {formatNumber(v.quantity)} {key.includes("tokens") ? "tokens" : "uds."}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between bg-muted/30 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">Total operación</span>
              <span className="font-display text-lg font-bold text-foreground">{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Tarifas unitarias */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">Tarifas unitarias</span>
          </div>
          <div className="divide-y divide-border">
            {unitCosts.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">Sin tarifas configuradas.</p>
            )}
            {unitCosts.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Phone className={cn("h-3.5 w-3.5 text-muted-foreground", u.organization_id && "text-[var(--tenant-primary)]")} />
                  <span className="text-sm text-foreground">{RESOURCE_LABELS[u.resource_type] ?? u.resource_type}</span>
                  {u.organization_id && <span className="rounded bg-accent px-1 py-0.5 text-mono text-[9px] text-foreground">override</span>}
                </div>
                <span className="text-xs font-medium text-foreground">
                  {formatCurrency(u.cost_per_unit)} / {u.unit.replace("1k_tokens", "1k tok.")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
