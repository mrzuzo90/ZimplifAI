import type { Lead, MessageChannel, MessageThread, Message } from "@/types/database";

/**
 * Dominio puro de la bandeja unificada (Fase B).
 * Meta de canales, utilidades de hilos y el motor determinista
 * de "AI Reply Copilot" (sugerencias de respuesta). Sin imports de UI
 * ni de la capa de datos → SSR-safe y reutilizable.
 */

export const CHANNEL_BADGE: Record<MessageChannel, "success" | "info" | "warning" | "muted"> = {
  whatsapp: "success",
  email: "info",
  instagram: "warning",
  web: "muted",
};

export const CHANNEL_ORDER: MessageChannel[] = ["whatsapp", "instagram", "email", "web"];

/** Extracto corto de un mensaje para la lista de hilos. */
export function threadPreview(text: string | null | undefined, max = 64): string {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

/** Sustituye las {{variables}} de una plantilla con los datos del lead. */
export function interpolateVariables(
  template: string,
  vars: { first_name?: string | null; last_name?: string | null; phone?: string | null; email?: string | null; business?: string | null } = {}
): string {
  const map: Record<string, string> = {
    first_name: vars.first_name?.trim() || "cliente",
    last_name: vars.last_name?.trim() || "",
    phone: vars.phone?.trim() || "",
    email: vars.email?.trim() || "",
    business: vars.business?.trim() || "tu negocio",
  };
  return template.replace(/\{\{\s*([a-zA-Z_]+)\s*\}\}/g, (m, key: string) =>
    key in map ? map[key] : m
  );
}

/** Extrae los nombres de variables {{var}} de un texto. */
export function extractVariables(template: string): string[] {
  const out = new Set<string>();
  const re = /\{\{\s*([a-zA-Z_]+)\s*\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(template)) !== null) out.add(m[1]);
  return Array.from(out);
}

/* ------------------------- AI Reply Copilot ------------------------- */

export interface ReplySuggestion {
  reply: string;
  intent: string;
  intentLabel: string;
  tokens: number;
}

/** Nombre legible de un intent detectado. */
export const INTENT_LABELS: Record<string, string> = {
  booking_request: "Solicitud de reserva",
  pricing: "Pregunta de precio",
  hours: "Horario",
  dietary: "Alergias / dieta",
  event: "Evento / grupo",
  greeting: "Saludo",
  thanks: "Agradecimiento",
  qualification: "Cualificación",
  fallback: "Consulta general",
};

/**
 * Detecta la intención del último mensaje entrante por palabras clave.
 * Determinista (modo demo y producción sin backend IA).
 */
export function detectIntent(body: string): string {
  const t = body.toLowerCase();
  const has = (...words: string[]) => words.some((w) => t.includes(w));
  if (has("reserv", "mesa", "comensal", "libre", "hueco", "disponibilidad", "sitio", "viernes", "sábado", "sabado", "sunday", "noche")) return "booking_request";
  if (has("precio", "cuánto", "cuanto", "coste", "cuesta", "tarifa", "presupuesto", "€", "euro")) return "pricing";
  if (has("horario", "abierto", "abren", "cierra", "cerráis", "hora abr", "cuándo abr", "cuando abr")) return "hours";
  if (has("vegan", "alergia", "gluten", "intolerancia", "veggie", "vegetariano", "alérgico", "alergico")) return "dietary";
  if (has("catering", "evento", "grupo", "cumpleaños", "cumpleanos", "20 persona", "30 persona", "salón", "salon privado")) return "event";
  if (has("hola", "buenas", "buenos días", "buenas tardes", "hi", "hey", "saludos")) return "greeting";
  if (has("gracias", "genial", "perfecto", "estupendo", "¡qué bien", "ok gracias")) return "thanks";
  if (has("información", "info", "consulta", "quería preguntar", "pregunta")) return "qualification";
  return "fallback";
}

/**
 * Genera una sugerencia de respuesta para el último mensaje entrante.
 * Usa el contexto del hilo, el lead y el agente activo para devolver
 * una respuesta en español contextual (simulador determinista del copilot).
 */
export function generateReplySuggestion(input: {
  thread: MessageThread;
  messages: Message[];
  lead: Pick<Lead, "id" | "first_name" | "last_name" | "email" | "phone"> | null;
  agentName: string | null;
  businessName: string;
}): ReplySuggestion {
  const { lead, agentName, businessName } = input;
  const name = lead?.first_name?.trim();
  const lastInbound = [...input.messages].reverse().find((m) => m.direction === "inbound");
  const body = lastInbound?.body ?? "";
  const intent = detectIntent(body);
  const n = name ? `¡Hola ${name}! ` : "¡Hola! ";
  const base = businessName || "nuestro equipo";

  const replies: Record<string, string> = {
    booking_request: `${n}Gracias por escribir a ${base}. Podemos confirmarte esa reserva. ¿Para cuántas personas, qué día y a qué hora prefieres? Te confirmo disponibilidad al momento.`,
    pricing: `${n}Claro, te lo cuento sin compromiso. Para ${base}, los precios dependen de lo que necesites: cuéntame tu caso y te paso una propuesta a medida con precios claros. ¿Te parece bien que te llame por WhatsApp?`,
    hours: `${n}Nuestro horario es el que aparece en la web: de 12:00 a 16:00 y de 20:00 a 23:30. ¿Quieres que te reserve mesa en alguno de esos tramos?`,
    dietary: `${n}¡Claro que sí! En ${base} podemos adaptar platos a alérgenos y dietas especiales. Dime qué alergias o preferencias tienes y se lo traslado a cocina para que esté todo listo.`,
    event: `${n}¡Genial, suena a plan especial! Para ${base}, los eventos y grupos grandes se gestionan mejor con antelación. ¿Cuántas personas sois y qué fecha tenéis en mente? Os preparo una propuesta con menú y espacio.`,
    greeting: `${n}Gracias por escribir a ${base}. ¿En qué podemos ayudarte hoy? Reservas, horarios o lo que necesites, aquí estamos.`,
    thanks: `${n}A ti por escribirnos. Si necesitas cualquier cosa, aquí seguimos en ${base}. ¡Que tengas un gran día!`,
    qualification: `${n}Con mucho gusto te ayudamos. Para darte la mejor respuesta, ¿me cuentas brevemente qué necesitas y por qué canal prefieres que te contactemos?`,
    fallback: `${n}He recibido tu mensaje en ${base}. Para responderte con precisión, ¿me das un par de datos? Puedes contarme qué necesitas y un teléfono de contacto si lo prefieres.`,
  };

  const reply = replies[intent] ?? replies.fallback;
  const tokens = Math.max(40, Math.round(reply.length / 4) + (agentName ? 20 : 0));
  return { reply, intent, intentLabel: INTENT_LABELS[intent] ?? intent, tokens };
}

/** Busca el agente IA activo de la subcuenta (para la etiqueta del copilot). */
export function pickActiveAgentName(agents: Array<{ name: string; is_active: boolean }>): string | null {
  const active = agents.filter((a) => a.is_active);
  if (active.length === 0) return null;
  const preferred =
    active.find((a) => /whatsapp|qualifier|asistente|asistente de reservas/i.test(a.name)) ?? active[0];
  return preferred.name;
}
