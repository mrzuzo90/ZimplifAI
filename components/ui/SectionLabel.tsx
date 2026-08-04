import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";

interface SectionLabelProps {
  index: string;
  label: string;
  className?: string;
}

/** Cabecera de sección editorial: `// 01 · Manifiesto`. */
export function SectionLabel({ index, label, className }: SectionLabelProps) {
  return (
    <Reveal>
      <div
        className={cn(
          "flex items-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-muted",
          className,
        )}
      >
        <span className="text-volt">{"// " + index}</span>
        <span className="h-px w-8 bg-line-strong" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </Reveal>
  );
}
