"use client";

import { useEffect, useRef, useState } from "react";
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

/** Publisher ID oficial de la cuenta de Google AdSense de Zuzo */
const ADSENSE_CLIENT_ID = "ca-pub-7635423594730192";

/**
 * Componente AdSlot: Contenedor activo para monetización con Google AdSense.
 *
 * NOTA DE ARQUITECTURA & CORE WEB VITALS:
 * - El script principal de AdSense se carga en app/layout.tsx con strategy='afterInteractive'
 *   y crossOrigin='anonymous' para no bloquear el First Contentful Paint ni el LCP.
 * - Este componente reserva dimensiones según estándares IAB (min-h fijo) para evitar CLS.
 * - Muestra un placeholder de respaldo mientras AdSense inicializa o si falla/se bloquea por adblocker.
 */
export function AdSlot({ position, className, slotId }: AdSlotProps) {
  const config = DIMENSIONS_BY_POSITION[position];
  const insRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const el = insRef.current;
    if (!el) return;

    // Si ya contiene un anuncio renderizado previamente
    if (el.getAttribute("data-ad-status") === "filled" || el.querySelector("iframe") !== null) {
      setAdLoaded(true);
      return;
    }

    // Observar mutaciones en el elemento <ins> para detectar cuando AdSense inyecta el anuncio
    const observer = new MutationObserver(() => {
      const status = el.getAttribute("data-ad-status");
      const hasIframe = el.querySelector("iframe") !== null;

      if (status === "filled" || hasIframe) {
        setAdLoaded(true);
      } else if (status === "unfilled") {
        setHasError(true);
        setAdLoaded(false);
      }
    });

    observer.observe(el, {
      attributes: true,
      attributeFilter: ["data-ad-status", "data-adsbygoogle-status"],
      childList: true,
      subtree: true,
    });

    // Evitar múltiples llamadas a push({}) sobre el mismo contenedor
    if (!pushedRef.current && el.getAttribute("data-adsbygoogle-status") !== "done") {
      try {
        // @ts-expect-error window.adsbygoogle global injection
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushedRef.current = true;
      } catch (err) {
        console.error("AdSense push error:", err);
        setHasError(true);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <aside
      aria-label={`Espacio publicitario: ${config.slotLabel}`}
      data-ad-position={position}
      data-ad-slot-id={slotId || "0000000000"}
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-xl transition-all",
        !adLoaded &&
          "border border-dashed border-line-strong bg-surface/40 p-4 hover:border-line",
        adLoaded && "border border-line/30 bg-surface/10 py-2",
        config.container,
        className,
      )}
    >
      {/* Placeholder visual de respaldo: SOLO se muestra mientras carga o si falla */}
      {!adLoaded && (
        <div
          className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center p-4 text-center"
          aria-hidden="true"
        >
          {/* Patrón sutil de fondo geométrico */}
          <div
            className="pointer-events-none absolute inset-0 opacity-15"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              <span className="size-1 rounded-full bg-volt/60" aria-hidden="true" />
              Publicidad · {config.slotLabel}
            </span>
            <p className="font-mono text-[11px] text-muted/80">
              Espacio reservado IAB ({config.iabStandard})
            </p>
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted/40">
              {hasError ? "[Anuncio no disponible]" : "[Google AdSense Ready]"}
            </span>
          </div>
        </div>
      )}

      {/* Bloque oficial de Google AdSense */}
      <ins
        ref={insRef}
        className="adsbygoogle relative z-10 w-full"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT_ID}
        // TODO: crear unidades de anuncio en adsense.google.com y sustituir slotId por el ID real de cada posición
        data-ad-slot={slotId || "0000000000"}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}

export default AdSlot;
