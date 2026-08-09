"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { VerticalHome } from "@/components/dashboard/VerticalHome";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";

export default function PipelinePage() {
  const { organization, loading } = useBranding();
  const isRestaurant = organization?.vertical_type === "restaurant_booking";

  return (
    <div className="space-y-6">
      <PageHeader
        index="01"
        label="Inicio"
        title={isRestaurant ? "Hoy en tu restaurante" : "Pipeline de ventas"}
        description={
          isRestaurant
            ? "Reservas del día y próximas citas entrantes por WhatsApp o web."
            : "Arrastra los leads entre columnas para avanzarlos en el ciclo. El bot de WhatsApp cualifica en paralelo."
        }
        actions={
          <Link
            href="/workspace/automations"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver agentes IA <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {loading ? (
        <LoadingState label="Cargando tenant" />
      ) : organization ? (
        <VerticalHome orgId={organization.id} />
      ) : (
        <EmptyState
          title="Sin organización activa"
          description="Inicia sesión o entra en modo demo para ver el panel."
          action={
            <Link href="/login" className="text-xs font-medium text-[var(--tenant-primary)]">
              Ir al acceso →
            </Link>
          }
        />
      )}
    </div>
  );
}
