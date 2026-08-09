import type { ReactNode } from "react";

/** Cabecera de página: tag mono + título + descripción + acciones. */
export function PageHeader({
  index,
  label,
  title,
  description,
  actions,
}: {
  index?: string;
  label?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {(index || label) && (
          <div className="mb-2 flex items-center gap-2">
            {index && (
              <span className="text-mono text-xs font-semibold text-[var(--tenant-primary)]">
                {index}
              </span>
            )}
            {label && (
              <span className="text-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {label}
              </span>
            )}
          </div>
        )}
        <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
