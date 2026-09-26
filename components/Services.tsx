"use client";

import { motion } from "framer-motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/motion/Reveal";
import { useSmoothScroll } from "@/components/providers";
import { container, fadeUp } from "@/lib/motion";
import Link from "next/link";

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
      "Automatizaciones y agentes que ejecutan tareas concretas, integrados con tus herramientas y tus datos.",
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
              Ver si encaja
              <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </button>
          </motion.article>
        ))}
      </motion.div>

      {/* Enlace especializado hacia la Auditoría GEO para hostelería */}
      <div className="mt-8 flex flex-col justify-between gap-6 rounded-2xl border border-line bg-surface/60 p-6 sm:flex-row sm:items-center md:mt-10 md:p-8">
        <div className="max-w-xl">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-volt" aria-hidden="true" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-volt">
              Especial Hostelería & Hoteles
            </span>
          </div>
          <h3 className="mt-2 text-xl font-bold tracking-tight text-ink md:text-2xl">
            Auditoría GEO accionable
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            ¿Qué dicen ChatGPT, Perplexity y Gemini de tu restaurante u hotel? Análisis de 8 consultas
            reales, fuentes citadas y 3 acciones priorizadas.
          </p>
        </div>
        <Link
          href="/auditoria-geo-hosteleria"
          className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-volt/40 bg-volt/10 px-6 py-3 font-mono text-xs uppercase tracking-wider text-volt transition-colors hover:bg-volt hover:text-bg sm:self-center"
        >
          Ver auditoría GEO
          <span
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
