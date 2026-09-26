import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import { site } from "@/data/site";
import { MonoTag } from "@/components/ui/MonoTag";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Auditoría GEO para Restaurantes y Hoteles · Diagnóstico en ChatGPT, Perplexity y Gemini",
  description:
    "Auditoría GEO accionable para hostelería: análisis de 8 consultas reales en ChatGPT, Perplexity y Gemini, fuentes citadas, consistencia en Google y 3 acciones priorizadas. Sin promesas de rankings ni humo.",
  alternates: {
    canonical: `${siteUrl}/auditoria-geo-hosteleria`,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: `${siteUrl}/auditoria-geo-hosteleria`,
    siteName: site.name,
    title: "Auditoría GEO para Restaurantes y Hoteles · ZimplifAI",
    description:
      "Descubre qué dicen los motores de IA generativa de tu restaurante u hotel. Análisis de 8 consultas reales, fuentes citadas y 3 acciones priorizadas.",
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Auditoría GEO para Hostelería y Hoteles · ZimplifAI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Auditoría GEO para Restaurantes y Hoteles · ZimplifAI",
    description:
      "Análisis de 8 consultas reales en ChatGPT, Perplexity y Gemini para hostelería. Fuentes citadas, consistencia y 3 acciones priorizadas.",
    images: [`${siteUrl}/opengraph-image`],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Auditoría GEO para Restaurantes y Hoteles",
  description:
    "Auditoría técnica e independiente de visibilidad en motores de IA generativa (ChatGPT, Perplexity y Gemini) para hostelería. Análisis de 8 consultas reales, fuentes citadas, ficha Google y 3 acciones priorizadas.",
  provider: {
    "@type": "ProfessionalService",
    "@id": `${siteUrl}/#organization`,
    name: site.name,
    url: siteUrl,
  },
  areaServed: "ES",
  audience: {
    "@type": "Audience",
    audienceType: "Restaurantes, grupos gastronómicos, bares y hoteles independientes",
  },
};

const CONSULTAS_EJEMPLO = [
  {
    motor: "ChatGPT (Search)",
    tag: "OpenAI",
    estado: "Datos incompletos",
    color: "text-amber-400 border-amber-400/30 bg-amber-400/10",
    detalle:
      "Cita un agregador con precios de 2022 y omite el servicio de terraza reformada. Ante preguntas de grupos, sugiere a dos competidores directos.",
  },
  {
    motor: "Perplexity AI",
    tag: "Web Crawl",
    estado: "Discrepancia crítica",
    color: "text-red-400 border-red-400/30 bg-red-400/10",
    detalle:
      "Extrae un PDF antiguo de carta encontrado en un blog de viajes y avisa erróneamente de que el local cierra los domingos noche.",
  },
  {
    motor: "Google Gemini",
    tag: "Knowledge Graph",
    estado: "Falta estructuración",
    color: "text-plasma border-plasma/30 bg-plasma/10",
    detalle:
      "Sincroniza la ficha de Google Maps, pero carece de atributos Schema de alérgenos y reservas directas, relegando el negocio a tercera opción.",
  },
];

const ENTREGABLES = [
  {
    num: "01",
    titulo: "Análisis de 8 consultas reales en ChatGPT, Perplexity y Gemini",
    subtitulo: "Evaluación en paralelo en los 3 grandes motores del mercado",
    descripcion:
      "Diseñamos contigo 8 consultas con intención de reserva real adaptadas a tu zona, tipo de cocina o perfil de alojamiento. Ejecutamos cada consulta en ChatGPT (OpenAI), Perplexity y Gemini, registrando si tu establecimiento aparece, con qué adjetivos te describe y qué alternativas de tu competencia sugiere antes.",
  },
  {
    num: "02",
    titulo: "Mapeo exhaustivo de fuentes citadas (Grounding)",
    subtitulo: "Descubre exactamente de dónde sacan la información",
    descripcion:
      "Los LLMs no inventan en el vacío: consultan URLs concretas. Mapeamos qué portales, agregadores (TripAdvisor, TheFork, Yelp), guías turísticas o artículos de prensa están alimentando sus respuestas y destapamos inconsistencias de cartas, teléfonos o servicios obsoletos.",
  },
  {
    num: "03",
    titulo: "Auditoría de Ficha Google, directorios y reseñas",
    subtitulo: "Coherencia NAP y análisis del sentimiento que absorbe la IA",
    descripcion:
      "Revisamos tu perfil de Google Business Profile (categorías primarias, secundarias, atributos y fotos) y la consistencia NAP (Nombre, Dirección, Teléfono) en los principales directorios de hostelería. Analizamos el corpus de reseñas para identificar los términos que los motores sintetizan al resumirte.",
  },
  {
    num: "04",
    titulo: "Informe técnico y ejecutivo fechado",
    subtitulo: "Evidencia congelada en el tiempo para seguimiento real",
    descripcion:
      "Dado que los modelos y los rastreos web cambian periódicamente, te entregamos un informe con fecha y hora exacta de extracción, capturas de pantalla de cada respuesta y registro literal de las fuentes citadas. Una línea base auditable para contrastar mejoras futuras.",
  },
  {
    num: "05",
    titulo: "3 acciones priorizadas de impacto directo",
    subtitulo: "Sin listas infinitas: solo lo que mueve la aguja",
    descripcion:
      "No entregamos un PDF de 90 páginas para archivar en un cajón. Te damos exactamente tres intervenciones técnicas y operativas ordenadas por impacto y viabilidad (por ejemplo: corregir datos en la fuente raíz conflictiva, estructurar Schema.org en tu web y actualizar atributos clave en Google).",
  },
];

const LIMITES = [
  {
    titulo: "Sin rankings garantizados",
    descripcion:
      "Los modelos de lenguaje son probabilísticos y no deterministas. Dos usuarios con historiales o ubicaciones distintas pueden recibir respuestas diferentes. No existe la «posición 1 garantizada en ChatGPT» y nadie honesto puede prometerla.",
  },
  {
    titulo: "Sin indexación forzada ni tráfico prometido",
    descripcion:
      "No controlamos los rastreadores de OpenAI, Google ni Perplexity. Tener los datos limpios y coherentes maximiza la probabilidad de ser citado sin errores, pero no garantizamos un volumen fijo de visitas ni reservas.",
  },
  {
    titulo: "Sin causalidad mágica ni atajos",
    descripcion:
      "La optimización GEO garantiza que los motores cuenten con la información correcta. Sin embargo, no sustituye la reputación real del negocio, la calidad gastronómica, el servicio en sala ni la experiencia del cliente.",
  },
  {
    titulo: "Sin productos de audio ni testimonios falsos",
    descripcion:
      "No vendemos centralitas con voz sintética, grabaciones invasivas ni bots de llamadas telefónicas. Y no inventamos testimonios ficticios de clientes: analizamos tu establecimiento con rigor empírico.",
  },
];

const PILOTO_PASOS = [
  {
    fase: "Paso 1",
    titulo: "Selección de 10 a 15 referencias críticas",
    detalle:
      "Identificamos los artículos indispensables cuya falta bloquea el servicio o reduce el ticket medio (aceites, cortes de carne/pescado estrella, vinos clave, panadería, consumibles).",
  },
  {
    fase: "Paso 2",
    titulo: "Cálculo de umbrales y consumos",
    detalle:
      "Definimos los puntos de reorden según históricos de demanda y previsiones de fin de semana para no pedir de más ni quedarnos cortos.",
  },
  {
    fase: "Paso 3",
    titulo: "Generación automática del borrador de pedido",
    detalle:
      "El sistema calcula las necesidades y redacta el borrador exacto con proveedor, unidades y formato comercial, ahorrando tiempo de cálculo a mano a medianoche.",
  },
  {
    fase: "Paso 4",
    titulo: "Aprobación humana obligatoria (Human-in-the-loop)",
    detalle:
      "El jefe de cocina, metre o gerente recibe el borrador en su móvil (vía WhatsApp o email). Revisa en 10 segundos, ajusta una cantidad si lo considera y pulsa «Aprobar».",
  },
  {
    fase: "Paso 5",
    titulo: "Envío seguro y trazabilidad",
    detalle:
      "Solo tras el clic humano el pedido sale hacia el proveedor y queda archivado en el histórico. Cero compras automáticas descontroladas; control presupuestario absoluto.",
  },
];

const FAQS = [
  {
    q: "¿Por qué evaluar 8 consultas y no un número mayor?",
    a: "Porque en hostelería local, 8 consultas bien diseñadas cubren todo el espectro de decisión del comensal o huésped: desde búsquedas exploratorias de zona hasta consultas específicas de tipo de producto, terraza, eventos, dietas especiales o viajes de trabajo. Probar más consultas redundantes encarece el servicio sin aportar más claridad accionable.",
  },
  {
    q: "¿En qué se diferencia la auditoría GEO del SEO local tradicional?",
    a: "El SEO local tradicional optimiza para aparecer en una lista de resultados de Google Maps. La auditoría GEO (Generative Engine Optimization) analiza cómo los modelos de IA sintetizan, resumen y recomiendan tu negocio en una conversación en lenguaje natural, destapando las fuentes de las que beben (Perplexity, ChatGPT, Gemini) y detectando alucinaciones o datos desfasados.",
  },
  {
    q: "¿Cuánto tiempo requiere y qué tiene que hacer mi equipo?",
    a: "Solo necesitamos una llamada inicial de 30 minutos para recoger datos clave de tu establecimiento (carta, horarios, canales de reserva, competidores de referencia). En un plazo de 3 a 5 días laborables realizamos el análisis técnico y agendamos una sesión de entrega de 30 minutos con el informe fechado y las 3 acciones priorizadas.",
  },
  {
    q: "¿Tengo que instalar algún software en mi TPV o en mi web?",
    a: "No. La auditoría GEO es un diagnóstico 100% externo y no invasivo. No requiere accesos a tus servidores ni tocar tus sistemas de facturación o TPV.",
  },
  {
    q: "¿Qué relación tiene con el piloto de stock crítico?",
    a: "La auditoría GEO resuelve la visibilidad externa hacia los clientes. El piloto de stock crítico es una solución operativa interna para restaurantes y hoteles que sufren roturas de producto en días clave. Lo ofrecemos como piloto complementario para negocios que buscan automatizaciones pragmáticas con estricto control humano.",
  },
];

export default function AuditoriaGeoHosteleriaPage() {
  return (
    <div className="relative pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Resplandor ambiental de fondo */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-full max-w-7xl -translate-x-1/2 opacity-25"
        style={{
          background:
            "radial-gradient(circle at 50% 25%, rgba(206, 255, 0, 0.12), transparent 70%), radial-gradient(circle at 75% 40%, rgba(69, 229, 255, 0.08), transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Migas de pan */}
        <nav
          aria-label="Migas de pan"
          className="mb-8 font-mono text-xs uppercase tracking-[0.16em] text-muted md:mb-12"
        >
          <Link href="/" className="transition-colors hover:text-volt">
            Inicio
          </Link>
          <span aria-hidden="true" className="mx-2 text-line-strong">
            /
          </span>
          <Link href="/#servicios" className="transition-colors hover:text-volt">
            Servicios
          </Link>
          <span aria-hidden="true" className="mx-2 text-line-strong">
            /
          </span>
          <span aria-current="page" className="text-ink">
            Auditoría GEO Hostelería
          </span>
        </nav>

        {/* HERO */}
        <header className="max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <MonoTag tone="volt">Hostelería & Hoteles</MonoTag>
            <MonoTag tone="plasma">GEO · Motores Generativos</MonoTag>
            <MonoTag>Diagnóstico Fechado</MonoTag>
          </div>

          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl md:text-7xl">
            Auditoría GEO para hostelería:{" "}
            <span className="text-volt text-glow-volt">qué dicen ChatGPT, Perplexity y Gemini</span>{" "}
            de tu negocio.
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted md:text-2xl">
            Tus clientes ya no buscan solo en Google: le preguntan a la inteligencia artificial
            dónde comer o alojarse. Analizamos 8 consultas reales, las fuentes que citan, la
            consistencia de tu ficha en Google y directorios, y te entregamos un informe fechado con
            3 acciones priorizadas.
          </p>

          <p className="mt-4 font-mono text-xs uppercase tracking-wider text-muted">
            Ingeniería de datos aplicada. Sin promesas de rankings mágicos ni humo.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/#contacto"
              className="inline-flex items-center gap-3 rounded-full bg-volt px-7 py-3.5 text-sm font-semibold tracking-wide text-bg transition-colors duration-300 hover:bg-[#d2ff55]"
            >
              Pedir diagnóstico de 30 min
              <span aria-hidden="true">→</span>
            </Link>

            <a
              href="#alcance"
              className="inline-flex items-center gap-2 rounded-full border border-line-strong px-6 py-3.5 font-mono text-xs uppercase tracking-[0.16em] text-ink transition-colors hover:border-volt/60 hover:text-volt"
            >
              Ver entregables y límites ↓
            </a>
          </div>

          {/* Métricas clave del servicio */}
          <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
            <div className="bg-bg p-5 md:p-6">
              <span className="font-display text-3xl font-bold text-ink md:text-4xl">8</span>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                Consultas reales probadas
              </p>
            </div>
            <div className="bg-bg p-5 md:p-6">
              <span className="font-display text-3xl font-bold text-volt md:text-4xl">3</span>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                Motores: GPT, Perplexity, Gemini
              </p>
            </div>
            <div className="bg-bg p-5 md:p-6">
              <span className="font-display text-3xl font-bold text-ink md:text-4xl">100%</span>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                Fuentes citadas mapeadas
              </p>
            </div>
            <div className="bg-bg p-5 md:p-6">
              <span className="font-display text-3xl font-bold text-plasma md:text-4xl">3</span>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted">
                Acciones priorizadas
              </p>
            </div>
          </div>
        </header>

        {/* SECCIÓN 01: EL PROBLEMA REAL EN HOSTELERÍA */}
        <section className="mt-24 border-t border-line pt-16 md:mt-32 md:pt-20">
          <SectionLabel index="01" label="El cambio de hábito del cliente" />

          <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <h2 className="text-3xl font-bold tracking-tight text-ink md:text-5xl">
                Los clientes ya no buscan por palabras sueltas.{" "}
                <span className="text-volt">Conversan con la IA.</span>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted">
                El comportamiento del comensal y del viajero ha mutado en cuestión de meses. Ya no
                escriben simplemente &quot;restaurante arroces&quot; o &quot;hotel centro&quot;. Hacen
                preguntas directas con filtros cruzados y esperan una recomendación sintetizada en
                tres segundos.
              </p>
              <div className="mt-6 space-y-3 rounded-2xl border border-line bg-surface p-5 text-sm text-ink/90">
                <p className="font-mono text-xs uppercase tracking-wider text-volt">
                  {"// Consultas conversacionales habituales:"}
                </p>
                <p className="italic text-muted">
                  &ldquo;¿Dónde cenar hoy en [zona] con terraza tranquila, opciones sin gluten y que
                  no sea una trampa para turistas?&rdquo;
                </p>
                <p className="italic text-muted">
                  &ldquo;Recomiéndame un hotel céntrico con buen wifi para trabajar, silencio
                  nocturno y desayuno antes de las 7:30.&rdquo;
                </p>
              </div>
            </div>

            <div className="space-y-4 lg:col-span-7">
              <div className="rounded-2xl border border-line bg-surface p-6 md:p-8">
                <span className="font-mono text-xs text-muted">{"// Riesgo 1"}</span>
                <h3 className="mt-2 text-xl font-bold text-ink">Invisibilidad en el corte final</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  A diferencia de un buscador que muestra páginas de resultados, un modelo de lenguaje
                  solo recomienda 2 o 3 opciones. Si tus datos no están bien consolidados en sus
                  fuentes de grounding, tu establecimiento desaparece de la selección final.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-6 md:p-8">
                <span className="font-mono text-xs text-muted">{"// Riesgo 2"}</span>
                <h3 className="mt-2 text-xl font-bold text-ink">
                  Alucinaciones con horarios y cartas
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Si un agregador secundario mantiene tu horario de hace dos años o un blog antiguo
                  menciona un menú descatalogado, la IA puede afirmar que cierras un día en el que
                  estás abierto, o dar precios desfasados que frustran al cliente antes de reservar.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-surface p-6 md:p-8">
                <span className="font-mono text-xs text-muted">{"// Riesgo 3"}</span>
                <h3 className="mt-2 text-xl font-bold text-ink">Desvío hacia tu competencia directa</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  Cuando la IA no encuentra atributos estructurados en tu web o en tu ficha de Google
                  (alérgenos, tipo de terraza, parking, políticas de cancelación), opta por el negocio
                  vecino que sí tiene esa información explícita y verificada.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SIMULACIÓN TÉCNICA: QUÉ DESVELA LA AUDITORÍA */}
        <section className="mt-20 rounded-3xl border border-line bg-bg-soft p-6 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
            <div>
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-volt">
                {"// Simulación de auditoría real"}
              </span>
              <h3 className="mt-1 text-xl font-bold text-ink md:text-2xl">
                Consulta de prueba: «Cena de grupo en [zona] con terraza y carta de temporada»
              </h3>
            </div>
            <span className="rounded-full border border-line bg-surface px-4 py-1.5 font-mono text-xs text-muted">
              3 motores comparados
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {CONSULTAS_EJEMPLO.map((item) => (
              <div
                key={item.motor}
                className="flex flex-col rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line-strong"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink">{item.motor}</span>
                  <span className="font-mono text-[10px] text-muted">{item.tag}</span>
                </div>
                <div className="mt-4">
                  <span
                    className={`inline-block rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${item.color}`}
                  >
                    {item.estado}
                  </span>
                </div>
                <p className="mt-4 text-xs leading-relaxed text-muted">{item.detalle}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 border-t border-line/60 pt-4 font-mono text-xs text-muted">
            <span className="text-volt">Resultado operativo:</span> Tu cocina y tu sala funcionan
            perfectamente, pero los asistentes de IA están desincentivando reservas por falta de
            sincronización y consistencia de datos en la red.
          </p>
        </section>

        {/* SECCIÓN 02: ENTREGABLES Y ALCANCE */}
        <section id="alcance" className="mt-24 border-t border-line pt-16 md:mt-32 md:pt-20">
          <div className="max-w-3xl">
            <SectionLabel index="02" label="Alcance del servicio" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-5xl">
              Cinco entregables concretos.{" "}
              <span className="text-volt">Cero informes de relleno.</span>
            </h2>
            <p className="mt-4 text-base text-muted">
              No te entregamos un documento genérico generado con plantillas automáticas. Analizamos
              tu caso de forma artesanal y rigurosa para darte claridad exacta.
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {ENTREGABLES.map((e, idx) => (
              <article
                key={e.num}
                className={`flex flex-col bg-surface p-7 md:p-9 ${
                  idx === 0 ? "lg:col-span-2" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-volt">{"// " + e.num}</span>
                  <span className="font-mono text-[11px] text-muted">Entregable verificado</span>
                </div>

                <h3 className="mt-6 text-xl font-bold tracking-tight text-ink md:text-2xl">
                  {e.titulo}
                </h3>
                <p className="mt-2 font-mono text-xs text-plasma">{e.subtitulo}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted">{e.descripcion}</p>
              </article>
            ))}
          </div>
        </section>

        {/* SECCIÓN 03: BLOQUE DE LÍMITES Y REALIDAD TÉCNICA */}
        <section className="mt-24 border-t border-line pt-16 md:mt-32 md:pt-20">
          <SectionLabel index="03" label="Límites y realidad técnica" />

          <div className="mt-6 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-ink md:text-5xl">
              Lo que esta auditoría es y{" "}
              <span className="text-volt">lo que la IA no permite garantizar.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              En ZimplifAI trabajamos con ingeniería y hechos contrastables. Desconfía de cualquiera
              que te venda &quot;posicionar el primero en ChatGPT&quot; o te prometa visitas
              garantizadas. Fijamos los límites de forma transparente:
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {LIMITES.map((lim, idx) => (
              <div
                key={lim.titulo}
                className="rounded-2xl border border-line bg-surface/70 p-6 md:p-8"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full border border-volt/40 font-mono text-xs text-volt">
                    0{idx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-ink">{lim.titulo}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted">{lim.descripcion}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECCIÓN 04: BLOQUE PILOTO STOCK CRÍTICO */}
        <section className="mt-24 border-t border-line pt-16 md:mt-32 md:pt-20">
          <SectionLabel index="04" label="Automatización operativa complementaria" />

          <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <span className="rounded-full border border-plasma/40 bg-plasma/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-plasma">
                Piloto para hostelería
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-5xl">
                Piloto de stock crítico con{" "}
                <span className="text-plasma">aprobación humana obligatoria.</span>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted">
                La IA y la automatización no solo sirven para la presencia exterior: resuelven
                fricciones críticas en cocina y almacén. Quedarse sin el producto estrella un
                viernes por la noche cuesta facturación directa y quema al personal.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted">
                Pero dejar que un algoritmo compre solo es un riesgo inaceptable. Nuestro piloto
                combina cálculo automático con estricta validación humana: el sistema prepara el
                borrador exacto; tu jefe de cocina o gerente decide con un toque.
              </p>

              <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
                <span className="font-mono text-xs text-volt">{"// Regla inviolable:"}</span>
                <p className="mt-2 text-sm font-semibold text-ink">
                  Ningún pedido sale al proveedor sin la confirmación explícita de un humano
                  responsable.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="space-y-4">
                {PILOTO_PASOS.map((paso) => (
                  <div
                    key={paso.fase}
                    className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-5 md:flex-row md:items-start md:gap-6 md:p-6"
                  >
                    <span className="shrink-0 font-mono text-xs uppercase tracking-wider text-plasma">
                      {paso.fase}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-ink">{paso.titulo}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{paso.detalle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN 05: METODOLOGÍA Y TIEMPOS */}
        <section className="mt-24 border-t border-line pt-16 md:mt-32 md:pt-20">
          <SectionLabel index="05" label="Proceso de trabajo" />

          <div className="mt-6 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-ink md:text-5xl">
              Tres pasos sencillos. Entrega en 3 a 5 días laborables.
            </h2>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
            <div className="bg-bg p-7 md:p-9">
              <span className="font-mono text-xs text-volt">{"// Fase 1 · Día 1"}</span>
              <h3 className="mt-4 text-xl font-bold text-ink">Toma de datos (30 min)</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Breve videollamada para definir tu propuesta de valor, carta clave, ubicación,
                perfil de cliente objetivo y los 3 competidores más cercanos.
              </p>
            </div>

            <div className="bg-bg p-7 md:p-9">
              <span className="font-mono text-xs text-volt">{"// Fase 2 · Días 2 a 4"}</span>
              <h3 className="mt-4 text-xl font-bold text-ink">Análisis en paralelo</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Ejecutamos las 8 consultas en ChatGPT, Perplexity y Gemini. Cruzamos las fuentes
                citadas con tu ficha de Google, directorios y web, registrando cada discrepancia.
              </p>
            </div>

            <div className="bg-bg p-7 md:p-9">
              <span className="font-mono text-xs text-volt">{"// Fase 3 · Día 5"}</span>
              <h3 className="mt-4 text-xl font-bold text-ink">Entrega fechada y sesión</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Te entregamos el informe fechado y mantenemos una sesión de 30 minutos para explicar
                las 3 acciones prioritarias y cómo implementarlas con tu equipo o desarrollador.
              </p>
            </div>
          </div>
        </section>

        {/* SECCIÓN 06: PREGUNTAS FRECUENTES */}
        <section className="mt-24 border-t border-line pt-16 md:mt-32 md:pt-20">
          <SectionLabel index="06" label="Preguntas frecuentes" />

          <div className="mt-6 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-ink md:text-5xl">
              Respuestas claras a dudas habituales.
            </h2>
          </div>

          <div className="mt-10 divide-y divide-line rounded-2xl border border-line bg-surface">
            {FAQS.map((faq) => (
              <div key={faq.q} className="p-6 md:p-8">
                <h3 className="text-lg font-bold text-ink">{faq.q}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECCIÓN 07: CTA FINAL / CONTACTO EXISTENTE */}
        <section className="mt-24 rounded-3xl border border-volt/30 bg-surface p-8 md:mt-32 md:p-14">
          <div className="max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-volt">
              {"// Próximo paso"}
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink md:text-5xl">
              ¿Quieres saber qué responde la IA cuando preguntan por tu local?
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted md:text-lg">
              Empezamos con una llamada de 30 minutos sin compromiso. Analizamos una consulta de
              prueba en directo sobre tu restaurante u hotel y vemos si la auditoría completa tiene
              sentido en tu caso.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/#contacto"
                className="inline-flex items-center gap-3 rounded-full bg-volt px-8 py-4 text-sm font-semibold tracking-wide text-bg transition-colors duration-300 hover:bg-[#d2ff55]"
              >
                Solicitar auditoría o llamada
                <span aria-hidden="true">→</span>
              </Link>

              <a
                href={`mailto:${site.email}?subject=Auditor%C3%ADa%20GEO%20Hosteler%C3%ADa`}
                className="inline-flex items-center gap-2 rounded-full border border-line-strong px-6 py-4 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:border-volt/60 hover:text-volt"
              >
                Escribir a {site.email}
              </a>

              {site.whatsapp && (
                <a
                  href={`https://wa.me/${site.whatsapp}?text=Hola%20Zuzo,%20me%20interesa%20la%20Auditor%C3%ADa%20GEO%20para%20mi%20negocio%20de%20hosteler%C3%ADa`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-4 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-volt"
                >
                  WhatsApp directo ↗
                </a>
              )}
            </div>

            <p className="mt-8 font-mono text-xs text-muted">
              * En el mensaje indica el nombre de tu restaurante u hotel y tu ubicación para revisar
              tu caso con antelación.
            </p>
          </div>
        </section>
      </div>

      {/* Datos estructurados Schema.org */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
