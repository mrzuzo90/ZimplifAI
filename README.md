# ZimplifAI — Web showroom

Web de **ZimplifAI**: agencia de implantación de IA. Showroom awwwards con hero de
partículas interactivas, preloader de marca, smooth scroll y SEO completo.

![ZimplifAI](public/og.svg)

## Stack

- **Next.js 15** (App Router) · React 19 · TypeScript
- **Tailwind CSS v4** (tokens en `app/globals.css`)
- **framer-motion** (animaciones) · **Lenis** (smooth scroll)
- **Resend** (email del formulario, vía API route) · **Vercel** (despliegue)

## Empezar

```bash
npm install
npm run dev        # http://localhost:3000
```

Otros comandos:

```bash
npm run build      # build de producción
npm run start      # sirve el build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Configuración (`.env.local`)

Copia `.env.example` a `.env.local` y rellena:

| Variable | Uso | Obligatoria |
|---|---|---|
| `RESEND_API_KEY` | Envío del formulario de contacto | Para que el formulario envíe |
| `CONTACT_EMAIL` | Email que recibe los mensajes | Idem |
| `RESEND_FROM` | Remitente (usa dominio verificado; fallback `onboarding@resend.dev`) | No |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Email público mostrado en la web | No (fallback `hola@zimplifai.com`) |
| `NEXT_PUBLIC_SITE_URL` | URL base para OG/sitemap | No (fallback vercel.app) |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Analytics de Vercel (opt-in con consentimiento) | No |
| `NEXT_PUBLIC_WHATSAPP` | Botón WhatsApp (código país + número, sin `+`) | No (vacío oculta) |
| `NEXT_PUBLIC_GITHUB` / `LINKEDIN` / `X` | Redes en contacto/footer | No |

> Si el formulario no está configurado, la web lo muestra con un aviso elegante — nunca rompe.

## Desplegar en Vercel

```bash
npm i -g vercel
vercel            # preview
vercel --prod     # producción
```

O conecta el repositorio desde el dashboard de Vercel (importa el repo, añade las
variables de entorno y despliega). `metadataBase` usa `NEXT_PUBLIC_SITE_URL`; cambia el
dominio en `.env` cuando lo tengas.

## Estructura

```
app/          páginas, layout (SEO + JSON-LD), API de contacto, sitemap, robots
components/   secciones + chrome (preloader, cursor, nav) + motion primitives
data/         proyectos (11, del brief) e identidad
lib/          utilidades (cn, motion, siteUrl)
docs/         spec de diseño y plan de implementación
```

## Notas de calidad

- **Rendimiento**: First Load JS ~169 kB; el hero usa canvas2D (sin three.js) → LCP ligero.
- **Reduced motion**: preloader, partículas, marquee y cursor se degradan con elegancia.
- **Accesibilidad**: saltar al contenido, diálogo con foco/Esc, contraste AA.
- **Datos de proyectos**: los del `prompt.md`; revisa `/Users/zuzo` para versiones actuales antes del lanzamiento.
