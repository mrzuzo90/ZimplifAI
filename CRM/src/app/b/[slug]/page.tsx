import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { fetchPublicBookingContext } from "@/lib/data-access";
import { PublicBookingWidget } from "@/components/bookings/PublicBookingWidget";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ctx = await fetchPublicBookingContext(slug);
  if (!ctx) return { title: "Reserva no encontrada" };
  return { title: `Reserva · ${ctx.org.name}` };
}

/** Página pública de reserva de citas del vertical (sin auth, lectura vía service role). */
export default async function BookingPage({ params }: PageProps) {
  const { slug } = await params;
  const ctx = await fetchPublicBookingContext(slug);
  if (!ctx) notFound();

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<p className="p-10 text-center text-sm text-muted-foreground">Cargando…</p>}>
        <PublicBookingWidget
          slug={slug}
          orgId={ctx.org.id}
          orgName={ctx.org.name}
          primaryColor={ctx.org.primary_color}
          calendars={ctx.calendars}
        />
      </Suspense>
    </div>
  );
}
