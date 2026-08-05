"use client";

import { Tilt } from "@/components/motion/Tilt";
import {
  categoryLabels,
  type Project,
  type ProjectStatusTone,
} from "@/data/projects";

const toneLabel: Record<ProjectStatusTone, string> = {
  live: "En producción",
  wip: "En curso",
  tests: "Tests",
  oss: "Open source",
};

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
}

/** Renderiza una "captura" simulada según el tipo de preview. */
function PreviewMockup({ project }: { project: Project }) {
  const accent = project.accent ?? "#22D3EE";

  const browserChrome = (
    <div className="absolute top-0 left-0 right-0 h-7 flex items-center px-2 border-b border-line bg-surface/80">
      <div className="flex gap-1.5 ml-2">
        <span className="size-2.5 rounded-full bg-red-500/70" />
        <span className="size-2.5 rounded-full bg-amber-500/70" />
        <span className="size-2.5 rounded-full bg-green-500/70" />
      </div>
      <div className="ml-4 flex-1 h-4 rounded bg-line/50" />
    </div>
  );

  const desktopChrome = (
    <div className="absolute top-0 left-0 right-0 h-7 flex items-center justify-between px-2 border-b border-line bg-surface/80">
      <div className="flex gap-1.5">
        <span className="size-2.5 rounded-full bg-red-500/70" />
        <span className="size-2.5 rounded-full bg-amber-500/70" />
        <span className="size-2.5 rounded-full bg-green-500/70" />
      </div>
      <span className="font-mono text-[10px] text-muted mr-3">{project.name}</span>
    </div>
  );

  const terminalChrome = (
    <div className="absolute top-0 left-0 right-0 h-7 flex items-center px-2 border-b border-line bg-surface/80">
      <div className="flex gap-1.5">
        <span className="size-2.5 rounded-full bg-red-500/70" />
        <span className="size-2.5 rounded-full bg-amber-500/70" />
        <span className="size-2.5 rounded-full bg-green-500/70" />
      </div>
      <span className="ml-4 font-mono text-[10px] text-ink/60">$ zimplifai run</span>
    </div>
  );

  const mobileChrome = (
    <div className="absolute top-0 left-0 right-0 h-7 flex items-center justify-center border-b border-line bg-surface/80">
      <div className="size-32 h-0.5 rounded-full bg-line" />
    </div>
  );

  const gridPattern = (
    <div
      className="absolute inset-0 opacity-30"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
      aria-hidden="true"
    />
  );

  // Contenido específico por previewType
  const previewContent = (() => {
    switch (project.previewType) {
      case "browser":
        return (
          <div className="absolute inset-y-7 left-0 right-0 p-4 font-mono text-xs text-ink/70 leading-relaxed">
            <div className="mb-2 text-muted">{`// ${project.name}`}</div>
            <div className="grid gap-1.5">
              {project.stack.slice(0, 4).map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="size-1.5 rounded" style={{ backgroundColor: accent }} />
                  <span className="text-ink/80">{s}</span>
                </div>
              ))}
              {project.stack.length > 4 && (
                <div className="text-muted">+{project.stack.length - 4} más…</div>
              )}
            </div>
          </div>
        );

      case "desktop":
        return (
          <div className="absolute inset-y-7 left-0 right-0 p-4 flex flex-col items-center justify-center gap-3">
            <div
              className="size-16 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accent}20` }}
            >
              <svg
                width="32"
                height="32"
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
              <div className="font-medium text-sm text-ink">{project.name}</div>
              <div className="font-mono text-[10px] text-muted mt-1">
                {project.stack.slice(0, 3).join(" · ")}
              </div>
            </div>
          </div>
        );

      case "terminal":
        return (
          <div className="absolute inset-y-7 left-0 right-0 p-4 font-mono text-[11px] text-ink/80 leading-relaxed">
            <div className="text-muted mb-3">$ zimplifai deploy {project.id}</div>
            <div className="grid gap-1">
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
          <div className="absolute inset-y-7 left-0 right-0 p-4 flex flex-col items-center justify-center gap-3">
            <div
              className="size-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${accent}20` }}
            >
              <svg
                width="28"
                height="28"
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
              <div className="font-medium text-sm text-ink">{project.name}</div>
              <div className="font-mono text-[10px] text-muted mt-1">App móvil</div>
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

  const chrome = (() => {
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

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-bg">
      {chrome}
      <div className="absolute inset-0">{previewContent}</div>
      {gridPattern}
    </div>
  );
}

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  return (
    <Tilt max={5} className="h-full">
      <button
        onClick={onOpen}
        data-cursor="project"
        className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left transition-colors duration-300 hover:border-volt/40"
        aria-label={`Ver caso de estudio: ${project.name}`}
        style={{ "--accent": project.accent } as React.CSSProperties}
      >
        {/* Preview visual */}
        <PreviewMockup project={project} />

        {/* Cuerpo */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-center gap-2">
            <span
              className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
              style={{ borderColor: `${project.accent}60`, color: project.accent }}
            >
              {categoryLabels[project.category]}
            </span>
            <span
              className="ml-auto rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]"
              style={{
                borderColor: `${project.accent}60`,
                backgroundColor: `${project.accent}15`,
                color: project.accent,
              }}
            >
              {toneLabel[project.statusTone]}
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight">{project.name}</h3>
          <p className="text-sm text-muted">{project.tagline}</p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <span className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              {project.stack.length ? project.stack.join(" · ") : "—"}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-volt opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Ver caso <span aria-hidden="true">→</span>
            </span>
          </div>
        </div>
      </button>
    </Tilt>
  );
}
