import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import AdSlot from "@/components/blog/AdSlot";

/**
 * Convierte un título de texto a un ID amigable para anclas de URL.
 */
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export function Callout({
  children,
  type = "info",
  title,
}: {
  children: ReactNode;
  type?: "info" | "tip" | "warning";
  title?: string;
}) {
  const tones = {
    info: {
      border: "border-plasma/40",
      bg: "bg-plasma/5",
      badge: "border-plasma/40 text-plasma",
      label: "INFORMACIÓN",
    },
    tip: {
      border: "border-volt/40",
      bg: "bg-volt/5",
      badge: "border-volt/40 text-volt",
      label: "CONSEJO PRÁCTICO",
    },
    warning: {
      border: "border-amber-400/40",
      bg: "bg-amber-400/5",
      badge: "border-amber-400/40 text-amber-300",
      label: "ATENCIÓN / REQUISITO",
    },
  };

  const style = tones[type];

  return (
    <div
      className={cn(
        "my-8 rounded-xl border p-5 transition-colors",
        style.border,
        style.bg,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
            style.badge,
          )}
        >
          {title ?? style.label}
        </span>
      </div>
      <div className="text-sm md:text-base leading-relaxed text-ink/90 [&>p]:mb-0">
        {children}
      </div>
    </div>
  );
}

export const mdxComponents = {
  h1: ({ children, ...props }: ComponentPropsWithoutRef<"h1">) => {
    const text = typeof children === "string" ? children : "";
    const id = slugify(text);
    return (
      <h1
        id={id}
        className="mt-12 mb-6 font-display text-3xl font-bold tracking-tight text-ink md:text-4xl"
        {...props}
      >
        {children}
      </h1>
    );
  },

  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => {
    const text = typeof children === "string" ? children : "";
    const id = slugify(text);
    return (
      <h2
        id={id}
        className="group mt-12 mb-4 flex items-center gap-3 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl scroll-mt-24 border-b border-line pb-3"
        {...props}
      >
        <span className="text-volt font-mono text-base font-normal select-none" aria-hidden="true">
          {"//"}
        </span>
        <span>{children}</span>
        <a
          href={`#${id}`}
          className="ml-auto opacity-0 transition-opacity group-hover:opacity-60 text-muted font-mono text-sm hover:text-volt"
          aria-label="Enlace a esta sección"
        >
          #
        </a>
      </h2>
    );
  },

  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => {
    const text = typeof children === "string" ? children : "";
    const id = slugify(text);
    return (
      <h3
        id={id}
        className="mt-8 mb-3 font-display text-xl font-bold tracking-tight text-ink md:text-2xl scroll-mt-24"
        {...props}
      >
        {children}
      </h3>
    );
  },

  h4: ({ children, ...props }: ComponentPropsWithoutRef<"h4">) => (
    <h4
      className="mt-6 mb-2 font-display text-lg font-semibold tracking-tight text-ink"
      {...props}
    >
      {children}
    </h4>
  ),

  p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p
      className="mb-6 font-normal text-base md:text-lg leading-relaxed text-ink/90"
      {...props}
    >
      {children}
    </p>
  ),

  a: ({ href = "", children, ...props }: ComponentPropsWithoutRef<"a">) => {
    const isInternal = href.startsWith("/") || href.startsWith("#");
    if (isInternal) {
      return (
        <Link
          href={href}
          className="text-volt underline underline-offset-4 decoration-volt/40 transition-colors hover:text-plasma hover:decoration-plasma"
          {...props}
        >
          {children}
        </Link>
      );
    }
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-volt underline underline-offset-4 decoration-volt/40 transition-colors hover:text-plasma hover:decoration-plasma inline-flex items-center gap-1"
        {...props}
      >
        {children}
        <span className="text-xs" aria-hidden="true">↗</span>
      </a>
    );
  },

  ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul
      className="my-6 ml-6 list-disc space-y-2 text-ink/90 marker:text-volt text-base md:text-lg leading-relaxed"
      {...props}
    >
      {children}
    </ul>
  ),

  ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol
      className="my-6 ml-6 list-decimal space-y-2 text-ink/90 marker:text-volt font-medium text-base md:text-lg leading-relaxed"
      {...props}
    >
      {children}
    </ol>
  ),

  li: ({ children, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li className="pl-1" {...props}>
      {children}
    </li>
  ),

  blockquote: ({ children, ...props }: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="my-8 rounded-r-xl border-l-2 border-volt bg-surface/60 px-6 py-4 font-serif italic text-lg md:text-xl text-ink leading-relaxed"
      {...props}
    >
      {children}
    </blockquote>
  ),

  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr className="my-10 border-t border-line" {...props} />
  ),

  code: ({ children, className, ...props }: ComponentPropsWithoutRef<"code">) => {
    const isCodeBlock = className && className.startsWith("language-");
    if (isCodeBlock) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] text-volt"
        {...props}
      >
        {children}
      </code>
    );
  },

  pre: ({ children, ...props }: ComponentPropsWithoutRef<"pre">) => (
    <div className="my-8 overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex h-8 items-center justify-between border-b border-line bg-surface-2 px-4 font-mono text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-red-500/70" />
          <span className="size-2 rounded-full bg-amber-500/70" />
          <span className="size-2 rounded-full bg-green-500/70" />
        </div>
        <span className="text-[11px] uppercase tracking-wider text-muted">ZimplifAI · Code</span>
      </div>
      <pre
        className="overflow-x-auto p-4 font-mono text-xs md:text-sm leading-relaxed text-ink/90"
        {...props}
      >
        {children}
      </pre>
    </div>
  ),

  table: ({ children, ...props }: ComponentPropsWithoutRef<"table">) => (
    <div className="my-8 w-full overflow-x-auto rounded-xl border border-line bg-surface/50">
      <table className="w-full text-left text-sm" {...props}>
        {children}
      </table>
    </div>
  ),

  thead: ({ children, ...props }: ComponentPropsWithoutRef<"thead">) => (
    <thead className="border-b border-line bg-surface-2/80 font-mono text-xs uppercase tracking-wider text-muted" {...props}>
      {children}
    </thead>
  ),

  th: ({ children, ...props }: ComponentPropsWithoutRef<"th">) => (
    <th className="px-4 py-3 font-semibold" {...props}>
      {children}
    </th>
  ),

  td: ({ children, ...props }: ComponentPropsWithoutRef<"td">) => (
    <td className="border-b border-line/50 px-4 py-3 text-ink/90" {...props}>
      {children}
    </td>
  ),

  img: ({ src, alt }: ComponentPropsWithoutRef<"img">) => {
    if (!src || typeof src !== "string") return null;
    return (
      <figure className="my-8">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface">
          <Image
            src={src}
            alt={alt ?? "Imagen del artículo"}
            width={1200}
            height={630}
            className="h-auto w-full object-cover"
          />
        </div>
        {alt && (
          <figcaption className="mt-2 text-center font-mono text-xs text-muted">
            {alt}
          </figcaption>
        )}
      </figure>
    );
  },

  // Componentes de utilidad para los artículos MDX
  AdSlot,
  Callout,
};
