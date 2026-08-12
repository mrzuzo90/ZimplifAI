"use client";

import { useBranding } from "@/hooks/useBranding";
import { PipelineView } from "@/components/pipeline/PipelineView";
import { MyDay } from "@/components/sales/MyDay";
import { RestaurantToday } from "./RestaurantToday";
import { InsightsWidget } from "./InsightsWidget";
import { DailyMetricsWidget } from "./DailyMetricsWidget";
import { SLARadar } from "@/components/sla/SLARadar";
import { ReservationBotCard } from "@/components/bots/ReservationBotCard";

/**
 * Home adaptativa por vertical:
 * - Hostelería → "Hoy en tu restaurante" (reservas del día).
 * - Servicios / agencia → widget "Mi Día" + pipeline (kanban / tabla / calendario / lista).
 * Widgets comunes (SLA, momentos IA, métricas, bot de reservas) se muestran en ambas ramas.
 */
export function VerticalHome() {
  const { organization, isModuleEnabled } = useBranding();
  const isRestaurant = organization?.vertical_type === "restaurant_booking";
  const showBookingsHome = isRestaurant && isModuleEnabled("booking_calendar");
  const showSalesCRM = isModuleEnabled("sales_crm");
  const showSalesKanban = isModuleEnabled("sales_kanban");
  const orgId = organization?.id;

  const widgets = (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-3">
        <ReservationBotCard />
      </div>
      <SLARadar compact />
      <InsightsWidget />
      <DailyMetricsWidget />
    </div>
  );

  if (showBookingsHome)
    return (
      <div className="space-y-6">
        <RestaurantToday orgId={orgId!} />
        {widgets}
      </div>
    );
  return (
    <div className="space-y-6">
      {showSalesCRM && <MyDay orgId={orgId!} />}
      {widgets}
      {showSalesKanban && <PipelineView orgId={orgId!} />}
    </div>
  );
}
