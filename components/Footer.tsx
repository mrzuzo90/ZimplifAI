"use client";

import { useSmoothScroll } from "@/components/providers";
import { site } from "@/data/site";

const NAV = [
  { label: "Manifiesto", target: "#manifiesto" },
  { label: "Servicios", target: "#servicios" },
  { label: "Proyectos", target: "#proyectos" },
  { label: "Habilidades", target: "#habilidades" },
  { label: "Contacto", target: "#contacto" },
];

export default function Footer() {
  const { scrollTo } = useSmoothScroll();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-16 md:px-8">
        {/* Marca gigante (clic → arriba) */}
        <button
          onClick={() => scrollTo(0, { duration: 1.4 })}
          aria-label="Volver arriba"
          className="block w-full text-left"
        >
          <span className="block text-[14vw] font-bold uppercase leading-[0.85] tracking-tight text-ink/90 transition-colors duration-500 hover:text-volt md:text-[10vw]">
            zimplifai<span className="text-volt">.</span>
          </span>
        </button>

        <div className="mt-14 grid gap-10 border-t border-line pt-10 md:grid-cols-3">
          <div>
            <p className="max-w-xs text-sm leading-relaxed text-muted">{site.description}</p>
          </div>

          <nav aria-label="Pie de página" className="flex flex-col gap-3">
            {NAV.map((n) => (
              <button
                key={n.target}
                onClick={() => scrollTo(n.target)}
                className="self-start font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-volt"
              >
                {n.label}
              </button>
            ))}
          </nav>

          <div className="flex flex-col gap-2 text-sm text-muted">
            <a href={`mailto:${site.email}`} className="transition-colors hover:text-volt">
              {site.email}
            </a>
            {site.whatsapp && (
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-volt"
              >
                WhatsApp ↗
              </a>
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-line pt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted md:flex-row md:items-center">
          <span>
            © {year} ZimplifAI · {site.tagline}
          </span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-volt" aria-hidden="true" />
            Diseñado y construido con Claude Code
          </span>
        </div>
      </div>
    </footer>
  );
}
