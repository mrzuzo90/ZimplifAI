import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/motion/Reveal";

const steps = [
  ["01", "Entendemos el proceso", "Vemos dónde se atasca el trabajo, qué herramientas intervienen y qué merece la pena automatizar."],
  ["02", "Diseñamos e implantamos", "Definimos una solución que encaje con tus datos, tu equipo y la forma en que ya trabajáis."],
  ["03", "Medimos e iteramos", "Probamos el flujo con casos reales, ajustamos lo necesario y dejamos una base que se pueda mantener."],
] as const;

export default function Process() {
  return <section className="relative mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20" aria-labelledby="proceso-titulo">
    <SectionLabel index="03" label="Cómo trabajamos" className="mb-4 md:mb-6" />
    <Reveal className="max-w-2xl"><h2 id="proceso-titulo" className="text-4xl font-bold tracking-tight md:text-6xl">De un cuello de botella a un sistema que <span className="font-serif font-normal italic text-volt">sí se usa.</span></h2></Reveal>
    <p className="mt-5 max-w-xl leading-relaxed text-muted">Empezamos con un diagnóstico de 30 minutos, sin compromiso. Si la IA no es la solución, te lo diremos.</p>
    <ol className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
      {steps.map(([number, title, description]) => <li key={number} className="bg-bg p-7 md:p-9"><span className="font-mono text-xs text-volt">{"// "}{number}</span><h3 className="mt-8 text-2xl font-bold tracking-tight">{title}</h3><p className="mt-3 leading-relaxed text-muted">{description}</p></li>)}
    </ol>
  </section>;
}
