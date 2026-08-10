"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ROIView } from "@/components/roi/ROIView";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";

export default function ROIPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="roi_dashboard">
      <div className="space-y-6">
        <PageHeader
          index="10"
          label="Analítica"
          title="Dashboard ROI"
          description="Ingresos atribuidos a la IA, coste de software, horas ahorradas y el radar de rescates de SLA en un solo panel."
        />
        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <ROIView orgId={organization.id} />
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
