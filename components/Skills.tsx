"use client";

import { motion } from "framer-motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Marquee } from "@/components/motion/Marquee";
import { Reveal } from "@/components/motion/Reveal";
import { container, fadeUp } from "@/lib/motion";

const MARQUEE = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Tauri",
  "Konva",
  "Supabase",
  "Postgres",
  "Prisma",
  "MongoDB",
  "Stripe",
  "WebSockets",
  "OCR",
  "LLMs",
  "Agentes de IA",
];

const GROUPS = [
  {
    title: "Frontend & apps",
    items: ["React", "Next.js", "TypeScript", "Tailwind", "Tauri", "Konva"],
  },
  {
    title: "Backend & datos",
    items: ["Node.js", "Fastify", "Postgres / Prisma", "MongoDB", "Supabase", "Redis"],
  },
  {
    title: "IA & automatización",
    items: ["LLMs (OpenAI / Claude)", "Agentes de IA", "OCR", "Automatización", "WebSockets"],
  },
  {
    title: "Pagos & plataformas",
    items: ["Stripe", "Multi-tenant SaaS", "RLS", "Colas / BullMQ"],
  },
  {
    title: "Automatismos industriales",
    items: ["PLC (Siemens / Allen-Bradley)", "SCADA / HMI", "Modbus / Profibus / Profinet", "Cableado y cuadros eléctricos", "Normativa baja tensión", "Mantenimiento predictivo"],
  },
];

export default function Skills() {
  return (
    <section id="habilidades" className="relative overflow-hidden py-20 md:py-28">
      {/* Marquee de stack */}
      <Marquee speed={44} pauseOnHover className="mb-12 border-y border-line py-6">
        {MARQUEE.map((s) => (
          <span
            key={s}
            className="flex items-center gap-6 px-6 font-mono text-lg uppercase tracking-[0.1em] text-muted"
          >
            {s}
            <span className="size-1.5 rounded-full bg-volt" aria-hidden="true" />
          </span>
        ))}
      </Marquee>

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionLabel index="04" label="Habilidades" className="mb-8 md:mb-10" />

        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Reveal>
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
                Stack que se usa <span className="text-volt">de verdad</span>
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-5 max-w-sm leading-relaxed text-muted">
                No un CV de tecnologías: herramientas con las que he publicado productos en
                producción. Nada de conocimientos de oídas.
              </p>
            </Reveal>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-8% 0px" }}
            className="md:col-span-8"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              {GROUPS.map((g) => (
                <motion.div
                  key={g.title}
                  variants={fadeUp}
                  className="rounded-2xl border border-line bg-surface p-6"
                >
                  <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-volt">{g.title}</h3>
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {g.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-center justify-between gap-3 border-b border-line/60 pb-2.5 text-sm text-ink/85"
                      >
                        {item}
                        <span className="size-1 shrink-0 rounded-full bg-plasma" aria-hidden="true" />
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Dato único */}
        <Reveal delay={0.15}>
          <div className="mt-10 rounded-2xl border border-volt/30 bg-volt/[0.04] p-6 md:p-8">
            <p className="text-lg leading-relaxed md:text-xl">
              <span className="font-mono text-volt">ELEE0109</span> — automatismos industriales. No es un
              adorno: es la razón por la que entiendo tus procesos físicos a fondo y sé cómo
              automatizarlos bien con IA y software.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
