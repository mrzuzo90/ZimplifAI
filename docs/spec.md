# ZimplifAI — Spec de diseño y contenido

> Web showroom de ZimplifAI. Objetivo: un visitante debe querer contratar los servicios
> solo por cómo se siente la web. Decisión de producto y copy tomadas con criterio;
> si algo no cuadra, es la primera sección que revisamos.

## 1. Identidad

- **ZimplifAI** es una agencia de implantación de IA (unipersonal, fundada por Zuzo).
- Metáfora rectora: **el sistema eléctrico vivo**. La chispa = simplificar + IA.
- Tono: técnico, claro, sin humo. Primera persona ("no vendo humo, construyo").
- Público: pequeñas/medianas empresas que quieren automatizar sin dependencia de proveedores de "IA mágica".

### Mensajes clave
- Simplifico procesos. Implanto IA.
- Software real, en producción, sin humo.
- El humano: desarrollador senior full-stack **y** electricista certificado (ELEE0109). Dos oficios, un mismo sistema.

## 2. Paleta

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#07080a` | Fondo principal |
| `bg-soft` | `#0c0e12` | Fondos en hover |
| `surface` | `#101319` | Tarjetas |
| `surface-2` | `#171b23` | Tarjetas en hover |
| `line` | `rgba(255,255,255,.08)` | Bordes |
| `line-strong` | `rgba(255,255,255,.16)` | Bordes destacados |
| `ink` | `#e8e6e1` | Texto principal |
| `muted` | `#8b9098` | Texto secundario |
| **`volt`** | `#b9ff2a` | Acento principal (CTA, highlights) |
| **`plasma`** | `#45e5ff` | Acento secundario (conexiones IA) |

- Volt/plasma reservados para **acciones** y **detalles**, nunca para bloques grandes de texto.
- Semánticas de estado (badges): live→volt, wip→ámbar, tests→plasma, open source→morado.

## 3. Tipografía

| Rol | Fuente | Detalle |
|---|---|---|
| Display / titular | **Space Grotesk** (700) | Titulares gigantes uppercase, tracking -0.02..-0.04 |
| Mono / técnica | **JetBrains Mono** | Etiquetas `// 01`, badges, marquee de stack, precios |
| Acento editorial | **Instrument Serif** (400 italic) | Palabras sueltas en titulares ("IA.", "showroom") |

- Titulares en `clamp(3.1rem, 11.5vw, 10.5rem)`, leading 0.9.
- Texto de cuerpo: Space Grotesk 400, muted.
- Cursiva serif = acento, máximo una por titular.

## 4. Layout y grids

- Max-width `7xl` (80rem) con padding lateral `5` (móvil) / `8` (desktop).
- Grid editorial `12` columnas: manifiesto `3/8`, contacto `5/7`, habilidades `4/8`.
- Showroom asimétrico: alterna `7/5` (12 col) en desktop para ritmo editorial.
- Márgenes de sección: `py-28` (móvil) / `py-40` (desktop).
- Cabecera de sección estándar: `SectionLabel` con `// índice · nombre`.

## 5. Motion (diseño)

| Elemento | Efecto |
|---|---|
| Preloader | Contador 0→100, marca letra a letra, salida en guillotina con flash volt. Una vez por sesión. |
| Hero | Campo de partículas canvas2D que reacciona al cursor (constelación + líneas), dos capas de color |
| Titulares | `SplitWords`: reveal palabra a palabra con máscara, stagger 0.055, ease `[0.22,1,0.36,1]` |
| Tarjetas showroom | `Tilt` 3D suave (máx 5°), número serif que se desplaza en hover |
| Botones | `Magnetic` (atracción al cursor) + flecha que se desliza |
| Marquee | Stack infinito, `36–44s` por ciclo, pausa en hover |
| Contadores | Cuentan al entrar en viewport (estadísticas) |
| Globales | Lenis smooth scroll, cursor custom (punto+anillo lag, blend difference), grano fílmico `0.06` |

### Reglas de degradación
- `prefers-reduced-motion: reduce` → sin Lenis, sin partículas, sin marquee, sin cursor custom, preloader instantáneo. Todo el contenido visible igualmente.
- Móvil/táctil → sin cursor custom, partículas con densidad reducida.
- WebGL no requerido (canvas2D): mismo efecto, sin fallos de contexto ni peso de three.js.

## 6. Secciones y copy

### Hero
- Etiqueta: `// zimplifai · agencia de implantación de IA` + `electricista certificado · ELEE0109`.
- Titular: **Simplifico procesos. Implanto IA.**
- Intro: "Soy Zuzo, desarrollador senior full-stack y electricista certificado. ZimplifAI es mi agencia: implanto IA en empresas y construyo software real, en producción, sin humo."
- CTAs: Contratar · Ver proyectos.

### 01 · Manifiesto
- "Construyo software que se usa de verdad. Ahora ayudo a empresas a hacer lo mismo con IA."
- Cierre: "No vendo humo. Construyo, pruebo y publico."
- Stats: nº proyectos reales · en producción · 420+ tests (zCADe) · ELEE0109.

### 02 · Servicios (precios orientativos)
| Servicio | Desde |
|---|---|
| Implantación de IA en empresas | 1.200 € |
| Automatización y agentes a medida | 1.800 € |
| Desarrollo de apps web full-stack | 2.500 € |
| Consultoría técnica · transformación con IA | 400 €/sesión |

### 03 · Proyectos (11, del brief)
Filtros: Todas / Web / IA / Desktop / Open source. Modal con "Qué es", "Qué resuelve", stack, enlace si existe. **Los datos son los del prompt.md; revisar en /Users/zuzo antes del lanzamiento.**

### 04 · Habilidades
Marquee de stack + 4 grupos + destacado ELEE0109.

### 05 · Contacto
Formulario (nombre, email, empresa, mensaje) → Resend. Honeypot anti-spam. Feedback en español. Canales: email + WhatsApp + redes (desde `.env`).

## 7. Formulario (UX)

| Estado | Mensaje |
|---|---|
| Envío | "Enviando…" |
| Éxito | "Recibido. Te respondo en menos de 48h." |
| No configurado | "El formulario aún no está conectado. Escríbeme directamente a {email}." |
| Error | Mensaje específico del servidor, en español. |

## 8. Accesibilidad

- HTML semántico (`section`, `nav`, `main`, `footer`), saltar al contenido.
- Diálogo con `role="dialog"`, `aria-modal`, Esc para cerrar, foco inicial, bloqueo de scroll.
- Botones con `aria-pressed` (filtros), labels asociadas a inputs.
- Contraste: texto principal sobre `#07080a` cumple AA (ink #e8e6e1).
- Todo el motion degrada con `prefers-reduced-motion`.

## 9. Rendimiento objetivo

- First Load JS ≤ 170 kB (actual: **169 kB**).
- Sin librerías de terceros pesadas; partículas en canvas2D; fuentes autoalojadas con `display: swap`.
- API de contacto con validación estricta y fallo controlado.
