"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "positive" | "negative" | "neutral";
  hint?: string;
  className?: string;
}

/** Card de métrica para dashboards: icono + valor + label + delta. */
export function MetricCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaTone = "neutral",
  hint,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--tenant-primary)]/15 text-[var(--tenant-primary)]">
            <Icon className="h-4 w-4" />
          </div>
          {delta && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-mono text-[10px] font-semibold",
                deltaTone === "positive" && "bg-emerald-500/10 text-emerald-500",
                deltaTone === "negative" && "bg-rose-500/10 text-rose-500",
                deltaTone === "neutral" && "bg-muted text-muted-foreground"
              )}
            >
              {delta}
            </span>
          )}
        </div>
        <p className="mt-3 font-display text-2xl font-bold tracking-tight tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        {hint && <p className="mt-1 text-[11px] leading-snug text-muted-foreground/70">{hint}</p>}
      </CardContent>
    </Card>
  );
}
