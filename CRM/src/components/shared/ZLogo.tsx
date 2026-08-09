import { cn } from "@/lib/utils";

/** Isotipo ZimplifAI: cuadrado volt con rayo-Z (marca técnica). */
export function ZMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="10" fill="var(--tenant-primary)" />
      <path
        d="M10 13.5h20L14.5 26.5H30"
        stroke="var(--tenant-primary-foreground)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Marca completa: isotipo + wordmark mono. */
export function ZLogo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <ZMark />
      {!compact && (
        <span className="text-mono text-sm font-bold uppercase tracking-[0.18em] text-foreground">
          Zimplif<span className="text-[var(--tenant-primary)]">AI</span>
        </span>
      )}
    </div>
  );
}
