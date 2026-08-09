"use client";

import { Banknote, Bot, Users, Workflow } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminOverview } from "@/types/database";

const KPI_META = [
  { key: "totalOrganizations", label: "Subcuentas", icon: Users, fmt: (n: number) => formatNumber(n) },
  { key: "activeModules", label: "Módulos activos", icon: Workflow, fmt: (n: number) => formatNumber(n) },
  { key: "activeAgents", label: "Agentes IA activos", icon: Bot, fmt: (n: number) => formatNumber(n) },
  { key: "mrr", label: "MRR sistema", icon: Banknote, fmt: (n: number) => formatCurrency(n) },
] as const;

export function KpiGrid({ overview, loading }: { overview: AdminOverview | null; loading: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {KPI_META.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.key} className="relative overflow-hidden p-4">
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[var(--tenant-primary)]/5" />
            <div className="flex items-center justify-between">
              <Icon className="h-4 w-4 text-[var(--tenant-primary)]" />
              <span className="text-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">
                live
              </span>
            </div>
            {loading || !overview ? (
              <Skeleton className="mt-3 h-7 w-20" />
            ) : (
              <p className="mt-2 font-display text-2xl font-bold text-foreground">
                {kpi.fmt(overview[kpi.key])}
              </p>
            )}
            <p className="mt-1 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
