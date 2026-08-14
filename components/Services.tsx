"use client";

import { motion } from "framer-motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/motion/Reveal";
import { useSmoothScroll } from "@/components/providers";
import { container, fadeUp } from "@/lib/motion";

interface Service {
  n: string;
  title: string;
  description: string;
  price: string;
  bullets: string[];
}

const SERVICES: Service[] = [
  {
    n: "01",
    title: "Implantación de IA en empresas",
    description:
      "Diagnóstico de tus procesos y automatización de lo repetitivo con IA, de principio a fin.",
    price: "desde 1.200 €",
    bullets: ["Diagnóstico de procesos", "Automatización con IA", "Formación del equipo"],
  },
  {
    n: "02",
    title: "Automatización y agentes a medida",
    description:
      "Agentes de IA que trabajan por ti, integrados con tus herramientas y tus datos.",
    price: "desde 1.800 €",
    bullets: ["Agentes con LLMs (OpenAI/Claude)", "Integración con tu stack", "Despliegue y soporte"],
  },
  {
    n: "03",
    title: "Desarrollo de aplicaciones web full-stack",
    description: "Productos completos, de la base de datos al píxel. Apps reales en producción.",
    price: "desde 2.500 €",
    bullets: ["Apps Next.js / React", "APIs y bases de datos", "Pagos con Stripe"],
  },
  {
    n: "04",
    title: "Consultoría técnica · transformación con IA",
    description: "Sin humo: te digo qué se puede automatizar, qué no, y por qué.",
    price: "desde 400 € / sesión",
    bullets: ["Auditoría de procesos", "Roadmap de IA", "Acompañamiento"],
  },
];

export default function Services() {
  const { scrollTo } = useSmoothScroll();

  return (
    <section id="servicios" className="relative mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
      <div className="mb-8 flex flex-col justify-between gap-6 md:mb-10 md:flex-row md:items-end">
        <div>
          <SectionLabel index="02" label="Servicios" />
          <Reveal delay={0.1} className="mt-3 max-w-2xl md:mt-4">
            <h2 className="text-4xl font-bold tracking-tight md:text-6xl">
              Lo que hace <span className="text-volt">ZimplifAI</span>
            </h2>
          </Reveal>
        </div>
        <Reveal delay={0.2}>
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Precios orientativos y claros, sin sorpresas. Cada proyecto se presupuesta tras una
            llamada de 30 minutos.
          </p>
        </Reveal>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-8% 0px" }}
        className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2"
      >
        {SERVICES.map((s) => (
          <motion.article
            key={s.n}
            variants={fadeUp}
            className="group relative flex flex-col gap-6 bg-bg p-7 transition-colors duration-500 hover:bg-bg-soft md:p-10"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted">{"// " + s.n}</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-volt">
                {s.price}
              </span>
            </div>

            <h3 className="text-2xl font-bold tracking-tight md:text-3xl">{s.title}</h3>
            <p className="text-muted">{s.description}</p>

            <ul className="mt-auto flex flex-col gap-2 border-t border-line pt-5">
              {s.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-ink/80">
                  <span className="size-1 rounded-full bg-volt" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>

            <button
              onClick={() => scrollTo("#contacto")}
              className="pointer-events-auto mt-2 inline-flex items-center gap-2 self-start font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors group-hover:text-volt"
            >
              Pedir presupuesto
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}
