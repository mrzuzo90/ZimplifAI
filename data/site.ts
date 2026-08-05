/**
 * Identidad y datos públicos de la marca.
 * Los valores con NEXT_PUBLIC_ se pueden sobrescribir desde .env.local sin tocar código.
 */

export const site = {
  name: "ZimplifAI",
  tagline: "Simplifico procesos. Implanto IA.",
  /** Descripción corta: va en meta description y JSON-LD. */
  description:
    "Agencia de implantación de IA y desarrollo web. Automatización de procesos, agentes a medida y aplicaciones full-stack en producción, sin humo.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contacto@zuzo.es",
  /** WhatsApp con código de país y sin "+" ni espacios. Vacío = se oculta. */
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP ?? "",
  social: {
    github: process.env.NEXT_PUBLIC_GITHUB ?? "",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN ?? "",
    x: process.env.NEXT_PUBLIC_X ?? "",
  },
  /** El humano detrás de la marca. */
  author: {
    name: "Zuzo",
    role: "Especialista en automatización · Full-stack + IA + Automatismos industriales",
    certification: "ELEE0109",
  },
} as const;
