"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/hooks/useBranding";
import { cn } from "@/lib/utils";

/** Banner persistente: SuperAdmin viendo una subcuenta en modo agencia. */
export function ImpersonationBanner({ className }: { className?: string }) {
  const router = useRouter();
  // stopImpersonation (contexto) hace DELETE + refresh de sesión + reload del contexto:
  // sin el reload, el provider persistente del layout conservaría el estado impersonado.
  const { isImpersonating, organization, isSuperAdmin, stopImpersonation } = useBranding();
  if (!isImpersonating || !isSuperAdmin) return null;

  const exit = async () => {
    try {
      await stopImpersonation();
      router.push("/admin");
      router.refresh();
    } catch {
      toast.error("No se pudo salir al modo agencia");
    }
  };

  return (
    <div className={cn("border-b border-warning/30 bg-warning/10", className)}>
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-4 py-2 sm:px-6">
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Eye className="h-3.5 w-3.5 text-warning" />
          Viewing as SuperAdmin (Agency Mode)
          <span className="hidden text-muted-foreground sm:inline">
            · dentro de <span className="font-semibold text-foreground">{organization?.name ?? "subcuenta"}</span>
          </span>
        </span>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-7 border-warning/40 px-2.5 text-[11px] text-warning hover:bg-warning/10 hover:text-warning"
          onClick={() => void exit()}
        >
          <LogOut className="h-3 w-3" />
          Exit to Agency Dashboard
        </Button>
      </div>
    </div>
  );
}
