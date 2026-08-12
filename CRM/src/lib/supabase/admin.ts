import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Cliente de servidor con `service_role` (bypass de RLS).
 * SOLO para server-side (API routes, server actions de admin).
 * Nunca importar en componentes de cliente.
 * Devuelve null si se ejecuta en el navegador para evitar exponer la clave service_role.
 */
export function getServiceSupabase() {
  if (typeof window !== "undefined") return null; // Evita fuga de service_role al bundle cliente
  if (!url || !serviceRole) return null;
  return createClient<Database>(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const isAdminConfigured = () => Boolean(url && serviceRole);
