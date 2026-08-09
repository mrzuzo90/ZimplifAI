"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { BookingsView } from "@/components/bookings/BookingsView";
import { NewBookingDialog } from "@/components/bookings/NewBookingDialog";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";

export default function BookingsPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="booking_calendar">
      <div className="space-y-6">
        <PageHeader
          index="02"
          label="Reservas"
          title="Reservas y citas"
          description="Incoming del vertical: WhatsApp, web o manual. Confirma con un clic."
          actions={organization ? <NewBookingDialog orgId={organization.id} onCreated={() => undefined} /> : undefined}
        />
        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <BookingsView orgId={organization.id} />
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
