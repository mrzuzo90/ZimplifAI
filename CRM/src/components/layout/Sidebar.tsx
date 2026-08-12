"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  BarChart3,
  Bot,
  Building2,
  CalendarClock,
  CalendarDays,
  FormInput,
  Globe,
  Inbox,
  Kanban,
  ListTodo,
  Palette,
  Receipt,
  Rocket,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Star,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useBranding } from "@/hooks/useBranding";
import { TenantLogo } from "@/components/shared/TenantLogo";
import { VERTICAL_LABELS, type ModuleKey } from "@/types/database";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  moduleKey?: ModuleKey;
  exact?: boolean;
}

const CLIENT_ITEMS: NavItem[] = [
  { label: "Pipeline", href: "/workspace", icon: Kanban, moduleKey: "sales_kanban", exact: true },
  { label: "Empresas", href: "/workspace/sales/companies", icon: Building2, moduleKey: "sales_crm" },
  { label: "Tareas", href: "/workspace/sales/tasks", icon: ListTodo, moduleKey: "sales_crm" },
  { label: "Formularios", href: "/workspace/forms", icon: FormInput, moduleKey: "marketing_forms" },
  { label: "Reservas", href: "/workspace/bookings", icon: CalendarDays, moduleKey: "booking_calendar" },
  { label: "Calendarios", href: "/workspace/bookings/calendars", icon: CalendarClock, moduleKey: "booking_calendar" },
  { label: "Inbox", href: "/workspace/inbox", icon: Inbox, moduleKey: "unified_inbox" },
  { label: "Automations", href: "/workspace/automations", icon: Bot, moduleKey: "whatsapp_bot" },
  { label: "Workflows", href: "/workspace/automations/workflows", icon: Workflow, moduleKey: "workflow_automation" },
  { label: "AI Copilot", href: "/workspace/ai", icon: Sparkles, moduleKey: "ai_copilot" },
  { label: "Logs IA", href: "/workspace/logs", icon: ScrollText, moduleKey: "ai_logs" },
  { label: "Sitio Web", href: "/workspace/marketing/site", icon: Globe, moduleKey: "light_web_menu" },
  { label: "Marca", href: "/workspace/settings/branding", icon: Palette, moduleKey: "light_web_menu" },
  { label: "Facturas", href: "/workspace/finance", icon: Receipt, moduleKey: "finance_suite" },
  { label: "Reseñas", href: "/workspace/reputation", icon: Star, moduleKey: "reputation_mgmt" },
  { label: "ROI Dashboard", href: "/workspace/analytics/roi", icon: BarChart3, moduleKey: "roi_dashboard" },
];

const AGENCY_ITEMS: NavItem[] = [
  { label: "Agency Dashboard", href: "/admin", icon: Building2, exact: true },
  { label: "Provisión 1-Click", href: "/admin/provision", icon: Rocket },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { organization, isSuperAdmin, isAgencyMode, isModuleEnabled, isImpersonating, stopImpersonation } =
    useBranding();
  const vertical = organization?.vertical_type ?? "custom_agency";

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  // Clientes: solo módulos habilitados. SuperAdmin en impersonación: todos.
  const clientItems = CLIENT_ITEMS.filter((item) =>
    isSuperAdmin ? true : item.moduleKey ? isModuleEnabled(item.moduleKey) : true
  );

  /**
   * Navegación al Agency Dashboard. Estando dentro de una subcuenta (impersonando)
   * es imprescindible salir de la impersonación primero: sin el stop, el contexto
   * sigue apuntando a la subcuenta y /admin no muestra la vista de agencia real.
   */
  const goAgencyDashboard = async () => {
    if (isImpersonating) {
      try {
        await stopImpersonation();
      } catch {
        toast.error("No se pudo salir al modo agencia");
        return;
      }
    }
    onNavigate?.();
    router.push("/admin");
    router.refresh();
  };

  const renderLink = (item: NavItem, action?: () => void) => {
    const active = isActive(item);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={(e) => {
          onNavigate?.();
          if (action) {
            e.preventDefault();
            void action();
          }
        }}
        className={cn(
          "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
          active
            ? "bg-accent text-foreground [&_svg]:text-[var(--tenant-primary)]"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0 transition-colors" />
        <span className="flex-1 truncate">{item.label}</span>
        {active && <span className="h-1.5 w-1.5 rounded-full bg-[var(--tenant-primary)] glow-volt" />}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Image
          src="/imagotipo.png"
          alt="ZimplifAI"
          width={140}
          height={56}
          className="h-6 w-auto"
          priority
        />
      </div>

      {/* Contexto del tenant / agencia */}
      {isAgencyMode ? (
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--tenant-primary)]">
            <ShieldCheck className="h-4 w-4 text-pitch" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">Agency View</p>
            <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Todas las subcuentas
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
          <TenantLogo organization={organization} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-foreground">
              {organization?.name ?? "Sin organización"}
            </p>
            <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {VERTICAL_LABELS[vertical]}
            </p>
          </div>
        </div>
      )}

      {/* Navegación */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        {isAgencyMode ? (
          <>
            <p className="px-2 pb-2 pt-1 text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              Operación global
            </p>
            {AGENCY_ITEMS.map((item) =>
              renderLink(item, item.href === "/admin" ? goAgencyDashboard : undefined)
            )}
          </>
        ) : (
          <>
            <p className="px-2 pb-2 pt-1 text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              Operaciones
            </p>
            {clientItems.map((item) => renderLink(item))}

            {isSuperAdmin && (
              <>
                <p className="px-2 pb-2 pt-5 text-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
                  ZimplifAI
                </p>
                <Link
                  href="/admin"
                  onClick={(e) => {
                    e.preventDefault();
                    void goAgencyDashboard();
                  }}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                    pathname.startsWith("/admin")
                      ? "bg-accent text-foreground [&_svg]:text-[var(--tenant-primary)]"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">Agency Dashboard</span>
                </Link>
              </>
            )}
          </>
        )}
      </nav>

      {/* Pie */}
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center gap-2 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <Zap className="h-3 w-3 text-[var(--tenant-primary)]" />
          v1.1 · agency multi-tenant
        </div>
      </div>
    </div>
  );
}
