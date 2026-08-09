/** Config neutra de Supabase: sin imports de next/headers, segura para cliente y servidor. */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Indica si el entorno Supabase está configurado. */
export const isSupabaseConfigured = () => Boolean(url && anonKey);
