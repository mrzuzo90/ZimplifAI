"use client";

import { useMemo, useState } from "react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  calculateNoShowRisk,
  recordTimelineEvent,
  updateBookingDeposit,
  type NoShowRiskInput,
} from "@/lib/data-access";
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
  const [sending, setSending] = useState(false);

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

  /** Envía el link de pago: persiste el estado del depósito y lo deja en el timeline. */
  const handleSend = async () => {
    setSending(true);
    try {
      await updateBookingDeposit(orgId, booking.id, "pending");
      await recordTimelineEvent(orgId, {
        lead_id: booking.lead_id,
        event_type: "deposit_requested",
        title: "Depósito solicitado",
        description: `Link de pago de ${formatCurrency(amount)} enviado por WhatsApp (anti-no-show).`,
        payload: { booking_id: booking.id, amount, channel: "whatsapp" },
      });
      setSent(true);
      toast.success(`Link de pago de ${formatCurrency(amount)} enviado por WhatsApp`);
    } catch {
      toast.error("No se pudo enviar el link de pago");
    } finally {
      setSending(false);
    }
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
        onClick={() => void handleSend()}
        disabled={sent || sending}
      >
        {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
        {sent ? "Link enviado" : sending ? "Enviando…" : "Enviar link de pago"}
      </Button>
    </div>
  );
}
