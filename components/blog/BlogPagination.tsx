import Link from "next/link";
import { cn } from "@/lib/cn";

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  currentTag?: string;
  basePath?: string;
}

export function BlogPagination({
  currentPage,
  totalPages,
  currentTag,
  basePath = "/blog",
}: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", page.toString());
    if (currentTag) params.set("tag", currentTag);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Paginación de artículos"
      className="mt-14 flex items-center justify-center gap-2 font-mono text-xs"
    >
      {/* Botón Anterior */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-muted transition-colors hover:border-volt/50 hover:text-ink"
          aria-label="Página anterior"
        >
          ← Anterior
        </Link>
      ) : (
        <span className="inline-flex h-10 items-center gap-2 rounded-full border border-line/40 bg-surface/30 px-4 text-muted/40 cursor-not-allowed">
          ← Anterior
        </span>
      )}

      {/* Números de página */}
      <div className="flex items-center gap-1.5 px-2">
        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <Link
              key={p}
              href={buildUrl(p)}
              className={cn(
                "flex size-10 items-center justify-center rounded-full border transition-colors",
                isActive
                  ? "border-volt bg-volt font-bold text-bg shadow-[0_0_12px_rgba(206,255,0,0.3)]"
                  : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {p}
            </Link>
          );
        })}
      </div>

      {/* Botón Siguiente */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-muted transition-colors hover:border-volt/50 hover:text-ink"
          aria-label="Página siguiente"
        >
          Siguiente →
        </Link>
      ) : (
        <span className="inline-flex h-10 items-center gap-2 rounded-full border border-line/40 bg-surface/30 px-4 text-muted/40 cursor-not-allowed">
          Siguiente →
        </span>
      )}
    </nav>
  );
}

export default BlogPagination;
