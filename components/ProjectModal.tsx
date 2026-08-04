"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { MonoTag } from "@/components/ui/MonoTag";
import { useSmoothScroll } from "@/components/providers";
import { categoryLabels, type Project } from "@/data/projects";

interface ProjectModalProps {
  project: Project | null;
  onClose: () => void;
}

/** Detalle de proyecto en un diálogo accesible (Esc, backdrop, foco inicial). */
export function ProjectModal({ project, onClose }: ProjectModalProps) {
  const { scrollTo } = useSmoothScroll();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();

    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [project, onClose]);

  const goContact = () => {
    onClose();
    window.setTimeout(() => scrollTo("#contacto"), 200);
  };

  return (
    <AnimatePresence>
      {project && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-end justify-center md:items-center md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label={project.name}
        >
          <div
            className="absolute inset-0 bg-bg/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            className="relative max-h-[88dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-line bg-surface p-7 outline-none md:rounded-3xl md:p-10"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <MonoTag>{categoryLabels[project.category]}</MonoTag>
                <MonoTag tone="volt">{project.status}</MonoTag>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-volt/50 hover:text-ink"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <h3 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">{project.name}</h3>
            <p className="mt-3 text-lg text-muted">{project.tagline}</p>

            <div className="mt-8 space-y-6">
              <div>
                <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-volt">Qué es</h4>
                <p className="mt-2 leading-relaxed">{project.description}</p>
              </div>
              <div>
                <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-volt">
                  Qué resuelve
                </h4>
                <p className="mt-2 leading-relaxed text-muted">{project.problem}</p>
              </div>
              <div>
                <h4 className="font-mono text-xs uppercase tracking-[0.2em] text-volt">Stack</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.stack.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-line px-3 py-1 font-mono text-xs text-ink/80"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-4 border-t border-line pt-7">
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-volt/50 px-6 py-3 text-sm font-semibold text-volt transition-colors hover:bg-volt hover:text-bg"
                >
                  Visitar {project.url.replace(/^https?:\/\//, "")}
                  <span aria-hidden="true">↗</span>
                </a>
              )}
              <button
                onClick={goContact}
                className="inline-flex items-center gap-2 rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-volt/60 hover:text-volt"
              >
                ¿Quieres algo así?
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
