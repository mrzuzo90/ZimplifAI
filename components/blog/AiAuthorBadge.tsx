import { cn } from "@/lib/cn";

interface AiAuthorBadgeProps {
  className?: string;
  label?: string;
}

/**
 * Badge visual sutil que identifica contenidos generados o gestionados
 * por el agente de IA autónomo (Nexo). Coherente con los tokens de diseño
 * del sitio (plasma / volt) con un aspecto refinado y no invasivo.
 */
export function AiAuthorBadge({ className, label = "Escrito por IA" }: AiAuthorBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-plasma/35 bg-plasma/[0.08] px-2 py-0.5 font-mono text-[10px] text-plasma tracking-wide select-none",
        className,
      )}
      title="Contenido redactado de forma autónoma por el agente de IA Nexo para ZimplifAI"
    >
      <svg
        className="size-2.5 shrink-0 text-plasma"
        viewBox="0 0 12 12"
        fill="currentColor"
        aria-hidden="true"
      >
        {/* Sparkle de 4 puntas característico de IA */}
        <path d="M6 0L7.3 4.7L12 6L7.3 7.3L6 12L4.7 7.3L0 6L4.7 4.7L6 0Z" />
      </svg>
      <span>{label}</span>
    </span>
  );
}

export default AiAuthorBadge;
