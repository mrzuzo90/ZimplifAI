import { LEAD_STATUSES, type LeadStatus, type PipelineStage } from "@/types/database";

export interface StatusConfig {
  status: LeadStatus;
  label: string;
  /** clase tailwind del acento de columna */
  accent: string;
  /** badge variant */
  badge: "volt" | "info" | "warning" | "success" | "muted" | "destructive";
}

/** Columna del kanban derivada de una etapa de pipeline (multi-pipeline). */
export interface PipelineColumn {
  stageId: string;
  status: LeadStatus;
  label: string;
  /** color hex de la etapa, si el pipeline lo define */
  color: string | null;
  /** acento de fallback del estado canónico */
  accent: string;
  badge: StatusConfig["badge"];
}

/** Pipeline canónico: una columna por estado del lead. */
export const STATUS_CONFIG: StatusConfig[] = [
  { status: "new", label: "Nuevo", accent: "text-muted-foreground", badge: "muted" },
  { status: "ai_contacted", label: "Contactado por IA", accent: "text-info", badge: "info" },
  { status: "qualified", label: "Cualificado", accent: "text-warning", badge: "warning" },
  { status: "booked", label: "Reservado", accent: "text-[var(--tenant-primary)]", badge: "volt" },
  { status: "closed_won", label: "Cerrado ganado", accent: "text-success", badge: "success" },
  { status: "closed_lost", label: "Cerrado perdido", accent: "text-destructive", badge: "destructive" },
];

export const STATUS_MAP: Record<LeadStatus, StatusConfig> = Object.fromEntries(
  STATUS_CONFIG.map((c) => [c.status, c])
) as Record<LeadStatus, StatusConfig>;

export const STATUS_ORDER = LEAD_STATUSES;

export function isTerminalStatus(status: LeadStatus): boolean {
  return status === "closed_won" || status === "closed_lost";
}

/** Columnas del kanban desde las etapas de un pipeline (orden, nombre y color propios). */
export function columnsFromStages(stages: PipelineStage[]): PipelineColumn[] {
  return [...stages]
    .sort((a, b) => a.position - b.position)
    .map((s) => {
      const base = STATUS_MAP[s.status];
      return {
        stageId: s.id,
        status: s.status,
        label: s.name,
        color: s.color ?? null,
        accent: base?.accent ?? "text-muted-foreground",
        badge: base?.badge ?? "muted",
      };
    });
}

/** Fallback cuando un pipeline aún no tiene etapas: columnas del estado canónico. */
export function fallbackColumns(): PipelineColumn[] {
  return STATUS_CONFIG.map((c) => ({
    stageId: `status_${c.status}`,
    status: c.status,
    label: c.label,
    color: null,
    accent: c.accent,
    badge: c.badge,
  }));
}
