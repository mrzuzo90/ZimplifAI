"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBranding } from "@/hooks/useBranding";
import { Loader2 } from "lucide-react";

/**
 * Guardia de ruta para páginas de administración.
 * Solo permite acceso si:
 * - isAgencyMode === true (super_admin sin impersonar)
 * - Se redirige a /workspace si no se cumplen las condiciones.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAgencyMode, loading } = useBranding();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAgencyMode) {
      router.replace("/workspace");
      router.refresh();
    }
  }, [isAgencyMode, loading, router]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--tenant-primary)]" />
      </div>
    );
  }

  if (!isAgencyMode) {
    // Render a loading skeleton instead of null to avoid layout flash during redirect
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--tenant-primary)]" />
      </div>
    );
  }

  return <>{children}</>;
}