"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBooking } from "@/lib/data-access";
import type { BookingStatus } from "@/types/database";

export function NewBookingDialog({ orgId, onCreated }: { orgId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState("");
  const [when, setWhen] = useState("");
  const [status, setStatus] = useState<BookingStatus>("pending");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !when) {
      toast.error("Indica servicio y fecha");
      return;
    }
    setSaving(true);
    try {
      await createBooking(orgId, {
        lead_id: null,
        booking_date: new Date(when).toISOString(),
        party_size_or_service: service,
        status,
        notes: "Creada manualmente",
      });
      toast.success("Reserva creada");
      setService("");
      setWhen("");
      onCreated();
      setOpen(false);
    } catch {
      toast.error("No se pudo crear la reserva");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Nueva reserva
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
          <DialogDescription>Agenda una entrada manual para tu vertical.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sv">Servicio / tamaño</Label>
            <Input
              id="sv"
              placeholder="4 personas · Terraza"
              value={service}
              onChange={(e) => setService(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dt">Fecha y hora</Label>
            <Input
              id="dt"
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5">
            {(["pending", "confirmed"] as BookingStatus[]).map((s) => (
              <Button
                key={s}
                type="button"
                size="sm"
                variant={status === s ? "default" : "outline"}
                className="h-7 text-xs"
                onClick={() => setStatus(s)}
              >
                {s === "pending" ? "Pendiente" : "Confirmada"}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creando…" : "Crear reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
