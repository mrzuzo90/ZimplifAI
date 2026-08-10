"use client";

import { useMemo, useState } from "react";
import { CreditCard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateNoShowRisk, type NoShowRiskInput } from "@/lib/data-access";
import { formatCurrency } from "@/lib/format";
import { toast } from "sonner";
import type { Booking } from "@/types/database";

function estimateDeposit(booking: Booking): number {
  const party = parseInt(booking.party_size_or_service ?? "", 10) || 2;
  return Math.max(20, Math.min(100, party * 10));
}

/** Banner de depósito anti-no-show para reservas con riesgo ≥ 50. */
export function DepositBanner({ booking, orgId }: { booking: Booking; orgId: string }) {
  const [sent, setSent] = useState(false);

  const score = useMemo(() => {
    if (typeof booking.risk_score === "number") return booking.risk_score;
    const input: NoShowRiskInput = {
      party_size_or_service: booking.party_size_or_service,
      source: booking.source,
      booking_date: booking.booking_date,
    };
    return calculateNoShowRisk(input);
  }, [booking]);

  const amount = estimateDeposit(booking);

  if (score < 50 || booking.status === "cancelled" || booking.status === "completed") return null;

  const handleSend = () => {
    setSent(true);
    toast.success(`Link de pago de ${formatCurrency(amount)} enviado por WhatsApp`);
  };

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-xs font-medium text-amber-600">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        Depósito requerido: <span className="font-bold">{formatCurrency(amount)}</span> (riesgo alto de no-show)
      </p>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 border-amber-500/40 text-xs text-amber-600 hover:text-amber-700"
        onClick={handleSend}
        disabled={sent}
      >
        <CreditCard className="h-3.5 w-3.5" />
        {sent ? "Link enviado" : "Enviar link de pago"}
      </Button>
    </div>
  );
}
