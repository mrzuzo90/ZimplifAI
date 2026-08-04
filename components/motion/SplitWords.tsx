"use client";

import { motion, type Variants } from "framer-motion";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};

const word: Variants = {
  hidden: { y: "118%" },
  show: { y: "0%", transition: { duration: 0.85, ease: EASE } },
};

interface SplitWordsProps {
  text: string;
  className?: string;
  wordClassName?: string;
  /** Palabra que se renderiza en cursiva serif (acento editorial). */
  italicWord?: string;
}

/** Texto revelado palabra a palabra con máscara y stagger. */
export function SplitWords({ text, className, wordClassName, italicWord }: SplitWordsProps) {
  const words = text.split(" ");

  return (
    <motion.span
      className={cn("inline-flex flex-wrap", className)}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-10% 0px" }}
      aria-label={text}
    >
      {words.map((w, i) => {
        const clean = w.replace(/[.,!?;:]/g, "");
        const isItalic = italicWord !== undefined && clean === italicWord;
        return (
          <span key={i} className="inline-block overflow-hidden pb-[0.09em] -mb-[0.09em]">
            <motion.span
              variants={word}
              className={cn(
                "inline-block will-change-transform",
                isItalic && "font-serif italic font-normal",
                wordClassName,
              )}
            >
              {w}
            </motion.span>
          </span>
        );
      })}
    </motion.span>
  );
}
