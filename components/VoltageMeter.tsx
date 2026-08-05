"use client";

import { motion, useScroll, useTransform } from "framer-motion";

/** Medidor de voltaje lateral: se carga de 0%→100% con el scroll.
 *  Un eco del preloader ("cargando sistema") que acompaña toda la navegación. */
export default function VoltageMeter() {
  const { scrollYProgress } = useScroll();

  const fillScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const pct = useTransform(scrollYProgress, (v) => `${String(Math.round(v * 100)).padStart(3, "0")}%`);
  const opacity = useTransform(scrollYProgress, [0, 0.03], [0, 1]);

  return (
    <motion.div
      className="pointer-events-none fixed bottom-6 right-6 z-[90] hidden flex-col items-center gap-3 md:flex"
      style={{ opacity }}
      aria-hidden="true"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted [writing-mode:vertical-rl]">
        volt
      </span>
      <div className="relative h-36 w-[3px] overflow-hidden rounded-full bg-line">
        <motion.div
          className="absolute inset-x-0 bottom-0 rounded-full bg-volt"
          style={{
            height: "100%",
            scaleY: fillScale,
            transformOrigin: "bottom",
            boxShadow: "0 0 12px rgba(185, 255, 42, 0.85)",
          }}
        />
      </div>
      <motion.span className="font-mono text-[11px] text-volt">{pct}</motion.span>
    </motion.div>
  );
}
