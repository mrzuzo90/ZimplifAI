"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { calculateNoShowRisk, type NoShowRiskInput } from "@/lib/data-access";
import type { Booking } from "@/types/database";

function riskTone(score: number): { cls: string; label: string } {
  if (score >= 75) return { cls: "bg-rose-500/15 text-rose-500 border-rose-500/30", label: "Alto" };
  if (score >= 50) return { cls: "bg-amber-500/15 text-amber-500 border-amber-500/30", label: "Medio" };
  return { cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", label: "Bajo" };
}

/** Badge de riesgo de no-show para una reserva, con desglose en tooltip. */
export function RiskBadge({ booking }: { booking: Booking }) {
  const score = useMemo(() => {
    if (typeof booking.risk_score === "number") return booking.risk_score;
    const input: NoShowRiskInput = {
      party_size_or_service: booking.party_size_or_service,
      source: booking.source,
      booking_date: booking.booking_date,
    };
    return calculateNoShowRisk(input);
  }, [booking]);

  const tone = riskTone(score);

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn("gap-1 border font-medium", tone.cls)}
          >
            <AlertTriangle className="h-3 w-3" />
            No-show {tone.label} · {score}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-60 space-y-1 text-xs">
          <p className="font-semibold">Riesgo de no-show: {score}/100</p>
          <ul className="list-disc pl-4 text-muted-foreground">
            <li>Tamaño del grupo / servicio</li>
            <li>Canal de origen de la reserva</li>
            <li>Franja horaria (picos de sábado noche)</li>
            <li>Historial de cancelaciones del lead</li>
          </ul>
          {score >= 50 && (
            <p className="pt-1 font-medium text-amber-500">Se requiere depósito de fianza.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
