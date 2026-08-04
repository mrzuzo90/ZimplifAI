"use client";

import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";
import { EASE } from "@/lib/motion";

interface CounterProps {
  to: number;
  from?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/** Número que cuenta al entrar en viewport. Escribe directamente en el DOM (sin re-renders). */
export function Counter({ to, from = 0, duration = 1.8, prefix = "", suffix = "", className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(from, to, {
      duration,
      ease: EASE,
      onUpdate(value) {
        if (ref.current) {
          ref.current.textContent = `${prefix}${Math.round(value).toLocaleString("es-ES")}${suffix}`;
        }
      },
    });
    return () => controls.stop();
  }, [inView, from, to, duration, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {from}
      {suffix}
    </span>
  );
}
