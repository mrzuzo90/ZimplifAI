"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Code, Loader2, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { TenantLogo } from "@/components/shared/TenantLogo";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fetchModules, setModuleEnabled, setModuleSettings } from "@/lib/data-access";
import { MODULE_DESCRIPTIONS, MODULE_ICONS } from "@/lib/modules";
import { ReservationBotSetup } from "@/components/admin/ReservationBotSetup";
import { cn } from "@/lib/utils";
import {
  MODULE_KEYS,
  MODULE_LABELS,
  type ModuleKey,
  type OrganizationModule,
  type OrganizationWithStats,
} from "@/types/database";

/**
 * Drawer de gestión de features por subcuenta. Solo SuperAdmin lo abre:
 * conmuta módulos en tiempo real y edita sus settings de configuración.
 */
export function FeatureManagementDrawer({
  org,
  open,
  onOpenChange,
  onChanged,
}: {
  org: OrganizationWithStats;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se invoca tras cada cambio para refrescar el overview de agencia. */
  onChanged: () => void;
}) {
  const [modules, setModules] = useState<OrganizationModule[]>([]);
  const [expanded, setExpanded] = useState<ModuleKey | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<ModuleKey | null>(null);
  const [busyKey, setBusyKey] = useState<ModuleKey | null>(null);

  // El componente se monta al abrirse (parent conditional) → carga fresca.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchModules(org.id);
        if (cancelled) return;
        setModules(rows);
        setDrafts(
          Object.fromEntries(
            rows.map((r) => [r.module_key, JSON.stringify(r.settings ?? {}, null, 2)])
          )
        );
      } catch {
        if (!cancelled) toast.error("No se pudieron cargar los módulos");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, org.id]);

  const loading = open && modules.length === 0;

  const toggle = async (key: ModuleKey, enabled: boolean) => {
    const prev = modules;
    setModules((cur) =>
      cur.map((m) => (m.module_key === key ? { ...m, is_enabled: enabled } : m))
    );
    setBusyKey(key);
    try {
      await setModuleEnabled(org.id, key, enabled);
      toast.success(`${MODULE_LABELS[key]} ${enabled ? "activado" : "desactivado"}`);
      onChanged();
    } catch {
      setModules(prev);
      toast.error("No se pudo actualizar el módulo");
    } finally {
      setBusyKey(null);
    }
  };

  /** Sincroniza settings del bot en modules + drafts (para que el JSON no quede obsoleto). */
  const syncBotSettings = (key: ModuleKey, settings: Record<string, unknown>) => {
    setModules((cur) =>
      cur.map((m) => (m.module_key === key ? { ...m, settings } : m))
    );
    setDrafts((cur) => ({ ...cur, [key]: JSON.stringify(settings, null, 2) }));
  };

  const saveSettings = async (key: ModuleKey) => {
    const raw = drafts[key];
    if (!raw?.trim()) return;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      toast.error("JSON de settings inválido");
      return;
    }
    setSaving(key);
    try {
      await setModuleSettings(org.id, key, parsed);
      setModules((cur) =>
        cur.map((m) => (m.module_key === key ? { ...m, settings: parsed } : m))
      );
      toast.success("Settings guardados");
    } catch {
      toast.error("No se guardaron los settings");
    } finally {
      setSaving(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0">
        <SheetHeader>
          <div className="flex items-center gap-3 pr-8">
            <TenantLogo organization={org} size="md" />
            <div className="min-w-0">
              <SheetTitle className="truncate">Gestión de features</SheetTitle>
              <SheetDescription className="truncate">
                {org.name} · {org.slug}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            <span>
              Solo el SuperAdmin puede activar o desactivar módulos. Los cambios se aplican en
              tiempo real al workspace del cliente.
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--tenant-primary)]" />
              <span className="text-mono text-xs uppercase tracking-wider">Cargando módulos…</span>
            </div>
          ) : (
            <div className="space-y-2">
              {MODULE_KEYS.map((key) => {
                const mod = modules.find((m) => m.module_key === key);
                const Icon = MODULE_ICONS[key];
                const isOpen = expanded === key;
                return (
                  <div
                    key={key}
                    className={cn(
                      "rounded-lg border border-border bg-background transition-colors",
                      isOpen && "border-border-strong"
                    )}
                  >
                    <div className="flex items-center gap-3 p-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent">
                        <Icon className="h-4 w-4 text-[var(--tenant-primary)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{MODULE_LABELS[key]}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {MODULE_DESCRIPTIONS[key]}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => setExpanded(isOpen ? null : key)}
                        aria-label={`Configurar ${MODULE_LABELS[key]}`}
                      >
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Switch
                        checked={mod?.is_enabled ?? false}
                        onCheckedChange={(checked) => void toggle(key, checked)}
                        disabled={busyKey !== null}
                        aria-label={`Activar ${MODULE_LABELS[key]}`}
                      />
                    </div>

                    {isOpen && (
                      <div className="space-y-2 border-t border-border px-3 py-3">
                        {key === "reservation_bot" && mod && (
                          <ReservationBotSetup
                            orgId={org.id}
                            settings={mod.settings ?? {}}
                            onUpdated={(s) => syncBotSettings(key, s)}
                          />
                        )}
                        <div className="flex items-center gap-1.5 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          <Code className="h-3 w-3 text-[var(--tenant-primary)]" />
                          Configuración JSON
                        </div>
                        <Textarea
                          value={drafts[key] ?? "{}"}
                          onChange={(e) =>
                            setDrafts((cur) => ({ ...cur, [key]: e.target.value }))
                          }
                          rows={6}
                          className="font-mono text-xs"
                          spellCheck={false}
                          aria-label={`Settings de ${MODULE_LABELS[key]}`}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => void saveSettings(key)}
                          disabled={saving !== null}
                        >
                          {saving === key ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="h-3.5 w-3.5" />
                          )}
                          Guardar settings
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <SheetFooter>
          <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {org.modules.filter((m) => m.is_enabled).length ?? 0} / {MODULE_KEYS.length} módulos activos
          </span>
          <Button size="sm" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
