"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityTimeline } from "./ActivityTimeline";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { formatDateTime, formatDateTimeLocal } from "@/lib/format";
import { fetchCompanies, fetchPipelines, updateLead, updateLeadStatus } from "@/lib/data-access";
import { STATUS_CONFIG, STATUS_MAP } from "./config";
import type { Lead } from "@/types/database";

/** Detalle de lead en 2 columnas: datos editables + timeline de actividad. */
export function LeadDialog({
  lead,
  orgId,
  open,
  onOpenChange,
  onChanged,
}: {
  lead: Lead | null;
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
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

  const [status, setStatus] = useState<Lead["status"]>("new");
  const [dealValue, setDealValue] = useState(0);
  const [followUp, setFollowUp] = useState("");
  const [pipelineId, setPipelineId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [prevLead, setPrevLead] = useState(lead);

  // Ajuste de estado durante el render: sincroniza el formulario cuando cambia
  // el lead (patrón recomendado, sin effect).
  if (lead !== prevLead) {
    setPrevLead(lead);
    if (lead) {
      setStatus(lead.status);
      setDealValue(lead.deal_value ?? 0);
      setFollowUp(lead.next_follow_up_at ? formatDateTimeLocal(lead.next_follow_up_at) : "");
      setPipelineId(lead.pipeline_id ?? "");
      setCompanyId(lead.company_id ?? "");
    }
  }

  if (!lead) return null;

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Sin nombre";
  const currentFollowUp = lead.next_follow_up_at ? formatDateTimeLocal(lead.next_follow_up_at) : "";
  const unchanged =
    status === lead.status &&
    dealValue === (lead.deal_value ?? 0) &&
    followUp === currentFollowUp &&
    pipelineId === (lead.pipeline_id ?? "") &&
    companyId === (lead.company_id ?? "");

  const save = async () => {
    setSaving(true);
    try {
      if (status !== lead.status) {
        await updateLeadStatus(orgId, lead.id, status);
      }
      const followNext = followUp ? new Date(followUp).toISOString() : null;
      if (
        dealValue !== (lead.deal_value ?? 0) ||
        followNext !== lead.next_follow_up_at ||
        pipelineId !== (lead.pipeline_id ?? "") ||
        companyId !== (lead.company_id ?? "")
      ) {
        await updateLead(orgId, lead.id, {
          deal_value: dealValue,
          next_follow_up_at: followNext,
          pipeline_id: pipelineId || null,
          company_id: companyId || null,
        });
      }
      toast.success(`Lead actualizado (${STATUS_MAP[status].label})`);
      onChanged();
      onOpenChange(false);
    } catch {
      toast.error("No se pudo guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const pipelineName = pipelines.data.find((p) => p.id === pipelineId)?.name;
  const companyName = companies.data.find((c) => c.id === companyId)?.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{fullName}</DialogTitle>
          <DialogDescription>
            Creado el {formatDateTime(lead.created_at)} ·{" "}
            <span className="text-mono text-[11px]">{lead.id.slice(0, 8)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Izquierda: datos editables */}
          <ScrollArea className="h-[440px] pr-3">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input readOnly value={lead.email ?? "—"} className="text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Teléfono</Label>
                  <Input readOnly value={lead.phone ?? "—"} className="text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Estado del pipeline</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Lead["status"])}>
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
                <Badge variant={STATUS_MAP[status].badge} className="mt-1">
                  {STATUS_MAP[status].label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Pipeline</Label>
                  <Select
                    value={pipelineId || "none"}
                    onValueChange={(v) => setPipelineId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin pipeline</SelectItem>
                      {pipelines.data.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Empresa</Label>
                  <Select
                    value={companyId || "none"}
                    onValueChange={(v) => setCompanyId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger className="text-xs">
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

              {(pipelineName || companyName) && (
                <div className="flex flex-wrap gap-1">
                  {pipelineName && <Badge variant="outline">Embudo: {pipelineName}</Badge>}
                  {companyName && <Badge variant="outline">Empresa: {companyName}</Badge>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="deal">Valor (€)</Label>
                  <Input
                    id="deal"
                    type="number"
                    className="text-xs"
                    value={dealValue}
                    onChange={(e) => setDealValue(e.target.value === "" ? 0 : Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs" htmlFor="fu2">Seguimiento</Label>
                  <Input
                    id="fu2"
                    type="datetime-local"
                    className="text-xs"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                  />
                </div>
              </div>

              {lead.tags.length > 0 && (
                <div>
                  <Label className="text-xs">Etiquetas</Label>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {lead.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Atribución UTM */}
              {(lead.utm_source || lead.utm_medium || lead.utm_campaign || lead.utm_term || lead.utm_content || lead.landing_page || lead.referrer) && (
                <div>
                  <Label className="text-xs">Atribución UTM</Label>
                  <div className="mt-1.5 space-y-1 text-xs">
                    {lead.utm_source && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-24">Source:</span>
                        <span className="font-mono">{lead.utm_source}</span>
                      </div>
                    )}
                    {lead.utm_medium && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-24">Medium:</span>
                        <span className="font-mono">{lead.utm_medium}</span>
                      </div>
                    )}
                    {lead.utm_campaign && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-24">Campaign:</span>
                        <span className="font-mono">{lead.utm_campaign}</span>
                      </div>
                    )}
                    {lead.utm_term && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-24">Term:</span>
                        <span className="font-mono">{lead.utm_term}</span>
                      </div>
                    )}
                    {lead.utm_content && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-24">Content:</span>
                        <span className="font-mono">{lead.utm_content}</span>
                      </div>
                    )}
                    {lead.landing_page && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-24">Landing:</span>
                        <span className="font-mono truncate max-w-xs">{lead.landing_page}</span>
                      </div>
                    )}
                    {lead.referrer && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground w-24">Referrer:</span>
                        <span className="font-mono truncate max-w-xs">{lead.referrer}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Actualizado {formatDateTime(lead.updated_at)}
              </div>
            </div>
          </ScrollArea>

          {/* Derecha: timeline de actividad */}
          <div className="h-[440px] rounded-lg border border-border bg-muted/20 p-3">
            <ActivityTimeline orgId={orgId} leadId={lead.id} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button onClick={save} disabled={saving || unchanged}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
