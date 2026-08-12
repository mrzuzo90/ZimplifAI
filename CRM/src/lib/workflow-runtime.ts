import {
  listWorkflows,
  listLeads,
  listAgents,
  addWorkflowRun,
  addWorkflowRunStep,
  listWorkflowRuns,
  patchWorkflowRun,
} from "@/lib/mock-store";
import { executeNode, orderNodes } from "@/lib/workflows";
import { shortId } from "@/lib/utils";
import type {
  Lead,
  Workflow,
  WorkflowRun,
  WorkflowRunStep,
  WorkflowTriggerType,
} from "@/types/database";

/**
 * Runtime de automatizaciones (dispatcher de triggers).
 *
 * Ejecuta los workflows ACTIVOS cuyo trigger coincide con el evento que acaba
 * de ocurrir (lead_created, booking_created, message_incoming, stage_changed).
 * Cada ejecución crea una `workflow_runs` + sus `workflow_run_steps`, de modo
 * que la pestaña "Runs" del CRM muestra la automatización real.
 *
 * Backend dual (el cliente lo inyecta el llamador):
 *  - Cliente Supabase (browser o service) → SOLO Supabase.
 *  - Sin cliente (null) → mock-store (modo demo).
 *
 * El ejecutor de nodos es determinista (executeNode): los envíos reales de
 * WhatsApp/email y las esperas (`wait`) se materializan cuando conectemos los
 * canales de salida; hoy queda registrado el paso con su payload, igual que el
 * resto del CRM en modo demo.
 */
export interface WorkflowTriggerContext {
  leadId?: string | null;
  bookingId?: string | null;
  threadId?: string | null;
  /** Metadatos extra que se copian como `trigger_context` en cada paso. */
  meta?: Record<string, unknown>;
}

// Tipo genérico compatible con Supabase Client (browser y service_role)
// Usamos `any` para el query builder porque SupabaseClient<Database> tiene
// tipos internos complejos (PostgrestQueryBuilder, PostgrestFilterBuilder, etc.)
// que varían entre cliente browser y service_role. La estructura de métodos
// (select, eq, insert, update, delete, single, maybeSingle) es compatible.
type AnySupabase = {
  from: (table: string) => any;
};

/* ===================== Helpers backend dual ===================== */

async function findActiveWorkflows(
  orgId: string,
  trigger: WorkflowTriggerType,
  sb: AnySupabase | null
): Promise<Workflow[]> {
  if (sb) {
    const { data, error } = await sb
      .from("workflows")
      .select("*")
      .eq("organization_id", orgId)
      .eq("trigger_type", trigger)
      .eq("is_active", true);
    if (error) throw error;
    return data ?? [];
  }
  return listWorkflows(orgId).filter((w) => w.is_active && w.trigger_type === trigger);
}

async function findLeadById(
  orgId: string,
  leadId: string,
  sb: AnySupabase | null
): Promise<Lead | null> {
  if (sb) {
    const { data, error } = await sb
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (error) throw error;
    return (data as Lead | null) ?? null;
  }
  return listLeads(orgId).find((l) => l.id === leadId) ?? null;
}

async function findAgents(
  orgId: string,
  sb: AnySupabase | null
): Promise<Array<{ id: string; name: string }>> {
  if (sb) {
    const { data, error } = await sb
      .from("ai_agents")
      .select("id, name")
      .eq("organization_id", orgId);
    if (error) throw error;
    return data ?? [];
  }
  return listAgents(orgId).map((a) => ({ id: a.id, name: a.name }));
}

async function createRun(
  orgId: string,
  workflowId: string,
  leadId: string | null,
  sb: AnySupabase | null
): Promise<string> {
  const startedAt = new Date().toISOString();
  if (sb) {
    const { data, error } = await sb
      .from("workflow_runs")
      .insert({
        organization_id: orgId,
        workflow_id: workflowId,
        lead_id: leadId,
        status: "running",
        started_at: startedAt,
        finished_at: null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }
  const run: WorkflowRun = {
    id: `run_${shortId()}`,
    organization_id: orgId,
    workflow_id: workflowId,
    lead_id: leadId,
    status: "running",
    started_at: startedAt,
    finished_at: null,
  };
  addWorkflowRun(run);
  return run.id;
}

async function saveStep(
  orgId: string,
  runId: string,
  node: Workflow["nodes"][number],
  result: { status: WorkflowRunStep["status"]; output: Record<string, unknown>; error?: string },
  sb: AnySupabase | null
): Promise<void> {
  if (sb) {
    const { error } = await sb.from("workflow_run_steps").insert({
      organization_id: orgId,
      workflow_run_id: runId,
      node_id: node.id,
      input_payload: node.config,
      output_payload: result.output,
      status: result.status,
      error_message: result.error ?? null,
      executed_at: new Date().toISOString(),
    });
    if (error) throw error;
    return;
  }
  const step: WorkflowRunStep = {
    id: `step_${shortId()}`,
    organization_id: orgId,
    workflow_run_id: runId,
    node_id: node.id,
    input_payload: node.config,
    output_payload: result.output,
    status: result.status,
    error_message: result.error ?? null,
    executed_at: new Date().toISOString(),
  };
  addWorkflowRunStep(step);
}

async function finishRun(
  orgId: string,
  runId: string,
  status: WorkflowRun["status"],
  sb: AnySupabase | null
): Promise<void> {
  const finishedAt = new Date().toISOString();
  if (sb) {
    await sb
      .from("workflow_runs")
      .update({ status, finished_at: finishedAt })
      .eq("id", runId)
      .eq("organization_id", orgId);
    return;
  }
  patchWorkflowRun(runId, { status, finished_at: finishedAt });
}

async function getRun(orgId: string, runId: string, sb: AnySupabase | null): Promise<WorkflowRun> {
  if (sb) {
    const { data, error } = await sb
      .from("workflow_runs")
      .select("*")
      .eq("id", runId)
      .eq("organization_id", orgId)
      .single();
    if (error) throw error;
    return data;
  }
  const run = listWorkflowRuns(orgId).find((r) => r.id === runId);
  if (!run) throw new Error("Run no encontrada");
  return run;
}

/* ===================== API pública ===================== */

/**
 * Dispara los workflows activos de una organización cuyo trigger coincide con
 * el evento. Devuelve las runs creadas (vacío si no hay workflows o si algo
 * falla — un error de automatización NUNCA rompe la operación principal que
 * lo originó, p.ej. crear un lead o una reserva).
 *
 * @param client Cliente Supabase inyectado por el llamador (browser client en
 *   la UI, service client en los flujos server-side como el bot de Telegram).
 *   Si es null/undefined se usa mock-store (modo demo).
 */
export async function fireWorkflowTriggers(
  orgId: string,
  trigger: WorkflowTriggerType,
  ctx: WorkflowTriggerContext = {},
  client?: AnySupabase | null
): Promise<WorkflowRun[]> {
  const sb = client ?? null;
  try {
    const workflows = await findActiveWorkflows(orgId, trigger, sb);
    if (workflows.length === 0) return [];

    const lead = ctx.leadId ? await findLeadById(orgId, ctx.leadId, sb) : null;
    const agents = await findAgents(orgId, sb);
    const runs: WorkflowRun[] = [];

    for (const workflow of workflows) {
      const runId = await createRun(orgId, workflow.id, ctx.leadId ?? null, sb);
      const orderedNodes = orderNodes(workflow.nodes, workflow.edges);
      let finalStatus: WorkflowRun["status"] = "completed";

      for (const node of orderedNodes) {
        const result = executeNode(node, lead, { agents });
        await saveStep(orgId, runId, node, result, sb);
        if (result.status === "failed") {
          finalStatus = "failed";
          break; // un paso que falla aborta la automatización
        }
      }

      await finishRun(orgId, runId, finalStatus, sb);
      runs.push(await getRun(orgId, runId, sb));
    }

    return runs;
  } catch (err) {
    console.error(`[workflow-runtime] fallo al disparar trigger "${trigger}"`, err);
    return [];
  }
}
