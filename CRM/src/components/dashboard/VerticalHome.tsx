"use client";

import { useBranding } from "@/hooks/useBranding";
import { PipelineView } from "@/components/pipeline/PipelineView";
import { MyDay } from "@/components/sales/MyDay";
import { RestaurantToday } from "./RestaurantToday";

/**
 * Home adaptativa por vertical:
 * - Hostelería → "Hoy en tu restaurante" (reservas del día).
 * - Servicios / agencia → widget "Mi Día" + pipeline (kanban / tabla / calendario / lista).
 */
export function VerticalHome({ orgId }: { orgId: string }) {
  const { organization, isModuleEnabled } = useBranding();
  const isRestaurant = organization?.vertical_type === "restaurant_booking";
  const showBookingsHome = isRestaurant && isModuleEnabled("booking_calendar");

  if (showBookingsHome) return <RestaurantToday orgId={orgId} />;
  return (
    <div className="space-y-6">
      <MyDay orgId={orgId} />
      <PipelineView orgId={orgId} />
    </div>
  );
}
