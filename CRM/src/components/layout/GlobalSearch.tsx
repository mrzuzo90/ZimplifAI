"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  CalendarDays,
  CornerDownLeft,
  Kanban,
  Layers,
  Palette,
  Search,
  ShieldCheck,
} from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useBranding } from "@/hooks/useBranding";
import { fetchOrganizations, impersonate } from "@/lib/data-access";
import { VERTICAL_LABELS, type ModuleKey, type Organization } from "@/types/database";

const PAGES: Array<{ label: string; hint: string; href: string; icon: typeof Kanban; module: ModuleKey }> = [
  { label: "Pipeline de ventas", hint: "Pipeline", href: "/workspace", icon: Kanban, module: "sales_kanban" },
  { label: "Reservas de hoy", hint: "Bookings", href: "/workspace/bookings", icon: CalendarDays, module: "booking_calendar" },
  { label: "Agentes IA y automatización", hint: "Automations", href: "/workspace/automations", icon: Bot, module: "whatsapp_bot" },
  { label: "Logs de IA", hint: "Logs", href: "/workspace/logs", icon: Layers, module: "ai_logs" },
  { label: "Marca y personalización", hint: "Settings", href: "/workspace/settings/branding", icon: Palette, module: "light_web_menu" },
];

export function GlobalSearch() {
  const router = useRouter();
  const { isSuperAdmin, isModuleEnabled } = useBranding();
  const [open, setOpen] = useState(false);
  const [orgs, setOrgs] = useState<Organization[]>([]);

  const pages = PAGES.filter((p) => isSuperAdmin || isModuleEnabled(p.module));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open && isSuperAdmin && orgs.length === 0) {
      void fetchOrganizations().then(setOrgs).catch(() => setOrgs([]));
    }
  }, [open, isSuperAdmin, orgs.length]);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group flex h-9 w-full max-w-sm items-center gap-2.5 rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-mono text-[10px] text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Busca páginas, leads o cambia de organización…" />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <CommandGroup heading="Navegación">
            {pages.map((p) => {
              const Icon = p.icon;
              return (
                <CommandItem
                  key={p.href}
                  value={p.label}
                  onSelect={() => run(() => router.push(p.href))}
                >
                  <Icon className="text-muted-foreground" />
                  <span>{p.label}</span>
                  <span className="ml-auto flex items-center gap-1 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <CornerDownLeft className="h-3 w-3" /> Enter
                  </span>
                </CommandItem>
              );
            })}
            {isSuperAdmin && (
              <CommandItem value="SuperAdmin" onSelect={() => run(() => router.push("/admin"))}>
                <ShieldCheck className="text-muted-foreground" />
                <span>Panel SuperAdmin</span>
              </CommandItem>
            )}
          </CommandGroup>

          {isSuperAdmin && orgs.length > 0 && (
            <CommandGroup heading="Cambiar organización">
              {orgs.map((o) => (
                <CommandItem
                  key={o.id}
                  value={o.name}
                  onSelect={() =>
                    run(() => {
                      void impersonate(o.id).then(() => router.push("/workspace"));
                    })
                  }
                >
                  <Layers className="text-muted-foreground" />
                  <span className="flex-1 truncate">{o.name}</span>
                  <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {VERTICAL_LABELS[o.vertical_type]}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
