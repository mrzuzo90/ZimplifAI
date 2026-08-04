# ZimplifAI — Web Showroom

## Estado actual (2026-08-04)

**Proyecto:** Web showroom de ZimplifAI (agencia de implantación de IA)
**Stack:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + framer-motion + Lenis
**Repo:** https://github.com/mrzuzo90/ZimplifAI (main branch, clean)

---

## ✅ Completado

### Estructura y configuración
- Scaffolding Next.js 15 completo con npm (package-lock.json)
- `app/globals.css` — Design tokens con `@theme` (volt/plasma, fuentes, animaciones)
- `app/layout.tsx` — SEO completo (metadata, OG, Twitter, JSON-LD Person/Organization), fuentes `next/font`, providers
- `app/page.tsx` — Home componiendo todas las secciones
- `app/api/contact/route.ts` — API Resend con validación robusta, honeypot, fallo elegante (503 si no configurado)
- `app/sitemap.ts` + `app/robots.ts` — SEO técnico
- `.env.example` completo con todas las variables documentadas

### Componentes principales
| Componente | Archivo | Detalles |
|------------|---------|----------|
| **Preloader** | `components/Preloader.tsx` | Sesión única, contador 000→100%, letras caen, salida guillotina (volt), `prefers-reduced-motion` |
| **Hero** | `components/Hero.tsx` | SplitWords gigante, ParticleField (canvas2D), botones CTA con smooth scroll |
| **ParticleField** | `components/ParticleField.tsx` | Constelación reactiva al cursor, 2 capas color, parallax, 60fps móvil |
| **CustomCursor** | `components/CustomCursor.tsx` | Punto + anillo con lag, solo `pointer: fine`, `mix-blend-difference` |
| **GrainOverlay** | `components/GrainOverlay.tsx` | Noise cinematográfico CSS puro, `animate-grain` |
| **Nav** | `components/Nav.tsx` | Fija, blur al scroll, burger móvil animado, scroll suave |
| **Manifiesto** | `components/Manifesto.tsx` | Texto + 4 stats con Counter animado (11 proyectos, 3 live, 420+ tests, ELEE0109) |
| **Servicios** | `components/Services.tsx` | 4 tarjetas con Tilt, precios, botón → contacto |
| **Showroom** | `components/Showroom.tsx` | 11 proyectos, filtros (Todas/Web/IA/Desktop/OSS), layout asimétrico 7/5, modal accesible |
| **ProjectCard** | `components/ProjectCard.tsx` | Tilt, badge categoría/estado, letra inicial gigante, hover details |
| **ProjectModal** | `components/ProjectModal.tsx` | Diálogo accesible (Esc, foco, backdrop), datos completos, CTA visitar/contactar |
| **Habilidades** | `components/Skills.tsx` | Marquee infinito stack + 4 grupos skills, dato único certificación |
| **Contacto** | `components/Contact.tsx` | Formulario validado, estados idle/sending/success/error/not-configured, honeypot |
| **Footer** | `components/Footer.tsx` | Marca gigante clicable ↑, nav, copyright, "Built with Claude Code" |

### Motion primitives (reutilizables)
- `components/motion/Reveal.tsx` — Clip-path reveal con stagger
- `components/motion/SplitWords.tsx` — Palabra a palabra con máscara
- `components/motion/Counter.tsx` — Cuenta al entrar en viewport (sin re-renders)
- `components/motion/Marquee.tsx` — Loop infinito CSS, pauseOnHover
- `components/motion/Magnetic.tsx` — Atracción cursor con spring
- `components/motion/Tilt.tsx` — Tilt 3D con spring, perspective

### UI base
- `Button` (primary/ghost, Magnetic, flecha hover)
- `MonoTag` (default/volt/plasma)
- `SectionLabel` (número + label)

### Datos
- `data/projects.ts` — 11 proyectos reales tipados (del prompt.md), `liveCount` calculado
- `data/site.ts` — Identidad, contactos vía `NEXT_PUBLIC_*`, autor (Zuzo, ELEE0109)

### Calidad
- `prefers-reduced-motion` respetado en TODOS los componentes animados
- Accesibilidad: skip link, focus-visible, aria-labels, modales con trap focus, labels en formulario
- Contraste AA (volt sobre dark con noise)
- First Load JS ~169 kB (hero canvas2D, sin three.js)

---

## 🔧 Pendientes / Por mejorar

1. **URLs faltantes en proyectos** (`data/projects.ts`): zCADe, VerifAI, pixel-agents, zopify, tcgscan, AInfluencer — revisar `/Users/zuzo` para versiones actuales
2. **Deploy Vercel** — Repo listo, falta conectar en dashboard y añadir env vars
3. **Variables de entorno producción** — `RESEND_API_KEY`, `CONTACT_EMAIL` mínimas para formulario
4. **Lighthouse móvil ≥90** — Verificar tras deploy
5. **Dominio propio** — Actualizar `NEXT_PUBLIC_SITE_URL` cuando se tenga

---

## Comandos útiles

```bash
npm run dev        # http://localhost:3000
npm run build      # Build producción
npm run start      # Sirve build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

---

## Notas para nueva sesión

- El código está **completo y funcional** — no hay lugar a "continuar implementando"
- El repo está **limpio** (working tree clean) y **pusheado a GitHub**
- Si se pide "ver la web", ejecutar `npm run dev` y abrir localhost:3000
- Si se pide "deploy", usar Vercel dashboard o `vercel --prod` con env vars configuradas
- Los datos de proyectos son **reales** (del brief) — no inventar métricas
- `prefers-reduced-motion` es **criterio de aceptación** — revisar componente a componente