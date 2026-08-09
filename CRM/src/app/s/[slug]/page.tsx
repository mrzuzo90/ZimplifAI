import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { getOrg, getPublishedSiteBySlug } from "@/lib/mock-store";
import { PublicSitePage } from "@/components/sites/PublicSitePage";
import type { TenantSite } from "@/types/database";

export const dynamic = "force-dynamic";

/** Resuelve un sitio publicado por slug: Supabase (service role) o mock en demo. */
async function getSite(slug: string): Promise<TenantSite | null> {
  const sb = getServiceSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("tenant_sites")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  return getPublishedSiteBySlug(slug) ?? null;
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite(slug);
  if (!site) return { title: "Sitio no encontrado" };
  const meta = site.seo_metadata as Record<string, unknown>;
  return {
    title: String(meta.meta_title || site.title),
    description: String(meta.meta_description || site.content_payload.hero.subheadline || ""),
  };
}

export default async function SitePage({ params }: PageProps) {
  const { slug } = await params;
  const site = await getSite(slug);
  if (!site) notFound();

  // Marca de la organización propietaria (color primario + logo) para el render.
  let brandColor = "#CEFF00";
  let brandLogo: string | null = null;
  const sb = getServiceSupabase();
  if (sb) {
    const { data } = await sb
      .from("organizations")
      .select("primary_color, logo_url")
      .eq("id", site.organization_id)
      .maybeSingle();
    if (data) {
      brandColor = data.primary_color ?? brandColor;
      brandLogo = data.logo_url ?? null;
    }
  } else {
    const org = getOrg(site.organization_id);
    if (org) {
      brandColor = org.primary_color;
      brandLogo = org.logo_url;
    }
  }

  return <PublicSitePage site={site} brandColor={brandColor} brandLogo={brandLogo} />;
}
