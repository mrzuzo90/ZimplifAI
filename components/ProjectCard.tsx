"use client";

import { Tilt } from "@/components/motion/Tilt";
import { cn } from "@/lib/cn";
import {
  categoryLabels,
  type Project,
  type ProjectCategory,
  type ProjectStatusTone,
} from "@/data/projects";

const categoryGradients: Record<ProjectCategory, string> = {
  web: "from-plasma/20",
  ia: "from-volt/20",
  desktop: "from-violet-500/20",
  opensource: "from-pink-500/20",
};

const toneLabel: Record<ProjectStatusTone, string> = {
  live: "En producción",
  wip: "En curso",
  tests: "Tests",
  oss: "Open source",
};

const toneBadge: Record<ProjectStatusTone, string> = {
  live: "border-volt/40 bg-volt/10 text-volt",
  wip: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  tests: "border-plasma/40 bg-plasma/10 text-plasma",
  oss: "border-purple-400/40 bg-purple-400/10 text-purple-300",
};

interface ProjectCardProps {
  project: Project;
  onOpen: () => void;
}

export function ProjectCard({ project, onOpen }: ProjectCardProps) {
  return (
    <Tilt max={5} className="h-full">
      <button
        onClick={onOpen}
        className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-surface text-left transition-colors duration-300 hover:border-volt/40"
        aria-label={`Ver caso de estudio: ${project.name}`}
      >
        {/* Portada */}
        <div
          className={cn(
            "relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br to-transparent",
            categoryGradients[project.category],
          )}
        >
          {/* rejilla técnica de fondo */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
            aria-hidden="true"
          />
          <span className="absolute left-4 top-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            {categoryLabels[project.category]}
          </span>
          <span
            className={cn(
              "absolute right-4 top-4 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
              toneBadge[project.statusTone],
            )}
          >
            {toneLabel[project.statusTone]}
          </span>
          <span className="absolute bottom-2 right-4 font-serif text-[6.5rem] italic leading-none text-ink/20 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1">
            {project.name.charAt(0)}
          </span>
        </div>

        {/* Cuerpo */}
        <div className="flex flex-1 flex-col gap-3 p-5">
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
