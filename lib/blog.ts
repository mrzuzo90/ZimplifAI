import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";

/**
 * ELECCIÓN ARQUITECTÓNICA: next-mdx-remote vs @next/mdx para Next.js 15 App Router
 * ---------------------------------------------------------------------------------
 * Tras evaluar ambas opciones oficiales y comunitarias para Next.js 15 (App Router + React 19):
 *
 * 1. @next/mdx:
 *    - Requiere configurar webpack/turbopack en next.config con el plugin `createMDX`.
 *    - Trata los archivos .mdx como módulos importados estáticamente en tiempo de compilación.
 *    - La extracción de frontmatter requiere plugins adicionales (remark-frontmatter + remark-mdx-frontmatter)
 *      y expone exports globales que complican la lectura de listados dinámicos sin importar
 *      el código completo de cada archivo en memoria.
 *
 * 2. next-mdx-remote (seleccionado):
 *    - Proporciona utilidades nativas para React Server Components (RSC) mediante `next-mdx-remote/rsc`.
 *    - Desacopla por completo los datos y el contenido: leemos el sistema de archivos con Node `fs`,
 *      extraemos el frontmatter en microsegundos con `gray-matter` (ideal para paginación,
 *      filtros por tags, metadata dinámica y app/sitemap.ts), y solo compilamos el MDX
 *      del post solicitado en su ruta `/blog/[slug]`.
 *    - Cero impacto en el bundle de cliente: la compilación y renderizado ocurren 100% en el servidor.
 *    - Permite inyectar componentes React de diseño (como `AdSlot`, callouts, botones) sin configuración
 *      adicional en el bundler.
 */

export interface BlogPostMetadata {
  title: string;
  description: string;
  date: string; // Formato YYYY-MM-DD
  slug: string;
  coverImage: string;
  tags: string[];
  author: string;
  readingTime: string;
}

export interface BlogPost extends BlogPostMetadata {
  content: string; // Markdown / MDX sin el frontmatter
}

const BLOG_CONTENT_DIR = path.join(process.cwd(), "content", "blog");

/**
 * Calcula el tiempo estimado de lectura en minutos a ~200 palabras por minuto.
 */
export function calculateReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min de lectura`;
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) al formato natural en español.
 * Ej: "2026-09-02" -> "2 de septiembre de 2026"
 */
export function formatDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Lee todos los posts MDX disponibles en /content/blog, extrae su frontmatter
 * y los devuelve ordenados cronológicamente (más recientes primero).
 */
export async function getAllPosts(): Promise<BlogPostMetadata[]> {
  try {
    const entries = await fs.readdir(BLOG_CONTENT_DIR, { withFileTypes: true });
    const mdxFiles = entries.filter(
      (entry) => entry.isFile() && entry.name.endsWith(".mdx"),
    );

    const posts = await Promise.all(
      mdxFiles.map(async (file) => {
        const filePath = path.join(BLOG_CONTENT_DIR, file.name);
        const fileContent = await fs.readFile(filePath, "utf-8");
        const { data, content } = matter(fileContent);

        const slug = (data.slug as string) || file.name.replace(/\.mdx$/, "");
        const readingTime = calculateReadingTime(content);

        return {
          title: (data.title as string) || "Sin título",
          description: (data.description as string) || "",
          date: (data.date as string) || "2026-01-01",
          slug,
          coverImage: (data.coverImage as string) || "/og.svg",
          tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
          author: (data.author as string) || "Equipo ZimplifAI",
          readingTime,
        } satisfies BlogPostMetadata;
      }),
    );

    // Ordenar de más reciente a más antiguo
    return posts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  } catch (error) {
    console.error("Error leyendo posts de /content/blog:", error);
    return [];
  }
}

/**
 * Obtiene un post específico por su slug, incluyendo su contenido MDX completo.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const allPosts = await getAllPosts();
    const foundMeta = allPosts.find((p) => p.slug === slug);

    if (!foundMeta) {
      // Intentar leer directamente por nombre de archivo slug.mdx
      const directFilePath = path.join(BLOG_CONTENT_DIR, `${slug}.mdx`);
      const fileContent = await fs.readFile(directFilePath, "utf-8");
      const { data, content } = matter(fileContent);

      return {
        title: (data.title as string) || "Sin título",
        description: (data.description as string) || "",
        date: (data.date as string) || "2026-01-01",
        slug,
        coverImage: (data.coverImage as string) || "/og.svg",
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
        author: (data.author as string) || "Equipo ZimplifAI",
        readingTime: calculateReadingTime(content),
        content,
      };
    }

    // Leemos el archivo exacto
    const directFilePath = path.join(BLOG_CONTENT_DIR, `${foundMeta.slug}.mdx`);
    let fileContent: string;
    try {
      fileContent = await fs.readFile(directFilePath, "utf-8");
    } catch {
      // Buscar entre todos los mdx aquel cuyo slug coincida
      const entries = await fs.readdir(BLOG_CONTENT_DIR);
      let matchedContent: string | null = null;
      for (const name of entries) {
        if (!name.endsWith(".mdx")) continue;
        const candidate = await fs.readFile(path.join(BLOG_CONTENT_DIR, name), "utf-8");
        const parsed = matter(candidate);
        if (parsed.data.slug === slug) {
          matchedContent = candidate;
          break;
        }
      }
      if (!matchedContent) return null;
      fileContent = matchedContent;
    }

    const { content } = matter(fileContent);
    return {
      ...foundMeta,
      content,
    };
  } catch (error) {
    console.error(`Error obteniendo el post ${slug}:`, error);
    return null;
  }
}

/**
 * Devuelve todos los tags únicos presentes en los artículos junto con su conteo.
 */
export async function getAllTags(): Promise<{ tag: string; count: number }[]> {
  const posts = await getAllPosts();
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Devuelve un subconjunto paginado y opcionalmente filtrado por tag.
 */
export async function getPaginatedPosts({
  page = 1,
  pageSize = 6,
  tag,
}: {
  page?: number;
  pageSize?: number;
  tag?: string;
}): Promise<{
  posts: BlogPostMetadata[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  const allPosts = await getAllPosts();
  const filtered = tag
    ? allPosts.filter((p) => p.tags.some((t) => t.toLowerCase() === tag.toLowerCase()))
    : allPosts;

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const start = (currentPage - 1) * pageSize;
  const posts = filtered.slice(start, start + pageSize);

  return {
    posts,
    total,
    totalPages,
    currentPage,
  };
}
