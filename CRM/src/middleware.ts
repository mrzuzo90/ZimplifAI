import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Extraer el project ref de la URL de Supabase para CSP específico de realtime.
// Ejemplo: https://abcdefgh.supabase.co → project ref = abcdefgh
const supabaseProjectRef = url ? new URL(url).host.split(".")[0] : null;
const realtimeWss = supabaseProjectRef
  ? `wss://${supabaseProjectRef}.supabase.co`
  : "wss:";

/**
 * Cabeceras de seguridad (Fase I). Se aplican a TODAS las respuestas,
 * incluidas las redirigidas. CSP restrictiva para la app; los estilos
 * inline de Tailwind v4 necesitan nonce/'unsafe-inline'.
 */
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' https: ${realtimeWss}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
} as const;

// Mapa para deduplicar refreshSession por sesión (evita race conditions en peticiones concurrentes)
const refreshCache = new Map<string, Promise<void>>();

function getSessionKey(request: NextRequest): string | null {
  const cookies = request.cookies;
  // Buscar cookie de sesión de Supabase (formato: sb-<project-ref>-auth-token)
  for (const [name, value] of cookies) {
    if (name.startsWith("sb-") && name.endsWith("-auth-token")) {
      return `${name}=${value}`;
    }
  }
  return null;
}

/**
 * Middleware de sesión + hardening: refresca el token de Supabase y mantiene
 * las cookies al día. Sin entorno configurado → no bloquea (modo demo).
 *
 * IMPORTANTE: Usa refreshSession() en lugar de getUser() para forzar la
 * actualización de claims del JWT (role, organization_id, _impersonated_from).
 * Esto es crítico después de operaciones de impersonación (POST/DELETE
 * /api/admin/impersonate) donde el JWT del cliente queda stale hasta el
 * próximo refresh. Sin este refresh, AdminGuard ve isAgencyMode=false y
 * redirige al super_admin a /workspace, y las políticas RLS fallan.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Hardening: cabeceras de seguridad en cada respuesta.
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }

  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // --- Server-side admin guard: protege /admin/:path* antes de renderizar ---
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/admin")) {
    const { data: { user } } = await supabase.auth.getUser();
    const role = user?.app_metadata?.role;
    const impersonatedFrom = user?.app_metadata?._impersonated_from;
    const effectiveRole = (impersonatedFrom ?? role) as string | undefined;
    const isAgencyMode = effectiveRole === "super_admin" && !impersonatedFrom;

    if (!isAgencyMode) {
      // No es super_admin o está impersonando → redirigir a workspace
      const redirectUrl = new URL("/workspace", request.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Deduplicar refreshSession por sesión para evitar race conditions
  const sessionKey = getSessionKey(request);
  if (sessionKey) {
    let refreshPromise = refreshCache.get(sessionKey);
    if (!refreshPromise) {
      refreshPromise = supabase.auth.refreshSession().then(() => {
        refreshCache.delete(sessionKey);
      });
      refreshCache.set(sessionKey, refreshPromise);
    }
    await refreshPromise;
  } else {
    // Sin cookie de sesión: refresh normal (primera carga)
    await supabase.auth.refreshSession();
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
