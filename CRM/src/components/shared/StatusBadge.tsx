"use client";

import { cn } from "@/lib/utils";

/** Badge de estado del sistema: "AI Engine: Nominal" con pulso volt. */
export function StatusBadge({
  label = "AI Engine: Nominal",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary glow-volt" />
      </span>
      <span className="text-mono uppercase tracking-wide">{label}</span>
    </span>
  );
}
