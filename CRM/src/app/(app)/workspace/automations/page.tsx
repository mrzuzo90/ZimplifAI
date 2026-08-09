"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { AgentsGrid } from "@/components/automations/AgentsGrid";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";

export default function AutomationsPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="whatsapp_bot">
      <div className="space-y-8">
        <PageHeader
          index="03"
          label="Automatización"
          title="Agentes IA y orquestación"
          description="Despliega agentes y edita sus prompts de sistema. La actividad se vigila en los logs."
          actions={
            <Link
              href="/workspace/logs"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver logs IA <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <section className="space-y-3">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Agentes desplegados
            </h2>
            <AgentsGrid orgId={organization.id} />
          </section>
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
