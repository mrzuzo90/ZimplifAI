"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ReputationView } from "@/components/reputation/ReputationView";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";

export default function ReputationPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="reputation_mgmt">
      <div className="space-y-6">
        <PageHeader
          index="09"
          label="Reputación"
          title="Reseñas online"
          description="Recopila, responde y mide las reseñas de Google y WhatsApp para construir tu reputación."
        />
        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <ReputationView orgId={organization.id} />
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
