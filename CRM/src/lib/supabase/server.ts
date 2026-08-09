import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Cliente Supabase de servidor con cookies de sesión (para RSC / server actions). */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(url ?? "", anonKey ?? "", {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Llamado desde un Server Component: no se pueden setear cookies aquí.
        }
      },
    },
  });
}

export { isSupabaseConfigured };
