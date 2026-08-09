"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { updateLead } from "@/lib/data-access";
import { formatDateTimeLocal, formatRelative } from "@/lib/format";
import { STATUS_CONFIG } from "../config";
import type { Lead, LeadStatus } from "@/types/database";

/** Vista tabla: edición inline de estado, valor y seguimiento. */
export function TableView({
  orgId,
  leads,
  onOpenLead,
  onMove,
}: {
  orgId: string;
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
  onMove: (leadId: string, status: LeadStatus) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead className="hidden md:table-cell">Contacto</TableHead>
            <TableHead className="hidden lg:table-cell">Seguimiento</TableHead>
            <TableHead className="hidden sm:table-cell">Etiquetas</TableHead>
            <TableHead>Alta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                Sin leads todavía. Añade el primero con «Nuevo lead».
              </TableCell>
            </TableRow>
          )}
          {leads.map((lead) => (
            <TableRow key={lead.id} className="cursor-pointer" onClick={() => onOpenLead(lead)}>
              <TableCell className="font-medium text-foreground">
                {[lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.email || "Sin nombre"}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Select value={lead.status} onValueChange={(v) => onMove(lead.id, v as LeadStatus)}>
                  <SelectTrigger className="h-7 w-40 text-xs">
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
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <InlineNumber orgId={orgId} lead={lead} />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <p className="truncate text-xs text-muted-foreground">{lead.phone ?? lead.email ?? "—"}</p>
              </TableCell>
              <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                <InlineDate orgId={orgId} lead={lead} />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="flex max-w-36 flex-wrap gap-1">
                  {lead.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap text-mono text-[11px] text-muted-foreground">
                {formatRelative(lead.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** Input numérico inline: edita deal_value al perder el foco. */
function InlineNumber({ orgId, lead }: { orgId: string; lead: Lead }) {
  const [val, setVal] = useState(lead.deal_value ?? 0);
  const [prev, setPrev] = useState(lead.deal_value ?? 0);

  // Sincroniza ante cambios externos (realtime) durante el render.
  if ((lead.deal_value ?? 0) !== prev) {
    setPrev(lead.deal_value ?? 0);
    setVal(lead.deal_value ?? 0);
  }

  const commit = async () => {
    if (val === (lead.deal_value ?? 0)) return;
    try {
      await updateLead(orgId, lead.id, { deal_value: val });
    } catch {
      toast.error("No se pudo guardar el valor");
      setVal(lead.deal_value ?? 0);
    }
  };

  return (
    <Input
      type="number"
      className="h-7 w-24 text-xs"
      value={val}
      onChange={(e) => setVal(e.target.value === "" ? 0 : Number(e.target.value))}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );
}

/** Input datetime-local inline: edita next_follow_up_at al perder el foco. */
function InlineDate({ orgId, lead }: { orgId: string; lead: Lead }) {
  const [val, setVal] = useState(lead.next_follow_up_at ? formatDateTimeLocal(lead.next_follow_up_at) : "");
  const [prev, setPrev] = useState(lead.next_follow_up_at);

  if (lead.next_follow_up_at !== prev) {
    setPrev(lead.next_follow_up_at);
    setVal(lead.next_follow_up_at ? formatDateTimeLocal(lead.next_follow_up_at) : "");
  }

  const commit = async () => {
    const next = val ? new Date(val).toISOString() : null;
    if (next === lead.next_follow_up_at) return;
    try {
      await updateLead(orgId, lead.id, { next_follow_up_at: next });
    } catch {
      toast.error("No se pudo guardar el seguimiento");
      setVal(lead.next_follow_up_at ? formatDateTimeLocal(lead.next_follow_up_at) : "");
    }
  };

  return (
    <Input
      type="datetime-local"
      className="h-7 w-44 text-xs"
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );
}
