"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectModal } from "@/components/ProjectModal";
import { categoryLabels, projects, type Project, type ProjectCategory } from "@/data/projects";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/cn";

type FilterKey = ProjectCategory | "all";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Todas" },
  { key: "web", label: "Web" },
  { key: "ia", label: "IA" },
  { key: "desktop", label: "Desktop" },
  { key: "opensource", label: "Open source" },
];

/** Ritmo editorial asimétrico en desktop: 7/5 alternando. */
function spanClass(index: number): string {
  const wide = index % 4 === 0 || index % 4 === 3;
  return wide ? "lg:col-span-7" : "lg:col-span-5";
}

export default function Showroom() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [active, setActive] = useState<Project | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? projects : projects.filter((p) => p.category === filter)),
    [filter],
  );

  return (
    <section id="proyectos" className="relative mx-auto max-w-7xl px-5 py-28 md:px-8 md:py-40">
      <SectionLabel index="03" label="Proyectos" className="mb-12 md:mb-16" />

      <div className="mb-10 flex flex-col justify-between gap-6 md:mb-14 md:flex-row md:items-end">
        <Reveal delay={0.1}>
          <h2 className="max-w-xl text-4xl font-bold tracking-tight md:text-6xl">
            El <span className="font-serif italic font-normal text-volt">showroom</span>. Proyectos
            reales, en producción o en camino.
          </h2>
        </Reveal>

        {/* Filtros */}
        <Reveal delay={0.2}>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={cn(
                  "rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors duration-300",
                  filter === f.key
                    ? "border-volt bg-volt text-bg"
                    : "border-line text-muted hover:border-line-strong hover:text-ink",
                )}
              >
                {f.label}
                {f.key !== "all" && (
                  <span className={cn("ml-2", filter === f.key ? "text-bg/60" : "text-muted/50")}>
                    {projects.filter((p) => p.category === f.key).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>
      </div>

      <motion.div layout className="grid gap-5 md:grid-cols-2 lg:grid-cols-12">
        <AnimatePresence mode="popLayout">
          {filtered.map((project, i) => (
            <motion.div
              key={project.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.45, ease: EASE }}
              className={cn(spanClass(i), "h-full")}
            >
              <ProjectCard project={project} onOpen={() => setActive(project)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <p className="mt-8 font-mono text-xs text-muted">
        {projects.length} proyectos · {categoryLabels.web} / {categoryLabels.ia} / {categoryLabels.desktop} /{" "}
        {categoryLabels.opensource}
      </p>

      <ProjectModal project={active} onClose={() => setActive(null)} />
    </section>
  );
}
