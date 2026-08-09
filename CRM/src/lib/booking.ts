import type { AvailabilityRule, Booking } from "@/types/database";

/**
 * Lógica pura de reservas de citas: tokens, horas y generación de slots.
 * Sin dependencias de UI ni de acceso a datos (testeable y reutilizable).
 */

/** Token opaco de gestión (cancelación/reagenda) para una reserva. */
export function generateBookingToken(): string {
  const rnd = () => Math.random().toString(36).slice(2, 10);
  return `bk_${rnd()}${rnd()}`;
}

/** "09:30" → 570 (minutos desde medianoche). -1 si el formato no es válido. */
export function parseTime(time: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return -1;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return -1;
  return h * 60 + min;
}

/** 570 → "09:30". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Suma minutos a una hora "HH:MM". */
export function addMinutes(time: string, minutes: number): string {
  const base = parseTime(time);
  return base < 0 ? time : formatMinutes(base + minutes);
}

/** Comprueba si una hora está dentro del rango [start, end). */
export function timeInRange(time: string, start: string, end: string): boolean {
  const t = parseTime(time);
  const s = parseTime(start);
  const e = parseTime(end);
  return t >= s && t < e;
}

export interface DaySlot {
  time: string;
  available: boolean;
  remaining: number;
  capacity: number;
}

/**
 * Genera los slots de un día a partir de las franjas semanales activas.
 * Cada franja produce slots cada `slotMinutes` (por defecto 30) mientras
 * quepa la duración del servicio; las reservas ya existentes descuentan
 * aforo en su slot concreto.
 */
export function buildDaySlots(opts: {
  rules: AvailabilityRule[];
  dayOfWeek: number;
  bookings: Booking[];
  durationMin: number;
  slotMinutes?: number;
}): DaySlot[] {
  const { rules, dayOfWeek, bookings, durationMin, slotMinutes = 30 } = opts;
  const activeRules = rules.filter((r) => r.is_active && r.day_of_week === dayOfWeek);
  const slots: DaySlot[] = [];

  for (const rule of activeRules) {
    const start = parseTime(rule.start_time);
    const end = parseTime(rule.end_time);
    if (start < 0 || end < 0 || end <= start) continue;
    const capacity = Math.max(1, rule.capacity);

    for (let t = start; t + durationMin <= end; t += slotMinutes) {
      const time = formatMinutes(t);
      const occupied = bookings.filter((b) => {
        const bm = parseTime(new Date(b.booking_date).toTimeString().slice(0, 5));
        return bm === t;
      }).length;
      const remaining = Math.max(0, capacity - occupied);
      slots.push({ time, available: remaining > 0, remaining, capacity });
    }
  }

  return slots.sort((a, b) => a.time.localeCompare(b.time));
}

/** Etiqueta legible de un día de la semana (0=domingo). */
export function weekdayLabel(dayOfWeek: number): string {
  return ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][dayOfWeek] ?? "";
}
