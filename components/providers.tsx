"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import Lenis from "lenis";
import { MotionConfig } from "framer-motion";

type ScrollToOptions = { offset?: number; duration?: number };

type SmoothScrollContextValue = {
  scrollTo: (target: string | number, options?: ScrollToOptions) => void;
};

const SmoothScrollContext = createContext<SmoothScrollContextValue | null>(null);

/**
 * Smooth scroll con Lenis. Con prefers-reduced-motion se cae al scroll nativo
 * (Lenis no se instancia y scrollTo usa scrollIntoView / window.scrollTo).
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ lerp: 0.09 });
    lenisRef.current = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = (target: string | number, options?: ScrollToOptions) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, {
        offset: options?.offset ?? -88,
        duration: options?.duration ?? 1.4,
      });
      return;
    }
    if (typeof target === "string") {
      document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: target, behavior: "smooth" });
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <SmoothScrollContext.Provider value={{ scrollTo }}>
        {children}
      </SmoothScrollContext.Provider>
    </MotionConfig>
  );
}

export function useSmoothScroll(): SmoothScrollContextValue {
  const ctx = useContext(SmoothScrollContext);
  if (!ctx) throw new Error("useSmoothScroll debe usarse dentro de SmoothScrollProvider");
  return ctx;
}
