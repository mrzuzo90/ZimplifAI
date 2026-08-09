"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AuditLogStream } from "@/components/automations/AuditLogStream";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";

export default function LogsPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="ai_logs">
      <div className="space-y-6">
        <PageHeader
          index="04"
          label="IA · Auditoría"
          title="Logs de IA en tiempo real"
          description="Cada acción del agente, token a token: input, output, coste y estado."
        />

        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <AuditLogStream orgId={organization.id} />
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
