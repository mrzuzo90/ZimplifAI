"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Building2, Globe, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { fetchCompanies, fetchLeads, removeCompany, saveCompany, updateCompany } from "@/lib/data-access";
import { formatDateShort } from "@/lib/format";
import type { Company } from "@/types/database";

type CompanyForm = {
  name: string;
  website: string;
  industry: string;
  phone: string;
  city: string;
  notes: string;
};

const EMPTY_FORM: CompanyForm = { name: "", website: "", industry: "", phone: "", city: "", notes: "" };

/** Directorio de empresas B2B del CRM extendido (Fase E1). */
export function CompaniesView({ orgId }: { orgId: string }) {
  const fetchComps = useCallback((o: string) => fetchCompanies(o), []);
  const companies = useRealtimeCollection(fetchComps, orgId, {
    table: "companies",
    filter: `organization_id=eq.${orgId}`,
    sortKey: (a, b) => a.name.localeCompare(b.name, "es"),
  });
  const fetchLs = useCallback((o: string) => fetchLeads(o), []);
  const leads = useRealtimeCollection(fetchLs, orgId, {
    table: "leads",
    filter: `organization_id=eq.${orgId}`,
  });

  const [dialog, setDialog] = useState<{ open: boolean; company: Company | null }>({
    open: false,
    company: null,
  });

  const leadCount = (companyId: string) =>
    leads.data.filter((l) => l.company_id === companyId).length;

  const remove = async (company: Company) => {
    if (!window.confirm(`¿Eliminar «${company.name}»? Los leads asociados quedarán sin empresa.`)) return;
    try {
      await removeCompany(orgId, company.id);
      toast.success("Empresa eliminada");
      companies.refresh();
    } catch {
      toast.error("No se pudo eliminar la empresa");
    }
  };

  if (companies.loading) return <LoadingState label="Cargando empresas" />;
  if (companies.error) return <ErrorState message={companies.error.message} onRetry={companies.refresh} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {companies.data.length} empresas · {leads.data.length} leads vinculados
        </p>
        <Button onClick={() => setDialog({ open: true, company: null })}>
          <Plus />
          Nueva empresa
        </Button>
      </div>

      {companies.data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin empresas todavía"
          description="Crea cuentas B2B y asócialas a leads para agrupar oportunidades por cliente."
          action={
            <Button size="sm" onClick={() => setDialog({ open: true, company: null })}>
              <Plus />
              Nueva empresa
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Industria</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Creada</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent font-display text-sm font-bold text-[var(--tenant-primary)]">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                        {c.website && (
                          <a
                            href={c.website}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-[var(--tenant-primary)]"
                          >
                            <Globe className="h-3 w-3" />
                            {c.website.replace(/^https?:\/\//, "")}
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{c.industry ? <Badge variant="outline">{c.industry}</Badge> : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.city ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={leadCount(c.id) > 0 ? "volt" : "muted"}>{leadCount(c.id)}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-mono text-[11px] text-muted-foreground">
                    {formatDateShort(c.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setDialog({ open: true, company: c })}
                        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Editar ${c.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Eliminar ${c.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CompanyDialog
        orgId={orgId}
        company={dialog.company}
        open={dialog.open}
        onOpenChange={(o) => setDialog((d) => ({ ...d, open: o }))}
        onSaved={companies.refresh}
      />
    </div>
  );
}

/* ------------------------------ Diálogo ------------------------------ */

function CompanyDialog({
  orgId,
  company,
  open,
  onOpenChange,
  onSaved,
}: {
  orgId: string;
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<CompanyForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [prevId, setPrevId] = useState<string | null>(null);

  const currentId = company?.id ?? "new";
  if (open && currentId !== prevId) {
    setPrevId(currentId);
    if (company) {
      setForm({
        name: company.name,
        website: company.website ?? "",
        industry: company.industry ?? "",
        phone: company.phone ?? "",
        city: company.city ?? "",
        notes: company.notes ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }

  const set = (k: keyof CompanyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("La empresa necesita un nombre");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        website: form.website.trim() || null,
        industry: form.industry.trim() || null,
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        notes: form.notes.trim() || null,
      };
      if (company) {
        await updateCompany(orgId, company.id, payload);
        toast.success("Empresa actualizada");
      } else {
        await saveCompany(orgId, payload);
        toast.success("Empresa creada");
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("No se pudo guardar la empresa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{company ? "Editar empresa" : "Nueva empresa"}</DialogTitle>
          <DialogDescription>
            Cuenta B2B a la que asociar leads y oportunidades.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Nombre *</Label>
              <Input id="c-name" placeholder="Grupo Restalia" value={form.name} onChange={set("name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-ind">Industria</Label>
              <Input id="c-ind" placeholder="Hostelería" value={form.industry} onChange={set("industry")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-web">Web</Label>
              <Input id="c-web" type="url" placeholder="https://…" value={form.website} onChange={set("website")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-city">Ciudad</Label>
              <Input id="c-city" placeholder="Madrid" value={form.city} onChange={set("city")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-phone">Teléfono</Label>
            <Input id="c-phone" placeholder="+34 910 000 000" value={form.phone} onChange={set("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-notes">Notas</Label>
            <Textarea id="c-notes" rows={2} placeholder="Contexto interno…" value={form.notes} onChange={set("notes")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : company ? "Guardar cambios" : "Crear empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
