"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "framer-motion";
import { EASE } from "@/lib/motion";

const SESSION_KEY = "zimplifai-seen-v1";
const BRAND = "zimplifai";

export default function Preloader() {
  const [phase, setPhase] = useState<"loading" | "exit" | "done">("loading");
  const [mounted, setMounted] = useState(false);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
    const seen = sessionStorage.getItem(SESSION_KEY);
    if (seen === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("done");
      return;
    }

    const controls = animate(0, 100, {
      duration: 1.5,
      ease: "easeInOut",
      onUpdate(v) {
        if (counterRef.current) {
          counterRef.current.textContent = String(Math.round(v)).padStart(3, "0");
        }
      },
      onComplete() {
        window.setTimeout(() => setPhase("exit"), 280);
      },
    });
    return () => controls.stop();
  }, []);

  // Al terminar la salida, marca como visto y desmonta.
  useEffect(() => {
    if (phase !== "exit") return;
    const t = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setPhase("done");
    }, 1200);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[200] overflow-hidden bg-bg"
          initial={{ y: 0 }}
          exit={{ y: "-101%" }}
          transition={{ duration: 0.9, ease: EASE }}
          aria-hidden="true"
        >
          {/* Flash volt que sube durante la salida (guillotina). z-10 → queda sobre el contenido. */}
          <motion.div
            className="absolute inset-x-0 top-0 z-10 h-full origin-top bg-volt"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: phase === "exit" ? 1 : 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.06 }}
          />

          <div className="relative flex h-full flex-col justify-between p-6 md:p-10">
            {/* Cabecera */}
            <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.22em] text-muted">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-volt" aria-hidden="true" />
                zimplifai
              </span>
              <span>{"// cargando sistema"}</span>
            </div>

            {/* Marca gigante, letra a letra */}
            <div className="flex justify-center">
              <span className="inline-flex overflow-hidden text-[16vw] font-bold uppercase leading-[0.85] tracking-tight text-ink md:text-[11vw]">
                {BRAND.split("").map((char, i) => (
                  <span key={i} className="inline-block overflow-hidden">
                    <motion.span
                      className="inline-block will-change-transform"
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      transition={{ duration: 0.9, ease: EASE, delay: 0.15 + i * 0.045 }}
                    >
                      {char}
                    </motion.span>
                  </span>
                ))}
              </span>
            </div>

            {/* Pie: claim + contador */}
            <div className="flex items-end justify-between font-mono text-xs uppercase tracking-[0.22em] text-muted">
              <span>simplifico procesos. implanto IA.</span>
              <span className="flex items-baseline gap-1">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="text-[3.5rem] leading-none tracking-tight text-volt md:text-[4.5rem]"
                >
                  <span ref={counterRef}>000</span>
                </motion.span>
                <span>%</span>
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
