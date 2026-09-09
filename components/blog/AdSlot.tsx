import { cn } from "@/lib/cn";

export type AdPosition = "header" | "in-article" | "sidebar" | "footer";

export interface AdSlotProps {
  position: AdPosition;
  className?: string;
  /** Identificador de slot específico asignado en Google AdSense (opcional por ahora). */
  slotId?: string;
}

/**
 * Mapeo de estilos y dimensiones recomendadas según estándares IAB:
 * - header: Leaderboard (728x90 desktop / 320x100 mobile / 970x90)
 * - in-article: Medium/Large Rectangle (300x250 / 336x280 / responsive fluid)
 * - sidebar: Half Page (300x600 / 300x250)
 * - footer: Leaderboard (728x90 / responsive)
 */
const DIMENSIONS_BY_POSITION: Record<
  AdPosition,
  {
    container: string;
    slotLabel: string;
    iabStandard: string;
  }
> = {
  header: {
    container: "w-full max-w-3xl min-h-[90px] md:h-[90px] mx-auto my-8",
    slotLabel: "HEADER LEADERBOARD",
    iabStandard: "728×90 / Responsive Leaderboard",
  },
  "in-article": {
    container: "w-full max-w-2xl min-h-[250px] md:min-h-[280px] mx-auto my-10",
    slotLabel: "IN-ARTICLE RECTANGLE",
    iabStandard: "336×280 / 300×250 Medium Rectangle",
  },
  sidebar: {
    container: "w-full max-w-[300px] min-h-[400px] md:min-h-[600px] mx-auto my-6",
    slotLabel: "SIDEBAR HALF-PAGE",
    iabStandard: "300×600 Half-Page / Skyscraper",
  },
  footer: {
    container: "w-full max-w-3xl min-h-[90px] md:min-h-[120px] mx-auto my-8",
    slotLabel: "BOTTOM BANNER",
    iabStandard: "728×90 / 970×90 Large Leaderboard",
  },
};

/**
 * Componente AdSlot: Placeholder y contenedor preparado para monetización con Google AdSense.
 *
 * NOTA DE ARQUITECTURA & PRIVACIDAD:
 * Actualmente NO carga ningún script externo de AdSense (evita penalizaciones de Core Web Vitals,
 * cookies de terceros y dependencias no aprobadas).
 *
 * =========================================================================================
 * TODO: CUANDO SE OBTENGA LA CUENTA APROBADA DE GOOGLE ADSENSE:
 * =========================================================================================
 * 1. En `app/layout.tsx`, dentro del `<head>` o antes de cerrar el body:
 *    ```tsx
 *    import Script from "next/script";
 *    <Script
 *      id="adsbygoogle-init"
 *      strategy="afterInteractive"
 *      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
 *      crossOrigin="anonymous"
 *    />
 *    ```
 * 2. En este componente (`components/blog/AdSlot.tsx`), añadir "use client" y descomentar el bloque <ins>:
 *    ```tsx
 *    useEffect(() => {
 *      try {
 *        // @ts-expect-error window.adsbygoogle global injection
 *        (window.adsbygoogle = window.adsbygoogle || []).push({});
 *      } catch (err) {
 *        console.error("AdSense push error:", err);
 *      }
 *    }, []);
 *
 *    <ins
 *      className="adsbygoogle"
 *      style={{ display: "block" }}
 *      data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
 *      data-ad-slot={slotId || "0000000000"}
 *      data-ad-format="auto"
 *      data-full-width-responsive="true"
 *    />
 *    ```
 * =========================================================================================
 */
export function AdSlot({ position, className, slotId }: AdSlotProps) {
  const config = DIMENSIONS_BY_POSITION[position];

  return (
    <aside
      aria-label={`Espacio publicitario: ${config.slotLabel}`}
      data-ad-position={position}
      data-ad-slot-id={slotId ?? "pending"}
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-surface/40 p-4 transition-colors hover:border-line",
        config.container,
        className,
      )}
    >
      {/* Patrón sutil de fondo geométrico */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
        aria-hidden="true"
      />

      {/* Identificador visual de placeholder */}
      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          <span className="size-1 rounded-full bg-volt/60" aria-hidden="true" />
          Publicidad · {config.slotLabel}
        </span>
        <p className="font-mono text-[11px] text-muted/80">
          Espacio reservado IAB ({config.iabStandard})
        </p>
        <span className="font-mono text-[9px] uppercase tracking-wider text-muted/40">
          [Google AdSense Ready]
        </span>
      </div>
    </aside>
  );
}

export default AdSlot;
