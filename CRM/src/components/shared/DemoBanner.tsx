"use client";

import { useEffect, useState } from "react";
import { FlaskConical, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/hooks/useBranding";
import { resetMockDb } from "@/lib/mock-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/** Banner de modo demo: aviso + conmutador rol + reset de datos. */
export function DemoBanner({ className }: { className?: string }) {
  const { demoMode, isSuperAdmin, switchDemoRole } = useBranding();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Evita hydration mismatch: solo renderiza tras montar en client.
  if (!mounted || !demoMode) return null;

  return (
    <div className={cn("border-b border-[var(--tenant-primary)]/25 bg-[var(--tenant-primary)]/5", className)}>
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-2 px-4 py-2 sm:px-6">
        <span className="flex items-center gap-1.5 text-xs text-foreground">
          <FlaskConical className="h-3.5 w-3.5 text-[var(--tenant-primary)]" />
          <span className="font-medium">Modo demo</span>
          <span className="hidden text-muted-foreground sm:inline">
            — datos locales en tu navegador. Conecta Supabase en <code className="text-mono text-[11px] text-[var(--tenant-primary)]">.env.local</code>.
          </span>
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <Button
            variant={isSuperAdmin ? "subtle" : "default"}
            size="sm"
            className="h-7 px-2.5 text-[11px]"
            onClick={() => switchDemoRole("super_admin")}
          >
            SuperAdmin
          </Button>
          <Button
            variant={isSuperAdmin ? "default" : "subtle"}
            size="sm"
            className="h-7 px-2.5 text-[11px]"
            onClick={() => switchDemoRole("client_admin")}
          >
            Cliente
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[11px] text-muted-foreground"
            onClick={() => {
              resetMockDb();
              toast.success("Datos demo restablecidos");
              window.location.reload();
            }}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </span>
      </div>
    </div>
  );
}
