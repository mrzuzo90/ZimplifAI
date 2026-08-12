import { NextResponse } from "next/server";
import { getServiceSupabase, isAdminConfigured } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Impersonación de subcuenta.
 * POST   /api/admin/impersonate  { orgId } → swap JWT app_metadata a client_admin de la org
 * DELETE /api/admin/impersonate           → restaura role + organization_id del rol real
 *
 * Solo super_admin puede impersonar. La impersonación vive SOLO en `app_metadata`
 * (las claims llegan al JWT tras `auth.refreshSession()` del cliente):
 *  - El rol real se conserva en `_impersonated_from` y en `profiles.role`.
 *  - NO se toca `profiles`: el trigger `sync_profile_claims` es unidireccional
 *    (profile → app_metadata) y dispara en CUALQUIER update del perfil, así que
 *    escribir el perfil sobrescribiría las claims de la impersonación (y una
 *    restauración interrumpida dejaría el rol real perdido → admin atrapado).
 *
 * Autenticación y operación se separan a propósito:
 *  - `createServerSupabase()` (anon key + cookies) resuelve quién es el usuario real.
 *  - `getServiceSupabase()` (service role, sin sesión) ejecuta el cambio de claims.
 * El service client NO lee cookies, así que `getUser()` sobre él siempre era null → 401.
 *
 * El guard acepta `_impersonated_from` como prueba de super_admin: si el JWT quedó
 * a medias (role=client_admin de un swap previo), el admin puede re-impersonar otra
 * subcuenta o salir sin quedar atrapado.
 */
export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Entorno Supabase no configurado" }, { status: 503 });
  }
  const sb = getServiceSupabase();
  if (!sb) return NextResponse.json({ error: "Service role no configurado" }, { status: 503 });

  const { orgId } = (await req.json().catch(() => ({}))) as { orgId?: string };
  if (!orgId) return NextResponse.json({ error: "Falta orgId" }, { status: 400 });

  // Autentica la sesión actual con cookies para comprobar super_admin.
  const userSb = await createServerSupabase();
  const {
    data: { user },
  } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const role = user.app_metadata?.role;
  const impersonatedFrom = user.app_metadata?._impersonated_from;
  // Rol efectivo: si el JWT es de una impersonación a medias, `_impersonated_from`
  // sigue siendo super_admin → se permite re-impersonar u operar.
  const effectiveRole = (impersonatedFrom ?? role) as string | undefined;
  if (effectiveRole !== "super_admin") {
    return NextResponse.json({ error: "Solo SuperAdmin puede impersonar" }, { status: 403 });
  }

  // Verifica que la org existe.
  const { data: org } = await sb.from("organizations").select("id, name").eq("id", orgId).single();
  if (!org) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });

  // Swap: guardamos el rol real en `_impersonated_from` para poder revertir.
  // SOLO app_metadata — nunca tocar `profiles` (ver cabecera del archivo).
  const { error: swapError } = await sb.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      role: "client_admin",
      organization_id: orgId,
      _impersonated_from: effectiveRole,
    },
  });
  if (swapError) return NextResponse.json({ error: swapError.message }, { status: 500 });

  return NextResponse.json({ ok: true, orgId, name: org.name });
}

export async function DELETE() {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Entorno Supabase no configurado" }, { status: 503 });
  }
  const sb = getServiceSupabase();
  if (!sb) return NextResponse.json({ error: "Service role no configurado" }, { status: 503 });

  const userSb = await createServerSupabase();
  const {
    data: { user },
  } = await userSb.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const from = user.app_metadata?._impersonated_from;
  if (from) {
    const rest = { ...user.app_metadata };
    delete rest._impersonated_from;
    const { error } = await sb.auth.admin.updateUserById(user.id, {
      app_metadata: { ...rest, role: from, organization_id: null },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // NO actualizamos el perfil aquí: el trigger `sync_profile_claims` (on_profile_claims_sync)
    // ya sincroniza role + organization_id desde profiles → app_metadata.
    // Escribir el perfil DESPUÉS del swap de app_metadata crearía una race condition:
    // 1. Admin sale de impersonación → app_metadata.role = super_admin, org_id = null
    // 2. Trigger se dispara (profile update) → app_metadata.role = super_admin (correcto)
    // 3. Pero si el perfil se modificó DURANTE la impersonación (p.ej. avatar_url),
    //    este UPDATE lo sobrescribiría con role=super_admin, org_id=null.
    //
    // La solución: confiar en el trigger. Si hubo un swap a medias previo que dejó
    // profiles.role=client_admin, ese estado ya es inconsistente y el admin debe
    // arreglarlo manualmente o via script. No arriesguemos corromper cambios legítimos.
  }

  return NextResponse.json({ ok: true });
}
