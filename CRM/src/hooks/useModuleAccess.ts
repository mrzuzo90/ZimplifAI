"use client";

import { useBranding } from "@/context/BrandingContext";
import type { ModuleKey } from "@/types/database";

/**
 * Comprueba si la organización activa tiene habilitado un módulo.
 * El SuperAdmin siempre tiene acceso (puede entrar a cualquier subcuenta).
 */
export function useModuleAccess(moduleKey: ModuleKey): boolean {
  const { isSuperAdmin, isModuleEnabled } = useBranding();
  return isSuperAdmin || isModuleEnabled(moduleKey);
}
