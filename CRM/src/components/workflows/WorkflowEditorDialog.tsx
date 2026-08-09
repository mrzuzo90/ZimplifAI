"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Save,
  Trash2,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { es } from "@/lib/i18n/es";
import {
  NODE_META,
  NODE_TYPES,
  TRIGGERS,
  TRIGGER_LABEL,
  VERTICAL_PIPELINE_STAGES,
  createNode,
  linearEdges,
  nodeConfigSummary,
  orderNodes,
} from "@/lib/workflows";
import { createWorkflow, updateWorkflow } from "@/lib/data-access";
import { cn } from "@/lib/utils";
import type { AiAgent, VerticalType, Workflow, WorkflowNode, WorkflowNodeType } from "@/types/database";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  vertical: VerticalType;
  agents: AiAgent[];
  initial?: Workflow | null;
}

/** Editor visual de flujos: cadena de nodos + panel de configuración. */
export function WorkflowEditorDialog({ open, onOpenChange, orgId, vertical, agents, initial }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [triggerType, setTriggerType] = useState<Workflow["trigger_type"]>(initial?.trigger_type ?? "lead_created");
  const [nodes, setNodes] = useState<WorkflowNode[]>(() =>
    initial ? orderNodes(initial.nodes, initial.edges) : []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;
  const stages = VERTICAL_PIPELINE_STAGES[vertical];

  const setNode = (id: string, patch: Partial<WorkflowNode>) =>
    setNodes((cur) => cur.map((n) => (n.id === id ? { ...n, ...patch } : n)));

  const addNode = (type: WorkflowNodeType) => {
    const node = createNode(type, nodes.length);
    setNodes((cur) => [...cur, node]);
    setSelectedId(node.id);
  };

  const insertAfter = (id: string) => {
    const idx = nodes.findIndex((n) => n.id === id);
    const node = createNode("send_whatsapp", idx + 1);
    setNodes((cur) => [...cur.slice(0, idx + 1), node, ...cur.slice(idx + 1)]);
    setSelectedId(node.id);
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = nodes.findIndex((n) => n.id === id);
    const target = idx + dir;
    if (target < 0 || target >= nodes.length) return;
    setNodes((cur) => {
      const next = [...cur];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const remove = (id: string) => {
    setNodes((cur) => cur.filter((n) => n.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const save = async () => {
    if (!name.trim() || nodes.length === 0) {
      toast.error("Dale un nombre y al menos un nodo al workflow");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        trigger_type: triggerType,
        trigger_config: initial?.trigger_config ?? {},
        nodes,
        edges: linearEdges(nodes),
      };
      if (initial) {
        await updateWorkflow(orgId, initial.id, payload);
      } else {
        await createWorkflow(orgId, payload);
      }
      toast.success(es.workflow.saveSuccess);
      onOpenChange(false);
    } catch {
      toast.error(es.workflow.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0">
        <div className="flex h-[82vh] flex-col">
          {/* Cabecera */}
          <DialogHeader className="border-b border-border px-6 py-4">
            <DialogTitle>{es.workflow.canvas}</DialogTitle>
            <DialogDescription>{es.workflow.canvasHint}</DialogDescription>
          </DialogHeader>

          <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[1fr_320px]">
            {/* Columna izquierda: nombre + disparador + lienzo */}
            <div className="flex min-h-0 flex-col gap-4 overflow-y-auto border-r border-border p-6">
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{es.workflow.name}</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={es.workflow.namePlaceholder}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{es.workflow.trigger}</Label>
                    <Select value={triggerType} onValueChange={(v) => setTriggerType(v as Workflow["trigger_type"])}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIGGERS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TRIGGER_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{es.workflow.description}</Label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={es.workflow.descriptionPlaceholder}
                  />
                </div>
              </div>

              {/* Lienzo de nodos */}
              <div className="min-h-0">
                {nodes.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-surface/40 px-4 py-10 text-center">
                    <Zap className="h-6 w-6 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">{es.workflow.selectNode}</p>
                  </div>
                ) : (
                  <ScrollArea className="h-full max-h-[46vh] pr-3">
                    <div className="space-y-0">
                      {nodes.map((node, i) => {
                        const meta = NODE_META[node.type];
                        const Icon = meta.icon;
                        const isSelected = node.id === selectedId;
                        return (
                          <div key={node.id}>
                            <div className="relative flex gap-3">
                              {/* Conector */}
                              <div className="flex flex-col items-center">
                                <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border border-border bg-surface">
                                  <Icon className={cn("h-4 w-4", meta.accent)} />
                                </span>
                                {i < nodes.length - 1 && (
                                  <span className="w-px flex-1 bg-border" aria-hidden />
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedId(node.id)}
                                className={cn(
                                  "group mb-3 flex-1 rounded-lg border bg-surface px-3 py-2.5 text-left transition-colors",
                                  isSelected
                                    ? "border-[var(--tenant-primary)]/60 ring-1 ring-[var(--tenant-primary)]/30"
                                    : "border-border hover:border-border-strong"
                                )}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-foreground">{node.label}</p>
                                  <span className="text-mono text-[10px] text-muted-foreground/60">nº {i + 1}</span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {nodeConfigSummary(node)}
                                </p>
                              </button>
                            </div>

                            {isSelected && (
                              <div className="mb-3 ml-[49px] flex flex-wrap items-center gap-1.5">
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => insertAfter(node.id)} title="Insertar nodo después">
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(node.id, -1)} disabled={i === 0} title="Subir">
                                  <ChevronUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => move(node.id, 1)} disabled={i === nodes.length - 1} title="Bajar">
                                  <ChevronDown className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => remove(node.id)} title={es.common.delete}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}

                {/* Paleta de nodos */}
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                    {es.workflow.addNode}
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {NODE_TYPES.map((t) => {
                      const meta = NODE_META[t];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => addNode(t)}
                          className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
                        >
                          <Icon className={cn("h-3.5 w-3.5 shrink-0", meta.accent)} />
                          <span className="truncate">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha: configuración del nodo seleccionado */}
            <div className="overflow-y-auto border-t border-border p-6 md:border-l md:border-t-0">
              {selected ? (
                <NodeConfigFields
                  node={selected}
                  agents={agents}
                  stages={stages}
                  onChange={(patch) => setNode(selected.id, patch)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                  <Zap className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">{es.workflow.selectNode}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pie */}
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              {es.common.cancel}
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {es.common.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Formulario de configuración por tipo de nodo ---------- */

function NodeConfigFields({
  node,
  agents,
  stages,
  onChange,
}: {
  node: WorkflowNode;
  agents: AiAgent[];
  stages: string[];
  onChange: (patch: Partial<WorkflowNode>) => void;
}) {
  const set = (patch: Record<string, unknown>) => onChange({ config: { ...node.config, ...patch } });
  const w = es.workflowNodeConfig;

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs text-muted-foreground">{es.common.edit}</Label>
        <Input
          value={node.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="mt-1.5"
        />
      </div>

      {node.type === "send_whatsapp" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{w.send_whatsapp.message}</Label>
          <Textarea
            value={String(node.config.message ?? "")}
            onChange={(e) => set({ message: e.target.value })}
            placeholder={w.send_whatsapp.messagePlaceholder}
            className="min-h-24 text-xs"
          />
        </div>
      )}

      {node.type === "send_email" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{w.send_email.subject}</Label>
            <Input
              value={String(node.config.subject ?? "")}
              onChange={(e) => set({ subject: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{w.send_email.body}</Label>
            <Textarea
              value={String(node.config.body ?? "")}
              onChange={(e) => set({ body: e.target.value })}
              placeholder={w.send_email.bodyPlaceholder}
              className="min-h-28 text-xs"
            />
          </div>
        </>
      )}

      {node.type === "wait" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{w.wait.amount}</Label>
            <Input
              type="number"
              min={0}
              value={String(node.config.amount ?? 2)}
              onChange={(e) => set({ amount: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{w.wait.unit}</Label>
            <Select
              value={String(node.config.unit ?? "hours")}
              onValueChange={(v) => set({ unit: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">{w.wait.unitHours}</SelectItem>
                <SelectItem value="days">{w.wait.unitDays}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {node.type === "condition" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{w.condition.field}</Label>
            <Select value={String(node.config.field ?? "status")} onValueChange={(v) => set({ field: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">{w.condition.fieldStatus}</SelectItem>
                <SelectItem value="deal_value">{w.condition.fieldValue}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-[1fr_1.2fr] gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{w.condition.op}</Label>
              <Select value={String(node.config.op ?? "eq")} onValueChange={(v) => set({ op: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eq">{w.condition.opEquals}</SelectItem>
                  <SelectItem value="ne">{w.condition.opNotEquals}</SelectItem>
                  <SelectItem value="gt">{w.condition.opGreater}</SelectItem>
                  <SelectItem value="lt">{w.condition.opLess}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{w.condition.value}</Label>
              <Input
                value={String(node.config.value ?? "")}
                onChange={(e) => set({ value: e.target.value })}
                list="condition-stages"
              />
              <datalist id="condition-stages">
                {stages.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>
        </>
      )}

      {node.type === "move_stage" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{w.move_stage.toStage}</Label>
          <Select value={String(node.config.to_stage ?? "")} onValueChange={(v) => set({ to_stage: v })}>
            <SelectTrigger>
              <SelectValue placeholder={w.move_stage.toStagePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {node.type === "call_ai_agent" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{w.call_ai_agent.agent}</Label>
            <Select
              value={node.config.agent_id ? String(node.config.agent_id) : "default"}
              onValueChange={(v) => set({ agent_id: v === "default" ? null : v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Agente por defecto</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{w.call_ai_agent.prompt}</Label>
            <Textarea
              value={String(node.config.prompt ?? "")}
              onChange={(e) => set({ prompt: e.target.value })}
              placeholder={w.call_ai_agent.promptPlaceholder}
              className="min-h-24 text-xs"
            />
          </div>
        </>
      )}

      {node.type === "webhook_out" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{w.webhook_out.url}</Label>
            <Input
              value={String(node.config.url ?? "")}
              onChange={(e) => set({ url: e.target.value })}
              placeholder="https://hook.example.com/…"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{w.webhook_out.method}</Label>
            <Select value={String(node.config.method ?? "POST")} onValueChange={(v) => set({ method: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{w.webhook_out.payload}</Label>
            <Textarea
              value={String(node.config.payload ?? "")}
              onChange={(e) => set({ payload: e.target.value })}
              placeholder={w.webhook_out.payloadPlaceholder}
              className="min-h-24 font-mono text-xs"
            />
          </div>
        </>
      )}
    </div>
  );
}
