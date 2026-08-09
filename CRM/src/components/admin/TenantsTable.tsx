"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Eye, Plus, Search, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TenantLogo } from "@/components/shared/TenantLogo";
import { formatDateShort } from "@/lib/format";
import { getIngestWebhookInfo, impersonate } from "@/lib/data-access";
import { moduleLabel } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { VERTICAL_LABELS, type OrganizationStatus, type OrganizationWithStats } from "@/types/database";

const STATUS_META: Record<OrganizationStatus, { label: string; variant: "success" | "warning" | "destructive" }> = {
  active: { label: "Activa", variant: "success" },
  trial: { label: "Trial", variant: "warning" },
  suspended: { label: "Suspendida", variant: "destructive" },
};

export function TenantsTable({
  tenants,
  loading,
  onManageFeatures,
}: {
  tenants: OrganizationWithStats[];
  loading: boolean;
  onManageFeatures: (tenant: OrganizationWithStats) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [vertical, setVertical] = useState<string>("all");
  const [busy, setBusy] = useState<{ type: "enter" | "copy"; orgId: string } | null>(null);

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      const q = query.trim().toLowerCase();
      const matchQ = !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q);
      const matchS = status === "all" || t.status === status;
      const matchV = vertical === "all" || t.vertical_type === vertical;
      return matchQ && matchS && matchV;
    });
  }, [tenants, query, status, vertical]);

  const onImpersonate = async (tenant: OrganizationWithStats) => {
    setBusy({ type: "enter", orgId: tenant.id });
    try {
      await impersonate(tenant.id);
      toast.success(`Entrando en ${tenant.name}`);
      router.push("/workspace");
    } catch {
      toast.error("No se pudo entrar en la subcuenta");
    } finally {
      setBusy(null);
    }
  };

  const onCopyWebhook = async (tenant: OrganizationWithStats) => {
    setBusy({ type: "copy", orgId: tenant.id });
    try {
      const info = await getIngestWebhookInfo(tenant.id);
      await navigator.clipboard.writeText(info.webhookUrl);
      if (info.apiKey) {
        toast.success("Webhook + API key copiados");
      } else {
        toast.info("Webhook copiado · la API key solo se muestra en provisión");
      }
    } catch {
      toast.error("No se pudo copiar el webhook");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o slug…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="suspended">Suspendidas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={vertical} onValueChange={setVertical}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Vertical" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {(Object.keys(VERTICAL_LABELS) as Array<keyof typeof VERTICAL_LABELS>).map((v) => (
              <SelectItem key={v} value={v}>
                {VERTICAL_LABELS[v]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => router.push("/admin/provision")}>
          <Plus />
          Provisionar
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Cliente / Subcuenta</TableHead>
              <TableHead>Vertical</TableHead>
              <TableHead>Módulos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Agentes</TableHead>
              <TableHead className="text-right">Leads</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  {loading ? "Cargando subcuentas…" : "Sin resultados para estos filtros."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((tenant) => {
              const meta = STATUS_META[tenant.status];
              const enabled = tenant.modules?.filter((m) => m.is_enabled) ?? [];
              const extra = enabled.length - 2;
              return (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <TenantLogo organization={tenant} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{tenant.name}</p>
                        <p className="text-mono text-[10px] text-muted-foreground">{tenant.slug}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {VERTICAL_LABELS[tenant.vertical_type]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-[200px] flex-wrap gap-1">
                      {enabled.slice(0, 2).map((m) => (
                        <Badge key={m.module_key} variant="outline" className="px-1.5 py-0 text-[10px]">
                          {moduleLabel(m.module_key)}
                        </Badge>
                      ))}
                      {extra > 0 && (
                        <span className="text-mono text-[10px] text-muted-foreground">+{extra}</span>
                      )}
                      {enabled.length === 0 && (
                        <span className="text-mono text-[10px] text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn("text-mono text-xs", tenant.active_agents > 0 ? "text-foreground" : "text-muted-foreground")}>
                      {tenant.active_agents}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-mono text-xs text-foreground">
                    {tenant.total_leads}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateShort(tenant.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider delayDuration={150}>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="iconSm"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => onManageFeatures(tenant)}
                            aria-label={`Gestionar features de ${tenant.name}`}
                          >
                            <Settings2 className="h-3.5 w-3.5 text-[var(--tenant-primary)]" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Manage Features</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="iconSm"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => void onCopyWebhook(tenant)}
                            disabled={busy?.orgId === tenant.id && busy.type === "copy"}
                            aria-label={`Copiar webhook de ${tenant.name}`}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copiar webhook / API key</TooltipContent>
                      </Tooltip>

                      <Button
                        size="sm"
                        className="h-7 gap-1.5 text-xs"
                        onClick={() => void onImpersonate(tenant)}
                        disabled={busy?.orgId === tenant.id && busy.type === "enter"}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {busy?.orgId === tenant.id && busy.type === "enter" ? "Entrando…" : "Entrar"}
                      </Button>
                    </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
