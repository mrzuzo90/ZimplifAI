"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Check, ListTodo, Pencil, Plus, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import {
  fetchCompanies,
  fetchLeads,
  fetchTasks,
  removeTask,
  saveTask,
  updateTask,
} from "@/lib/data-access";
import { formatDateShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Company, Lead, Task, TaskPriority, TaskStatus } from "@/types/database";

type TaskForm = {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string;
  lead_id: string;
  company_id: string;
};

const EMPTY_FORM: TaskForm = {
  title: "",
  description: "",
  priority: "medium",
  status: "todo",
  due_date: "",
  lead_id: "",
  company_id: "",
};

const PRIORITY_META: Record<TaskPriority, { label: string; variant: "muted" | "info" | "destructive" }> = {
  low: { label: "Baja", variant: "muted" },
  medium: { label: "Media", variant: "info" },
  high: { label: "Alta", variant: "destructive" },
};

const STATUS_TABS: { value: string; label: string; filter?: TaskStatus }[] = [
  { value: "all", label: "Todas" },
  { value: "todo", label: "Pendientes", filter: "todo" },
  { value: "in_progress", label: "En curso", filter: "in_progress" },
  { value: "done", label: "Hechas", filter: "done" },
];

/** Gestión de tareas personales / por lead / por empresa (alimenta "Mi Día"). */
export function TasksView({ orgId }: { orgId: string }) {
  const fetchTs = useCallback((o: string) => fetchTasks(o), []);
  const tasks = useRealtimeCollection(fetchTs, orgId, {
    table: "tasks",
    filter: `organization_id=eq.${orgId}`,
  });
  const fetchLs = useCallback((o: string) => fetchLeads(o), []);
  const leads = useRealtimeCollection(fetchLs, orgId, { table: "leads", filter: `organization_id=eq.${orgId}` });
  const fetchComps = useCallback((o: string) => fetchCompanies(o), []);
  const companies = useRealtimeCollection(fetchComps, orgId, {
    table: "companies",
    filter: `organization_id=eq.${orgId}`,
  });

  const [filter, setFilter] = useState("all");
  const [dialog, setDialog] = useState<{ open: boolean; task: Task | null }>({ open: false, task: null });

  const visible = filter === "all" ? tasks.data : tasks.data.filter((t) => t.status === filter);

  const leadName = (id: string | null) => {
    const l = leads.data.find((x) => x.id === id);
    if (!l) return null;
    return [l.first_name, l.last_name].filter(Boolean).join(" ") || l.email || l.phone || "Lead";
  };
  const companyName = (id: string | null) => companies.data.find((c) => c.id === id)?.name ?? null;

  const toggleDone = async (task: Task) => {
    const next = task.status === "done" ? ("todo" as TaskStatus) : ("done" as TaskStatus);
    try {
      await updateTask(orgId, task.id, { status: next });
    } catch {
      toast.error("No se pudo actualizar la tarea");
    }
  };

  const remove = async (task: Task) => {
    if (!window.confirm(`¿Eliminar la tarea «${task.title}»?`)) return;
    try {
      await removeTask(orgId, task.id);
      toast.success("Tarea eliminada");
    } catch {
      toast.error("No se pudo eliminar la tarea");
    }
  };

  if (tasks.loading) return <LoadingState label="Cargando tareas" />;
  if (tasks.error) return <ErrorState message={tasks.error.message} onRetry={tasks.refresh} />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            {STATUS_TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
                <span className="ml-1 text-mono text-[10px] text-muted-foreground">
                  {t.value === "all" ? tasks.data.length : tasks.data.filter((x) => x.status === t.value).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button onClick={() => setDialog({ open: true, task: null })}>
          <Plus />
          Nueva tarea
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title={filter === "all" ? "Sin tareas todavía" : "Nada aquí"}
          description="Crea tareas personales o vinculadas a un lead o empresa. Las de hoy aparecen en «Mi Día»."
          action={
            <Button size="sm" onClick={() => setDialog({ open: true, task: null })}>
              <Plus />
              Nueva tarea
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {visible.map((task) => {
            const meta = PRIORITY_META[task.priority];
            const lName = leadName(task.lead_id);
            const cName = companyName(task.company_id);
            const overdue =
              task.status !== "done" && task.due_date && task.due_date < new Date().toISOString().slice(0, 10);
            return (
              <div
                key={task.id}
                className={cn(
                  "group flex items-center gap-3 rounded-lg border border-border bg-surface px-3.5 py-3 transition-colors",
                  task.status === "done" && "opacity-60"
                )}
              >
                <button
                  onClick={() => toggleDone(task)}
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                    task.status === "done"
                      ? "border-[var(--tenant-primary)] bg-[var(--tenant-primary)] text-pitch"
                      : "border-border-strong text-transparent hover:border-[var(--tenant-primary)]/60"
                  )}
                  aria-label={task.status === "done" ? "Marcar pendiente" : "Marcar hecha"}
                >
                  <Check className="h-3 w-3" />
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium text-foreground",
                      task.status === "done" && "line-through"
                    )}
                  >
                    {task.title}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    {lName && <span>🎯 {lName}</span>}
                    {cName && <span>🏢 {cName}</span>}
                    {task.due_date && (
                      <span className={cn("text-mono", overdue && "font-medium text-destructive")}>
                        {overdue && "⏰ "}
                        {formatDateShort(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>

                <Badge variant={meta.variant}>{meta.label}</Badge>

                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setDialog({ open: true, task })}
                    className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={`Editar ${task.title}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => remove(task)}
                    className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Eliminar ${task.title}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskDialog
        orgId={orgId}
        task={dialog.task}
        leads={leads.data}
        companies={companies.data}
        open={dialog.open}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
        onSaved={() => {
          tasks.refresh();
          leads.refresh();
        }}
      />
    </div>
  );
}

/* ------------------------------ Diálogo ------------------------------ */

function TaskDialog({
  orgId,
  task,
  leads,
  companies,
  open,
  onOpenChange,
  onSaved,
}: {
  orgId: string;
  task: Task | null;
  leads: Lead[];
  companies: Company[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<TaskForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [prevId, setPrevId] = useState<string | null>(null);

  const currentId = task?.id ?? "new";
  if (open && currentId !== prevId) {
    setPrevId(currentId);
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        status: task.status,
        due_date: task.due_date ?? "",
        lead_id: task.lead_id ?? "",
        company_id: task.company_id ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }

  const set = (k: keyof TaskForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("La tarea necesita un título");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        status: form.status,
        due_date: form.due_date || null,
        lead_id: form.lead_id || null,
        company_id: form.company_id || null,
        assigned_to: task?.assigned_to ?? null,
      };
      if (task) {
        await updateTask(orgId, task.id, payload);
        toast.success("Tarea actualizada");
      } else {
        await saveTask(orgId, payload);
        toast.success("Tarea creada");
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("No se pudo guardar la tarea");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
          <DialogDescription>
            Tarea personal o vinculada a un lead o empresa para «Mi Día».
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Título *</Label>
            <Input id="t-title" placeholder="Llamar a Marta para confirmar la cena" value={form.title} onChange={set("title")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Descripción</Label>
            <Textarea id="t-desc" rows={2} placeholder="Detalles…" value={form.description} onChange={set("description")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Prioridad</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["low", "medium", "high"] as TaskPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PRIORITY_META[p].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as TaskStatus }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Pendiente</SelectItem>
                  <SelectItem value="in_progress">En curso</SelectItem>
                  <SelectItem value="done">Hecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Fecha límite</Label>
              <Input id="t-due" type="date" value={form.due_date} onChange={set("due_date")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Vinculada a lead</Label>
              <Select value={form.lead_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, lead_id: v === "none" ? "" : v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin lead</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {[l.first_name, l.last_name].filter(Boolean).join(" ") || l.email || l.phone || l.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Select value={form.company_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, company_id: v === "none" ? "" : v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin empresa</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : task ? "Guardar cambios" : "Crear tarea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
