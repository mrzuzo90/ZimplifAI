"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { InboxView } from "@/components/inbox/InboxView";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";
import { es } from "@/lib/i18n/es";

export default function InboxPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="unified_inbox">
      <div className="space-y-6">
        <PageHeader
          index="06"
          label="CRM · Inbox"
          title={es.inbox.title}
          description={es.inbox.subtitle}
        />

        {loading ? (
          <LoadingState label={es.common.loading} />
        ) : organization ? (
          <InboxView orgId={organization.id} />
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
