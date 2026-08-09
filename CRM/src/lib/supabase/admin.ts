import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Cliente de servidor con `service_role` (bypass de RLS).
 * SOLO para server-side (API routes, server actions de admin).
 * Nunca importar en componentes de cliente.
 */
export function getServiceSupabase() {
  if (!url || !serviceRole) return null;
  return createClient<Database>(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const isAdminConfigured = () => Boolean(url && serviceRole);
