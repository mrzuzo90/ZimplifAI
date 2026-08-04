# ZimplifAI — Plan de implementación y estado

## Fases (orden de ejecución)

| # | Fase | Estado |
|---|---|---|
| 1 | Scaffold (config, env, gitignore, `.npmrc`) | ✅ |
| 2 | Design system (globals.css, tokens, utilidades) | ✅ |
| 3 | Capa de datos (projects, site) | ✅ |
| 4 | Providers y primitivas de motion (Lenis, Reveal, SplitWords, Counter, Marquee, Tilt, Magnetic) | ✅ |
| 5 | Chrome (Preloader, CustomCursor, Grain, Nav, Analytics) | ✅ |
| 6 | Hero (partículas) + Manifiesto + Servicios | ✅ |
| 7 | Showroom (tarjetas, filtro, modal) | ✅ |
| 8 | Skills, Contact, Footer, API de contacto | ✅ |
| 9 | SEO (metadata, JSON-LD, sitemap, robots, iconos, OG) | ✅ |
| 10 | Docs (spec, plan, README) + revisión final | 🔄 |

## Archivos clave

```
app/
  layout.tsx          metadata + JSON-LD + providers + chrome + skip link
  page.tsx            composición de secciones
  globals.css         tokens Tailwind v4, keyframes, reduced-motion
  api/contact/route.ts  formulario → Resend (validación + fallback)
  sitemap.ts / robots.ts / not-found.tsx / icon.svg
  public/og.svg
components/
  providers.tsx       SmoothScrollProvider (Lenis) + MotionConfig
  Preloader / CustomCursor / GrainOverlay / Analytics / Nav / Footer
  Hero / Manifesto / Services / Showroom / Skills / Contact
  ProjectCard / ProjectModal / ParticleField
  motion/  Reveal · SplitWords · Counter · Marquee · Tilt · Magnetic
  ui/      Button · MonoTag · SectionLabel
data/
  projects.ts         11 proyectos del brief
  site.ts             identidad (email, WhatsApp, redes desde .env)
lib/
  cn.ts · motion.ts · site.ts
```

## Verificación (ejecutada)

| Check | Comando | Resultado |
|---|---|---|
| Build de producción | `npm run build` | ✅ sin errores (15.5.22) |
| Lint | `npm run lint` | ✅ 0 problemas |
| Typecheck | `npm run typecheck` | ✅ sin errores |
| Render en producción | `next start` + curl | ✅ 200, título, JSON-LD, secciones, fuentes |
| API contacto sin config | `POST /api/contact` | ✅ 503 "no configurado" (fallback controlado) |
| API validación | `POST /api/contact` datos vacíos | ✅ 400 en español |

## Pendiente (requiere credenciales humanas)

1. **Resend**: rellenar `RESEND_API_KEY`, `CONTACT_EMAIL` (y `RESEND_FROM` si hay dominio verificado) en `.env.local`.
2. **Datos personales**: `NEXT_PUBLIC_WHATSAPP`, `NEXT_PUBLIC_GITHUB`, `NEXT_PUBLIC_LINKEDIN`, `NEXT_PUBLIC_X`, `NEXT_PUBLIC_CONTACT_EMAIL`.
3. **Revisión de datos de proyectos** en `/Users/zuzo` (descripciones/estados más actuales).
4. **Dominio**: sustituir `NEXT_PUBLIC_SITE_URL` y metadataBase.
5. **Despliegue**: `vercel` (o `vercel --prod`).
6. **Lighthouse real** en producción (objetivo ≥90 móvil). El diseño está orientado a ello (JS 169 kB, sin three.js), pero hay que medirlo en Vercel.

## Notas técnicas

- `~/.npmrc` global de la máquina tiene `omit=dev`; el `.npmrc` del proyecto lo anula con `include=dev` (imprescindible para build).
- Se eligió **canvas2D** para el hero en lugar de three.js: mismo efecto visual, sin contexto WebGL ni binarios nativos → build fiable y bundle ligero. Swappable a three.js sin cambiar la API del componente.
- Mismo motivo: Resend vía `fetch` directo (sin SDK) → una dependencia menos.
