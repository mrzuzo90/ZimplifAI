"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const LINES = [
  { text: "Si tiene criterios objetivos", color: "text-ink" },
  { text: "se puede automatizar", color: "text-volt" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Declaración de principio en tipografía gigante.
 * La frase de Zuzo que define el posicionamiento de ZimplifAI.
 */
export default function KineticType() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-18% 0px" });

  return (
    <section
      ref={ref}
      className="relative mx-auto flex max-w-7xl flex-col items-start gap-0 overflow-hidden px-5 py-12 md:px-8 md:py-20"
      aria-hidden="true"
    >
      {LINES.map((w, i) => (
        <motion.div
          key={w.text}
          className="leading-[0.92] tracking-[-0.03em]"
          initial={{ opacity: 0, y: 36, clipPath: "inset(100% 0 0 0)" }}
          animate={
            inView
              ? { opacity: 1, y: 0, clipPath: "inset(0% 0 0 0)" }
              : { opacity: 0, y: 36, clipPath: "inset(100% 0 0 0)" }
          }
          transition={{
            duration: 0.65,
            delay: i * 0.18,
            ease: EASE,
          }}
        >
          <span
            className={`text-[9vw] font-bold md:text-[7.5vw] ${w.color}`}
          >
            {w.text}
          </span>
        </motion.div>
      ))}
    </section>
  );
}
