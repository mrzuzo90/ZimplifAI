"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/** Cliente Supabase del navegador. `null` si no hay entorno configurado (modo demo/offline). */
export function getSupabaseBrowserClient() {
  if (typeof window === "undefined") return null;
  if (!url || !anonKey) return null;
  if (!client) {
    client = createBrowserClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}
