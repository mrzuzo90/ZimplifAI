"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/motion/Reveal";
import { Counter } from "@/components/motion/Counter";
import { container, fadeUp, EASE } from "@/lib/motion";
import { projects, liveCount } from "@/data/projects";
import { cn } from "@/lib/cn";

/* ─────────────────────────────────────────────
   Esquema de automatismo (arranque/paro con autoretención)
   Dibujado por pathLength, guiado por scroll.
   ───────────────────────────────────────────── */
const SEGMENTS: Array<{ d: string; range: [number, number] }> = [
  // raíles
  { d: "M70 30 V250", range: [0.0, 0.08] },
  { d: "M450 30 V250", range: [0.0, 0.08] },
  // rung 1 · control (L1 → paro → marcha → bobina → N)
  { d: "M70 70 H112", range: [0.1, 0.15] },
  { d: "M138 70 H188", range: [0.15, 0.21] },
  { d: "M214 70 H268", range: [0.21, 0.27] },
  { d: "M303 70 H450", range: [0.27, 0.36] },
  // rama de autoretención (KM1 en paralelo con marcha)
  { d: "M188 70 V112", range: [0.4, 0.46] },
  { d: "M188 112 H234", range: [0.46, 0.52] },
  { d: "M234 112 V70", range: [0.52, 0.58] },
  // rung 2 · indicación (L1 → KM1 → lámpara → N)
  { d: "M70 150 H124", range: [0.62, 0.68] },
  { d: "M146 150 H210", range: [0.68, 0.74] },
  { d: "M242 150 H450", range: [0.74, 0.82] },
];

const DETAILS: Array<{ kind: "dot" | "line" | "coil" | "lamp"; cx?: number; cy?: number; d?: string; r?: number }> = [
  // paro (contacto NC) + actuador
  { kind: "dot", cx: 116, cy: 70 },
  { kind: "dot", cx: 138, cy: 70 },
  { kind: "line", d: "M118 72 L136 68" },
  // nodo A
  { kind: "dot", cx: 188, cy: 70 },
  // marcha (contacto NO) + actuador
  { kind: "dot", cx: 192, cy: 70 },
  { kind: "dot", cx: 214, cy: 70 },
  { kind: "line", d: "M203 70 V54" },
  // nodo B
  { kind: "dot", cx: 234, cy: 70 },
  // bobina KM1
  { kind: "line", d: "M268 70 H273" },
  { kind: "coil", cx: 288, cy: 70, r: 15 },
  { kind: "line", d: "M298 70 H303" },
  // contacto KM1 (rama autoretención)
  { kind: "dot", cx: 200, cy: 112 },
  { kind: "dot", cx: 222, cy: 112 },
  { kind: "line", d: "M202 110 L220 114" },
  // contacto KM1 (rung lámpara)
  { kind: "dot", cx: 124, cy: 150 },
  { kind: "dot", cx: 146, cy: 150 },
  { kind: "line", d: "M126 152 L144 148" },
  // lámpara H1
  { kind: "lamp", cx: 228, cy: 150, r: 14 },
  // puntos de conexión a raíles
  { kind: "dot", cx: 70, cy: 70 },
  { kind: "dot", cx: 450, cy: 70 },
  { kind: "dot", cx: 70, cy: 150 },
  { kind: "dot", cx: 450, cy: 150 },
];

const LABELS = [
  { text: "L1", x: 58, y: 24 },
  { text: "N", x: 442, y: 24 },
  { text: "KM1", x: 288, y: 100 },
  { text: "H1", x: 228, y: 180 },
  { text: "S1 · paro", x: 112, y: 92 },
  { text: "S2 · marcha", x: 180, y: 92 },
];

/** Segmento de cable que se dibuja en un rango del progreso. */
function Wire({ d, range, progress, powered, reduced }: { d: string; range: [number, number]; progress: MotionValue<number>; powered: boolean; reduced: boolean }) {
  const pathLength = useTransform(progress, range, [0, 1]);
  return (
    <motion.path
      d={d}
      fill="none"
      strokeWidth={1.6}
      strokeLinecap="round"
      style={{
        pathLength: reduced ? 1 : pathLength,
        stroke: powered ? "#b9ff2a" : "#8b9098",
        transition: "stroke 0.8s ease",
      }}
    />
  );
}

/** Detalles (puntos, bobina, lámpara, actuadores) que aparecen al final. */
function Detail({ item, progress, powered, reduced }: { item: (typeof DETAILS)[number]; progress: MotionValue<number>; powered: boolean; reduced: boolean }) {
  const opacity = useTransform(progress, [0.5, 0.8], [0, 1]);
  const color = powered ? "#b9ff2a" : "#e8e6e1";
  const stroke = powered ? "#b9ff2a" : "#e8e6e1";

  const common = { opacity: reduced ? 1 : opacity, transition: "fill 0.8s ease, stroke 0.8s ease" } as const;

  if (item.kind === "dot") {
    return <motion.circle cx={item.cx} cy={item.cy} r={2.6} fill={color} style={{ ...common, transition: "fill 0.8s ease" }} />;
  }
  if (item.kind === "line") {
    return (
      <motion.path
        d={item.d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinecap="round"
        style={{ ...common, transition: "stroke 0.8s ease" }}
      />
    );
  }
  if (item.kind === "coil") {
    return (
      <motion.g style={common}>
        <circle cx={item.cx} cy={item.cy} r={item.r} fill="none" stroke={stroke} strokeWidth={1.6} />
        <circle cx={item.cx} cy={item.cy} r={1.6} fill={color} />
      </motion.g>
    );
  }
  // lamp
  return (
    <motion.g style={common}>
      <circle cx={item.cx} cy={item.cy} r={item.r} fill="none" stroke={stroke} strokeWidth={1.6} />
      <path d={`M${(item.cx ?? 0) - 8} ${(item.cy ?? 0) - 8} l16 16 M${(item.cx ?? 0) + 8} ${(item.cy ?? 0) - 8} l-16 16`} stroke={stroke} strokeWidth={1.4} />
    </motion.g>
  );
}

export default function Manifesto() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [powered, setPowered] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setReduced(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: panelRef,
    offset: ["start 0.85", "end 0.45"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (v >= 0.85) setPowered(true);
  });

  // En reduced-motion, el circuito aparece dibujado y energizado sin scroll.
  useEffect(() => {
    if (reduced) setPowered(true);
  }, [reduced]);

  return (
    <section id="manifiesto" className="relative mx-auto max-w-7xl px-5 py-28 md:px-8 md:py-40">
      <SectionLabel index="01" label="Manifiesto" className="mb-12 md:mb-16" />

      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-3">
          <Reveal className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Quién está detrás
          </Reveal>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10% 0px" }}
          className="md:col-span-8"
        >
          <motion.p
            variants={fadeUp}
            className="mb-6 text-3xl font-medium leading-tight tracking-tight md:text-5xl"
          >
            Construyo software que se usa de verdad. Ahora ayudo a empresas a hacer lo mismo con IA:
            quitarse el papeleo, automatizar lo repetitivo y desplegar tecnología que suena a ciencia
            ficción.
          </motion.p>
          <motion.p variants={fadeUp} className="mb-6 text-lg leading-relaxed text-muted">
            Soy especialista en automatización: programo full-stack, entreno y despliego IA, y diseño
            automatismos industriales (ELEE0109). Tres disciplinas que convergen en lo mismo:
            entender cómo funciona un sistema por dentro —código, modelo o máquina— y hacerlo más
            seguro, más simple, más rápido.
          </motion.p>
          <motion.p variants={fadeUp} className="text-lg font-medium text-ink">
            No vendo humo. Construyo, pruebo y publico.
          </motion.p>
        </motion.div>
      </div>

      {/* El oficio, dibujado: esquema que se dibuja solo con el scroll */}
      <div
        ref={panelRef}
        className="relative mt-16 overflow-hidden rounded-2xl border border-line bg-surface"
      >
        {/* Destello volt al energizarse */}
        {powered && !reduced && (
          <motion.div
            initial={{ opacity: 0.55 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="pointer-events-none absolute inset-0 z-10 bg-volt"
            aria-hidden="true"
          />
        )}

        <div className="grid md:grid-cols-2">
          {/* Esquema */}
          <div className="relative border-b border-line p-6 md:border-b-0 md:border-r md:p-8">
            <div className="relative">
              <svg viewBox="0 0 520 280" className="h-auto w-full" aria-hidden="true">
                <g>
                  {SEGMENTS.map((s, i) => (
                    <Wire key={`w${i}`} d={s.d} range={s.range} progress={scrollYProgress} powered={powered} reduced={reduced} />
                  ))}
                </g>
                <g>
                  {DETAILS.map((item, i) => (
                    <Detail key={`d${i}`} item={item} progress={scrollYProgress} powered={powered} reduced={reduced} />
                  ))}
                </g>
                <g
                  className="font-mono"
                  fill={powered ? "#b9ff2a" : "#8b9098"}
                  fontSize={10}
                  style={{ transition: "fill 0.8s ease" }}
                >
                  {LABELS.map((l) => (
                    <text key={l.text} x={l.x} y={l.y} textAnchor="middle">
                      {l.text}
                    </text>
                  ))}
                </g>
              </svg>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                Arranque y paro con autoretención · zCADe
              </p>
            </div>
          </div>

          {/* El payoff: credencial que se enciende */}
          <div className="flex flex-col justify-center gap-4 p-6 md:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              El oficio, dibujado
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              La lógica de escalera es donde empecé: relés, contactores y bobinas antes que
              TypeScript. Ese fondo es el que aplico hoy a cada automatización con IA.
            </p>
            <div className="mt-2 flex items-baseline gap-3">
              <motion.span
                className={cn("font-mono text-2xl tracking-tight md:text-3xl", powered ? "text-volt text-glow-volt" : "text-muted")}
                animate={powered ? { scale: [1, 1.14, 1] } : {}}
                transition={{ duration: 0.5, ease: EASE }}
              >
                ELEE0109
              </motion.span>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-all duration-500",
                  powered ? "border-volt/50 bg-volt/10 text-volt" : "border-line text-muted/50",
                )}
              >
                ⏻ {powered ? "circuito energizado" : "en espera"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
        <Stat value={<Counter to={projects.length} />} label="proyectos reales" />
        <Stat value={<Counter to={liveCount} />} label="en producción" />
        <Stat value={<Counter to={420} suffix="+" />} label="tests automatizados (zCADe)" />
        <Stat value={<span className="font-mono text-2xl text-volt md:text-3xl">0</span>} label="humo vendido" />
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-2 bg-bg p-6 md:p-8">
      <span className="text-4xl font-bold tracking-tight text-ink md:text-5xl">{value}</span>
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{label}</span>
    </div>
  );
}
