"use client";

import type { LucideIcon } from "lucide-react";
import { Loader2, AlertTriangle, DatabaseZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-[var(--tenant-primary)]" />
      <p className="text-mono text-xs uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
}

export function ErrorState({
  message = "No se pudieron cargar los datos.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <AlertTriangle className="h-6 w-6 text-destructive" />
      <p className="text-sm text-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon = DatabaseZap,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong px-6 py-14 text-center",
        className
      )}
    >
      <div className="mb-1 grid h-12 w-12 place-items-center rounded-lg bg-accent">
        <Icon className="h-6 w-6 text-[var(--tenant-primary)]" />
      </div>
      <p className="font-display text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
