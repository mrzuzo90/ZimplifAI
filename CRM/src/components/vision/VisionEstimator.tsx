"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addDays, format } from "date-fns";
import { CalendarCheck, CheckCircle2, ImagePlus, Loader2, ScanEye, Sparkles } from "lucide-react";
import {
  createPublicBookingApi,
  fetchCalendars,
  fetchPublicAvailabilityApi,
} from "@/lib/data-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Booking, Calendar } from "@/types/database";
import type { DaySlot } from "@/lib/booking";

interface VisionResult {
  demo: boolean;
  estimate: {
    label: string;
    unit: string;
    price_min_eur: number;
    price_max_eur: number;
    confidence: number;
    detected_objects: string[];
  };
  cta: { label: string; action: string; payload: Record<string, unknown> };
}

function toDateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/**
 * Estimador por visión para el micrositio: sube foto → rango de precio →
 * reserva real de la inspección en el calendario del negocio.
 */
export function VisionEstimator({
  orgId,
  brandColor,
}: {
  orgId: string;
  brandColor: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const estimate = async (objectType = "generic") => {
    setEstimating(true);
    try {
      const res = await fetch("/api/v1/vision/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, object_type: objectType, demo: !preview }),
      });
      const json = await res.json();
      setResult(json);
    } finally {
      setEstimating(false);
    }
  };

  const handleBook = () => {
    if (!result) return;
    setBookingOpen(true);
  };

  return (
    <section style={{ "--brand": brandColor } as React.CSSProperties} className="mx-auto w-full max-w-md rounded-2xl border p-5 shadow-sm" id="vision-estimador">
      <div className="flex items-center gap-2.5">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: `${brandColor}22`, color: brandColor }}
        >
          <ScanEye className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold">Estimador por visión</h2>
          <p className="text-xs opacity-70">Sube una foto y estima el servicio en segundos.</p>
        </div>
      </div>

      <div className="mt-4 grid h-44 place-items-center overflow-hidden rounded-xl border-2 border-dashed">
        {preview ? (
          <img src={preview} alt="Vista previa" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm opacity-70 hover:opacity-100"
          >
            <ImagePlus className="h-6 w-6" style={{ color: brandColor }} />
            Toca para subir una imagen
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => estimate()}
          disabled={estimating}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-pitch transition-opacity disabled:opacity-60"
          style={{ backgroundColor: brandColor }}
        >
          {estimating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {estimating ? "Analizando…" : "Estimar"}
        </button>
        {!preview && (
          <button
            type="button"
            onClick={() => estimate("car")}
            disabled={estimating}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Probar ejemplo
          </button>
        )}
      </div>

      {result && (
        <div className="mt-4 rounded-xl border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Rango estimado</p>
          <p className="mt-1 font-display text-2xl font-bold" style={{ color: brandColor }}>
            {result.estimate.price_min_eur.toLocaleString("es-ES")} € – {result.estimate.price_max_eur.toLocaleString("es-ES")} €
          </p>
          <p className="text-xs opacity-70">
            {result.estimate.label} · confianza {Math.round(result.estimate.confidence * 100)}%
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {result.estimate.detected_objects.map((o) => (
              <span key={o} className="rounded-full border px-2 py-0.5 text-[10px]">
                {o}
              </span>
            ))}
          </div>

          {bookingOpen ? (
            <InspectionBooking
              orgId={orgId}
              brandColor={brandColor}
              serviceLabel={result.estimate.label}
            />
          ) : (
            <>
              <button
                type="button"
                onClick={handleBook}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:opacity-80"
                style={{ borderColor: brandColor, color: brandColor }}
              >
                <CalendarCheck className="h-4 w-4" />
                Reservar inspección
              </button>
              <p className="mt-2 text-center text-[10px] opacity-60">Estimación orientativa generada por IA.</p>
            </>
          )}
        </div>
      )}
    </section>
  );
}

/** Formulario compacto de reserva de la inspección (usa el primer calendario activo). */
function InspectionBooking({
  orgId,
  brandColor,
  serviceLabel,
}: {
  orgId: string;
  brandColor: string;
  serviceLabel: string;
}) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [calendarId, setCalendarId] = useState<string>("");
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [time, setTime] = useState<string>("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Booking | null>(null);

  const days = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)),
    []
  );
  const _calendarId = calendarId || calendars[0]?.id || "";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await fetchCalendars(orgId);
        if (cancelled) return;
        setCalendars(rows);
        setCalendarId(rows[0]?.id ?? "");
      } catch {
        /* sin calendarios: el form no puede reservar */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  useEffect(() => {
    if (!_calendarId || !dateKey) return;
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      try {
        const result = await fetchPublicAvailabilityApi(orgId, _calendarId, dateKey);
        if (!cancelled) setSlots(result.slots);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, _calendarId, dateKey]);

  const submit = async () => {
    if (!_calendarId || !time || !firstName.trim() || !phone.trim()) return;
    setSubmitting(true);
    try {
      const booking = await createPublicBookingApi({
        orgId,
        calendar_id: _calendarId,
        first_name: firstName.trim(),
        phone: phone.trim(),
        party_size: 1,
        date: dateKey,
        time,
      });
      setCreated(booking.booking);
    } catch {
      /* error silencioso: el micrositio no rompe */
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="mt-4 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-4 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
        <p className="mt-2 text-sm font-semibold">Inspección reservada</p>
        <p className="mt-1 text-xs opacity-70">
          {new Date(created.booking_date).toLocaleDateString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}{" "}
          ·{" "}
          {new Date(created.booking_date).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 border-t border-border pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
        Reserva la inspección de {serviceLabel}
      </p>

      <div className="space-y-1">
        <Label className="text-mono text-[10px] opacity-70">Servicio</Label>
        <div className="flex flex-wrap gap-1.5">
          {calendars.map((cal) => (
            <button
              key={cal.id}
              type="button"
              onClick={() => {
                setCalendarId(cal.id);
                setTime("");
              }}
              className={
                "rounded-full border px-2.5 py-1 text-[11px] transition-colors " +
                (cal.id === _calendarId
                  ? "border-transparent font-semibold text-pitch"
                  : "opacity-70 hover:opacity-100")
              }
              style={cal.id === _calendarId ? { backgroundColor: brandColor } : undefined}
            >
              {cal.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-mono text-[10px] opacity-70">Día</Label>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {days.map((d) => {
            const key = toDateKey(d);
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setDateKey(key);
                  setTime("");
                }}
                className={
                  "shrink-0 rounded-lg border px-2.5 py-1.5 text-center " +
                  (key === dateKey ? "border-transparent text-pitch" : "opacity-70")
                }
                style={key === dateKey ? { backgroundColor: brandColor } : undefined}
              >
                <span className="block text-[9px] uppercase opacity-70">
                  {d.toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 2)}
                </span>
                <span className="block text-xs font-bold">{format(d, "d")}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-mono text-[10px] opacity-70">Hora</Label>
        {slotsLoading ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs opacity-70">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando horarios…
          </div>
        ) : slots.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-2.5 text-xs opacity-70">
            Sin horarios disponibles para este día.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {slots
              .filter((s) => s.available)
              .map((s) => (
                <button
                  key={s.time}
                  type="button"
                  onClick={() => setTime(s.time)}
                  className={
                    "rounded-lg border px-2.5 py-1.5 text-xs transition-colors " +
                    (s.time === time ? "border-transparent font-semibold text-pitch" : "opacity-80 hover:opacity-100")
                  }
                  style={s.time === time ? { backgroundColor: brandColor } : undefined}
                >
                  {s.time}
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-mono text-[10px] opacity-70">Nombre</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Tu nombre"
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-mono text-[10px] opacity-70">Teléfono</Label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+34 600 00 00 00"
            className="h-9 text-sm"
          />
        </div>
      </div>

      <Button
        className="w-full"
        onClick={() => void submit()}
        disabled={submitting || !time || !firstName.trim() || !phone.trim()}
        style={submitting || !time || !firstName.trim() || !phone.trim() ? undefined : { backgroundColor: brandColor, color: "#0B0D0C", borderColor: brandColor }}
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
        {submitting ? "Reservando…" : "Confirmar inspección"}
      </Button>
    </div>
  );
}
