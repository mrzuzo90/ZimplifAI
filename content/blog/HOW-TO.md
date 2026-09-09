# Guía de Publicación de Artículos MDX · ZimplifAI

Esta guía documenta la especificación técnica exacta para redactar y publicar nuevos artículos en el blog de ZimplifAI. Está diseñada para que un **agente de IA o redactor técnico** pueda generar artículos completos de forma autónoma sin necesidad de revisar el código fuente de la aplicación.

---

## 1. Dónde guardar el archivo

- **Directorio de contenido:** `/content/blog/`
- **Nombre del archivo:** `[slug-del-articulo].mdx`
- **Ejemplo:** `/content/blog/optimizacion-flujos-logistica-ia.mdx`

> **Importante:** El nombre del archivo debe coincidir exactamente con el campo `slug` del frontmatter (en minúsculas, palabras separadas por guiones, sin caracteres especiales ni tildes).

---

## 2. Estructura y Esquema del Frontmatter

Todo archivo `.mdx` debe comenzar en la **Línea 1** con un bloque YAML delimitado por tres guiones (`---`):

```yaml
---
title: "Título atractivo, claro y optimizado para SEO (60-85 caracteres)"
description: "Meta description técnica para Google y redes sociales (140-160 caracteres). Resume el valor del artículo."
date: "YYYY-MM-DD"
slug: "slug-del-articulo-en-kebab-case"
coverImage: "/images/blog/nombre-imagen.svg"
tags: ["Categoría Principal", "Tecnología", "Tag Opcional"]
author: "Zuzo"
---
```

### Especificación de campos

| Campo | Tipo | Obligatorio | Descripción / Reglas |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Sí** | Título visible en H1, `<title>` y OpenGraph. Claro, directo y sin títulos clickbait vacíos. |
| `description` | `string` | **Sí** | Utilizado en la tarjeta del post, meta tag `<description>` y JSON-LD. Debe invitar al clic explicando el beneficio del contenido. |
| `date` | `string` | **Sí** | Fecha de publicación en formato ISO `YYYY-MM-DD` (ej. `2026-09-09`). Se usa para ordenar los artículos en `/blog` (más recientes primero) y en el `sitemap.xml`. |
| `slug` | `string` | **Sí** | Identificador único de URL para `/blog/[slug]`. Formato `kebab-case`. |
| `coverImage` | `string` | **Sí** | Ruta local a la imagen en `/public` (ej. `/images/blog/mi-post.svg` o `/images/blog/mi-post.png`) o URL absoluta HTTPS (1200×630 recomendada). |
| `tags` | `string[]` | **Sí** | Array de 2 a 5 etiquetas temáticas (ej. `["IA Empresarial", "Automatización", "Hostelería"]`). Sirven para el filtrado en `/blog`. |
| `author` | `string` | **Sí** | Nombre del autor. Habitual: `"Zuzo"` o `"Equipo ZimplifAI"`. Aparece en la cabecera, pie del post y schema.org JSON-LD. |

---

## 3. Componentes Disponibles en MDX

No necesitas importar ningún componente dentro del archivo `.mdx`. El compilador inyecta automáticamente los siguientes componentes enriquecidos:

### 3.1 Espacio Publicitario (`<AdSlot />`)

Inserta el bloque preparado para Google AdSense con las dimensiones estándar de IAB.

```mdx
<AdSlot position="in-article" />
```

- **Valores para `position`:**
  - `"in-article"`: Rectángulo para colocar dentro del cuerpo del artículo (se recomienda tras el primer o segundo encabezado).
  - `"sidebar"`: Rascacielos / Half-page para barras laterales.
  - `"header"`: Banner superior tipo Leaderboard.
  - `"footer"`: Banner inferior.

### 3.2 Cajas de Alerta y Notas (`<Callout />`)

Para resaltar información clave, consejos o advertencias normativas:

```mdx
<Callout type="tip" title="Consejo Práctico">
Aquí va una recomendación directa para el lector, explicando un truco o buena práctica.
</Callout>

<Callout type="info" title="Dato Relevante">
Explicación técnica o contexto complementario.
</Callout>

<Callout type="warning" title="Requisito Legal">
Advertencia sobre plazos normativos, errores críticos o requisitos fiscales.
</Callout>
```

- **Atributos:**
  - `type`: `"tip"` (borde y acento volt lima), `"info"` (acento plasma cian), o `"warning"` (acento ámbar).
  - `title` *(opcional)*: Texto de la píldora superior.

### 3.3 Formato Markdown Estándar Soportado

- **Encabezados H2 (`##`):** Generan automáticamente anclas clicables con identificador `slugify`. Utilízalos para estructurar las secciones principales.
- **Encabezados H3 (`###`):** Subsecciones.
- **Listas (`-` o `1.`):** Con viñetas estilizadas en color volt de marca.
- **Citas (`>`):** Con borde lateral volt y tipografía serif elegante.
- **Bloques de código (` ```ts `):** Renderizados con marco estilo terminal de comando ZimplifAI.
- **Tablas:** Renderizadas con bordes sutiles y cabeceras contrastadas.
- **Enlaces:** Los enlaces relativos (`/contacto`, `/blog`) usan Next.js Link; los externos añaden automáticamente `rel="noopener noreferrer"` e icono de apertura `↗`.

---

## 4. Dónde alojar las imágenes de portada

1. Coloca la imagen en `/public/images/blog/nombre-descriptivo.[svg|png|webp|jpg]`.
2. Proporción ideal: **1200 × 630 píxeles** (aspect ratio 1.91:1, ideal para redes sociales y Open Graph).
3. Paleta recomendada si creas gráficos vectoriales SVG:
   - Fondo oscuro: `#07080a` o `#101319`
   - Acento lima volt: `#ceff00`
   - Acento cian plasma: `#45e5ff`
   - Texto principal: `#e8e6e1`
   - Texto secundario: `#8b9098`

---

## 5. Automatización total (Zero-Config)

Al guardar un nuevo archivo `.mdx` en `/content/blog/`:
1. **Ruta `/blog`:** Aparece automáticamente en el listado, ordenado por fecha, y computa para la paginación y filtros por tag.
2. **Ruta `/blog/[slug]`:** Se genera estáticamente con SEO completo, OpenGraph dinámico, Twitter card y Schema.org JSON-LD `BlogPosting`.
3. **Sitemap (`/sitemap.xml`):** Se añade automáticamente una nueva entrada con `priority: 0.8` y `changeFrequency: "weekly"`.

---

## 6. Checklist para el Agente IA antes de Publicar

- [ ] El archivo se guarda en `/content/blog/[slug].mdx`.
- [ ] El frontmatter contiene los 7 campos obligatorios (`title`, `description`, `date`, `slug`, `coverImage`, `tags`, `author`).
- [ ] El artículo tiene entre 600 y 900 palabras en español profesional y cercano.
- [ ] No promete funcionalidades que ZimplifAI no posea ni inventa datos estadísticos falsos.
- [ ] Contiene al menos un `<AdSlot position="in-article" />` y un `<Callout />`.
- [ ] Ejecutar `npm run typecheck && npm run lint` en el proyecto para verificar que no hay errores tipográficos ni sintácticos.
