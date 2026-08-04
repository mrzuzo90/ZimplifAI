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
  const accent = project?.accent ?? "#22D3EE";

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

  const chromeContent = (() => {
    if (!project) return null;

    const browserChrome = (
      <div className="absolute top-0 left-0 right-0 h-8 flex items-center px-3 border-b border-line bg-surface/80">
        <div className="flex gap-1.5 ml-2">
          <span className="size-3 rounded-full bg-red-500/70" />
          <span className="size-3 rounded-full bg-amber-500/70" />
          <span className="size-3 rounded-full bg-green-500/70" />
        </div>
        <div className="ml-4 flex-1 h-5 rounded bg-line/50" />
      </div>
    );

    const desktopChrome = (
      <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-between px-3 border-b border-line bg-surface/80">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-red-500/70" />
          <span className="size-3 rounded-full bg-amber-500/70" />
          <span className="size-3 rounded-full bg-green-500/70" />
        </div>
        <span className="font-mono text-[11px] text-muted mr-3">{project.name}</span>
      </div>
    );

    const terminalChrome = (
      <div className="absolute top-0 left-0 right-0 h-8 flex items-center px-3 border-b border-line bg-surface/80">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-red-500/70" />
          <span className="size-3 rounded-full bg-amber-500/70" />
          <span className="size-3 rounded-full bg-green-500/70" />
        </div>
        <span className="ml-4 font-mono text-[11px] text-ink/60">$ zimplifai run</span>
      </div>
    );

    const mobileChrome = (
      <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center border-b border-line bg-surface/80">
        <div className="size-40 h-0.5 rounded-full bg-line" />
      </div>
    );

    switch (project.previewType) {
      case "desktop":
        return desktopChrome;
      case "terminal":
        return terminalChrome;
      case "mobile":
        return mobileChrome;
      default:
        return browserChrome;
    }
  })();

  const previewContent = (() => {
    if (!project) return null;

    switch (project.previewType) {
      case "browser":
        return (
          <div className="absolute inset-y-8 left-0 right-0 p-6 font-mono text-sm text-ink/70 leading-relaxed">
            <div className="mb-3 text-muted">{`// ${project.name}`}</div>
            <div className="grid gap-2">
              {project.stack.slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="size-2 rounded" style={{ backgroundColor: accent }} />
                  <span className="text-ink/85">{s}</span>
                </div>
              ))}
              {project.stack.length > 6 && (
                <div className="text-muted">+{project.stack.length - 6} más…</div>
              )}
            </div>
          </div>
        );

      case "desktop":
        return (
          <div className="absolute inset-y-8 left-0 right-0 p-6 flex flex-col items-center justify-center gap-4">
            <div
              className="size-24 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accent}20` }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ color: accent }}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6M9 12h6M9 15h4" />
              </svg>
            </div>
            <div className="text-center">
              <div className="font-medium text-lg text-ink">{project.name}</div>
              <div className="font-mono text-[11px] text-muted mt-2">
                {project.stack.slice(0, 4).join(" · ")}
              </div>
            </div>
          </div>
        );

      case "terminal":
        return (
          <div className="absolute inset-y-8 left-0 right-0 p-6 font-mono text-sm text-ink/80 leading-relaxed">
            <div className="text-muted mb-4">$ zimplifai deploy {project.id}</div>
            <div className="grid gap-1.5">
              {[
                "✓ Build completado",
                "✓ Tests pasando",
                "✓ Desplegado en producción",
                "→ Ver logs: zimplifai logs",
              ].map((line, i) => (
                <div key={i} className={i < 3 ? "text-green-400" : "text-muted"}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        );

      case "mobile":
        return (
          <div className="absolute inset-y-8 left-0 right-0 p-6 flex flex-col items-center justify-center gap-4">
            <div
              className="size-20 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${accent}20` }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: accent }}
              >
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <path d="M12 18h.01" />
              </svg>
            </div>
            <div className="text-center">
              <div className="font-medium text-lg text-ink">{project.name}</div>
              <div className="font-mono text-[11px] text-muted mt-2">App móvil</div>
            </div>
          </div>
        );

      default:
        return (
          <div className="absolute inset-0 flex items-center justify-center text-muted">
            <span>{project.name}</span>
          </div>
        );
    }
  })();

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
            style={{ "--accent": accent } as React.CSSProperties}
          >
            {/* Preview visual en el modal */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-bg mb-6">
              {chromeContent}
              <div className="absolute inset-0">{previewContent}</div>
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }}
                aria-hidden="true"
              />
            </div>

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
