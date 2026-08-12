import type { AvailabilityRule, Booking, Calendar, VoiceSessionState } from "@/types/database";
import { buildDaySlots, type DaySlot } from "@/lib/booking";
import { detectIntent } from "@/lib/inbox";
import { parseDate, formatDateEs, parseTime } from "@/lib/bot-brain";

/**
 * Motor de conversación telefónica del agente de llamadas IA — 100% por
 * organización.
 *
 * Recibe un `VoiceOrgContext` con TODO lo que el cliente ya tiene en su
 * subcuenta (nombre, tono, servicios y precios, horarios, aforo, reservas,
 * historial del lead) y devuelve la respuesta hablada + la acción a
 * ejecutar. No conoce ni proveedores LLM ni orquestadores de voz: es puro
 * y replicable para cualquier organización.
 *
 * Dos modos:
 *  - `runVoiceTurn`       → respuesta determinista (demo, sin LLM).
 *  - `buildSystemPromptForTenant` → prompt LLM con el contexto completo,
 *    para cuando la subcuenta aporta una API key (Gemini / Groq).
 */

/* ============================ Contexto ============================ */

export interface VoiceService {
  id: string;
  name: string;
  description: string | null;
  price_eur: number | null;
  duration_min: number;
}

export interface VoiceOrgContext {
  orgId: string;
  businessName: string;
  /** Nombre del agente (p. ej. "Ariadna"). */
  agentName: string;
  /** Personalidad/tono del agente. */
  tone: string;
  /** Reglas de negocio extra del cliente. */
  customRules?: string | null;
  /** Horario legible ("12:00–16:00, 20:00–23:30"). */
  openHours: string;
  siteUrl: string;
  calendars: Calendar[];
  rules: AvailabilityRule[];
  bookings: Booking[];
  /** Servicios del negocio con precio (desde los calendarios activos). */
  services: VoiceService[];
  /** Contexto del llamante si ya existe como lead. */
  lead?: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    status: string;
    tags: string[];
  } | null;
  /** Últimos mensajes del hilo con este cliente (voz/chat), si hay. */
  recentMessages?: Array<{ sender: "client" | "agent"; body: string }>;
}

export interface VoiceCaller {
  phone?: string | null;
  name?: string | null;
}

/** Estado acumulado de una llamada (por sesión). */
export type VoiceSession = VoiceSessionState;

export function emptyVoiceSession(): VoiceSession {
  return {
    intent: "idle",
    step: "none",
    dateStr: null,
    serviceId: null,
    partySize: null,
    time: null,
    customerName: null,
    turnCount: 0,
  };
}

export interface VoiceTurnResult {
  reply: string;
  session: VoiceSession;
  action: {
    type: "none" | "create_booking";
    payload: Record<string, unknown>;
  };
}

/* ============================ Helpers de voz ============================ */

const NUMBER_WORDS: Record<string, number> = {
  una: 1, uno: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13,
  catorce: 14, quince: 15, dieciséis: 16, dieciseis: 16, diecisiete: 17,
  dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintidós: 22,
  veintidó: 22, treinta: 30, cuarenta: 40, cincuenta: 50,
};

/** "a las 21:30", "las nueve y media", "nueve de la noche" → "21:30". */
export function parseSpokenTime(text: string): string | null {
  const direct = parseTime(text);
  if (direct) return direct;

  const t = text.toLowerCase().replace(/[.,]/g, "");
  // "y media / y cuarto" sirve a la hora numérica ("a las 10 y media") y a la escrita.
  const quarter = /y\s+(media|cuarto)/.exec(t)?.[1] ?? null;
  // Hora numérica inmediata tras "a las": "a las 21:00", "las 8 de la tarde", "son las 9".
  const hourMatch =
    /(?:a\s+las|las|son las|sería a las|a eso de)\s+(\d{1,2})(?::(\d{2}))?\s*(?:de\s+la\s+(mañana|tarde|noche)|pm|am)?/.exec(
      t
    );
  // Hora en palabras: "las nueve y media de la tarde", "a las doce y cuarto".
  const loose =
    /(?:a\s+las|las|son las|sería a las|a eso de)\s+([a-záéíóúñü]+)(?:\s+y\s+(media|cuarto))?(?:\s*de\s+la\s+(mañana|tarde|noche))?/.exec(t);

  let hour: number | null = null;
  let minute = 0;
  let period: string | null = null;

  if (hourMatch && Number(hourMatch[1]) >= 0 && Number(hourMatch[1]) <= 23) {
    hour = Number(hourMatch[1]);
    minute = hourMatch[2]
      ? Number(hourMatch[2])
      : quarter === "media" ? 30 : quarter === "cuarto" ? 15 : 0;
    period = hourMatch[3] ?? null;
  } else if (loose) {
    const w = NUMBER_WORDS[loose[1]];
    if (w && w <= 12) hour = w;
    if (hour !== null) {
      minute = loose[2] === "media" ? 30 : loose[2] === "cuarto" ? 15 : 0;
      period = loose[3] ?? null;
    }
  }

  if (hour === null) return null;
  // "9 de la noche" → 21:00; "8 de la tarde" → 20:00; "12 de la tarde" queda en 12:00.
  if (period === "noche" && hour < 12) hour += 12;
  else if (period === "tarde" && hour < 12) hour += 12;
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** "para 4 personas", "somos 6", "2 personas" → 4. */
export function parsePartySize(text: string): number | null {
  const direct = /(\d{1,2})/.exec(text);
  if (direct) {
    const n = Number(direct[1]);
    if (n >= 1 && n <= 50) return n;
  }
  const words = text.toLowerCase().match(/\b(uno|una|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce)\b/g);
  if (words) return NUMBER_WORDS[words[words.length - 1]] ?? null;
  return null;
}

/* ============================ Disponibilidad ============================ */

function slotsFor(ctx: VoiceOrgContext, dateStr: string, partySize: number): DaySlot[] {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  const duration = ctx.calendars.find((c) => c.is_active)?.service_duration_min ?? 60;
  const dayBookings = ctx.bookings.filter(
    (b) => b.status !== "cancelled" && b.booking_date.slice(0, 10) === dateStr
  );
  const slots = buildDaySlots({
    rules: ctx.rules,
    dayOfWeek,
    bookings: dayBookings,
    durationMin: duration,
    slotMinutes: 30,
  });
  return slots.filter((s) => s.available && s.remaining >= partySize);
}

function availableTimesText(ctx: VoiceOrgContext, dateStr: string, partySize: number): string {
  const slots = slotsFor(ctx, dateStr, partySize);
  if (slots.length === 0) return "";
  return slots.slice(0, 4).map((s) => s.time).join(", ");
}

function serviceOptionsText(ctx: VoiceOrgContext): string {
  return ctx.services.map((s) => s.name).join(", ");
}

/* ============================ Turno determinista (demo) ============================ */

/**
 * Procesa el último turno hablado del cliente y devuelve la respuesta
 * + el siguiente estado + la acción a ejecutar (si aplica).
 */
export function runVoiceTurn(
  ctx: VoiceOrgContext,
  caller: VoiceCaller,
  transcript: string,
  session: VoiceSession
): VoiceTurnResult {
  const t = (transcript ?? "").trim();
  const lower = t.toLowerCase();
  const next = { ...session, turnCount: session.turnCount + 1 };

  const noAction = (reply: string, s: VoiceSession): VoiceTurnResult => ({ reply, session: s, action: { type: "none", payload: {} } });

  // --- Silencio / primer saludo ---
  if (!t) {
    const name = ctx.lead?.firstName || caller.name || "";
    return noAction(
      `Hola${name ? `, ${name}` : ""}. Soy ${ctx.agentName} de ${ctx.businessName}. ` +
        `Puedo ayudarte a reservar, decirte nuestros horarios o informarte de precios. ¿Qué necesitas?`,
      { ...emptyVoiceSession(), intent: "idle", turnCount: next.turnCount }
    );
  }

  // --- Flujo de reserva en curso ---
  if (session.step !== "none") {
    switch (session.step) {
      case "date": {
        const date = parseDate(t);
        if (!date) {
          return noAction("No te he entendido el día. ¿Hoy, mañana, o algún día de la semana?", next);
        }
        const services = ctx.services.filter((_s) => slotsFor(ctx, date, session.partySize ?? 1).length > 0);
        if (services.length === 0) {
          return noAction(`Lo siento, el ${formatDateEs(date)} no tenemos disponibilidad. ¿Otro día?`, { ...next, step: "date", dateStr: null });
        }
        // Si hay más de un servicio, preguntamos cuál.
        return noAction(
          `Para el ${formatDateEs(date)} tengo hueco. ${ctx.services.length > 1 ? `¿Qué servicio te interesa? ${serviceOptionsText(ctx)}.` : `¿Para cuántas personas sería?`}`,
          ctx.services.length > 1
            ? { ...next, step: "service", dateStr: date }
            : { ...next, step: "party", dateStr: date, serviceId: ctx.services[0]?.id ?? null }
        );
      }
      case "service": {
        const svc = ctx.services.find((s) => lower.includes(s.name.toLowerCase()));
        if (!svc) {
          return noAction(`Lo siento, no he reconocido el servicio. Tenemos ${serviceOptionsText(ctx)}. ¿Cuál quieres?`, next);
        }
        return noAction(`Perfecto, ${svc.name}. ¿Para cuántas personas sería?`, { ...next, step: "party", serviceId: svc.id });
      }
      case "party": {
        const party = parsePartySize(t);
        if (!party) {
          return noAction("¿Para cuántas personas sería la reserva?", next);
        }
        const date = session.dateStr ?? new Date().toISOString().slice(0, 10);
        const slots = slotsFor(ctx, date, party);
        if (slots.length === 0) {
          return noAction(`Lo siento, el ${formatDateEs(date)} no nos quedan huecos para ${party} ${party === 1 ? "persona" : "personas"}. ¿Puedo buscar otro día?`, { ...next, step: "date", partySize: null, dateStr: null });
        }
        return noAction(
          `El ${formatDateEs(date)} tengo ${party === 1 ? "una persona" : `${party} personas`} en ${availableTimesText(ctx, date, party)}. ¿Qué hora te va mejor?`,
          { ...next, step: "time", partySize: party }
        );
      }
      case "time": {
        const time = parseSpokenTime(t);
        const date = session.dateStr ?? new Date().toISOString().slice(0, 10);
        const party = session.partySize ?? 2;
        if (!time) {
          return noAction(`No te he entendido la hora. Por ejemplo, a las ${availableTimesText(ctx, date, party) || "21:00"}.`, next);
        }
        const available = slotsFor(ctx, date, party).some((s) => s.time === time);
        if (!available) {
          return noAction(`A las ${time} no tengo hueco. Tengo ${availableTimesText(ctx, date, party)}. ¿Te vale alguna?`, next);
        }
        const knownName = ctx.lead?.firstName || caller.name;
        if (knownName) {
          return noAction(
            `De acuerdo: ${formatDateEs(date)} a las ${time} para ${party} ${party === 1 ? "persona" : "personas"}. ` +
              `¿Confirmo la reserva a nombre de ${knownName}?`,
            { ...next, step: "confirm", time }
          );
        }
        return noAction(`¿A nombre de quién hago la reserva?`, { ...next, step: "confirm", time });
      }
      case "confirm": {
        const date = session.dateStr ?? new Date().toISOString().slice(0, 10);
        const time = session.time ?? "21:00";
        const party = session.partySize ?? 2;
        const svc = ctx.services.find((s) => s.id === session.serviceId);
        const knownName = session.customerName ?? ctx.lead?.firstName ?? caller.name;

        // Confirmación explícita (con nombre ya conocido).
        if (knownName && /^(sí|si|vale|perfecto|adelante|claro|dale|ok|confirmo|de acuerdo|genial)/.test(lower)) {
          const name = knownName || "Cliente";
          return {
            reply: `¡Perfecto, reserva confirmada! ${formatDateEs(date)} a las ${time} para ${party} ${party === 1 ? "persona" : "personas"}${svc ? ` en ${svc.name}` : ""} a nombre de ${name}. ` +
              `Te esperamos en ${ctx.businessName}. ¿Algo más?`,
            session: { ...emptyVoiceSession(), turnCount: next.turnCount },
            action: {
              type: "create_booking",
              payload: {
                date,
                time,
                party_size: party,
                service_id: session.serviceId,
                service_name: svc?.name ?? null,
                customer_name: name,
                phone: caller.phone ?? null,
              },
            },
          };
        }

        // Rechazo explícito → reiniciamos el flujo.
        if (/^(no|no gracias|no, gracias|cancelar|cancel)/.test(lower)) {
          return noAction("No hay problema. ¿Quieres probar con otro día u hora, o prefieres que te ayude con otra cosa?", { ...emptyVoiceSession(), turnCount: next.turnCount });
        }

        // Sin nombre aún: lo dicho ahora es el nombre del cliente.
        if (!knownName && t) {
          const name = t
            .replace(/\b\w/g, (c) => c.toUpperCase())
            .slice(0, 40);
          return noAction(
            `De acuerdo: ${formatDateEs(date)} a las ${time} para ${party} ${party === 1 ? "persona" : "personas"}${svc ? ` en ${svc.name}` : ""} a nombre de ${name}. ¿Confirmo?`,
            { ...next, step: "confirm", customerName: name }
          );
        }

        return noAction(`¿A nombre de quién hago la reserva?`, next);
      }
    }
  }

  // --- Intención en lenguaje natural (sin flujo en curso) ---
  switch (detectIntent(t)) {
    case "booking_request":
      return noAction(
        `Claro, vamos a ello. ¿Para qué día quieres la ${ctx.services.length > 1 ? "reserva o cita" : "reserva"}? Puede ser hoy, mañana o un día de la semana.`,
        { ...next, intent: "booking", step: "date" }
      );
    case "hours":
      return noAction(
        `Nuestro horario es ${ctx.openHours || "consultable en la web"}. ¿Quieres que te reserve algo?`,
        { ...next, intent: "hours" }
      );
    case "pricing": {
      if (ctx.services.length === 0) {
        return noAction(`No tengo la lista de precios a mano. ¿Te interesa que te ponga en contacto con el equipo?`, { ...next, intent: "pricing" });
      }
      const lines = ctx.services
        .map((s) => (s.price_eur != null ? `${s.name} desde ${s.price_eur}€` : s.name))
        .join(". ");
      return noAction(`${lines}. ¿Quieres reservar o probar?`, { ...next, intent: "pricing" });
    }
    case "greeting":
    case "thanks":
      return noAction(
        `Gracias por llamar a ${ctx.businessName}. Soy ${ctx.agentName}: te ayudo con reservas, horarios y precios. ¿Qué necesitas?`,
        { ...next, intent: "idle" }
      );
    default: {
      // Palabras de web o despedida.
      if (/(web|página|pagina|enlace|link|sitio)/.test(lower)) {
        return noAction(
          ctx.siteUrl ? `Puedes vernos en ${ctx.siteUrl}. ¿Quieres que te reserve algo mientras tanto?` : `Todavía no tenemos web publicada, pero puedo ayudarte a reservar por teléfono. ¿Quieres?`,
          { ...next, intent: "web" }
        );
      }
      if (/(adiós|adios|hasta luego|hasta pronto|nada más|nada mas)/.test(lower)) {
        return noAction(`Hasta luego${ctx.lead?.firstName ? `, ${ctx.lead.firstName}` : ""}. ¡Gracias por llamar a ${ctx.businessName}!`, { ...emptyVoiceSession(), turnCount: next.turnCount });
      }
      return noAction(
        `No estoy seguro de haberlo entendido. Puedo ayudarte a reservar, decirte horarios o precios. ¿Qué prefieres?`,
        { ...next, intent: "idle" }
      );
    }
  }
}

/* ============================ Prompt LLM por tenant ============================ */

/**
 * Construye el system prompt del agente de voz con TODO el contexto que
 * el cliente ya tiene en el CRM. Es el corazón del patrón "code-once,
 * parametrize-by-tenant": el mismo prompt sirve a cualquier vertical y
 * solo cambian los datos inyectados en runtime.
 */
export function buildSystemPromptForTenant(
  ctx: VoiceOrgContext,
  caller: VoiceCaller
): string {
  const servicesLines = ctx.services.length
    ? ctx.services
        .map((s) => {
          const price = s.price_eur != null ? `${s.price_eur}€` : "consultar";
          const dur = s.duration_min ? ` (~${s.duration_min} min)` : "";
          return `  - ${s.name}: ${price}${dur}${s.description ? ` — ${s.description}` : ""}`;
        })
        .join("\n")
    : "  (no hay servicios configurados; si preguntan precios, deriva al equipo humano)";

  const leadLines = ctx.lead
    ? [
        `  - Nombre: ${[ctx.lead.firstName, ctx.lead.lastName].filter(Boolean).join(" ") || "desconocido"}`,
        `  - Teléfono: ${ctx.lead.phone ?? "desconocido"}`,
        `  - Estado en CRM: ${ctx.lead.status}`,
        ctx.lead.tags.length ? `  - Etiquetas: ${ctx.lead.tags.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "  (llamante nuevo, no está en el CRM todavía)";

  const historyLines =
    ctx.recentMessages && ctx.recentMessages.length
      ? ctx.recentMessages
          .slice(-6)
          .map((m) => `  ${m.sender === "client" ? "Cliente" : "Equipo"}: ${m.body}`)
          .join("\n")
      : "  (sin historial previo)";

  const rulesLines = ctx.customRules?.trim()
    ? ctx.customRules
    : "  No hay reglas extra configuradas.";

  const availableNow = ctx.openHours || "no definido";

  return [
    `Eres ${ctx.agentName}, el agente telefónico de ${ctx.businessName}.`,
    `Tu tono de voz es: ${ctx.tone}.`,
    "",
    `## Tu misión`,
    `Atiendes llamadas de clientes por teléfono. Responde SIEMPRE en español, de forma`,
    `natural y hablada (frases cortas, sin markdown, sin emojis). Si no sabes algo,`,
    `ofrece derivar a un humano del equipo. Nunca inventes precios, horarios ni reservas.`,
    "",
    `## Servicios y precios (del CRM de ${ctx.businessName})`,
    servicesLines,
    "",
    `## Horario`,
    availableNow,
    "",
    `## Reglas de negocio`,
    rulesLines,
    "",
    `## Contexto del llamante (del CRM)`,
    leadLines,
    "",
    `## Historial reciente con este cliente`,
    historyLines,
    "",
    `## Herramienta disponible: create_booking`,
    `Cuando el cliente pida reservar y tengas día, hora y nº de personas (y el nombre si`,
    `es nuevo), responde CONFIRMANDO la reserva y añade al final de tu respuesta un`,
    `bloque JSON así:`,
    `__TOOL__{"tool":"create_booking","payload":{"date":"YYYY-MM-DD","time":"HH:MM","party_size":N,"service_id":"...","service_name":"...","customer_name":"...","phone":"..."}}`,
    "",
    `Reglas del flujo de reserva:`,
    ` 1. Pide un dato cada vez (primero el día).`,
    ` 2. Si no hay hueco ese día, ofrece otro día sin inventar disponibilidad.`,
    ` 3. Solo emite __TOOL__ cuando el cliente haya confirmado explícitamente.`,
    ` 4. Usa el teléfono del llamante (${caller.phone ?? "desconocido"}) en el payload.`,
  ].join("\n");
}
