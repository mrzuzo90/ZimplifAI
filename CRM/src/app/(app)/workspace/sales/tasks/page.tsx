"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { TasksView } from "@/components/sales/TasksView";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";

export default function TasksPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="sales_crm">
      <div className="space-y-6">
        <PageHeader
          index="04"
          label="CRM"
          title="Tareas"
          description="Tareas personales o vinculadas a leads y empresas. Las de hoy alimentan el widget «Mi Día» del home."
        />
        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <TasksView orgId={organization.id} />
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
