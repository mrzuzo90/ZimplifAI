"use client";

import { createSiteLead, isDemoMode } from "@/lib/data-access";
import type { TenantSite } from "@/types/database";
import { SiteRenderer, type SiteLeadForm } from "@/components/sites/SiteRenderer";
import { VisionEstimator } from "@/components/vision/VisionEstimator";

/**
 * Página pública de un micro-website. Recibe el sitio ya resuelto por el
 * servidor (SSR) y se encarga de la captación de leads del CTA:
 *  - Modo demo: escribe en el store mock (sin backend).
 *  - Producción: POST a /api/v1/sites/lead (service role, sin RLS).
 */
export function PublicSitePage({
  site,
  brandColor,
  brandLogo,
}: {
  site: TenantSite;
  brandColor: string;
  brandLogo: string | null;
}) {
  const submitLead = async (form: SiteLeadForm) => {
    if (isDemoMode()) {
      await createSiteLead(site.organization_id, form);
      return;
    }
    const res = await fetch("/api/v1/sites/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ org_id: site.organization_id, ...form }),
    });
    if (!res.ok) throw new Error("lead submission failed");
  };

  return (
    <>
      {site.vertical_template === "service_catalog" && (
        <div className="mx-auto max-w-2xl px-4 py-10">
          <VisionEstimator orgId={site.organization_id} brandColor={brandColor} />
        </div>
      )}
      <SiteRenderer
        site={site}
        brandColor={brandColor}
        brandLogo={brandLogo}
        onLeadSubmit={submitLead}
      />
    </>
  );
}
