import { NextResponse } from "next/server";
import { getServiceSupabase, isAdminConfigured } from "@/lib/supabase/admin";
import { applySnapshot, generateApiKey, buildWebhookUrl, type ProvisionInput } from "@/lib/provisioning";
import { createVerticalWorkflowTemplate } from "@/lib/workflows";
import { defaultContentForTemplate, slugify } from "@/lib/site";
import { shortId } from "@/lib/utils";

/**
 * POST /api/provision
 * Motor de provisión 1-Click (service role, bypass RLS).
 * Crea organización + cliente admin + agentes IA + api_key_hash y
 * devuelve el webhook de ingesta cifrado.
 */
export async function POST(req: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "Entorno Supabase no configurado" }, { status: 503 });
  }

  const sb = getServiceSupabase();
  if (!sb) {
    return NextResponse.json({ error: "Service role no configurado" }, { status: 503 });
  }

  let body: ProvisionInput;
  try {
    body = (await req.json()) as ProvisionInput;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const clientName = body.clientName?.trim();
  const slug = body.slug?.trim();
  const adminEmail = body.adminEmail?.trim();
  const snapshotId = body.snapshotId;

  if (!clientName || !slug || !adminEmail || !snapshotId) {
    return NextResponse.json({ error: "Campos incompletos" }, { status: 400 });
  }

  // 1. Lee la snapshot de vertical para clonar pipeline/agentes/módulos.
  const { data: snapshot, error: snapError } = await sb
    .from("vertical_snapshots")
    .select("*")
    .eq("id", snapshotId)
    .single();
  if (snapError || !snapshot) {
    return NextResponse.json({ error: "Snapshot no encontrada" }, { status: 404 });
  }

  const config = applySnapshot(snapshot);
  const { plain, hash } = generateApiKey();

  // 2. Crea la organización (Trial por defecto, color primario de la vertical).
  const orgId = `org_${shortId()}`;
  const { data: org, error: orgError } = await sb
    .from("organizations")
    .insert({
      id: orgId,
      name: clientName,
      slug,
      vertical_type: snapshot.vertical_type,
      logo_url: null,
      primary_color: "#CEFF00",
      custom_domain: null,
      status: "trial",
      api_key_hash: hash,
    })
    .select()
    .single();
  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 400 });
  }

  // 3. Crea el perfil del cliente admin (se enlaza a un auth user con ese email si existe).
  const { error: profileError } = await sb
    .from("profiles")
    .insert({
      id: `profile_${shortId()}`,
      organization_id: orgId,
      role: "client_admin",
      full_name: clientName,
      avatar_url: null,
    });
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  // 4. Aprovisiona los agentes IA por defecto de la vertical.
  const { error: agentsError } = await sb.from("ai_agents").insert(
    config.agents.map((agent) => ({
      id: `ag_${shortId()}`,
      organization_id: orgId,
      name: agent.name,
      model: agent.model,
      system_prompt: agent.system_prompt,
      is_active: true,
    }))
  );
  if (agentsError) {
    return NextResponse.json({ error: agentsError.message }, { status: 400 });
  }

  // 5. Auto-inserta y habilita los módulos por defecto de la snapshot.
  const { error: modulesError } = await sb.from("organization_modules").insert(
    config.enabledModules.map((moduleKey) => ({
      organization_id: orgId,
      module_key: moduleKey,
      is_enabled: true,
      settings: {},
    }))
  );
  if (modulesError) {
    return NextResponse.json({ error: modulesError.message }, { status: 400 });
  }

  // 6. Copia la plantilla de workflow por defecto de la vertical (Fase A).
  if (config.enabledModules.includes("workflow_automation")) {
    const template = createVerticalWorkflowTemplate(snapshot.vertical_type);
    const { error: wfError } = await sb.from("workflows").insert({
      organization_id: orgId,
      name: template.name,
      description: template.description,
      trigger_type: template.trigger_type,
      trigger_config: template.trigger_config,
      nodes: template.nodes,
      edges: template.edges,
      is_active: true,
    });
    if (wfError) {
      return NextResponse.json({ error: wfError.message }, { status: 400 });
    }
  }

  // 7. Crea el micro-website por defecto de la vertical (light_web_editor).
  if (config.enabledModules.includes("light_web_menu")) {
    const template = snapshot.vertical_type === "restaurant_booking" ? "restaurant_menu" : "service_catalog";
    const content = defaultContentForTemplate(template);
    const { error: siteError } = await sb.from("tenant_sites").insert({
      organization_id: orgId,
      title: clientName,
      slug: `${slugify(clientName)}-${orgId.slice(0, 6)}`,
      vertical_template: template,
      is_published: true,
      custom_domain: null,
      seo_metadata: { meta_title: clientName, meta_description: content.hero.subheadline },
      content_payload: content,
    });
    if (siteError) {
      return NextResponse.json({ error: siteError.message }, { status: 400 });
    }
  }

  return NextResponse.json({
    organizationId: org.id,
    slug,
    webhookUrl: buildWebhookUrl(orgId, plain),
    adminEmail,
    pipelineStages: config.pipelineStages,
    agents: config.agents,
    enabledModules: config.enabledModules,
    apiKey: plain,
  });
}
