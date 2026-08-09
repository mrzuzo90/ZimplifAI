"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPipelineStage,
  removePipeline,
  removePipelineStage,
  savePipeline,
  updatePipeline,
  updatePipelineStage,
} from "@/lib/data-access";
import { STATUS_CONFIG } from "./config";
import { cn } from "@/lib/utils";
import type { LeadStatus, Pipeline, PipelineStage } from "@/types/database";

interface StageDraft {
  key: string;
  id?: string;
  name: string;
  status: LeadStatus;
  color: string;
}

const DEFAULT_STAGES: { name: string; status: LeadStatus }[] = [
  { name: "Nuevo", status: "new" },
  { name: "Contactado por IA", status: "ai_contacted" },
  { name: "Cualificado", status: "qualified" },
  { name: "Reservado", status: "booked" },
  { name: "Cerrado ganado", status: "closed_won" },
  { name: "Cerrado perdido", status: "closed_lost" },
];

let draftKey = 0;
const nextKey = () => `stage_${++draftKey}`;

function toDraft(stage: PipelineStage): StageDraft {
  return {
    key: nextKey(),
    id: stage.id,
    name: stage.name,
    status: stage.status,
    color: stage.color ?? "",
  };
}

/**
 * Crear / editar / borrar un pipeline y sus etapas.
 * En modo edición las etapas se sincronizan (añadir / actualizar / eliminar)
 * en una sola operación sobre la capa de datos (Supabase o demo).
 */
export function PipelineDialog({
  orgId,
  pipeline,
  stages,
  open,
  onOpenChange,
  onSaved,
}: {
  orgId: string;
  pipeline: Pipeline | null;
  stages: PipelineStage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const isNew = pipeline === null;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [draft, setDraft] = useState<StageDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [prevKey, setPrevKey] = useState<string>(`${isNew ? "new" : pipeline?.id ?? "new"}`);

  // Ajuste durante el render: siembra el formulario al abrir / cambiar de pipeline.
  const currentKey = isNew ? "new" : pipeline?.id ?? "new";
  if (open && currentKey !== prevKey) {
    setPrevKey(currentKey);
    if (pipeline) {
      setName(pipeline.name);
      setDescription(pipeline.description ?? "");
      setIsDefault(pipeline.is_default);
      setDraft(stages.length > 0 ? stages.map(toDraft) : DEFAULT_STAGES.map((d) => ({ ...d, key: nextKey(), color: "" })));
    } else {
      setName("");
      setDescription("");
      setIsDefault(false);
      setDraft(DEFAULT_STAGES.map((d) => ({ ...d, key: nextKey(), color: "" })));
    }
  }

  const setStage = (key: string, patch: Partial<StageDraft>) =>
    setDraft((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const removeStage = (key: string) => setDraft((ds) => ds.filter((d) => d.key !== key));

  const addStage = () =>
    setDraft((ds) => [...ds, { key: nextKey(), name: "", status: "new", color: "" }]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El pipeline necesita un nombre");
      return;
    }
    const cleanStages = draft.map((s, i) => ({
      key: s.key,
      id: s.id,
      name: s.name.trim() || "Sin nombre",
      status: s.status,
      position: i,
      color: s.color || null,
    }));
    if (cleanStages.length === 0) {
      toast.error("Añade al menos una etapa");
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        await savePipeline(orgId, {
          name: name.trim(),
          description: description || null,
          is_active: true,
          is_default: isDefault,
          stages: cleanStages.map(({ name: n, status, position, color }) => ({ name: n, status, position, color })),
        });
        toast.success("Pipeline creado");
      } else {
        await updatePipeline(orgId, pipeline.id, {
          name: name.trim(),
          description: description || null,
          is_default: isDefault,
        });
        // Sincroniza etapas: actualizar existentes + crear nuevas + eliminar ausentes.
        for (const s of cleanStages) {
          if (!s.id) {
            await createPipelineStage(orgId, pipeline.id, {
              name: s.name,
              status: s.status,
              position: s.position,
              color: s.color,
            });
          } else {
            const prev = stages.find((st) => st.id === s.id);
            if (
              prev &&
              (prev.name !== s.name || prev.status !== s.status || prev.color !== s.color || prev.position !== s.position)
            ) {
              await updatePipelineStage(orgId, s.id, {
                name: s.name,
                status: s.status,
                position: s.position,
                color: s.color,
              });
            }
          }
        }
        for (const st of stages) {
          if (!cleanStages.some((s) => s.id === st.id)) {
            await removePipelineStage(orgId, st.id);
          }
        }
        toast.success("Pipeline actualizado");
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("No se pudo guardar el pipeline");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!pipeline) return;
    if (!window.confirm(`¿Eliminar el pipeline «${pipeline.name}»? Los leads quedarán sin pipeline asignado.`)) return;
    setSaving(true);
    try {
      await removePipeline(orgId, pipeline.id);
      toast.success("Pipeline eliminado");
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("No se pudo eliminar el pipeline");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? "Nuevo pipeline" : `Editar pipeline`}</DialogTitle>
          <DialogDescription>
            {isNew
              ? "Crea un embudo nuevo (Ventas, Eventos, Soporte…) con sus propias etapas."
              : "Renombra, reordena o ajusta las etapas de este embudo."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pl-name">Nombre</Label>
              <Input id="pl-name" placeholder="Ventas" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch id="pl-default" checked={isDefault} onCheckedChange={setIsDefault} />
              <Label htmlFor="pl-default" className="text-xs text-muted-foreground">
                Pipeline por defecto
              </Label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pl-desc">Descripción</Label>
            <Textarea
              id="pl-desc"
              rows={2}
              placeholder="Opcional: para qué se usa este embudo."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Etapas</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStage}>
                <Plus className="h-3 w-3" />
                Añadir etapa
              </Button>
            </div>
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              {draft.map((s, i) => (
                <div key={s.key} className="flex items-center gap-2">
                  <span className="text-mono text-[10px] text-muted-foreground">{i + 1}</span>
                  <Input
                    className="h-8 text-xs"
                    placeholder="Nombre de la etapa"
                    value={s.name}
                    onChange={(e) => setStage(s.key, { name: e.target.value })}
                  />
                  <Select value={s.status} onValueChange={(v) => setStage(s.key, { status: v as LeadStatus })}>
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_CONFIG.map((c) => (
                        <SelectItem key={c.status} value={c.status}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label
                    className={cn(
                      "flex h-8 w-9 items-center justify-center rounded-md border border-border transition-colors",
                      s.color ? "opacity-100" : "opacity-40"
                    )}
                    title="Color de la columna"
                  >
                    <input
                      type="color"
                      className="h-5 w-5 cursor-pointer appearance-none bg-transparent p-0"
                      value={s.color || "#CEFF00"}
                      onChange={(e) => setStage(s.key, { color: e.target.value })}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => removeStage(s.key)}
                    className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Eliminar etapa"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {draft.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Sin etapas. Añade al menos una para poder arrastrar leads.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            {!isNew && (
              <Button
                type="button"
                variant="ghost"
                className="mr-auto text-destructive hover:bg-destructive/10"
                onClick={remove}
                disabled={saving}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : isNew ? "Crear pipeline" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
