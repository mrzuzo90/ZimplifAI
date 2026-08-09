"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { CalendarsView } from "@/components/bookings/CalendarsView";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";

export default function CalendarsPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="booking_calendar">
      <div className="space-y-6">
        <PageHeader
          index="07"
          label="Calendarios"
          title="Calendarios de citas"
          description="Servicios con duración, franjas semanales de disponibilidad y URL pública de reserva."
        />
        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <CalendarsView orgId={organization.id} />
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
