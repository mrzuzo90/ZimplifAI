/**
 * Showroom — proyectos reales de ZimplifAI.
 * Datos tomados del brief (prompt.md). No se inventan resultados ni métricas:
 * todo lo mostrado es real o roadmap. Revisa/actualiza antes del lanzamiento
 * si encuentras versiones más recientes en /Users/zuzo.
 */

export type ProjectCategory = "web" | "ia" | "desktop" | "opensource";
export type ProjectStatusTone = "live" | "wip" | "tests" | "oss";

export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  /** Una frase: qué es. */
  tagline: string;
  /** Qué es, a gran escala. */
  description: string;
  /** Qué resuelve. */
  problem: string;
  stack: string[];
  status: string;
  statusTone: ProjectStatusTone;
  url?: string;
  /** Color principal del proyecto para la tarjeta (hex). */
  accent?: string;
  /** Captura/preview visual: "browser" | "desktop" | "terminal" | "mobile" */
  previewType?: "browser" | "desktop" | "terminal" | "mobile";
}

export const categoryLabels: Record<ProjectCategory, string> = {
  web: "Web",
  ia: "IA",
  desktop: "Desktop",
  opensource: "Open source",
};

export const projects: Project[] = [
  {
    id: "elektrizia",
    name: "ElektriZIA",
    category: "web",
    tagline: "Suite web para instaladores eléctricos.",
    description:
      "Digitaliza el papeleo técnico del instalador: previsión de cargas según ITC-BT y un asistente REBT impulsado por IA.",
    problem:
      "Los instaladores pierden horas con cálculos normativos y consultas al reglamento. ElektriZIA lo convierte en un flujo web completo.",
    stack: ["TanStack Start", "Supabase", "jspdf", "pdf-lib"],
    status: "En producción",
    statusTone: "live",
    url: "https://elektrizia.com",
    accent: "#00D4AA",
    previewType: "browser",
  },
  {
    id: "zcade",
    name: "zCADe",
    category: "desktop",
    tagline: "Suite de esquemas y simulación industriales.",
    description:
      "El sucesor moderno de CADe SIMU para dibujar y simular esquemas eléctricos industriales, con una lógica de simulación sólida y testeada.",
    problem:
      "CADe SIMU no evoluciona. zCADe lo sustituye en escritorio y navegador, con pruebas automatizadas como garantía de calidad.",
    stack: ["Tauri 2", "React", "Konva", "TypeScript"],
    status: "Fase A completa · 420+ tests",
    statusTone: "tests",
    accent: "#FF6B35",
    previewType: "desktop",
  },
  {
    id: "elektrikop",
    name: "ElektriKOP",
    category: "opensource",
    tagline: "Emulador educativo de PLC con lógica de escalera.",
    description:
      "Aprende programación de PLCs con lógica de escalera directamente en el navegador, con un Modo Desafío para practicar.",
    problem:
      "Los PLCs reales son caros y poco accesibles. ElektriKOP lleva la lógica de escalera al aula, gratis y open source.",
    stack: ["React"],
    status: "Open source",
    statusTone: "oss",
    url: "https://kop.elektrizia.com",
    accent: "#FFD700",
    previewType: "browser",
  },
  {
    id: "verifai",
    name: "VerifAI",
    category: "ia",
    tagline: "Motor de procesamiento KYC/KYB.",
    description:
      "Corrección de datos, transliteración y reglas para verificar identidades de forma consistente, con una cobertura de tests exigente.",
    problem:
      "Los procesos KYC/KYB manuales fallan por datos sucios y formatos inconsistentes. VerifAI normaliza y valida a escala.",
    stack: ["Node.js", "TypeScript", "MongoDB", "OpenAI GPT-4o"],
    status: "60+ tests · 90% coverage",
    statusTone: "tests",
    accent: "#7C3AED",
    previewType: "terminal",
  },
  {
    id: "klasyfi",
    name: "Klasyfi",
    category: "ia",
    tagline: "API de procesamiento de documentos financieros.",
    description:
      "OCR local, cola asíncrona y despliegue on-premise para clasificar y extraer datos de documentos financieros sin depender de la nube.",
    problem:
      "Los documentos financieros llegan en mil formatos. Klasyfi los normaliza con OCR propio y un pipeline en cola, incluso on-premise.",
    stack: ["Fastify", "Postgres", "Redis", "BullMQ", "Tesseract"],
    status: "En producción (API en Render)",
    statusTone: "live",
    accent: "#0EA5E9",
    previewType: "browser",
  },
  {
    id: "wasap",
    name: "WASAP",
    category: "ia",
    tagline: "Reclutador de IA por chat.",
    description:
      "Entrevista inicial por chat con informe de score y detección de red flags, para que el equipo humano entre ya filtrado.",
    problem:
      "El primer filtro de candidatos consume horas de equipo. WASAP lo automatiza con una entrevista conversacional y un informe claro.",
    stack: ["IA"],
    status: "MVP",
    statusTone: "wip",
    url: "https://wasap.es",
    accent: "#EC4899",
    previewType: "mobile",
  },
  {
    id: "zopify",
    name: "zopify",
    category: "web",
    tagline: "Plataforma multi-tenant tipo Shopify.",
    description:
      "Subdominios por tenant, Stripe Connect y row-level security para lanzar tiendas independientes sobre una misma base.",
    problem:
      "Montar una plataforma multi-tenant segura desde cero es complejo y caro. zopify lo resuelve con aislamiento a nivel de base de datos.",
    stack: ["Supabase", "Stripe"],
    status: "Modelo validado",
    statusTone: "wip",
    accent: "#10B981",
    previewType: "browser",
  },
  {
    id: "merchandeando",
    name: "Merchandeando",
    category: "web",
    tagline: "Tienda print-on-demand con marca y motion.",
    description:
      "Checkout real con Stripe, tema y animaciones de marca. Un ecommerce que se siente premium de principio a fin.",
    problem:
      "Las tiendas print-on-demand genéricas no convierten. Merchandeando vende experiencia además de producto.",
    stack: ["Next.js", "Prisma", "Stripe"],
    status: "En producción",
    statusTone: "live",
    accent: "#F97316",
    previewType: "browser",
  },
  {
    id: "crm",
    name: "ZimplifAI CRM",
    category: "ia",
    tagline: "Agency Operating System multi-tenant con IA.",
    description:
      "Plataforma B2B SaaS completa para gestionar subcuentas verticales (hostelería, servicios, agencia) con provisión 1-clic, feature flags por módulo, impersonación real, workflows visuales, bandeja unificada multicanal, calendarios de citas públicos, editor de micro-webs verticales y CRM extendido (empresas, pipelines, tareas). Todo con white-label en tiempo real y modo demo offline.",
    problem:
      "Las agencias necesitan operar decenas de clientes verticales sin repetir setup: provisionar, configurar módulos, entrar en su workspace y controlar features desde un panel central. El CRM lo resuelve con arquitectura multi-tenant estricta (RLS), motor white-label y IA nativa (agentes, copilot, auditoría).",
    stack: [
      "Next.js 16.3",
      "React 19",
      "Supabase (Postgres + RLS + Realtime)",
      "Tailwind CSS v4",
      "Radix UI + shadcn",
      "framer-motion",
      "Turbopack",
    ],
    status: "Completo · Build verificado",
    statusTone: "live",
    url: "https://zimplifai.vercel.app/CRM",
    accent: "#CEFF00",
    previewType: "browser",
  },
];

/** Número de proyectos con estado "en producción" (para las stats del manifiesto). */
export const liveCount = projects.filter((p) => p.statusTone === "live").length;
