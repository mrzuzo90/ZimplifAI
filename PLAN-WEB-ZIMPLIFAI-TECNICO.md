# 🛠️ PLAN TÉCNICO DE APOYO — Web de ZimplifAI (showroom awwwards)

> **Documento complementario a `prompt.md`** (el prompt es la fuente de verdad de la sesión).
> Este plan acelera las decisiones técnicas, aporta el inventario verificado de proyectos y el checklist de cierre. Se escribió mientras la sesión de implementación ya trabajaba en el repo — si algo se desfasa, lo que manda es el estado real del código.

---

## 0. Estado verificado del proyecto (04-08-2026, ~18:20)

**Ya existe (creado por la sesión):**
- Scaffolding **Next.js 15 App Router + React 19 + TS + Tailwind v4**. Gestor: **npm** (`package-lock.json`; aquí NO usar bun, aunque el resto de proyectos sí).
- Dependencias: `framer-motion ^12`, `lenis ^1.1`, `@vercel/analytics`. Scripts: `dev / build / start / lint / typecheck`.
- `app/globals.css` (tema con `@theme`), `components/providers.tsx`, `lib/` (`cn`, `motion`, `site`).
- Piezas de motion reutilizables: `Counter`, `Magnetic`, `Marquee`, `Reveal`, `SplitWords`, `Tilt`.
- UI base: `Button`, `MonoTag`, `SectionLabel`.
- `data/projects.ts` (los **11 proyectos reales**, bien tipados) y `data/site.ts` (identidad, contactos vía `NEXT_PUBLIC_*`).
- `.env.example` completo: Resend (email), `CONTACT_EMAIL`, WhatsApp, redes, analytics opt-in, `NEXT_PUBLIC_SITE_URL`.

**Falta construir (el grueso del wow):**
- `app/layout.tsx` y `app/page.tsx` — **aún no hay home**.
- Preloader de marca (una vez por sesión).
- Hero con fondo en movimiento: **three.js NO está instalado** → no hay fondo WebGL todavía.
- Cursor personalizado, config de Lenis, transición de página en guillotina.
- Secciones: manifiesto, servicios, showroom (tarjetas + detalle), habilidades, contacto (formulario con Resend), footer.
- SEO (metadata/og/JSON-LD, `sitemap.ts`, `robots.ts`) y `next/font`.

---

## 1. Decisiones técnicas anticipadas

### 1.1. El wow (prioridad absoluta)
- **Preloader**: una vez por sesión, con salida en máscara/guillotina. Referencia de nivel: `Merchandeando/components/motion/Preloader.tsx` (usar su calidad como baremo, no copiar).
- **Hero**: tipografía display gigante con `SplitWords` (ya existe) + fondo animado.
  - Fondo **three.js** (partículas/malla que reacciona al cursor) con **fallback a canvas2D** si el rendimiento o el build lo exigen — el prompt ya lo permite.
  - **Carga diferida obligatoria**: importar three.js con `dynamic(() => import(...))` (sin SSR) y arrancar tras el preloader o al entrar el hero en viewport. Protege LCP y Lighthouse.
- **Smooth scroll**: Lenis + sync con framer-motion (librería `lenis/react` o hook propio con `requestAnimationFrame`). En móvil, considerar Lenis desactivado o con orientación nativa — el scroll nativo debe sentirse bien.
- **Cursor personalizado**: solo con `pointer: fine` (nunca en táctil); los elementos interactivos siguen siendo accesibles con el cursor nativo y por teclado.
- **Transición de página en guillotina**: con App Router, la vía limpia es un `app/template.tsx` (se re-renderiza en cada navegación) o `AnimatePresence` a nivel de página si se decide SPA. Coste a evaluar: si rompe el scroll o el SEO, simplificar a transición de entrada.
- **Grano/noise**: un SVG/PNG de baja opacidad fijo con `mix-blend-mode` sobre toda la UI — barato y cinematográfico.
- Reutilizar `Marquee`, `Counter`, `Tilt`, `Magnetic`, `Reveal` ya creados — no duplicarlos.

### 1.2. Rendimiento (bloqueante)
- `next/font` (variable, `display: swap`, sin descargas externas de Google Fonts).
- `next/image` para todo raster; el noise y los iconos, inline o SVG.
- Lazy-load de secciones bajo el fold (`dynamic import` + IntersectionObserver).
- El hero WebGL debe mantener 60 fps en móvil: densidad de partículas reducida en viewport pequeño (`matchMedia`) y **estático si `prefers-reduced-motion`**.

### 1.3. Accesibilidad
- `prefers-reduced-motion` como norma transversal: los `SplitWords`, parallax y marquees degradan a fades simples; los contadores muestran el valor final.
- Contraste AA del acento vibrante sobre dark, sobre todo con el noise encima.
- Formulario accesible (labels, `aria-invalid`, estados disabled/error claros en español).

---

## 2. Showroom — inventario verificado

Los datos de `data/projects.ts` coinciden con lo que he podido verificar en disco (`klasyfi.md`, `VerifAI.md`, `wasap.md`, `elektrizia/CLAUDE.md`). Para la spec/estadísticas:

- **Stats del manifiesto**: "**11 proyectos · 3 en producción**" (`liveCount` ya calcula los `live`: ElektriZIA, Klasyfi, Merchandeando).
- Cada tarjeta debe mostrar: *qué es · qué resuelve · stack · estado*. No inventar métricas ni resultados.
- **Lagunas a pulir antes del lanzamiento** (datos reales existentes en `/Users/zuzo`):
  - Klasyfi: añadir URL de la API en producción (`https://klasyfi-api.onrender.com/api/v1/health` está viva).
  - VerifAI / zCADe: falta URL pública o repo; si no existe, dejar el campo `url` vacío (el componente ya lo tolera).
  - `status` de ElektriKOP y pixel-agents: son open source — enlazar a su repo real si es público.
- **Casos reales en disco que NO están en el showroom** (opcional, si se quieren más): `sumsub-fixer`, `nycrist`, `managerIA`, `cpsumsubnode`. Añadirlos solo con sus datos reales; si no aportan, mantener los 11 del brief.

---

## 3. Contacto (Resend)

- **Route handler** `app/api/contact/route.ts` (POST) → Resend (`resend` npm). Validación con zod, feedback en español, sin página blanca (patrón de fallo controlado: `Merchandeando/lib/checkout/actions.ts` como referencia de calidad).
- Variables: `RESEND_API_KEY`, `CONTACT_EMAIL`, `RESEND_FROM`. Mientras no se verifique dominio en Resend, `RESEND_FROM` usa `"ZimplifAI <onboarding@resend.dev>"` (ya está en `.env.example`).
- Plan free de Resend (100 emails/día) sobra al inicio. Probar el flujo end-to-end antes del deploy.

---

## 4. SEO

- `app/layout.tsx`: `metadata` estática (title, description, `openGraph`, `twitter`) + **JSON-LD** de persona/agencia en la home.
- `app/sitemap.ts` + `app/robots.ts` (file-based de Next.js).
- `NEXT_PUBLIC_SITE_URL` para URLs absolutas en og.

---

## 5. Riesgos anticipados

1. **three.js engorda el bundle** (~100-150 KB gz). Si Lighthouse lo castiga, solución primaria con **canvas2D** (partículas con `requestAnimationFrame`) es igualmente válida y mucho más ligera.
2. **Lenis + App Router**: en navegaciones el scroll debe reiniciarse y los anclajes seguir funcionando. Probar a fondo en la revisión.
3. **Sesión en curso**: este documento refleja el repo a las 18:20; si la sesión ya construyó más, lo que manda es el código.
4. **Formulario en producción**: verificar que Resend acepta el `from` configurado y que el mensaje llega; fallo controlado en español si la clave no está.
5. **prefers-reduced-motion** es criterio de aceptación: revisar componente por componente, no asumirlo.

---

## 6. Checklist de cierre (verificación final de la sesión)

- [ ] `npm run build` y `npm run lint` limpios.
- [ ] Lighthouse móvil ≥90 en Performance / Accessibility / Best Practices / SEO.
- [ ] Wow en los primeros 2 segundos (preloader + entrada del hero).
- [ ] Showroom: 11 tarjetas con datos reales y microinteracción; detalle/modal si se construyó.
- [ ] Formulario de contacto envía un email real (probado).
- [ ] `prefers-reduced-motion` respetado en toda la web.
- [ ] Responsive móvil / tablet / escritorio revisado (el hero y el marquee son los puntos más frágiles).
- [ ] SEO base + sitemap + robots + og verificados.
- [ ] README breve (`npm run dev`, cómo desplegar).
- [ ] Deploy en Vercel y URL reportada.
