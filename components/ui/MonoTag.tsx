import { cn } from "@/lib/cn";

interface MonoTagProps {
  children: string;
  className?: string;
  tone?: "default" | "volt" | "plasma";
}

/** Etiqueta monoespaciada tipo corner-label, detalle de marca. */
export function MonoTag({ children, className, tone = "default" }: MonoTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em]",
        tone === "default" && "border-line text-muted",
        tone === "volt" && "border-volt/40 text-volt",
        tone === "plasma" && "border-plasma/40 text-plasma",
        className,
      )}
    >
      {children}
    </span>
  );
}
