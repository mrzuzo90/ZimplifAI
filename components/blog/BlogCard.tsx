import Link from "next/link";
import Image from "next/image";
import { type BlogPostMetadata, formatDate } from "@/lib/blog";
import { MonoTag } from "@/components/ui/MonoTag";

interface BlogCardProps {
  post: BlogPostMetadata;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300 hover:border-volt/40 hover:bg-surface/80">
      <Link href={`/blog/${post.slug}`} className="block overflow-hidden relative aspect-[16/9] w-full bg-surface-2">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent opacity-60" />
      </Link>

      <div className="flex flex-1 flex-col p-6">
        {/* Metadatos superiores: tags */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {post.tags.slice(0, 2).map((tag, idx) => (
            <MonoTag key={tag} tone={idx === 0 ? "volt" : "default"}>
              {tag}
            </MonoTag>
          ))}
          <span className="ml-auto font-mono text-[11px] text-muted">
            {post.readingTime}
          </span>
        </div>

        {/* Título */}
        <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-volt line-clamp-2">
          <Link href={`/blog/${post.slug}`}>
            {post.title}
          </Link>
        </h2>

        {/* Resumen */}
        <p className="mb-6 text-sm leading-relaxed text-muted line-clamp-3">
          {post.description}
        </p>

        {/* Footer de la tarjeta */}
        <div className="mt-auto flex items-center justify-between border-t border-line/60 pt-4">
          <div className="flex items-center gap-2 font-mono text-xs text-muted">
            <span>{post.author}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </div>

          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-volt transition-transform group-hover:translate-x-1"
            aria-label={`Leer artículo completo: ${post.title}`}
          >
            Leer <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default BlogCard;
