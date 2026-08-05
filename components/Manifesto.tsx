"use client";

import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/motion/Reveal";
import { Counter } from "@/components/motion/Counter";
import { container, fadeUp } from "@/lib/motion";
import { projects, liveCount } from "@/data/projects";

export default function Manifesto() {
  return (
    <section id="manifiesto" className="relative mx-auto max-w-7xl px-5 py-28 md:px-8 md:py-40">
      <SectionLabel index="01" label="Manifiesto" className="mb-12 md:mb-16" />

      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-3">
          <Reveal className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Quién está detrás
          </Reveal>
        </div>

        <div className="md:col-span-8 md:col-start-5">
          <Reveal delay={0.08}>
            <p className="mb-6 text-3xl font-medium leading-tight tracking-tight md:text-5xl">
              Construyo software que se usa de verdad. Ahora ayudo a empresas a hacer lo mismo con
              IA: quitarse el papeleo, automatizar lo repetitivo y desplegar tecnología que suena a
              ciencia ficción.
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mb-6 text-lg leading-relaxed text-muted">
              Soy especialista en automatización: programo full-stack, entreno y despliego IA, y
              diseño automatismos industriales (ELEE0109). Tres disciplinas que convergen en lo
              mismo: entender cómo funciona un sistema por dentro —código, modelo o máquina— y
              hacerlo más seguro, más simple, más rápido.
            </p>
          </Reveal>
          <Reveal delay={0.22}>
            <p className="text-lg font-medium text-ink">No vendo humo. Construyo, pruebo y publico.</p>
          </Reveal>

          {/* Credencial inline — discreta, sin esquema complejo */}
          <Reveal delay={0.28}>
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-volt/30 bg-volt/5 px-5 py-2.5">
              <span className="font-mono text-sm font-semibold tracking-tight text-volt">ELEE0109</span>
              <span className="text-xs text-muted">automatismos industriales</span>
            </div>
          </Reveal>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
        <Stat value={<Counter to={projects.length} />} label="proyectos reales" />
        <Stat value={<Counter to={liveCount} />} label="en producción" />
        <Stat value={<Counter to={420} suffix="+" />} label="tests automatizados (zCADe)" />
        <Stat
          value={<span className="font-mono text-2xl text-volt md:text-3xl">0</span>}
          label="humo vendido"
        />
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
