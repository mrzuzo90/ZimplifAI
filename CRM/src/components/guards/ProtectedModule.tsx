"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldX } from "lucide-react";
import { useBranding } from "@/context/BrandingContext";
import { moduleKeyForRoute } from "@/lib/modules";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { MODULE_LABELS, type ModuleKey } from "@/types/database";

/**
 * Guarda una ruta del workspace: si la organización activa no tiene
 * habilitado el módulo que exige la ruta (y el usuario no es SuperAdmin),
 * bloquea la navegación directa mostrando un estado de módulo inactivo.
 */
export function ProtectedModule({
  moduleKey,
  children,
}: {
  /** Opcional: si se omite se infiere de la ruta actual. */
  moduleKey?: ModuleKey;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { isSuperAdmin, isModuleEnabled, loading } = useBranding();
  const required = moduleKey ?? moduleKeyForRoute(pathname);

  if (loading) return <LoadingState label="Comprobando acceso" />;
  if (required && !isSuperAdmin && !isModuleEnabled(required)) {
    return (
      <EmptyState
        icon={ShieldX}
        title={`Módulo no activo`}
        description={`Tu subcuenta no tiene habilitado «${MODULE_LABELS[required] ?? required}». Pide a tu agencia que lo active.`}
        action={
          <Link
            href="/workspace"
            className="text-xs font-medium text-[var(--tenant-primary)] hover:underline"
          >
            Volver al panel →
          </Link>
        }
      />
    );
  }
  return <>{children}</>;
}
