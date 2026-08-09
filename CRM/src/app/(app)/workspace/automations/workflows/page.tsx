"use client";

import { Workflow as WorkflowIcon } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { WorkflowList } from "@/components/workflows/WorkflowList";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";

export default function WorkflowsPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="workflow_automation">
      <div className="space-y-8">
        <PageHeader
          index="03.1"
          label="Automatización visual"
          title="Workflows"
          description="Encadena disparadores y acciones: WhatsApp, email, esperas, condiciones, cambios de etapa y webhooks."
          actions={<WorkflowIcon className="h-4 w-4 text-[var(--tenant-primary)]" />}
        />

        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <section className="space-y-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Flujos de la subcuenta
            </h2>
            <WorkflowList orgId={organization.id} />
          </section>
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
