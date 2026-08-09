"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { CompaniesView } from "@/components/sales/CompaniesView";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";

export default function CompaniesPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="sales_crm">
      <div className="space-y-6">
        <PageHeader
          index="03"
          label="CRM"
          title="Empresas"
          description="Cuentas B2B a las que asociar leads y oportunidades. Agrupa contactos por cliente."
        />
        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <CompaniesView orgId={organization.id} />
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
