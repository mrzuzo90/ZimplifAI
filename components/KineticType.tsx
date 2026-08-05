"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const WORDS = [
  { text: "código", color: "text-volt" },
  { text: "IA", color: "text-plasma" },
  { text: "máquinas", color: "text-ink" },
  { text: "resultados", color: "text-volt" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Tipografía cinética gigante: cuatro palabras clave que se revelan
 * una tras otra al entrar en viewport. Estilo editorial / Apple.
 * Se ubica como interstitial entre secciones.
 */
export default function KineticType() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });

  return (
    <section
      ref={ref}
      className="relative mx-auto flex max-w-7xl flex-col items-start gap-1 overflow-hidden px-5 py-20 md:px-8 md:py-32"
      aria-hidden="true"
    >
      {WORDS.map((w, i) => (
        <motion.div
          key={w.text}
          className="leading-[0.88] tracking-[-0.04em]"
          initial={{ opacity: 0, y: 40, clipPath: "inset(100% 0 0 0)" }}
          animate={
            inView
              ? { opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)" }
              : { opacity: 0, y: 40, clipPath: "inset(100% 0 0 0)" }
          }
          transition={{
            duration: 0.7,
            delay: i * 0.15,
            ease: EASE,
          }}
        >
          <span
            className={`text-[14vw] font-bold uppercase md:text-[11vw] ${w.color}`}
          >
            {w.text}
          </span>
        </motion.div>
      ))}
    </section>
  );
}
