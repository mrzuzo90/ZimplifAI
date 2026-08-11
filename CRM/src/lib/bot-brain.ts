import type { AvailabilityRule, Booking, Calendar } from "@/types/database";
import { buildDaySlots, type DaySlot } from "@/lib/booking";
import { detectIntent } from "@/lib/inbox";
import type { InlineKeyboardButton } from "@/lib/telegram";

/**
 * Motor de conversación del bot de reservas — 100% por organización.
 *
 * Recibe un `BotOrgContext` con TODO lo que el cliente ya tiene en su
 * subcuenta (nombre, horarios, franjas, aforo, reservas, web) y devuelve
 * la respuesta + el siguiente estado de la conversación. No conoce ni
 * tokens ni canales: es puro y replicable para cualquier organización.
 */

export interface BotOrgContext {
  orgId: string;
  businessName: string;
  /** P. ej. "12:00–16:00, 20:00–23:30" (settings de booking_calendar). */
  openHours: string;
  /** Web pública del cliente (micro-sitio), si tiene. */
  siteUrl: string;
  calendars: Calendar[];
  rules: AvailabilityRule[];
  bookings: Booking[];
}

export interface BotUser {
  id: number;
  firstName: string;
  username?: string;
}

export interface BookingInput {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  partySize: number;
  customerName: string;
  telegramUserId: number;
  telegramUsername?: string;
}

/** Acciones de persistencia inyectadas por la capa de transporte (webhook). */
export interface BotActions {
  createBooking(input: BookingInput): Promise<{ ok: true; token: string } | { ok: false; error: string }>;
}

export type BotStep =
  | "idle"
  | "booking_date"
  | "booking_party"
  | "booking_time"
  | "booking_name";

export interface BotSession {
  step: BotStep;
  dateStr: string | null;
  partySize: number | null;
  time: string | null;
  name: string | null;
}

export function emptySession(): BotSession {
  return { step: "idle", dateStr: null, partySize: null, time: null, name: null };
}

export interface BotReply {
  text: string;
  keyboard?: InlineKeyboardButton[][];
}

const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/* ============================ Helpers de fecha/hora ============================ */

function fmt(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextWeekday(target: number): Date {
  const now = new Date();
  now.setHours(12, 0, 0, 0);
  const diff = (target - now.getDay() + 7) % 7 || 7;
  now.setDate(now.getDate() + diff);
  return now;
}

/** Parsea "hoy", "mañana", un día de la semana o una fecha corta → YYYY-MM-DD. */
export function parseDate(text: string): string | null {
  const t = text.toLowerCase().trim();
  if (t.startsWith("date:")) return parseDate(t.slice(5));
  if (["hoy", "today", "esta noche", "tonight", "ahora"].includes(t)) return fmt(new Date());
  if (["mañana", "manana", "tomorrow", "mañana por la noche"].includes(t)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return fmt(d);
  }
  // "viernes", "sábado", "martes"…
  const wd = WEEKDAYS.findIndex((w) => t.startsWith(w.toLowerCase().slice(0, 3)));
  if (wd >= 0) return fmt(nextWeekday(wd));
  // "12/08" o "12-08" (DD/MM) → este año (o el siguiente si ya pasó).
  const m = /^(\d{1,2})[/-](\d{1,2})$/.exec(t);
  if (m) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const now = new Date();
    let year = now.getFullYear();
    const candidate = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (candidate < now) year += 1;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (iso) return t;
  return null;
}

/** "2026-08-12" → "miércoles 12 de agosto". */
export function formatDateEs(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const month = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ][dt.getMonth()];
  return `${WEEKDAYS[dt.getDay()]} ${d} de ${month}`;
}

export function parseTime(text: string): string | null {
  let t = text.toLowerCase().trim();
  if (t.startsWith("slot:")) t = t.slice(5);
  const m = /^(\d{1,2})[:.](\d{2})$/.exec(t);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function parsePartySize(text: string): number | null {
  const m = /(\d{1,2})/.exec(text);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= 50 ? n : null;
}

/* ============================ Disponibilidad ============================ */

function slotsFor(ctx: BotOrgContext, dateStr: string, partySize: number): DaySlot[] {
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

function slotKeyboard(slots: DaySlot[]): InlineKeyboardButton[][] {
  const rows: InlineKeyboardButton[][] = [];
  let row: InlineKeyboardButton[] = [];
  for (const s of slots) {
    row.push({ text: `${s.time} (${s.remaining})`, callback_data: `slot:${s.time}` });
    if (row.length === 3) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) rows.push(row);
  return rows;
}

function dateQuickKeyboard(): InlineKeyboardButton[][] {
  const rows: InlineKeyboardButton[][] = [
    [{ text: "Hoy", callback_data: "date:today" }],
    [{ text: "Mañana", callback_data: "date:tomorrow" }],
  ];
  const next: InlineKeyboardButton[] = [];
  for (let i = 0; i < 3; i++) {
    const d = new Date();
    d.setDate(d.getDate() + 2 + i);
    next.push({ text: WEEKDAYS[d.getDay()], callback_data: `date:${fmt(d)}` });
  }
  rows.push(next);
  return rows;
}

function mainMenuKeyboard(): InlineKeyboardButton[][] {
  return [
    [{ text: "🍽️ Reservar mesa", callback_data: "/reservar" }],
    [
      { text: "🕐 Horario", callback_data: "/horario" },
      { text: "🌐 Web", callback_data: "/web" },
    ],
  ];
}

/* ============================ Turno principal ============================ */

/**
 * Procesa un mensaje (o callback) y devuelve la respuesta + el siguiente
 * estado. `text` puede ser el texto plano del cliente o un callback_data
 * del teclado inline ("date:…", "slot:…", "/comando").
 */
export async function runBotTurn(
  ctx: BotOrgContext,
  user: BotUser,
  text: string,
  session: BotSession,
  actions: BotActions
): Promise<{ reply: BotReply; session: BotSession }> {
  const t = text?.trim() ?? "";
  const lower = t.toLowerCase();

  const command = /^\/(start|reservar|disponibilidad|horario|web|cancelar|ayuda)$/.exec(t);
  if (command) {
    switch (command[1]) {
      case "start":
      case "ayuda":
        return {
          reply: menuReply(ctx),
          session,
        };
      case "reservar":
        return {
          reply: askDateReply(ctx),
          session: { ...emptySession(), step: "booking_date" },
        };
      case "disponibilidad":
        return {
          reply: disponibilityReply(ctx, fmt(new Date())),
          session,
        };
      case "horario":
        return { reply: hoursReply(ctx), session };
      case "web":
        return { reply: webReply(ctx), session };
      case "cancelar":
        return {
          reply: { text: "Reserva cancelada. ¿Quieres empezar otra? /reservar", keyboard: mainMenuKeyboard() },
          session: emptySession(),
        };
    }
  }

  // --- Flujo de reserva en curso ---
  if (session.step !== "idle") {
    switch (session.step) {
      case "booking_date": {
        const date = parseDate(t);
        if (!date) {
          return {
            reply: {
              text: "No te he entendido la fecha 😅. Dime hoy, mañana, un día de la semana (p. ej. viernes) o una fecha (p. ej. 12/08).",
              keyboard: dateQuickKeyboard(),
            },
            session,
          };
        }
        return {
          reply: {
            text: `¿Para cuántas personas sería la mesa del ${formatDateEs(date)}?`,
          },
          session: { ...session, step: "booking_party", dateStr: date },
        };
      }
      case "booking_party": {
        const party = parsePartySize(t);
        if (!party) {
          return {
            reply: { text: "¿Cuántas personas sois? Dime un número, p. ej. “4 personas”." },
            session,
          };
        }
        const date = session.dateStr ?? fmt(new Date());
        const slots = slotsFor(ctx, date, party);
        if (slots.length === 0) {
          return {
            reply: {
              text: `Lo siento, el ${formatDateEs(date)} no quedan mesas libres para ${party} personas 😕. Prueba otra fecha:`,
              keyboard: dateQuickKeyboard(),
            },
            session: { ...session, step: "booking_date", partySize: null, dateStr: null },
          };
        }
        return {
          reply: {
            text: `El ${formatDateEs(date)} tengo estas horas libres para ${party} personas (entre paréntesis, mesas libres):`,
            keyboard: slotKeyboard(slots),
          },
          session: { ...session, step: "booking_time", partySize: party },
        };
      }
      case "booking_time": {
        const time = parseTime(t);
        const date = session.dateStr ?? fmt(new Date());
        const party = session.partySize ?? 2;
        if (!time) {
          const slots = slotsFor(ctx, date, party);
          return {
            reply: {
              text: "Elige una hora de las disponibles:",
              keyboard: slotKeyboard(slots),
            },
            session,
          };
        }
        const available = slotsFor(ctx, date, party).some((s) => s.time === time);
        if (!available) {
          return {
            reply: {
              text: `A las ${time} no tengo hueco para ${party} personas. Mira estas horas:`,
              keyboard: slotKeyboard(slotsFor(ctx, date, party)),
            },
            session,
          };
        }
        return {
          reply: {
            text: "¿Me dices tu nombre para dejar la reserva a tu nombre?",
          },
          session: { ...session, step: "booking_name", time },
        };
      }
      case "booking_name": {
        const name = t.replace(/^me llamo\s+/i, "").trim();
        if (!name || name.length < 2) {
          return {
            reply: { text: "¿Y tu nombre? (p. ej. “Ana García”)" },
            session,
          };
        }
        const date = session.dateStr ?? fmt(new Date());
        const party = session.partySize ?? 2;
        const time = session.time ?? "12:00";
        const res = await actions.createBooking({
          date,
          time,
          partySize: party,
          customerName: name,
          telegramUserId: user.id,
          telegramUsername: user.username,
        });
        if (!res.ok) {
          return {
            reply: { text: `No he podido guardar la reserva 😕 (${res.error}). Inténtalo de nuevo con /reservar.` },
            session: emptySession(),
          };
        }
        return {
          reply: {
            text:
              `✅ ¡Reserva confirmada en ${ctx.businessName}!\n\n` +
              `📅 ${formatDateEs(date)} a las ${time}\n` +
              `👥 ${party} ${party === 1 ? "persona" : "personas"} · a nombre de ${name}\n\n` +
              `Tu código de gestión: \`${res.token}\`\n` +
              `Si necesitas cambiarla o anularla, avísanos y lo gestionamos.`,
            keyboard: mainMenuKeyboard(),
          },
          session: emptySession(),
        };
      }
    }
  }

  // --- Intención en lenguaje natural (sin flujo en curso) ---
  if (/(web|página|pagina|enlace|link)\s*(web)?/.test(lower)) {
    return { reply: webReply(ctx), session };
  }
  switch (detectIntent(t)) {
    case "booking_request":
      return { reply: askDateReply(ctx), session: { ...emptySession(), step: "booking_date" } };
    case "hours":
      return { reply: hoursReply(ctx), session };
    case "greeting":
    case "thanks":
      return { reply: menuReply(ctx), session };
    default:
      return { reply: fallbackReply(ctx), session };
  }
}

/* ============================ Respuestas ============================ */

function menuReply(ctx: BotOrgContext): BotReply {
  return {
    text:
      `Hola 👋 Soy el bot de reservas de *${ctx.businessName}*.\n\n` +
      `¿Qué quieres hacer?\n` +
      `🍽️ /reservar — ver disponibilidad y reservar mesa\n` +
      `🕐 /horario — horario de apertura\n` +
      `🌐 /web — abrir nuestra web\n` +
      `✖️ /cancelar — cancelar una reserva en curso`,
    keyboard: mainMenuKeyboard(),
  };
}

function askDateReply(ctx: BotOrgContext): BotReply {
  return {
    text:
      `Claro, vamos a reservar en ${ctx.businessName} 🍽️\n\n` +
      `¿Para qué día quieres la mesa? (hoy, mañana, un día de la semana o una fecha como 12/08)`,
    keyboard: dateQuickKeyboard(),
  };
}

function hoursReply(ctx: BotOrgContext): BotReply {
  const h = ctx.openHours || "no lo tenemos publicado ahora mismo";
  return {
    text: `🕐 Horario de *${ctx.businessName}*:\n\n${h}\n\n¿Quieres reservar mesa? /reservar`,
  };
}

function webReply(ctx: BotOrgContext): BotReply {
  if (!ctx.siteUrl) {
    return {
      text: "Todavía no tenemos web publicada, pero puedes reservar mesa por aquí: /reservar",
    };
  }
  return {
    text: `🌐 Aquí tienes nuestra web:\n${ctx.siteUrl}\n\n¿Te reservo algo mientras la miras? /reservar`,
  };
}

function fallbackReply(ctx: BotOrgContext): BotReply {
  return {
    text:
      `No estoy seguro de haber entendido 😅. Puedo ayudarte con:\n` +
      `🍽️ /reservar · 🕐 /horario · 🌐 /web`,
    keyboard: mainMenuKeyboard(),
  };
}

/** Disponibilidad rápida de hoy (sin iniciar flujo). */
function disponibilityReply(ctx: BotOrgContext, dateStr: string): BotReply {
  const slots = slotsFor(ctx, dateStr, 1);
  if (slots.length === 0) {
    return {
      text: `Hoy no quedan mesas libres 😕. Prueba mañana: /reservar`,
    };
  }
  return {
    text:
      `📊 Mesas libres hoy (${formatDateEs(dateStr)}):\n\n` +
      slots.map((s) => `• ${s.time} — ${s.remaining} ${s.remaining === 1 ? "mesa" : "mesas"}`).join("\n") +
      `\n\n¿Reservas una? /reservar`,
  };
}
