"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  ExternalLink,
  Loader2,
  Monitor,
  Plus,
  Save,
  Smartphone,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBranding } from "@/hooks/useBranding";
import { ensureTenantSite, setSitePublished, updateTenantSite } from "@/lib/data-access";
import { defaultContentForTemplate, templateLabel } from "@/lib/site";
import { SITE_TEMPLATE_LABELS, SITE_VERTICAL_TEMPLATES, type TenantSite } from "@/types/database";
import { SiteRenderer } from "@/components/sites/SiteRenderer";
import { cn } from "@/lib/utils";

/** Editor de sitio web vertical: formulario a la izquierda, preview en vivo a la derecha. */
export function SiteEditor({ orgId }: { orgId: string }) {
  const { organization } = useBranding();
  const [site, setSite] = useState<TenantSite | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  const primary = organization?.primary_color ?? "#CEFF00";
  const logoUrl = organization?.logo_url ?? null;

  // Carga/crea el sitio por defecto del tenant (async IIFE + cancelled — regla ESLint).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await ensureTenantSite(orgId, organization?.vertical_type === "restaurant_booking" ? "restaurant_menu" : "service_catalog", organization?.name ?? undefined);
        if (!cancelled) setSite(s);
      } catch {
        if (!cancelled) toast.error("No se pudo cargar el sitio");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, organization?.vertical_type, organization?.name]);

  if (loading || !site) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">Cargando sitio…</span>
      </div>
    );
  }

  const c = site.content_payload;

  /** Aplica un cambio de contenido (immutable). */
  const patchContent = (patch: Partial<TenantSite["content_payload"]>) =>
    setSite((s) => (s ? { ...s, content_payload: { ...s.content_payload, ...patch } } : s));

  const setHero = (k: keyof typeof c.hero, v: string) =>
    patchContent({ hero: { ...c.hero, [k]: v } });

  const setContact = (k: keyof typeof c.contact, v: string) =>
    patchContent({ contact: { ...c.contact, [k]: v } });

  const setItem = (i: number, patch: Partial<typeof c.menu_items[number]>) =>
    patchContent({
      menu_items: c.menu_items.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
    });

  const setHours = (i: number, patch: Partial<typeof c.business_hours[number]>) =>
    patchContent({
      business_hours: c.business_hours.map((h, idx) => (idx === i ? { ...h, ...patch } : h)),
    });

  const switchTemplate = (template: TenantSite["vertical_template"]) => {
    if (template === site.vertical_template) return;
    setSite((s) =>
      s
        ? {
            ...s,
            vertical_template: template,
            content_payload: { ...defaultContentForTemplate(template), contact: s.content_payload.contact },
          }
        : s
    );
    toast.success(`Plantilla: ${SITE_TEMPLATE_LABELS[template]}`);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateTenantSite(orgId, site.id, {
        title: site.title,
        slug: site.slug,
        vertical_template: site.vertical_template,
        seo_metadata: site.seo_metadata,
        content_payload: site.content_payload,
      });
      toast.success("Cambios guardados");
    } catch {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async () => {
    try {
      await setSitePublished(orgId, site.id, !site.is_published);
      setSite((s) => (s ? { ...s, is_published: !s.is_published } : s));
      toast.success(site.is_published ? "Sitio despublicado" : "Sitio publicado");
    } catch {
      toast.error("No se pudo actualizar la publicación");
    }
  };

  return (
    <div className="grid h-[calc(100vh-9.5rem)] gap-4 lg:grid-cols-[minmax(340px,420px)_1fr]">
      {/* ===== Izquierda: configurador ===== */}
      <div className="flex min-h-0 flex-col rounded-xl border border-border bg-surface">
        {/* Selector de plantilla */}
        <div className="border-b border-border p-4">
          <Label className="text-xs text-muted-foreground">Plantilla del sitio</Label>
          <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
            {SITE_VERTICAL_TEMPLATES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTemplate(t)}
                className={cn(
                  "rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors",
                  site.vertical_template === t
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {templateLabel(t)}
              </button>
            ))}
          </div>
        </div>

        <Tabs defaultValue="hero" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-4 mt-3 justify-start">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="menu">Menú / Servicios</TabsTrigger>
            <TabsTrigger value="hours">Horario y lugar</TabsTrigger>
            <TabsTrigger value="seo">SEO y dominio</TabsTrigger>
          </TabsList>

          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 p-4">
              <TabsContent value="hero" className="mt-0 space-y-4">
                <Field label="Título destacado">
                  <Input value={c.hero.headline} onChange={(e) => setHero("headline", e.target.value)} />
                </Field>
                <Field label="Subtítulo">
                  <Input value={c.hero.subheadline} onChange={(e) => setHero("subheadline", e.target.value)} />
                </Field>
                <Field label="Badge (etiqueta)">
                  <Input value={c.hero.badge} onChange={(e) => setHero("badge", e.target.value)} />
                </Field>
                <Field label="Texto del botón CTA">
                  <Input value={c.hero.cta_text} onChange={(e) => setHero("cta_text", e.target.value)} />
                </Field>
                <Field label="Imagen de fondo (URL)">
                  <Input value={c.hero.bg_image} onChange={(e) => setHero("bg_image", e.target.value)} placeholder="https://…" />
                </Field>
              </TabsContent>

              <TabsContent value="menu" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Secciones visibles</Label>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Switch
                          checked={c.sections.show_menu}
                          onCheckedChange={(v) => patchContent({ sections: { ...c.sections, show_menu: v } })}
                        />
                        Carta
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Switch
                          checked={c.sections.show_booking}
                          onCheckedChange={(v) => patchContent({ sections: { ...c.sections, show_booking: v } })}
                        />
                        CTA
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {c.menu_items.map((item, i) => (
                    <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                      <div className="grid grid-cols-[1fr_90px] gap-2">
                        <Input value={item.name} onChange={(e) => setItem(i, { name: e.target.value })} placeholder="Nombre" />
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={String(item.price)}
                          onChange={(e) => setItem(i, { price: Number(e.target.value) })}
                          placeholder="Precio"
                        />
                      </div>
                      <Input value={item.category} onChange={(e) => setItem(i, { category: e.target.value })} placeholder="Categoría" />
                      <Input value={item.description} onChange={(e) => setItem(i, { description: e.target.value })} placeholder="Descripción" />
                      <div className="flex items-center gap-2">
                        <Input value={item.image} onChange={(e) => setItem(i, { image: e.target.value })} placeholder="Imagen (URL, opcional)" className="text-xs" />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 shrink-0 text-destructive"
                          onClick={() =>
                            patchContent({ menu_items: c.menu_items.filter((_, idx) => idx !== i) })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      patchContent({
                        menu_items: [...c.menu_items, { category: "Nueva", name: "", description: "", price: 0, image: "" }],
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir elemento
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="hours" className="mt-0 space-y-4">
                <div className="space-y-3">
                  {c.business_hours.map((h, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1.2fr_auto] items-center gap-2">
                      <Input value={h.day} onChange={(e) => setHours(i, { day: e.target.value })} placeholder="Días" className="text-xs" />
                      <Input value={h.hours} onChange={(e) => setHours(i, { hours: e.target.value })} placeholder="Horas" className="text-xs" />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => patchContent({ business_hours: c.business_hours.filter((_, idx) => idx !== i) })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => patchContent({ business_hours: [...c.business_hours, { day: "", hours: "" }] })}
                  >
                    <Plus className="h-3.5 w-3.5" /> Añadir horario
                  </Button>
                </div>

                <div className="h-px bg-border" />

                <Field label="Dirección">
                  <Input value={c.contact.address} onChange={(e) => setContact("address", e.target.value)} />
                </Field>
                <Field label="Teléfono">
                  <Input value={c.contact.phone} onChange={(e) => setContact("phone", e.target.value)} />
                </Field>
                <Field label="WhatsApp">
                  <Input value={c.contact.whatsapp} onChange={(e) => setContact("whatsapp", e.target.value)} />
                </Field>
                <Field label="Enlace Google Maps">
                  <Input value={c.contact.google_maps_url} onChange={(e) => setContact("google_maps_url", e.target.value)} />
                </Field>
              </TabsContent>

              <TabsContent value="seo" className="mt-0 space-y-4">
                <Field label="Título del sitio">
                  <Input
                    value={site.title}
                    onChange={(e) => setSite((s) => (s ? { ...s, title: e.target.value } : s))}
                  />
                </Field>
                <Field label="Meta title">
                  <Input
                    value={String(site.seo_metadata.meta_title ?? "")}
                    onChange={(e) => setSite((s) => (s ? { ...s, seo_metadata: { ...s.seo_metadata, meta_title: e.target.value } } : s))}
                  />
                </Field>
                <Field label="Meta description">
                  <Input
                    value={String(site.seo_metadata.meta_description ?? "")}
                    onChange={(e) =>
                      setSite((s) => (s ? { ...s, seo_metadata: { ...s.seo_metadata, meta_description: e.target.value } } : s))
                    }
                  />
                </Field>
                <Field label="Slug público">
                  <div className="flex items-center gap-1.5">
                    <span className="text-mono text-xs text-muted-foreground">/s/</span>
                    <Input
                      value={site.slug}
                      onChange={(e) => setSite((s) => (s ? { ...s, slug: e.target.value.replace(/\s+/g, "-").toLowerCase() } : s))}
                      className="font-mono text-xs"
                    />
                  </div>
                </Field>
                <Field label="Dominio personalizado (opcional)">
                  <Input
                    value={site.custom_domain ?? ""}
                    onChange={(e) => setSite((s) => (s ? { ...s, custom_domain: e.target.value || null } : s))}
                    placeholder="www.tunegocio.com"
                  />
                </Field>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        {/* Acciones */}
        <div className="flex items-center gap-2 border-t border-border p-4">
          <Button onClick={() => void save()} disabled={saving} className="flex-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </Button>
          <Button variant="outline" onClick={() => void togglePublished()}>
            {site.is_published ? "Despublicar" : "Publicar"}
          </Button>
          <Button
            variant="ghost"
            asChild
            title="Ver sitio publicado"
            className="px-2.5"
          >
            <a href={`/s/${site.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* ===== Derecha: preview en vivo ===== */}
      <div className="flex min-h-0 flex-col rounded-xl border border-border bg-[#0b0d0c]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
          <div className="flex items-center gap-1 rounded-md bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                device === "mobile" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
              )}
            >
              <Smartphone className="h-3.5 w-3.5" /> Móvil
            </button>
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={cn(
                "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
                device === "desktop" ? "bg-white/10 text-white" : "text-white/50 hover:text-white"
              )}
            >
              <Monitor className="h-3.5 w-3.5" /> Escritorio
            </button>
          </div>
          <a
            href={`/s/${site.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-white/70 transition-colors hover:text-white"
          >
            Ver sitio publicado <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-4">
          <div
            className={cn(
              "overflow-hidden rounded-lg bg-white shadow-2xl transition-all",
              device === "mobile" ? "w-[375px] max-w-full" : "w-full max-w-3xl"
            )}
          >
            <SiteRenderer site={site} brandColor={primary} brandLogo={logoUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
