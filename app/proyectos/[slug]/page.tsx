import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MonoTag } from "@/components/ui/MonoTag";
import { categoryLabels, projects } from "@/data/projects";
import { getProjectBySlug, getProjectPath, getProjectSeoDescription } from "@/lib/projects";
import { siteUrl } from "@/lib/site";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const project = getProjectBySlug((await params).slug);
  if (!project) return {};

  const path = getProjectPath(project);
  const description = getProjectSeoDescription(project);
  return {
    title: `${project.name} · Proyecto de ZimplifAI`,
    description,
    alternates: { canonical: path },
    openGraph: { title: `${project.name} · ZimplifAI`, description, url: path, type: "article" },
    twitter: { card: "summary_large_image", title: `${project.name} · ZimplifAI`, description },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const project = getProjectBySlug((await params).slug);
  if (!project) notFound();

  const path = getProjectPath(project);
  const pageUrl = `${siteUrl}${path}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.name,
    description: getProjectSeoDescription(project),
    url: pageUrl,
    creator: { "@id": `${siteUrl}/#organization` },
    keywords: project.stack.join(", "),
  };

  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 pt-32 md:px-8 md:pb-28 md:pt-40">
      <nav aria-label="Migas de pan" className="mb-10 font-mono text-xs uppercase tracking-[0.16em] text-muted">
        <Link href="/" className="transition-colors hover:text-volt">Inicio</Link>
        <span aria-hidden="true"> / </span>
        <Link href="/#proyectos" className="transition-colors hover:text-volt">Proyectos</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page" className="text-ink">{project.name}</span>
      </nav>

      <article>
        <div className="flex flex-wrap gap-2">
          <MonoTag>{categoryLabels[project.category]}</MonoTag>
          <MonoTag tone="volt">{project.status}</MonoTag>
        </div>
        <h1 className="mt-7 text-5xl font-bold tracking-tight md:text-8xl">{project.name}</h1>
        <p className="mt-5 max-w-3xl text-xl leading-relaxed text-muted md:text-2xl">{project.tagline}</p>

        <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-2">
          <section className="bg-surface p-7 md:p-10">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-volt">El reto</h2>
            <p className="mt-4 leading-relaxed text-ink">{project.problem}</p>
          </section>
          <section className="bg-bg p-7 md:p-10">
            <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-volt">La solución</h2>
            <p className="mt-4 leading-relaxed text-muted">{project.description}</p>
          </section>
        </div>

        <section className="mt-12">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-volt">Tecnología aplicada</h2>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label={`Stack de ${project.name}`}>
            {project.stack.map((item) => <li key={item} className="rounded-full border border-line px-4 py-2 font-mono text-xs text-ink/85">{item}</li>)}
          </ul>
        </section>

        <div className="mt-14 flex flex-wrap gap-4 border-t border-line pt-8">
          <Link href="/#contacto" className="rounded-full bg-volt px-6 py-3 text-sm font-semibold text-bg transition-colors hover:bg-[#d2ff55]">Quiero un diagnóstico de 30 min</Link>
          {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line-strong px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-volt/60 hover:text-volt">Visitar proyecto <span aria-hidden="true">↗</span></a>}
        </div>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
