"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { CalendarDays, Check, CheckCircle2, Clock, X } from "lucide-react";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { fetchBookings, updateBookingStatus } from "@/lib/data-access";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { isSameDay, format } from "date-fns";
import { es } from "date-fns/locale";
import type { Booking, BookingStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STATUS_META: Record<BookingStatus, { label: string; badge: "warning" | "success" | "muted" | "destructive" }> = {
  pending: { label: "Pendiente", badge: "warning" },
  confirmed: { label: "Confirmada", badge: "success" },
  completed: { label: "Completada", badge: "muted" },
  cancelled: { label: "Cancelada", badge: "destructive" },
};

export function BookingsView({ orgId }: { orgId: string }) {
  const { data, loading, error, refresh } = useRealtimeCollection(fetchBookings, orgId, {
    table: "bookings",
    filter: `organization_id=eq.${orgId}`,
    sortKey: (a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime(),
  });

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = data.filter(
      (b) => new Date(b.booking_date) >= now && ["pending", "confirmed"].includes(b.status)
    );
    const today = data.filter((b) => isSameDay(new Date(b.booking_date), now));
    const completed = data.filter((b) => b.status === "completed");
    return { upcoming: upcoming.length, today: today.length, completed: completed.length };
  }, [data]);

  const groups = useMemo(() => {
    const byDay = new Map<string, Booking[]>();
    for (const b of data) {
      const key = format(new Date(b.booking_date), "yyyy-MM-dd");
      byDay.set(key, [...(byDay.get(key) ?? []), b]);
    }
    return Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, items]) => ({
        key,
        label: isSameDay(new Date(key), new Date()) ? "Hoy" : format(new Date(key), "EEEE, d MMM", { locale: es }),
        items: items.sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()),
      }));
  }, [data]);

  const act = async (id: string, status: BookingStatus) => {
    try {
      await updateBookingStatus(orgId, id, status);
      toast.success(`Reserva ${STATUS_META[status].label.toLowerCase()}`);
      refresh();
    } catch {
      toast.error("No se pudo actualizar la reserva");
    }
  };

  if (loading) return <LoadingState label="Cargando reservas" />;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Reservas hoy", value: stats.today, icon: CalendarDays },
          { label: "Próximas", value: stats.upcoming, icon: Clock },
          { label: "Completadas", value: stats.completed, icon: CheckCircle2 },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border bg-surface px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <m.icon className="h-4 w-4 text-[var(--tenant-primary)]" />
            </div>
            <p className="mt-0.5 font-display text-lg font-bold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Sin reservas"
          description="Las reservas que entren por WhatsApp o la web aparecerán aquí."
        />
      ) : (
        groups.map((group) => (
          <section key={group.key}>
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h2>
            <div className="space-y-2">
              {group.items.map((b) => {
                const meta = STATUS_META[b.status];
                return (
                  <div
                    key={b.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center",
                      b.status === "cancelled" && "opacity-60"
                    )}
                  >
                    <div className="flex w-24 shrink-0 items-center gap-2">
                      <span className="text-mono text-xs font-bold text-[var(--tenant-primary)]">
                        {format(new Date(b.booking_date), "HH:mm")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {b.party_size_or_service ?? "Sin servicio"}
                      </p>
                      <p className="text-xs text-muted-foreground">{b.notes ?? "Sin notas"}</p>
                    </div>
                    <Badge variant={meta.badge} className="w-fit">
                      {meta.label}
                    </Badge>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {b.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => act(b.id, "cancelled")}>
                            <X /> Cancelar
                          </Button>
                          <Button size="sm" className="h-7 text-xs" onClick={() => act(b.id, "confirmed")}>
                            <Check /> Confirmar
                          </Button>
                        </>
                      )}
                      {b.status === "confirmed" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => act(b.id, "cancelled")}>
                            <X /> Cancelar
                          </Button>
                          <Button size="sm" className="h-7 text-xs" onClick={() => act(b.id, "completed")}>
                            <CheckCircle2 /> Completar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
