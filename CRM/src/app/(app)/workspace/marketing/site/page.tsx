"use client";

import { Globe } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SiteEditor } from "@/components/sites/SiteEditor";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";

export default function SiteEditorPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="light_web_menu">
      <div className="space-y-6">
        <PageHeader
          index="04"
          label="Sitio web"
          title="Editor de sitio vertical"
          description="Publica tu micro-website white-label: carta digital, catálogo de servicios o funnel de captación."
          actions={<Globe className="h-4 w-4 text-[var(--tenant-primary)]" />}
        />

        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <SiteEditor orgId={organization.id} />
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
