import type { ActivityEventType, LeadStatus } from "@/types/database";

/**
 * Meta de eventos del timeline de actividad.
 * Módulo de datos puros (sin React) para que data-access pueda
 * usarlo en los summaries legibles de los eventos.
 */

/** Label + clase de acento por tipo de evento. */
export const ACTIVITY_META: Record<ActivityEventType, { label: string; accent: string }> = {
  lead_created: { label: "Lead creado", accent: "text-info" },
  stage_changed: { label: "Cambio de estado", accent: "text-warning" },
  comment: { label: "Nota", accent: "text-[var(--tenant-primary)]" },
  whatsapp_reply: { label: "Respuesta de WhatsApp", accent: "text-success" },
  booking_confirmed: { label: "Reserva confirmada", accent: "text-success" },
  follow_up_set: { label: "Seguimiento programado", accent: "text-info" },
};

/** Labels cortos de estado del pipeline (para summaries legibles). */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nuevo",
  ai_contacted: "Contactado por IA",
  qualified: "Cualificado",
  booked: "Reservado",
  closed_won: "Cerrado ganado",
  closed_lost: "Cerrado perdido",
};

/** Construye un summary legible a partir de un evento (usa metadata.from/to). */
export function summarizeActivity(
  eventType: ActivityEventType,
  metadata: Record<string, unknown>
): string {
  if (eventType === "stage_changed") {
    const from = LEAD_STATUS_LABELS[metadata.from as LeadStatus];
    const to = LEAD_STATUS_LABELS[metadata.to as LeadStatus];
    if (from && to) return `Movido de «${from}» a «${to}»`;
    return "Cambio de estado";
  }
  return ACTIVITY_META[eventType].label;
}
