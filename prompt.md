🚀 PROMPT DE ARRANQUE — Web de ZimplifAI (showroom awwwards)

Cómo usar: pega TODO este documento como primer mensaje a una sesión nueva de Claude Code, con el directorio de trabajo en /Users/zuzo/ZimplifAI. Está escrito para que la IA que arranca el proyecto lo lea y ejecute el proceso completo sin necesitar nada más de mí. No te detengas a preguntarme nada que puedas decidir tú: usa criterio y buenas prácticas. Si hay una decisión de producto o diseño genuinamente binaria, propón la que creas mejor, justifícala y sigue.

────────────────────────────1. TU MISIÓN EN ESTA SESIÓNEres un equipo de élite de diseño y desarrollo web. Tu misión es crear la web de ZimplifAI desde cero: un showroom de los proyectos y habilidades de Zuzo que tenga efecto wow desde el primer segundo — a la altura de un premio Awwwards en la categoría de tecnología/sites. No es una landing page más: es la carta de presentación de una agencia de implantación de IA que DEMUESTRA su capacidad con su propio diseño. La web en sí misma es la prueba de venta.

Reglas de oro:
- El wow es el producto. Un visitante debe querer contratar los servicios solo por cómo se siente la web.
- Rendimiento impecable. El wow no puede costar performance. Lighthouse90+ en móvil.
- Respeto a prefers-reduced-motion. Todo el motion debe degradar con elegancia.
- Despliega a tus mejores agentes. No hagas todo tú en un solo contexto: usa subagentes especializados (diseño, motion, implementación por secciones, QA) y coordínalos. Trabaja en worktrees/ramas por feature si el repo es git. Sigue el flujo: brainstorming → spec → plan → implementación con revisión.

────────────────────────────2. CONTEXTO — QUIÉN ES ZUZO Y QUÉ ES ZIMPLIFAI- Zuzo es un desarrollador senior full-stack y electricista certificado (ELEE0109). Construye aplicaciones reales en producción con una calidad de diseño y motion muy por encima de la media. No es un estudiante ni un "prompt engineer" — es un ingeniero que ha publicado productos.
- ZimplifAI es su agencia (la marca que ya existe, la que está creando esta web). En la práctica: Zuzo solo + sus agentes de IA (Claude Code). La propuesta de valor: "simplifico procesos e implanto IA en empresas". Está empezando, sin ingresos recurrentes todavía — esta web es la herramienta para conseguirlos, así que debe convertir visitantes en leads (formulario de contacto, email, WhatsApp).
- ZimplifAI es la casa; debajo cuelgan los proyectos de Zuzo como hijos. La web debe presentar la agencia (servicios) y, a la vez, el showroom (proyectos que demuestran que sabe hacer lo que vende).

Identidad: ZimplifAI tiene identidad visual propia (no reutilices la marca de Merchandeando). Dirección de partida: "simplificar" + "IA". Dark mode como base, tipografía display con personalidad, acento vibrante (eléctrico o fosforescente), estética tech-premium que transmite inteligencia y confianza. Puedes proponer algo mejor en la spec de diseño — esta es una dirección, no un corsé.

────────────────────────────3. LA WEB — VISIÓN Y REQUISITOS3.1. Efecto wow (lo que un jurado de Awwwards miraría)
- Preloader de marca con animación de salida (una vez por sesión), a la altura del proyecto Merchandeando (referencia: /Users/zuzo/Merchandeando/components/motion/Preloader.tsx).
- Hero espectacular: tipografía gigante con reveal por líneas/palabras, y un elemento de fondo con vida — WebGL/canvas interactivo (partículas, malla, o campo de puntos que reacciona al cursor), o una grid/fondo geométrico animado. Debe sentirse "IA en movimiento".
- Smooth scroll (Lenis) + cursor personalizado + transición de página en guillotina o s
- Microinteracciones por todas partes: hover con Tilt en tarjetas, texto con efecto machine/gradient, marquee infinito (nombres de tecnologías o palabras clave), números que cuentan al entrar en
viewport, revelados con máscara de recorte y parallax.
- Grano/noise sutil sobre la interfaz para el acabado cinematográfico.
- Layout editorial: grid asimétrico, secciones con jerarquía audaz, espacio en blanco dla de SaaS genérica.
- Etiquetas técnicas en monoespaciada (ej. // zimplifai · agencia-ia) como detalle de marca, estilo corner-label.

3.2. Páginas / secciones1. Hero — "ZimplifAI — Simplifico procesos. Implanto IA." + CTA (Contratar / Ver proyectos) + el fondo animado.
2. Manifiesto / Quién es — presentación humana de Zuzo (dev senior + electricista ELEE0ctos). Texto en primera persona, honesto, con gancho. Incluye el dato de los X proyectosreales en producción.
3. Servicios (lo que ZimplifAI vende) — con precios orientativos o "desde":
 - Implantación de IA en empresas (diagnóstico → automatización).
 - Automatización de procesos y agentes de IA a medida.
 - Desarrollo de aplicaciones web full-stack.
 - Consultoría técnica / transformación con IA.
 (los precios exactos los propone la spec; el tono: claro, sin humo)
4. Showroom de proyectos — la sección estrella. Tarjetas/casos de estudio de los proyec), con filtro por categoría si aporta, hover con tilt + datos técnicos. Cada uno con "qué es, qué resuelve, stack, estado". Idealmente un modal o página de detalle.
5. Habilidades / stack — visual atractivo (listas animadas, marquee, o gráfico). TypeSc.js, Tauri, Konva, Supabase, Postgres/Prisma, MongoDB, Stripe, WebSockets, OCR, LLMs(OpenAI/Claude), automatización y agentes de IA, + el dato único: electricidad certificada.
6. Contacto — formulario con envío real (ver backend) + email + WhatsApp + redes. CTA cicar tu empresa".
7. Footer con detalle de marca + colofón.

3.3. Proyectos reales para el showroom (contenido a pulir en la spec)
Usa estos datos reales. No inventes características:

| Proyecto | Qué es | Stack | Estado |
|---|---|---|---|
| ElektriZIA | Suite web para instaladores eléctricos: previsión de cargas (ITC-BT), MTos, asistente REBT IA | TanStack Start, Supabase, jspdf/pdf-lib | En producción —elektrizia.com |
| zCADe | Suite de esquemas y simulación industriales (sucesor de CADe SIMU):69 símboloRC | Tauri2, React, Konva, TS | Fase A completa,420+ tests |
| ElektriKOP | Emulador educativo de PLC (lógica de escalera) con Modo Desafío | React | Open source — kop.elektrizia.com |
| VerifAI | Motor de procesamiento KYC/KYB: corrección de datos, transliteración, reglaress/Mongo, OpenAI GPT-4o |60+ tests,90% coverage |
| Klasyfi | API de procesamiento de documentos financieros: OCR local, cola asíncrona, on-premise | Fastify, Postgres, Redis/BullMQ, Tesseract | Producción (API en Render) |
| WASAP | Reclutador de IA: entrevista por chat, informe con score y red flags, anti pr | MVP — wasap.es |
| pixel-agents | Visualizador de agentes de Claude Code como oficina pixel-art; harness de tests determinista | Monorepo Fastify + VS Code + React | Open source |
| zopify | Plataforma multi-tenant tipo Shopify: subdominios, Stripe Connect, RLS | Nexkeleton validado |
| Merchandeando | Tienda print-on-demand real con checkout Stripe, tema y motion de marca | Next.js, Prisma, Stripe | En producción |
| tcgscan | Escáner OCR de cartas TCG con inventario e integración Cardmarket | NestJS
| AInfluencer | Motor autónomo de contenido con IA (noticias→vídeo→publicación→telegram) | (definir) | Código completo |

(Si en la sesión encuentras versiones más actuales de estos datos en las carpetas de /Users/zuzo, úsalos.)

3.4. Contenido y copy- Idioma: español por defecto. i18n ES/EN como P1 si el tiempo lo permite (no bloquea el lanzamiento).
- Tono del copy: directo, cercano, sin humo de agencia. Primera persona en la sección d cuidado.
- SEO básico: title/meta/og/JSON-LD de persona/agencia, sitemap, robots.

────────────────────────────4. STACK TÉCNICOUsa el stack que mejor cumpla el objetivo (justifica si cambias algo):
- Next.js15 (App Router) + React19 + TypeScript.
- Tailwind CSS v4 (estilo similar a /Users/zuzo/Merchandeando/app/globals.css con @theme).
- framer-motion para el motion de componentes.
- Lenis para smooth scroll.
- WebGL/three.js (o react-three-fiber) para el fondo del hero — con fallback a canvas2Dl lo exige.
- Hosting: Vercel (sin coste). Variables de entorno para contacto/analytics.
- Formulario de contacto: algo sin servidor propio — Resend (email) u opción equivalent de errores en español sin romper la página (referencia del patrón:/Users/zuzo/Merchandeando/lib/checkout/actions.ts — fallo controlado, mensaje claro, sin crash).
- Analytics: opt-in, sin depender de terceros pesados.

Rendimiento: imágenes optimizadas (next/image), tipografía con next/font (variable, sinimo, lazy-load de three.js y de las secciones que no se ven al cargar.

────────────────────────────5. PROCESO DE TRABAJO (obligatorio)

1. Brainstorming — explora, propón2–3 direcciones de diseño/identidad (paleta, tipografige/justifica una. Revisa como referencia de calidad y estándar de motion/Users/zuzo/Merchandeando/components/motion/ y /Users/zuzo/Merchandeando/theme/ (NO copies — usa su nivel como baremo; prefers-reduced-motion, piezas con responsabilidad única).
2. Spec — escribe una spec de diseño en docs/spec.md: identidad, paleta, tipografías, g, copy por sección.
3. Plan — plan de implementación por fases con archivos a crear y criterios de terminado.
4. Implementación con subagentes — divide el trabajo (hero/motion, showroom, resto de sA) y lánzalos en paralelo cuando no haya dependencias. Despliega a tus mejores agentespara cada pieza.
5. Revisión final — revisa el resultado completo: motion, responsive (móvil/tablero/escesibilidad, copy, SEO. Corrige lo que falle.
6. Deploy — desplegar en Vercel y dejarlo funcionando. Reporta la URL.

────────────────────────────6. CRITERIOS DE ACEPTACIÓN (todo debe cumplirse)

- [ ] La web carga y se ve impecable en móvil y escritorio.
- [ ] El hero produce "wow" en los primeros2 segundos (preloader + entrada).
- [ ] Todos los proyectos del showroom tienen tarjeta con datos reales y microinteracción.
- [ ] Formulario de contacto funcional con feedback en español.
- [ ] npm run build pasa sin errores y npm run lint limpio (configura ESLint si no existe).
- [ ] Lighthouse móvil ≥90 en Performance/Accessibility/Best Practices/SEO.
- [ ] prefers-reduced-motion respetado.
- [ ] SEO base (meta, og, sitemap, robots).
- [ ] El proyecto tiene README.md breve con cómo arrancar (npm run dev) y cómo desplegar.

────────────────────────────7. QUÉ NO HACER- No uses plantillas compradas ni frameworks de "landing builder".
- No instales dependencias innecesarias o pesadas.
- No dejes la web en un estado "casi": si algo queda pendiente, lista explícitamente qué falta y por qué, antes de dar por terminada la sesión.
- No inventes URLs, clientes ni resultados de proyectos. Todo lo mostrado debe ser real/roadmap.

────────────────────────────Empieza. Presenta primero tu dirección creativa en5 líneas,, y ejecuta. Cuando termines, entrega: la URL desplegada, un resumen de lo construido, ylos pendientes si los hay.
