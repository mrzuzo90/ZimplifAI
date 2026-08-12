"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Clipboard, Copy, Loader2, Rocket, ShieldCheck, Terminal } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { provisionOrganization } from "@/lib/data-access";
import { fetchPublishedSnapshots } from "@/lib/data-access";
import { VERTICAL_LABELS, type VerticalSnapshot } from "@/types/database";
import type { ProvisionOutput } from "@/lib/provisioning";
import { AdminGuard } from "@/components/admin/AdminGuard";

/** Motor de provisión 1-Click: crea org + cliente + agentes + webhook. */
export default function AdminProvisionPage() {
  const [snapshots, setSnapshots] = useState<VerticalSnapshot[]>([]);
  const [clientName, setClientName] = useState("");
  const [slug, setSlug] = useState("");
  const [snapshotId, setSnapshotId] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProvisionOutput | null>(null);

  useEffect(() => {
    fetchPublishedSnapshots().then(setSnapshots).catch(() => setSnapshots([]));
  }, []);

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !slug.trim() || !snapshotId || !adminEmail.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    setBusy(true);
    try {
      const out = await provisionOrganization({
        clientName: clientName.trim(),
        slug: slug.trim(),
        snapshotId,
        adminEmail: adminEmail.trim(),
      });
      setResult(out);
      toast.success(`Subcuenta "${out.slug}" aprovisionada`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aprovisionar");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado`);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <AdminGuard>
      <div className="space-y-6">
        <PageHeader
        index="ADM"
        label="SuperAdmin"
        title="Provisión 1-Click"
        description="Aprovisiona una subcuenta completa: organización, cliente admin, agentes IA, pipeline y webhook de ingesta."
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft />
              Volver
            </Link>
          </Button>
        }
      />

      {!result ? (
        <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-5">
          <Card className="space-y-4 p-5 lg:col-span-3">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre del cliente</Label>
                <Input
                  id="clientName"
                  placeholder="Pizzería La Brasa"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (!slug) setSlug(slugify(e.target.value));
                  }}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="slug">Subdominio / slug</Label>
                  <div className="relative">
                    <Input
                      id="slug"
                      placeholder="pizzeria-la-brasa"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      className="pr-16"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-mono text-[10px] text-muted-foreground">
                      .zimplifai.app
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email del admin</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@cliente.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Plantilla de vertical</Label>
                <Select value={snapshotId} onValueChange={setSnapshotId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige una snapshot…" />
                  </SelectTrigger>
                  <SelectContent>
                    {snapshots.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} · {VERTICAL_LABELS[s.vertical_type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {snapshotId && (
                  <div className="rounded-lg border border-border bg-surface p-3 text-xs text-muted-foreground">
                    <span className="text-mono text-[10px] uppercase tracking-wider text-[var(--tenant-primary)]">
                      Se aprovisionará
                    </span>
                    <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                      <li>· {snapshots.find((s) => s.id === snapshotId)?.default_pipeline_stages.length ?? 0} etapas de pipeline</li>
                      <li>· 2 agentes IA por defecto</li>
                      <li>· Prompt de vertical precargado</li>
                      <li>· Webhook de ingesta cifrado</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? <Loader2 className="animate-spin" /> : <Rocket />}
              {busy ? "Aprovisionando motor…" : "Aprovisionar subcuenta"}
            </Button>
          </Card>

          <Card className="space-y-4 p-5 lg:col-span-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[var(--tenant-primary)]" />
              <h3 className="text-sm font-semibold text-foreground">¿Qué ocurre en 1-Click?</h3>
            </div>
            <ol className="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
              {[
                "Crea la organización con estado Trial y color primario por defecto.",
                "Genera el cliente admin y le asigna rol client_admin.",
                "Clona la snapshot de vertical: etapas, prompts y módulos.",
                "Aprovisiona 2 agentes IA (cualificador WhatsApp + scoring).",
                "Genera API key cifrada y el webhook de ingesta cifrado.",
              ].map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-mono text-[10px] text-[var(--tenant-primary)]">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="flex items-start gap-2 rounded-lg border border-border bg-surface p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--tenant-primary)]" />
              <span>
                En modo demo la provisión es local y simulada. Con Supabase conectado se ejecuta vía API con service role.
              </span>
            </div>
          </Card>
        </form>
      ) : (
        <Card className="space-y-5 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[var(--tenant-primary)]" />
            <div>
              <h3 className="font-display text-lg font-bold text-foreground">
                Subcuenta {result.slug} aprovisionada
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                La org {result.organizationId} quedó en Trial con {result.agents.length} agentes IA.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Webhook de ingesta (guardar, solo se muestra una vez)</Label>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground">
                {result.webhookUrl}
              </code>
              <Button size="icon" variant="outline" onClick={() => copy(result.webhookUrl, "Webhook")}>
                <Copy />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>API key (solo se muestra una vez)</Label>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-[var(--tenant-primary)]">
                {result.apiKey}
              </code>
              <Button size="icon" variant="outline" onClick={() => copy(result.apiKey, "API key")}>
                <Copy />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-2">
            <div>
              <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">Pipeline</p>
              <p className="mt-1 text-xs text-foreground">{result.pipelineStages.join(" → ")}</p>
            </div>
            <div>
              <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">Módulos</p>
              <p className="mt-1 text-xs text-foreground">{result.enabledModules.join(", ")}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">Agentes</p>
              <div className="mt-1.5 space-y-1.5">
                {result.agents.map((a) => (
                  <div key={a.name} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                    <span className="text-xs text-foreground">{a.name}</span>
                    <span className="text-mono text-[10px] text-[var(--tenant-primary)]">{a.model}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setResult(null)}>
              <Clipboard />
              Otra provisión
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin">Volver al panel</Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
    </AdminGuard>
  );
}
