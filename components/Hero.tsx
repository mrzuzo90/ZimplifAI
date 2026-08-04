"use client";

import { motion } from "framer-motion";
import ParticleField from "@/components/ParticleField";
import { SplitWords } from "@/components/motion/SplitWords";
import { Button } from "@/components/ui/Button";
import { MonoTag } from "@/components/ui/MonoTag";
import { useSmoothScroll } from "@/components/providers";
import { EASE } from "@/lib/motion";

export default function Hero() {
  const { scrollTo } = useSmoothScroll();

  return (
    <section id="top" className="relative flex min-h-svh flex-col justify-end overflow-hidden pt-28">
      {/* Fondo vivo: campo de partículas */}
      <div className="absolute inset-0">
        <ParticleField />
      </div>
      {/* Viñeta para legibilidad del texto */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/70 via-transparent to-bg"
        aria-hidden="true"
      />

      {/* Etiquetas de esquina */}
      <div className="pointer-events-none absolute inset-x-5 top-24 hidden justify-between font-mono text-[11px] uppercase tracking-[0.22em] text-muted md:flex md:inset-x-8">
        <span>{"// zimplifai · agencia de implantación de IA"}</span>
        <span className="text-volt">electricista certificado · ELEE0109</span>
      </div>

      {/* Contenido */}
      <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 md:px-8 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.35 }}
          className="mb-8"
        >
          <MonoTag tone="volt">disponible para proyectos</MonoTag>
        </motion.div>

        <h1 className="text-[clamp(3.1rem,11.5vw,10.5rem)] font-bold uppercase leading-[0.9] tracking-tight">
          <span className="block">
            <SplitWords text="Simplifico" />
          </span>
          <span className="block">
            <SplitWords text="procesos." />
          </span>
          <span className="mt-2 block">
            <span className="mr-5 inline-block">
              <SplitWords text="Implanto" />
            </span>
            <span className="font-serif italic font-normal text-volt text-glow-volt">IA.</span>
          </span>
        </h1>

        <div className="mt-10 flex max-w-xl flex-col gap-8 md:mt-12">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.85 }}
            className="text-balance text-lg leading-relaxed text-muted md:text-xl"
          >
            Soy Zuzo, desarrollador senior full-stack y electricista certificado. ZimplifAI es mi
            agencia: implanto IA en empresas y construyo software real, en producción, sin humo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 1 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Button onClick={() => scrollTo("#contacto")}>Contratar</Button>
            <Button variant="ghost" onClick={() => scrollTo("#proyectos")}>
              Ver proyectos
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Indicador de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7, duration: 1 }}
        className="pointer-events-none absolute bottom-7 right-7 hidden flex-col items-center gap-3 md:flex"
        aria-hidden="true"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted [writing-mode:vertical-lr]">
          scroll
        </span>
        <span className="h-12 w-px bg-gradient-to-b from-volt to-transparent" />
      </motion.div>
    </section>
  );
}
