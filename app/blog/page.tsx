import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import { site } from "@/data/site";
import { getAllTags, getPaginatedPosts } from "@/lib/blog";
import BlogCard from "@/components/blog/BlogCard";
import BlogPagination from "@/components/blog/BlogPagination";
import AdSlot from "@/components/blog/AdSlot";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { MonoTag } from "@/components/ui/MonoTag";

export const metadata: Metadata = {
  title: "Blog · Implantación de IA y Automatización de Procesos",
  description:
    "Artículos técnicos, guías operativas y análisis sobre implantación de inteligencia artificial, CRM para hostelería y normativa digital en empresas.",
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: `${siteUrl}/blog`,
    siteName: site.name,
    title: "Blog · ZimplifAI · Implantación de IA y Automatización",
    description:
      "Artículos técnicos, guías operativas y análisis sobre implantación de inteligencia artificial, CRM para hostelería y normativa digital en empresas.",
    images: [
      {
        url: `${siteUrl}/og.svg`,
        width: 1200,
        height: 630,
        alt: "Blog de ZimplifAI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog · ZimplifAI · Implantación de IA y Automatización",
    description:
      "Artículos técnicos y guías prácticas sobre automatización e inteligencia artificial en la empresa real.",
    images: [`${siteUrl}/og.svg`],
  },
};

interface BlogPageProps {
  searchParams: Promise<{ page?: string; tag?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page, tag } = await searchParams;
  const currentPage = page ? parseInt(page, 10) || 1 : 1;
  const pageSize = 6;

  const { posts, total, totalPages } = await getPaginatedPosts({
    page: currentPage,
    pageSize,
    tag,
  });

  const allTags = await getAllTags();

  return (
    <div className="relative pt-32 pb-24 md:pt-40 md:pb-32">
      {/* Fondo con resplandor sutil */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-full max-w-7xl -translate-x-1/2 opacity-25"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(206, 255, 0, 0.15), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Cabecera editorial */}
        <header className="max-w-3xl">
          <SectionLabel index="05" label="Blog & Conocimiento" />

          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink md:text-6xl">
            Ingeniería de procesos e <span className="text-volt text-glow-volt">IA aplicada</span>.
          </h1>

          <p className="mt-6 text-base md:text-lg leading-relaxed text-muted">
            Artículos técnicos, guías operativas y análisis sobre cómo incorporar inteligencia
            artificial y automatizaciones en la empresa real, con foco en retorno de inversión y
            cero promesas vacías.
          </p>
        </header>

        {/* Barra de filtrado por tags */}
        <div className="mt-12 flex flex-wrap items-center gap-2 border-y border-line py-4">
          <span className="mr-2 font-mono text-xs uppercase tracking-wider text-muted">
            Filtrar:
          </span>

          <Link
            href="/blog"
            className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
              !tag
                ? "bg-volt text-bg font-semibold"
                : "border border-line text-muted hover:border-volt/50 hover:text-ink"
            }`}
          >
            Todos ({total + (tag ? 0 : 0)})
          </Link>

          {allTags.map((t) => {
            const isSelected = tag?.toLowerCase() === t.tag.toLowerCase();
            return (
              <Link
                key={t.tag}
                href={isSelected ? "/blog" : `/blog?tag=${encodeURIComponent(t.tag)}`}
                className={`rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                  isSelected
                    ? "bg-volt text-bg font-semibold"
                    : "border border-line text-muted hover:border-volt/50 hover:text-ink"
                }`}
              >
                {t.tag} <span className="opacity-60">({t.count})</span>
              </Link>
            );
          })}
        </div>

        {/* AdSlot en la cabecera del listado */}
        <AdSlot position="header" className="my-10" />

        {/* Listado de artículos */}
        {posts.length > 0 ? (
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="my-16 rounded-2xl border border-line bg-surface p-12 text-center">
            <MonoTag tone="volt" className="mb-4">
              Sin resultados
            </MonoTag>
            <h3 className="font-display text-xl font-bold text-ink">
              No hay artículos disponibles para este filtro
            </h3>
            <p className="mt-2 text-sm text-muted">
              Prueba a seleccionar otro tema o vuelve al listado completo de artículos.
            </p>
            <div className="mt-6">
              <Link
                href="/blog"
                className="inline-flex rounded-full border border-volt px-5 py-2 font-mono text-xs uppercase tracking-wider text-volt transition-colors hover:bg-volt hover:text-bg"
              >
                Ver todos los artículos
              </Link>
            </div>
          </div>
        )}

        {/* Paginación */}
        <BlogPagination
          currentPage={currentPage}
          totalPages={totalPages}
          currentTag={tag}
        />

        {/* CTA final */}
        <aside className="mt-24 rounded-2xl border border-line bg-surface/60 p-8 md:p-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-volt">
                {"// Soluciones a medida"}
              </span>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
                ¿Quieres resolver un cuello de botella en tu empresa?
              </h2>
              <p className="mt-3 text-sm md:text-base leading-relaxed text-muted">
                Auditamos tus procesos y diseñamos una solución conectada con tu software
                habitual. Sin humo, con métricas de rentabilidad claras.
              </p>
            </div>

            <div className="shrink-0">
              <Link
                href="/#contacto"
                className="inline-flex items-center gap-3 rounded-full bg-volt px-7 py-3.5 text-sm font-semibold tracking-wide text-bg transition-colors duration-300 hover:bg-[#d2ff55]"
              >
                Solicitar auditoría →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
