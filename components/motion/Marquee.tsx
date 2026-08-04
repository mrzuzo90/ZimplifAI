"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Segundos que tarda un ciclo completo. */
  speed?: number;
  reverse?: boolean;
  /** Pausa al hacer hover. */
  pauseOnHover?: boolean;
}

/** Marquee infinito: duplica el contenido y anima un -50% (bucle perfecto). */
export function Marquee({ children, className, speed = 36, reverse = false, pauseOnHover = false }: MarqueeProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <div
        className={cn(
          "flex w-max animate-marquee",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
        style={{ animationDuration: `${speed}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
