"use client";

import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { PageHeader } from "@/components/shared/PageHeader";
import { MarketingFormsView } from "@/components/marketing/MarketingFormsView";
import { useBranding } from "@/hooks/useBranding";
import { LoadingState, EmptyState } from "@/components/shared/States";

export default function FormsPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="marketing_forms">
      <div className="space-y-6">
        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <>
            <PageHeader
              title="Formularios"
              description="Gestiona formularios de captación, revisa envíos y configura funnels."
            />
            <MarketingFormsView orgId={organization.id} />
          </>
        ) : (
          <EmptyState
            title="Sin organización activa"
            description="Inicia sesión o entra en modo demo para ver el panel."
            action={
              <a href="/login" className="text-xs font-medium text-[var(--tenant-primary)]">
                Ir al acceso →
              </a>
            }
          />
        )}
      </div>
    </ProtectedModule>
  );
}