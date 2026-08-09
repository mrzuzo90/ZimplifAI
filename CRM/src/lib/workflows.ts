import {
  ArrowLeftRight,
  Clock,
  GitBranch,
  Mail,
  MessageSquare,
  Sparkles,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { es } from "@/lib/i18n/es";
import type {
  Lead,
  VerticalType,
  Workflow,
  WorkflowEdge,
  WorkflowNode,
  WorkflowNodeType,
  WorkflowTriggerType,
} from "@/types/database";

/**
 * Dominio puro de la automatización visual (Fase A).
 * Meta de nodos/disparadores, plantillas verticales y un ejecutor
 * determinista para simular pasos en modo demo / re-ejecución.
 */

export const TRIGGER_LABEL: Record<WorkflowTriggerType, string> = {
  lead_created: es.workflowTrigger.lead_created,
  stage_changed: es.workflowTrigger.stage_changed,
  booking_created: es.workflowTrigger.booking_created,
  message_incoming: es.workflowTrigger.message_incoming,
  webhook: es.workflowTrigger.webhook,
  schedule: es.workflowTrigger.schedule,
};

export const TRIGGERS: WorkflowTriggerType[] = [
  "lead_created",
  "stage_changed",
  "booking_created",
  "message_incoming",
  "webhook",
  "schedule",
];

interface NodeMeta {
  label: string;
  icon: LucideIcon;
  accent: string; // clase tailwind de acento del nodo
}

export const NODE_META: Record<WorkflowNodeType, NodeMeta> = {
  send_whatsapp: {
    label: es.workflowNode.send_whatsapp,
    icon: MessageSquare,
    accent: "text-[#25D366]",
  },
  send_email: {
    label: es.workflowNode.send_email,
    icon: Mail,
    accent: "text-sky-400",
  },
  wait: {
    label: es.workflowNode.wait,
    icon: Clock,
    accent: "text-amber-400",
  },
  condition: {
    label: es.workflowNode.condition,
    icon: GitBranch,
    accent: "text-violet-400",
  },
  move_stage: {
    label: es.workflowNode.move_stage,
    icon: ArrowLeftRight,
    accent: "text-[var(--tenant-primary)]",
  },
  call_ai_agent: {
    label: es.workflowNode.call_ai_agent,
    icon: Sparkles,
    accent: "text-fuchsia-400",
  },
  webhook_out: {
    label: es.workflowNode.webhook_out,
    icon: Webhook,
    accent: "text-cyan-400",
  },
};

export const NODE_TYPES: WorkflowNodeType[] = [
  "send_whatsapp",
  "send_email",
  "wait",
  "condition",
  "move_stage",
  "call_ai_agent",
  "webhook_out",
];

/** Config por defecto de cada tipo de nodo. */
export function defaultNodeConfig(type: WorkflowNodeType): Record<string, unknown> {
  switch (type) {
    case "send_whatsapp":
      return { message: "" };
    case "send_email":
      return { subject: "", body: "" };
    case "wait":
      return { amount: 2, unit: "hours" };
    case "condition":
      return { field: "status", op: "eq", value: "qualified" };
    case "move_stage":
      return { to_stage: "" };
    case "call_ai_agent":
      return { agent_id: null, prompt: "" };
    case "webhook_out":
      return { url: "", method: "POST", payload: "" };
  }
}

/** Nodo nuevo con id único. */
export function createNode(type: WorkflowNodeType, index: number): WorkflowNode {
  return {
    id: `n_${Date.now().toString(36)}_${index}`,
    type,
    label: NODE_META[type].label,
    config: defaultNodeConfig(type),
  };
}

/** Etapas de pipeline por vertical (para `move_stage` y el kanban). */
export const VERTICAL_PIPELINE_STAGES: Record<VerticalType, string[]> = {
  restaurant_booking: ["Nuevo", "Contactado por IA", "Cualificado", "Reservado", "Cerrado ganado", "Cerrado perdido"],
  service_lead_gen: ["Nuevo", "Contactado por IA", "Cualificado", "Propuesta enviada", "Cerrado ganado", "Cerrado perdido"],
  custom_agency: ["Nuevo", "Contactado por IA", "Cualificado", "Cerrado ganado", "Cerrado perdido"],
};

/**
 * Ordena los nodos según las aristas (orden topológico Kahn).
 * Los nodos sin aristas se anexan conservando su orden relativo.
 */
export function orderNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const incoming = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const adjacency = new Map<string, string[]>(nodes.map((n) => [n.id, []]));
  edges.forEach((e) => {
    if (!incoming.has(e.to)) return;
    incoming.set(e.to, (incoming.get(e.to) ?? 0) + 1);
    adjacency.get(e.from)?.push(e.to);
  });
  const queue = nodes.filter((n) => (incoming.get(n.id) ?? 0) === 0).map((n) => n.id);
  const seen = new Set<string>();
  const ordered: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    ordered.push(id);
    for (const next of adjacency.get(id) ?? []) {
      const deg = (incoming.get(next) ?? 1) - 1;
      incoming.set(next, deg);
      if (deg === 0) queue.push(next);
    }
  }
  const remaining = nodes.map((n) => n.id).filter((id) => !seen.has(id));
  const ids = [...ordered, ...remaining];
  return ids
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is WorkflowNode => Boolean(n));
}

/** Regenera aristas en cadena lineal a partir del orden de nodos. */
export function linearEdges(nodes: WorkflowNode[]): WorkflowEdge[] {
  const edges: WorkflowEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ id: `e_${i + 1}_${Date.now().toString(36)}`, from: nodes[i].id, to: nodes[i + 1].id });
  }
  return edges;
}

/** Resumen legible de la config de un nodo (chip bajo el título). */
export function nodeConfigSummary(node: WorkflowNode): string {
  const c = node.config;
  switch (node.type) {
    case "send_whatsapp":
      return (c.message as string)?.trim() ? String(c.message) : "Sin mensaje";
    case "send_email":
      return (c.subject as string)?.trim() ? String(c.subject) : "Sin asunto";
    case "wait":
      return `${c.amount ?? 2} ${c.unit === "days" ? "días" : "horas"}`;
    case "condition":
      return `${c.field ?? "status"} ${c.op === "ne" ? "≠" : "="} ${c.value ?? ""}`;
    case "move_stage":
      return String(c.to_stage ?? "—");
    case "call_ai_agent":
      return c.agent_id ? "Agente seleccionado" : "Sin agente";
    case "webhook_out":
      return String(c.url ?? "Sin URL");
  }
}

/* ===================== Plantillas verticales ===================== */

/** Clona una plantilla de workflow para una subcuenta recién provisionada. */
export function createVerticalWorkflowTemplate(vertical: VerticalType): Omit<Workflow, "id" | "organization_id" | "created_at" | "updated_at"> {
  const base: WorkflowNode[] = [
    { id: "n_1", type: "send_whatsapp", label: NODE_META.send_whatsapp.label, config: { message: "¡Hola {{first_name}}! Gracias por escribirnos. Un momento, te atiende nuestro equipo." } },
  ];

  if (vertical === "restaurant_booking") {
    return {
      name: "Bienvenida y cualificación de reservas",
      description: "Saluda al lead entrante, cualifica y mueve la etapa.",
      trigger_type: "lead_created",
      trigger_config: {},
      is_active: true,
      nodes: [
        ...base,
        { id: "n_2", type: "call_ai_agent", label: NODE_META.call_ai_agent.label, config: { agent_id: null, prompt: "Pide nº de comensales, fecha y hora. Confirma disponibilidad." } },
        { id: "n_3", type: "condition", label: NODE_META.condition.label, config: { field: "status", op: "eq", value: "qualified" } },
        { id: "n_4", type: "move_stage", label: NODE_META.move_stage.label, config: { to_stage: "Contactado por IA" } },
      ],
      edges: [
        { id: "e_1", from: "n_1", to: "n_2" },
        { id: "e_2", from: "n_2", to: "n_3" },
        { id: "e_3", from: "n_3", to: "n_4" },
      ],
    };
  }

  // service_lead_gen / custom_agency
  return {
    name: "Cualificación de leads entrantes",
    description: "Responde, puntúa y mueve el lead a la etapa correcta.",
    trigger_type: "lead_created",
    trigger_config: {},
    is_active: true,
    nodes: [
      ...base,
      { id: "n_2", type: "call_ai_agent", label: NODE_META.call_ai_agent.label, config: { agent_id: null, prompt: "Cualifica: necesidad, presupuesto, urgencia (A/B/C)." } },
      { id: "n_3", type: "condition", label: NODE_META.condition.label, config: { field: "deal_value", op: "gt", value: 500 } },
      { id: "n_4", type: "send_email", label: NODE_META.send_email.label, config: { subject: "Gracias por tu interés", body: "Hola {{first_name}}, hemos recibido tu consulta. Un comercial te contactará pronto." } },
    ],
    edges: [
      { id: "e_1", from: "n_1", to: "n_2" },
      { id: "e_2", from: "n_2", to: "n_3" },
      { id: "e_3", from: "n_3", to: "n_4" },
    ],
  };
}

/* ===================== Ejecutor determinista (demo) ===================== */

export interface NodeRunResult {
  status: "completed" | "failed" | "skipped";
  output: Record<string, unknown>;
  error?: string;
}

function leadValue(lead: Lead | null, field: string): unknown {
  if (!lead) return undefined;
  switch (field) {
    case "status":
      return lead.status;
    case "deal_value":
      return lead.deal_value;
    case "first_name":
      return lead.first_name;
    case "email":
      return lead.email;
    case "phone":
      return lead.phone;
    default:
      return (lead as unknown as Record<string, unknown>)[field];
  }
}

/** Resuelve {{variable}} con los datos del lead. */
function interpolate(template: string, lead: Lead | null): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const v = leadValue(lead, k);
    return v === null || v === undefined ? "" : String(v);
  });
}

/** Ejecuta un nodo contra un lead y devuelve resultado determinista. */
export function executeNode(
  node: WorkflowNode,
  lead: Lead | null,
  ctx: { agents?: Array<{ id: string; name: string }> } = {}
): NodeRunResult {
  const c = node.config;
  switch (node.type) {
    case "send_whatsapp": {
      const message = interpolate(String(c.message ?? ""), lead);
      if (!message.trim()) return { status: "failed", output: {}, error: "Mensaje vacío" };
      return { status: "completed", output: { channel: "whatsapp", message, to: lead?.phone ?? null } };
    }
    case "send_email": {
      const subject = interpolate(String(c.subject ?? ""), lead);
      const body = interpolate(String(c.body ?? ""), lead);
      if (!subject.trim() || !body.trim()) return { status: "failed", output: {}, error: "Asunto o cuerpo vacíos" };
      return { status: "completed", output: { channel: "email", subject, to: lead?.email ?? null } };
    }
    case "wait": {
      const amount = Number(c.amount ?? 2);
      return { status: "completed", output: { wait_ms: amount * (c.unit === "days" ? 86_400_000 : 3_600_000) } };
    }
    case "condition": {
      const actual = leadValue(lead, String(c.field ?? "status"));
      const expected = c.value;
      let ok = false;
      switch (c.op) {
        case "eq":
          ok = String(actual ?? "") === String(expected ?? "");
          break;
        case "ne":
          ok = String(actual ?? "") !== String(expected ?? "");
          break;
        case "gt":
          ok = Number(actual ?? 0) > Number(expected ?? 0);
          break;
        case "lt":
          ok = Number(actual ?? 0) < Number(expected ?? 0);
          break;
      }
      return { status: "completed", output: { branch: ok ? "yes" : "no", actual } };
    }
    case "move_stage": {
      const to = String(c.to_stage ?? "").trim();
      if (!to) return { status: "failed", output: {}, error: "Etapa destino vacía" };
      return { status: "completed", output: { from: lead?.status ?? null, to } };
    }
    case "call_ai_agent": {
      const agent = ctx.agents?.find((a) => a.id === c.agent_id);
      if (c.agent_id && !agent) return { status: "failed", output: {}, error: "Agente no encontrado" };
      return {
        status: "completed",
        output: {
          agent: agent?.name ?? "Agente por defecto",
          reply: interpolate(String(c.prompt ?? ""), lead) || "Mensaje procesado por IA",
          tokens_used: 96,
        },
      };
    }
    case "webhook_out": {
      const url = String(c.url ?? "").trim();
      if (!url) return { status: "failed", output: {}, error: "URL vacía" };
      return {
        status: "completed",
        output: { method: c.method ?? "POST", url, status_code: 200, sent: true },
      };
    }
  }
}
