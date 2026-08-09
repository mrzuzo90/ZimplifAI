"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, ImagePlus, Loader2, Palette, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useBranding } from "@/hooks/useBranding";
import { BRAND_SWATCHES, getContrastForeground, isValidHex, hexToRgba, relativeLuminance } from "@/lib/branding";
import { TenantLogo } from "@/components/shared/TenantLogo";
import { VERTICAL_LABELS, type Organization } from "@/types/database";
import { cn } from "@/lib/utils";

/** Mini preview del CRM con la marca del tenant en vivo. */
function BrandPreview({ name, color, logo }: { name: string; color: string; logo: string | null }) {
  const fg = getContrastForeground(color);
  const previewOrg: Organization = {
    id: "preview",
    name,
    primary_color: color,
    logo_url: logo,
    vertical_type: "restaurant_booking",
    slug: "preview",
    status: "active",
    custom_domain: null,
    api_key_hash: null,
    created_at: "",
  };
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-xl">
      {/* Barra superior */}
      <div className="flex items-center gap-2 border-b border-border bg-surface px-3 py-2">
        <TenantLogo organization={previewOrg} size="sm" />
        <span className="truncate text-xs font-semibold text-foreground">{name || "Tu organización"}</span>
        <span className="ml-auto flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
          AI Engine: Nominal
        </span>
      </div>
      {/* Cuerpo */}
      <div className="space-y-3 p-4">
        <div className="space-y-1.5">
          <div className="h-2.5 w-24 rounded-full bg-muted" />
          <div className="h-2.5 w-40 rounded-full bg-muted" />
        </div>
        <div className="flex gap-3">
          <div className="h-20 w-1/2 rounded-lg border border-border bg-surface" />
          <div className="h-20 w-1/2 rounded-lg border border-border bg-surface" />
        </div>
        <div className="flex items-center gap-2">
          <button
            className="h-8 rounded-md px-4 text-xs font-semibold transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: color, color: fg }}
          >
            Reservar mesa
          </button>
          <button className="h-8 rounded-md border px-4 text-xs text-muted-foreground">Ver menú</button>
        </div>
      </div>
      {/* Pie de marca */}
      <div className="border-t border-border bg-surface px-4 py-2.5">
        <p className="truncate text-[10px] text-muted-foreground">
          Powered by <span style={{ color }}>ZimplifAI</span> · reservas {name ? `· ${name}` : ""}
        </p>
      </div>
    </div>
  );
}

/** Página white-label: logo, color primario y nombre con preview en vivo. */
export function BrandingSettingsPage() {
  const { organization, role, updateBranding } = useBranding();
  const [name, setName] = useState(organization?.name ?? "");
  const [color, setColor] = useState(organization?.primary_color ?? "#CEFF00");
  const [logo, setLogo] = useState<string | null>(organization?.logo_url ?? null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [prevOrgId, setPrevOrgId] = useState<string | null>(organization?.id ?? null);

  // Ajuste de estado durante el render: sincroniza el formulario de marca
  // cuando cambia la organización (patrón recomendado, sin effect).
  if (organization && organization.id !== prevOrgId) {
    setPrevOrgId(organization.id);
    setName(organization.name);
    setColor(organization.primary_color);
    setLogo(organization.logo_url);
  }

  // Preview en vivo: la variable CSS del tema sigue al color seleccionado.
  useEffect(() => {
    if (isValidHex(color)) {
      document.documentElement.style.setProperty("--tenant-primary", color);
      document.documentElement.style.setProperty("--tenant-primary-foreground", getContrastForeground(color));
    }
  }, [color]);

  if (!organization) return null;

  const canEdit = role === "client_admin" || role === "super_admin";

  const mark = () => setDirty(true);

  const onLogoFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setLogo(String(reader.result));
      mark();
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateBranding({ name, primary_color: color, logo_url: logo });
      setDirty(false);
      toast.success("Marca actualizada en todo el CRM");
    } catch {
      toast.error("No se pudo guardar la marca");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setName(organization.name);
    setColor(organization.primary_color);
    setLogo(organization.logo_url);
    setDirty(false);
  };

  const fg = getContrastForeground(color);
  const colorName = relativeLuminance(color) > 0.45 ? "Claro" : "Oscuro";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row">
        {/* Formulario */}
        <div className="flex-1 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[var(--tenant-primary)]" />
                Identidad del tenant
              </CardTitle>
              <CardDescription>
                White-label: aplica tu marca a todo el CRM. Guarda y el cambio se inyecta vía{" "}
                <code className="text-mono text-[10px] text-[var(--tenant-primary)]">--tenant-primary</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="org-name">Nombre de la organización</Label>
                <Input id="org-name" value={name} onChange={(e) => { setName(e.target.value); mark(); }} disabled={!canEdit} />
                <p className="text-mono text-[10px] text-muted-foreground">
                  Slug: <span className="text-foreground">{organization.slug}</span> ·{" "}
                  {VERTICAL_LABELS[organization.vertical_type]}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Color primario</Label>
                <div className="flex items-center gap-3">
                  <label className="relative h-10 w-14 cursor-pointer overflow-hidden rounded-lg border border-border shadow-inner">
                    <input
                      type="color"
                      value={isValidHex(color) ? color : "#CEFF00"}
                      onChange={(e) => { setColor(e.target.value); mark(); }}
                      disabled={!canEdit}
                      className="absolute -left-2 -top-2 h-20 w-24 cursor-pointer"
                      aria-label="Color primario"
                    />
                    <span
                      className="pointer-events-none absolute inset-0 grid place-items-center text-mono text-[10px] font-bold"
                      style={{ backgroundColor: color, color: fg }}
                    >
                      Aa
                    </span>
                  </label>
                  <code className="text-mono text-xs uppercase text-foreground">{color}</code>
                  <Badge variant={colorName === "Claro" ? "volt" : "muted"}>{colorName}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {BRAND_SWATCHES.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => { setColor(swatch); mark(); }}
                      className={cn(
                        "h-7 w-7 rounded-md border transition-transform hover:scale-110",
                        color.toLowerCase() === swatch.toLowerCase() && "ring-2 ring-ring ring-offset-2 ring-offset-background"
                      )}
                      style={{ backgroundColor: swatch }}
                      aria-label={`Color ${swatch}`}
                    />
                  ))}
                </div>
                <p className="text-mono text-[10px] text-muted-foreground">
                  Contraste auto: <code className="text-[var(--tenant-primary)]">{fg}</code>
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Logo</Label>
                <div className="flex items-center gap-3">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logo} alt="Logo" className="h-12 w-12 rounded-lg border border-border object-cover" />
                  ) : (
                    <div
                      className="grid h-12 w-12 place-items-center rounded-lg"
                      style={{ backgroundColor: color, color: fg }}
                    >
                      <span className="font-display text-sm font-bold">
                        {(name || "ZA").replace(/[·&]/g, " ").split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 text-xs text-foreground transition-colors hover:bg-accent">
                      <ImagePlus className="h-3.5 w-3.5" />
                      Subir logo
                      <input type="file" accept="image/*" className="hidden" disabled={!canEdit} onChange={(e) => onLogoFile(e.target.files?.[0])} />
                    </label>
                    {logo && (
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground" onClick={() => { setLogo(null); mark(); }} disabled={!canEdit}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Quitar
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-mono text-[10px] text-muted-foreground">
                  Dominio: {organization.custom_domain ?? "sin custom domain"}
                </p>
              </div>

              <div className="flex items-center gap-2 border-t border-border pt-4">
                <Button onClick={save} disabled={!canEdit || saving || !dirty}>
                  {saving ? <Loader2 className="animate-spin" /> : <Check />}
                  {saving ? "Guardando…" : "Guardar marca"}
                </Button>
                <Button variant="outline" onClick={reset} disabled={!dirty}>
                  <RotateCcw />
                  Descartar
                </Button>
                {!canEdit && (
                  <span className="text-xs text-muted-foreground">
                    Solo el admin de la organización puede editar la marca.
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-wrap items-center gap-2 pt-5">
              <Badge variant="muted" className="gap-1.5">
                <ShieldCheck className="h-3 w-3 text-[var(--tenant-primary)]" />
                RLS activo
              </Badge>
              <span className="text-xs text-muted-foreground">
                Los cambios se aplican solo a <b className="text-foreground">{organization.name}</b>. El color se resuelve con contraste WCAG automático.
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="w-full shrink-0 xl:w-[380px]">
          <div className="sticky top-24 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Vista previa en vivo</p>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${hexToRgba(color, 0.8)}` }} />
            </div>
            <BrandPreview name={name} color={color} logo={logo} />
            <p className="text-center text-[10px] text-muted-foreground">
              La preview usa la misma variable CSS que el resto del CRM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
