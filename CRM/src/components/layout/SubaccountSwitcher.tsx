"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TenantLogo } from "@/components/shared/TenantLogo";
import { useBranding } from "@/hooks/useBranding";
import { fetchOrganizations, impersonate, stopImpersonating } from "@/lib/data-access";
import { VERTICAL_LABELS, type Organization } from "@/types/database";
import { cn } from "@/lib/utils";

/**
 * Switcher global de subcuentas (solo SuperAdmin).
 * - "Agency View (All Subaccounts)": contexto de agencia global.
 * - Subcuenta: impersona y entra en el workspace tal y como lo ve el cliente.
 */
export function SubaccountSwitcher({ className }: { className?: string }) {
  const router = useRouter();
  const { organization, isSuperAdmin, isAgencyMode, isImpersonating } = useBranding();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchOrganizations();
        if (!cancelled) setOrgs(rows);
      } catch {
        if (!cancelled) setOrgs([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  if (!isSuperAdmin) return null;

  const goAgency = async () => {
    if (isImpersonating) {
      setBusy("__agency__");
      try {
        await stopImpersonating();
      } catch {
        toast.error("No se pudo salir al modo agencia");
        setBusy(null);
        return;
      }
    }
    setBusy(null);
    router.push("/admin");
    router.refresh();
  };

  const enterOrg = async (o: Organization) => {
    setBusy(o.id);
    try {
      await impersonate(o.id);
      toast.success(`Entrando en ${o.name}`);
      router.push("/workspace");
    } catch {
      toast.error("No se pudo entrar en la subcuenta");
    } finally {
      setBusy(null);
    }
  };

  const activeName = isAgencyMode ? "Agency View" : (organization?.name ?? "Seleccionar");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2 px-2 text-left", className)}
          aria-label="Cambiar de contexto"
          disabled={busy !== null}
        >
          {isAgencyMode ? (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--tenant-primary)]">
              <Building2 className="h-4 w-4 text-pitch" />
            </span>
          ) : (
            <TenantLogo organization={organization} size="sm" />
          )}
          <span className="hidden max-w-[150px] truncate text-xs font-medium text-foreground md:block">
            {activeName}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Contexto global</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => void goAgency()}
            className={cn("gap-3 py-2", isAgencyMode && "bg-accent")}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--tenant-primary)]">
              <Building2 className="h-4 w-4 text-pitch" />
            </span>
            <span className="flex-1 text-xs">Agency View (All Subaccounts)</span>
            {isAgencyMode && <Check className="h-3.5 w-3.5 text-[var(--tenant-primary)]" />}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Subcuentas</DropdownMenuLabel>
        <DropdownMenuGroup className="max-h-72 overflow-y-auto">
          {orgs.map((o) => {
            const active = !isAgencyMode && o.id === organization?.id;
            return (
              <DropdownMenuItem
                key={o.id}
                onSelect={() => void enterOrg(o)}
                disabled={busy !== null}
                className="gap-3 py-2"
              >
                <TenantLogo organization={o} size="sm" />
                <span className="flex-1 truncate text-xs">{o.name}</span>
                <span className="text-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {VERTICAL_LABELS[o.vertical_type]}
                </span>
                {active && <Check className="h-3.5 w-3.5 text-[var(--tenant-primary)]" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/admin/provision")} className="gap-2">
          <Plus className="text-[var(--tenant-primary)]" />
          <span className="text-xs">Aprovisionar subcuenta</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
