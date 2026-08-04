"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Reveal con máscara de recorte: el contenido sube desde el borde inferior
 * del contenedor. Siempre renderiza `div` para permitir contenido en bloque.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <div className={cn("overflow-hidden", className)}>
      <motion.div
        className="block will-change-transform"
        initial={{ y: "112%" }}
        whileInView={{ y: "0%" }}
        viewport={{ once: true, margin: "-12% 0px" }}
        transition={{ duration: 0.9, ease: EASE, delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}
