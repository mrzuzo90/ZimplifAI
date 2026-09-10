import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import { siteUrl } from "@/lib/site";
import { site } from "@/data/site";
import { getAllPosts, getPostBySlug, formatDate, getAuthorInfo } from "@/lib/blog";
import { mdxComponents } from "@/components/blog/MDXComponents";
import AdSlot from "@/components/blog/AdSlot";
import ShareButtons from "@/components/blog/ShareButtons";
import { MonoTag } from "@/components/ui/MonoTag";
import { AiAuthorBadge } from "@/components/blog/AiAuthorBadge";
import { cn } from "@/lib/cn";

/**
 * ELECCIÓN ARQUITECTÓNICA DE MDX:
 * Se utiliza `compileMDX` de `next-mdx-remote/rsc` para renderizar el post como React Server Component (RSC).
 * Esto permite:
 * 1. Cero JS de librería MDX enviado al navegador cliente.
 * 2. Inyección declarativa de componentes de UI (AdSlot, Callout, pre con estilo terminal).
 * 3. Aislamiento completo de los datos en /content/blog/.
 */

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Artículo no encontrado · Blog ZimplifAI",
    };
  }

  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const ogImageUrl = post.coverImage.startsWith("http")
    ? post.coverImage
    : `${siteUrl}${post.coverImage}`;

  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author }],
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: "article",
      locale: "es_ES",
      url: postUrl,
      siteName: site.name,
      title: `${post.title} · ZimplifAI`,
      description: post.description,
      publishedTime: new Date(post.date).toISOString(),
      modifiedTime: new Date(post.date).toISOString(),
      authors: [post.author],
      tags: post.tags,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogImageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const postUrl = `${siteUrl}/blog/${post.slug}`;
  const ogImageUrl = post.coverImage.startsWith("http")
    ? post.coverImage
    : `${siteUrl}${post.coverImage}`;
  const authorInfo = getAuthorInfo(post.author);

  // Compilar MDX en el servidor con los componentes de diseño del proyecto
  const { content } = await compileMDX({
    source: post.content,
    components: mdxComponents,
  });

  // Schema.org JSON-LD para BlogPosting / Article (SEO enriquecido)
  //
  // SCHEMA.ORG ELECCIÓN DE TIPO PARA AUTOR-IA:
  // Schema.org y las directrices oficiales de Google Search Central para Article/BlogPosting
  // restringen el campo `author` a los tipos "@type": "Person" o "@type": "Organization".
  // Google Search Central recomienda expresamente reservar "@type": "Person" únicamente para
  // personas naturales (humanos).
  // Para 'Nexo' (agente autónomo de IA), seleccionamos "@type": "Organization" porque:
  // 1. Honestidad semántica: un agente de software no es un individuo físico/humano con identidad civil.
  // 2. Nexo actúa y redacta como una entidad de software delegada por ZimplifAI en su infraestructura.
  // 3. Valida estrictamente al 100% sin advertencias en el validador oficial de Schema.org y en la
  //    prueba de resultados enriquecidos (Rich Results) de Google.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    headline: post.title,
    description: post.description,
    image: [ogImageUrl],
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.date).toISOString(),
    author: authorInfo.isAi
      ? {
          "@type": "Organization",
          name: post.author,
          url: `${siteUrl}/blog`,
        }
      : {
          "@type": "Person",
          name: post.author,
          url: siteUrl,
        },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/isotipo.png`,
      },
    },
    keywords: post.tags.join(", "),
  };

  return (
    <article className="relative pt-32 pb-24 md:pt-40 md:pb-32">
      {/* Schema.org BlogPosting estructurado */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Resplandor ambiental de fondo */}
      <div
        className="pointer-events-none absolute top-20 left-1/2 -z-10 h-[500px] w-full max-w-5xl -translate-x-1/2 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, rgba(69, 229, 255, 0.15), transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Migas de pan / Breadcrumbs */}
        <nav aria-label="Migas de pan" className="mb-8 font-mono text-xs text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="transition-colors hover:text-ink">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/blog" className="transition-colors hover:text-volt">
                Blog
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ink truncate max-w-[200px] md:max-w-md" aria-current="page">
              {post.title}
            </li>
          </ol>
        </nav>

        {/* Cabecera del post */}
        <header className="mx-auto max-w-4xl">
          {/* Etiquetas y lectura */}
          <div className="flex flex-wrap items-center gap-2.5">
            {post.tags.map((tag, idx) => (
              <MonoTag key={tag} tone={idx === 0 ? "volt" : "plasma"}>
                {tag}
              </MonoTag>
            ))}
            <span className="ml-auto font-mono text-xs text-muted">
              {post.readingTime}
            </span>
          </div>

          {/* Título principal H1 */}
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink md:text-5xl lg:text-6xl leading-[1.1]">
            {post.title}
          </h1>

          {/* Resumen / Lead */}
          <p className="mt-6 text-lg md:text-xl leading-relaxed text-muted">
            {post.description}
          </p>

          {/* Datos del autor y fecha */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4 font-mono text-xs text-muted">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border font-bold",
                  authorInfo.isAi
                    ? "border-plasma/50 bg-plasma/10 text-plasma"
                    : "border-volt/50 bg-surface text-volt",
                )}
              >
                {authorInfo.avatarText}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="block font-semibold text-ink">{post.author}</span>
                  {authorInfo.isAi && <AiAuthorBadge />}
                </div>
                <span className="text-[11px] text-muted">{authorInfo.role}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted/60">Publicado:</span>
              <time dateTime={post.date} className="text-ink">
                {formatDate(post.date)}
              </time>
            </div>
          </div>
        </header>

        {/* Imagen destacada / Cover */}
        <div className="mx-auto my-10 max-w-4xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover"
            />
          </div>
        </div>

        {/* Hueco 1 de publicidad: Header Leaderboard */}
        <AdSlot position="header" slotId="2663115877" className="my-10" />

        {/* Cuerpo del artículo con layout a 2 columnas (contenido + sidebar sticky) */}
        <div className="mx-auto mt-12 grid max-w-6xl gap-12 lg:grid-cols-12">
          {/* Columna de contenido MDX */}
          <main className="lg:col-span-8 min-w-0">
            <div className="prose-blog">{content}</div>

            {/* Hueco 2 de publicidad: Footer del contenido */}
            <AdSlot position="footer" slotId="9886999771" className="my-12" />

            {/* Barra de compartir y tags */}
            <div className="mt-12 border-t border-line pt-8">
              <ShareButtons url={postUrl} title={post.title} />

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-muted">
                  Temas:
                </span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] text-muted transition-colors hover:border-volt/50 hover:text-volt"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Caja de autor */}
            <aside className="mt-12 rounded-2xl border border-line bg-surface/80 p-6 md:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-2xl border bg-bg font-display text-2xl font-bold",
                    authorInfo.isAi
                      ? "border-plasma/50 text-plasma"
                      : "border-volt/50 text-volt",
                  )}
                >
                  {authorInfo.avatarText}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-bold text-ink">
                      Escrito por {post.author}
                    </h3>
                    {authorInfo.isAi && <AiAuthorBadge />}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {authorInfo.bio}
                  </p>
                </div>
              </div>
            </aside>
          </main>

          {/* Sidebar en desktop */}
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-28 flex flex-col gap-6">
              {/* Tarjeta de navegación rápida / volver */}
              <div className="rounded-xl border border-line bg-surface p-5">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-volt transition-colors hover:text-plasma"
                >
                  ← Volver a todos los artículos
                </Link>
              </div>

              {/* Hueco 3 de publicidad: Sidebar Skyscraper/Half-Page */}
              <AdSlot position="sidebar" slotId="9410050726" />

              {/* CTA lateral de contacto */}
              <div className="rounded-xl border border-volt/30 bg-surface/80 p-6">
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-volt">
                  {"// Consultoría directa"}
                </span>
                <h4 className="mt-2 font-display text-lg font-bold text-ink">
                  ¿Quieres implementar esto en tu negocio?
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Analizamos tus sistemas y preparamos una propuesta de automatización adaptada a tu
                  operativa diaria.
                </p>
                <Link
                  href="/#contacto"
                  className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-volt py-2.5 font-mono text-xs uppercase tracking-wider font-bold text-bg transition-colors hover:bg-[#d2ff55]"
                >
                  Contactar con Zuzo →
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
