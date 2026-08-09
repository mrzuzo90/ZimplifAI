import { NextResponse } from "next/server";
import { getServiceSupabase, isAdminConfigured } from "@/lib/supabase/admin";

/**
 * Impersonación de subcuenta.
 * POST   /api/admin/impersonate  { orgId } → swap JWT app_metadata a client_admin de la org
 * DELETE /api/admin/impersonate           → restaura role + organization_id del perfil real
 *
 * Solo super_admin puede impersonar. Se hace vía service role actualizando
 * `raw_app_meta_data` (las claims vuelven al JWT en el próximo refresh) +
 * el trigger `sync_profile_claims` mantiene consistencia con el perfil.
 */
export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Entorno Supabase no configurado" }, { status: 503 });
  }
  const sb = getServiceSupabase();
  if (!sb) return NextResponse.json({ error: "Service role no configurado" }, { status: 503 });

  const { orgId } = (await req.json().catch(() => ({}))) as { orgId?: string };
  if (!orgId) return NextResponse.json({ error: "Falta orgId" }, { status: 400 });

  // Autentica la sesión actual para comprobar super_admin.
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const role = user.app_metadata?.role;
  if (role !== "super_admin") {
    return NextResponse.json({ error: "Solo SuperAdmin puede impersonar" }, { status: 403 });
  }

  // Verifica que la org existe.
  const { data: org } = await sb.from("organizations").select("id, name").eq("id", orgId).single();
  if (!org) return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });

  // Swap: guardamos el rol real en el perfil para poder revertir.
  const { error: swapError } = await sb.auth.admin.updateUserById(user.id, {
    app_metadata: {
      ...user.app_metadata,
      role: "client_admin",
      organization_id: orgId,
      _impersonated_from: role,
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

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const from = user.app_metadata?._impersonated_from;
  if (from) {
    const rest = { ...user.app_metadata };
    delete rest._impersonated_from;
    const { error } = await sb.auth.admin.updateUserById(user.id, {
      app_metadata: { ...rest, role: from, organization_id: null },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
