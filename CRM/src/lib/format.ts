import { format, formatDistanceToNowStrict } from "date-fns";
import { es } from "date-fns/locale";

/** Moneda con formato español (EUR por defecto). */
export function formatCurrency(value: number | null | undefined, currency = "EUR"): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

/** Fecha corta, e.g. "12 ago". */
export function formatDateShort(date: string | Date): string {
  return format(new Date(date), "d MMM", { locale: es });
}

/** Fecha con hora, e.g. "12 ago, 21:30". */
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), "d MMM, HH:mm", { locale: es });
}

/** Día largo, e.g. "Viernes, 12 de agosto". */
export function formatDayLong(date: string | Date): string {
  return format(new Date(date), "EEEE, d 'de' MMMM", { locale: es });
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), "HH:mm", { locale: es });
}

/** Valor para `<input type="datetime-local">` (yyyy-MM-ddTHH:mm, hora local). */
export function formatDateTimeLocal(date: string | Date): string {
  return format(new Date(date), "yyyy-MM-dd'T'HH:mm");
}

/** Distancia relativa, e.g. "hace 5 min". */
export function formatRelative(date: string | Date): string {
  return formatDistanceToNowStrict(new Date(date), { locale: es, addSuffix: true });
}

/** Tokens de IA con separador de miles. */
export function formatTokens(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("es-ES").format(value);
}

/** Número entero con separador español. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-ES").format(value);
}
