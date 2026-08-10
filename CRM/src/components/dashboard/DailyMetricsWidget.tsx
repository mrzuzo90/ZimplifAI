"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { fetchMetricsDaily } from "@/lib/data-access";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { MetricsDaily } from "@/types/database";

/** Widget "Métricas": leads, reservas y revenue de los últimos 7 días. */
export function DailyMetricsWidget({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<MetricsDaily[]>([]);

  useEffect(() => {
    const dateFrom = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);
    const dateTo = new Date().toISOString().slice(0, 10);
    fetchMetricsDaily(orgId, dateFrom, dateTo).then(setRows).catch(() => {});
  }, [orgId]);

  const totals = useMemo(() => {
    const leads = rows.reduce((acc, r) => acc + r.total_leads, 0);
    const bookings = rows.reduce((acc, r) => acc + r.total_bookings, 0);
    const revenue = rows.reduce((acc, r) => acc + r.attributed_revenue, 0);
    return { leads, bookings, revenue };
  }, [rows]);

  const trend = useMemo(() => {
    if (rows.length < 2) return null;
    const mid = Math.floor(rows.length / 2);
    const first = rows.slice(0, mid).reduce((a, r) => a + r.attributed_revenue, 0);
    const second = rows.slice(mid).reduce((a, r) => a + r.attributed_revenue, 0);
    if (first === 0) return null;
    return Math.round(((second - first) / first) * 100);
  }, [rows]);

  const items = [
    { label: "Leads", value: formatNumber(totals.leads), icon: Users },
    { label: "Reservas", value: formatNumber(totals.bookings), icon: CalendarCheck },
    { label: "Revenue", value: formatCurrency(totals.revenue), icon: TrendingUp },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Métricas</CardTitle>
        <CardDescription>
          Últimos 7 días
          {trend !== null && (
            <span className={trend >= 0 ? "ml-1.5 font-medium text-emerald-500" : "ml-1.5 font-medium text-rose-500"}>
              {trend >= 0 ? "+" : ""}{trend}%
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {items.map((it) => (
            <div key={it.label} className="rounded-lg border border-border bg-surface px-3 py-3">
              <it.icon className="h-4 w-4 text-[var(--tenant-primary)]" />
              <p className="mt-2 font-display text-lg font-bold tabular-nums">{it.value}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{it.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
