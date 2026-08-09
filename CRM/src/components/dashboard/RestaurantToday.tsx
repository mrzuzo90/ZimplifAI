"use client";

import { isAfter, isToday } from "date-fns";
import { CalendarDays, CheckCircle2, Clock3, Hourglass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/States";
import { useCollection } from "@/hooks/useCollection";
import { fetchBookings } from "@/lib/data-access";
import { formatTime } from "@/lib/format";
import type { Booking, BookingStatus } from "@/types/database";

const STATUS_META: Record<BookingStatus, { label: string; variant: "success" | "warning" | "muted" | "destructive" }> = {
  pending: { label: "Pendiente", variant: "warning" },
  confirmed: { label: "Confirmada", variant: "success" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  completed: { label: "Completada", variant: "muted" },
};

/** Dashboard "Hoy en tu restaurante": reservas del día + próximas. */
export function RestaurantToday({ orgId }: { orgId: string }) {
  const { data: bookings, loading } = useCollection(fetchBookings, orgId);

  const today = bookings.filter((b) => isToday(new Date(b.booking_date)) && b.status !== "cancelled");
  const confirmedToday = today.filter((b) => b.status === "confirmed").length;
  const pendingToday = today.filter((b) => b.status === "pending").length;
  const upcoming = bookings
    .filter((b) => b.status === "confirmed" && isAfter(new Date(b.booking_date), new Date()))
    .slice(0, 6);

  const cards = [
    { label: "Reservas hoy", value: today.length, icon: CalendarDays },
    { label: "Confirmadas", value: confirmedToday, icon: CheckCircle2 },
    { label: "Pendientes", value: pendingToday, icon: Hourglass },
    { label: "Próximas", value: upcoming.length, icon: Clock3 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="relative overflow-hidden p-4">
              <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[var(--tenant-primary)]/5" />
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-[var(--tenant-primary)]" />
              </div>
              {loading ? (
                <Skeleton className="mt-3 h-7 w-16" />
              ) : (
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{card.value}</p>
              )}
              <p className="mt-1 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
            </Card>
          );
        })}
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Reservas de hoy
        </h2>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : today.length === 0 ? (
          <EmptyState
            title="Sin reservas hoy"
            description="Las reservas entrantes por WhatsApp o web aparecerán aquí."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {today.map((b: Booking, i) => {
              const meta = STATUS_META[b.status];
              return (
                <div
                  key={b.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
                >
                  <span className="text-mono text-sm font-semibold text-[var(--tenant-primary)]">
                    {formatTime(b.booking_date)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {b.party_size_or_service ?? "Reserva"}
                    </p>
                    {b.notes && <p className="truncate text-xs text-muted-foreground">{b.notes}</p>}
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
