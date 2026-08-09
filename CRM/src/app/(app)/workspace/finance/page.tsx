"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { FinanceView } from "@/components/finance/FinanceView";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";

export default function FinancePage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="finance_suite">
      <div className="space-y-6">
        <PageHeader
          index="08"
          label="Finanzas"
          title="Facturación"
          description="Facturas, presupuestos y cobros de la agencia. Acepta un presupuesto y la factura se genera sola."
        />
        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <FinanceView orgId={organization.id} />
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
