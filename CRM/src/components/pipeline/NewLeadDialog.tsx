"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { createLead, fetchCompanies, fetchPipelines } from "@/lib/data-access";
import type { Lead } from "@/types/database";
import { STATUS_CONFIG } from "./config";

/**
 * Crea un lead en el pipeline (multi-embudo: permite elegir pipeline y empresa).
 * Puede usarse self-contained (con su propio botón + estado interno) o
 * controlado desde fuera (open/onOpenChange + status/seguimiento iniciales),
 * por ejemplo desde la vista calendario o un botón "Añadir" de una columna.
 */
export function NewLeadDialog({
  orgId,
  onCreated,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  initialStatus = "new",
  initialFollowUp = null,
  initialPipelineId = null,
  initialCompanyId = null,
}: {
  orgId: string;
  onCreated: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialStatus?: Lead["status"];
  initialFollowUp?: string | null;
  initialPipelineId?: string | null;
  initialCompanyId?: string | null;
}) {
  const fetchPipes = useCallback((o: string) => fetchPipelines(o), []);
  const pipelines = useRealtimeCollection(fetchPipes, orgId, {
    table: "pipelines",
    filter: `organization_id=eq.${orgId}`,
  });
  const fetchComps = useCallback((o: string) => fetchCompanies(o), []);
  const companies = useRealtimeCollection(fetchComps, orgId, {
    table: "companies",
    filter: `organization_id=eq.${orgId}`,
  });

  const [internalOpen, setInternalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    deal_value: "",
    tags: "",
    status: "new" as Lead["status"],
    next_follow_up_at: "",
    pipeline_id: "",
    company_id: "",
  });
  const [prevOpen, setPrevOpen] = useState<boolean | undefined>(undefined);

  const open = openProp ?? internalOpen;
  const setOpen = onOpenChangeProp ?? setInternalOpen;

  // Ajuste durante el render: al abrir, siembra estado/seguimiento/pipeline
  // iniciales (patrón recomendado, sin effect).
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm((f) => ({
        ...f,
        status: initialStatus,
        next_follow_up_at: initialFollowUp
          ? format(new Date(initialFollowUp), "yyyy-MM-dd'T'HH:mm")
          : "",
        pipeline_id: initialPipelineId ?? "",
        company_id: initialCompanyId ?? "",
      }));
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name && !form.email && !form.phone) {
      toast.error("Añade al menos un nombre o un contacto");
      return;
    }
    setSaving(true);
    try {
      await createLead(orgId, {
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        email: form.email || null,
        phone: form.phone || null,
        deal_value: form.deal_value ? Number(form.deal_value) : 0,
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        status: form.status,
        assigned_to: null,
        next_follow_up_at: form.next_follow_up_at
          ? new Date(form.next_follow_up_at).toISOString()
          : null,
        pipeline_id: form.pipeline_id || null,
        company_id: form.company_id || null,
      });
      toast.success("Lead creado en el pipeline");
      setForm({
        first_name: "", last_name: "", email: "", phone: "", deal_value: "",
        tags: "", status: "new", next_follow_up_at: "", pipeline_id: "", company_id: "",
      });
      onCreated();
      setOpen(false);
    } catch {
      toast.error("No se pudo crear el lead");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {onOpenChangeProp === undefined && (
        <DialogTrigger asChild>
          <Button>
            <Plus />
            Nuevo lead
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo lead</DialogTitle>
          <DialogDescription>
            Añade un contacto al pipeline. El bot de WhatsApp puede encargarse del resto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fn">Nombre</Label>
              <Input id="fn" placeholder="Laura" value={form.first_name} onChange={set("first_name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ln">Apellido</Label>
              <Input id="ln" placeholder="García" value={form.last_name} onChange={set("last_name")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="em">Email</Label>
              <Input id="em" type="email" placeholder="laura@example.com" value={form.email} onChange={set("email")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ph">Teléfono</Label>
              <Input id="ph" placeholder="+34 612 000 000" value={form.phone} onChange={set("phone")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dv">Valor (€)</Label>
              <Input id="dv" type="number" placeholder="0" value={form.deal_value} onChange={set("deal_value")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tg">Etiquetas (csv)</Label>
              <Input id="tg" placeholder="WhatsApp, Ig" value={form.tags} onChange={set("tags")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fu">Seguimiento</Label>
              <Input
                id="fu"
                type="datetime-local"
                value={form.next_follow_up_at}
                onChange={set("next_follow_up_at")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado inicial</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v as Lead["status"] }))}
              >
                <SelectTrigger>
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
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pipeline</Label>
              <Select
                value={form.pipeline_id || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, pipeline_id: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin pipeline (por defecto)</SelectItem>
                  {pipelines.data.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Select
                value={form.company_id || "none"}
                onValueChange={(v) => setForm((f) => ({ ...f, company_id: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin empresa</SelectItem>
                  {companies.data.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creando…" : "Crear lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
