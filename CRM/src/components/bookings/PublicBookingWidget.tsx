"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { addDays, format } from "date-fns";
import { toast } from "sonner";
import {
  CalendarClock, CalendarDays, CheckCircle2,
  Clock, Loader2, RotateCcw, XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelBookingByTokenApi, createPublicBookingApi, fetchBookingByTokenApi,
  fetchPublicAvailabilityApi, rescheduleBookingByTokenApi,
} from "@/lib/data-access";
import type { Booking, Calendar } from "@/types/database";
import type { DaySlot } from "@/lib/booking";
import { cn } from "@/lib/utils";
import { es } from "@/lib/i18n/es";

function toDateKey(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function humanDate(key: string): string {
  const d = new Date(`${key}T12:00:00`);
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function humanBookingDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) +
    " · " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Widget público de reserva de citas (/b/[slug]).
 * Flujo: elige servicio → día → hora → datos → confirmación.
 * Con ?token=… pasa a modo gestión (cancelar / reagendar).
 */
export function PublicBookingWidget({
  slug, orgId, orgName, primaryColor, calendars,
}: {
  slug: string;
  orgId: string;
  orgName: string;
  primaryColor: string;
  calendars: Calendar[];
}) {
  const params = useSearchParams();
  const token = params.get("token");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${primaryColor}1f` }}>
          <CalendarClock className="h-6 w-6" style={{ color: primaryColor }} />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-foreground">{es.bookingPage.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{orgName}</p>
      </header>

      {token ? (
        <ManageBooking orgId={orgId} slug={slug} token={token} primaryColor={primaryColor} />
      ) : (
        <BookingFlow
          slug={slug} orgId={orgId} calendars={calendars}
          primaryColor={primaryColor}
        />
      )}
    </div>
  );
}

/* ---------- Flujo de reserva ---------- */

function BookingFlow({
  slug, orgId, calendars, primaryColor,
}: {
  slug: string;
  orgId: string;
  calendars: Calendar[];
  primaryColor: string;
}) {
  const [calendarId, setCalendarId] = useState(calendars[0]?.id ?? "");
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Booking | null>(null);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => addDays(today, i));
  }, []);

  // Carga de slots: todo setState ocurre tras el await (regla set-state-in-effect).
  useEffect(() => {
    if (!calendarId || !dateKey) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchPublicAvailabilityApi(orgId, calendarId, dateKey);
        if (!cancelled) setSlots(result.slots);
      } catch {
        if (!cancelled) {
          setSlots([]);
          toast.error(es.bookingPage.errorGeneric);
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, calendarId, dateKey]);

  const confirm = async () => {
    if (!selectedTime || !firstName.trim() || !phone.trim()) {
      toast.error(es.bookingPage.required);
      return;
    }
    setSubmitting(true);
    try {
      const booking = await createPublicBookingApi({
        orgId,
        calendar_id: calendarId,
        first_name: firstName.trim(),
        last_name: lastName.trim() || undefined,
        phone: phone.trim(),
        email: email.trim() || undefined,
        party_size: Math.max(1, Number(partySize) || 1),
        date: dateKey,
        time: selectedTime,
      });
      setCreated(booking.booking);
    } catch {
      toast.error(es.bookingPage.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  // Vista de éxito.
  if (created) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#CEFF00]" />
        <h2 className="mt-4 font-display text-xl font-extrabold text-foreground">{es.bookingPage.successTitle}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{es.bookingPage.successText}</p>
        <p className="mt-4 rounded-lg border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground">
          {humanBookingDate(created.booking_date)}
        </p>
        <a href={`/b/${slug}?token=${created.token}`}>
          <Button className="mt-6 w-full sm:w-auto">
            <CalendarDays className="h-4 w-4" />
            {es.bookingPage.manageBooking}
          </Button>
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Servicio */}
      <section>
        <h2 className="mb-3 text-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {es.bookingPage.chooseService}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {calendars.map((cal) => {
            const active = cal.id === calendarId;
            return (
              <button
                key={cal.id}
                type="button"
                onClick={() => {
                  setCalendarId(cal.id);
                  setSelectedTime(null);
                  setSlotsLoading(true);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                  active ? "border-[#CEFF00]/60 bg-surface" : "border-border bg-surface/60 hover:border-border-strong"
                )}
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cal.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{cal.name}</span>
                  {cal.description && (
                    <span className="block truncate text-xs text-muted-foreground">{cal.description}</span>
                  )}
                </span>
                <span className="text-mono text-[10px] text-muted-foreground">{cal.service_duration_min}′</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Día */}
      <section>
        <h2 className="mb-3 text-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {es.bookingPage.chooseDate}
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => {
            const key = toDateKey(d);
            const active = key === dateKey;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setDateKey(key);
                  setSelectedTime(null);
                  setSlotsLoading(true);
                }}
                className={cn(
                  "shrink-0 rounded-xl border px-3 py-2 text-center transition-colors",
                  active ? "border-[#CEFF00]/60 bg-surface" : "border-border bg-surface/60 hover:border-border-strong"
                )}
              >
                <span className="block text-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {d.toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 2)}
                </span>
                <span className={cn("block text-sm font-bold", active ? "text-[#CEFF00]" : "text-foreground")}>
                  {format(d, "d")}
                </span>
                <span className="block text-mono text-[9px] text-muted-foreground">
                  {d.toLocaleDateString("es-ES", { month: "short" }).slice(0, 3)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs capitalize text-muted-foreground">{humanDate(dateKey)}</p>
      </section>

      {/* Hora */}
      <section>
        <h2 className="mb-3 text-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {es.bookingPage.chooseTime}
        </h2>
        {slotsLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> {es.common.loading}
          </div>
        ) : slots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            <Clock className="mx-auto mb-2 h-5 w-5 opacity-60" />
            {es.calendar.slotsEmpty}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {slots.map((s) => {
              const active = selectedTime === s.time;
              return (
                <button
                  key={s.time}
                  type="button"
                  disabled={!s.available}
                  onClick={() => setSelectedTime(s.time)}
                  className={cn(
                    "rounded-lg border px-2 py-2.5 text-center text-sm font-semibold transition-colors",
                    !s.available && "cursor-not-allowed border-border bg-background text-muted-foreground/40 line-through",
                    s.available && active && "border-[#CEFF00]/60 bg-surface text-[#CEFF00]",
                    s.available && !active && "border-border bg-surface/60 text-foreground hover:border-border-strong"
                  )}
                >
                  {s.time}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Datos */}
      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 text-mono text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {es.bookingPage.yourDetails}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-mono text-[10px] text-muted-foreground">{es.bookingPage.firstName}</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-mono text-[10px] text-muted-foreground">{es.bookingPage.lastName}</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-mono text-[10px] text-muted-foreground">{es.bookingPage.phone}</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-mono text-[10px] text-muted-foreground">{es.bookingPage.email}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-mono text-[10px] text-muted-foreground">{es.bookingPage.partySize}</Label>
            <Input
              type="number" min={1} max={50} value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              className="h-9 w-28 text-sm"
            />
          </div>
        </div>

        <Button
          className="mt-5 w-full"
          onClick={() => void confirm()}
          disabled={submitting || !selectedTime}
          style={submitting || !selectedTime ? undefined : { backgroundColor: primaryColor, color: "#0B0D0C", borderColor: primaryColor }}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {es.bookingPage.confirm}
        </Button>
      </section>
    </div>
  );
}

/* ---------- Gestión (cancelar / reagendar) ---------- */

function ManageBooking({
  orgId, slug, token, primaryColor,
}: {
  orgId: string;
  slug: string;
  token: string;
  primaryColor: string;
}) {
  const [booking, setBooking] = useState<Booking & { calendar_name: string | null; org_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<"view" | "cancel" | "reschedule">("view");
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [slots, setSlots] = useState<DaySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<"cancelled" | "rescheduled" | null>(null);

  // Carga inicial de la reserva por token (setState tras el await).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const b = await fetchBookingByTokenApi(token);
        if (!cancelled) {
          if (b) setBooking(b.booking);
          else setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Slots para reagendar: solo en modo reschedule (setState tras el await).
  useEffect(() => {
    const calendarId = booking?.calendar_id;
    if (mode !== "reschedule" || !calendarId) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchPublicAvailabilityApi(orgId, calendarId, dateKey);
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
  }, [orgId, mode, booking?.calendar_id, dateKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-surface p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> {es.common.loading}
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <XCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">{es.bookingPage.invalidToken}</p>
        <a href={`/b/${slug}`}>
          <Button variant="outline" className="mt-5">{es.bookingPage.backToStart}</Button>
        </a>
      </div>
    );
  }

  // Estados terminales tras cancelar/reagendar.
  if (result === "cancelled") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <XCircle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 font-display text-xl font-extrabold text-foreground">{es.bookingPage.cancelledTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{es.bookingPage.cancelledText}</p>
        <a href={`/b/${slug}`}>
          <Button variant="outline" className="mt-6">{es.bookingPage.backToStart}</Button>
        </a>
      </div>
    );
  }
  if (result === "rescheduled") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#CEFF00]" />
        <h2 className="mt-4 font-display text-xl font-extrabold text-foreground">{es.bookingPage.rescheduledTitle}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{es.bookingPage.rescheduledText}</p>
        <a href={`/b/${slug}`}>
          <Button variant="outline" className="mt-6">{es.bookingPage.backToStart}</Button>
        </a>
      </div>
    );
  }

  const doCancel = async () => {
    setBusy(true);
    try {
      await cancelBookingByTokenApi(token);
      setResult("cancelled");
    } catch {
      toast.error(es.bookingPage.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const doReschedule = async () => {
    if (!selectedTime) {
      toast.error(es.bookingPage.required);
      return;
    }
    setBusy(true);
    try {
      await rescheduleBookingByTokenApi(token, dateKey, selectedTime);
      setResult("rescheduled");
    } catch {
      toast.error(es.bookingPage.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="font-display text-xl font-extrabold text-foreground">{es.bookingPage.manageTitle}</h2>

      <div className="mt-5 space-y-2 rounded-xl border border-border bg-background p-4 text-sm">
        <p className="font-semibold text-foreground">{booking.calendar_name ?? es.calendar.newCalendar}</p>
        <p className="capitalize text-muted-foreground">{humanBookingDate(booking.booking_date)}</p>
        {booking.party_size_or_service && (
          <p className="text-muted-foreground">{booking.party_size_or_service}</p>
        )}
      </div>

      {mode === "view" && (
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            onClick={() => {
              setMode("reschedule");
              setSelectedTime(null);
              setSlotsLoading(true);
            }}
          >
            <RotateCcw className="h-4 w-4" />
            {es.bookingPage.reschedule}
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setMode("cancel")}>
            <XCircle className="h-4 w-4" />
            {es.bookingPage.cancel}
          </Button>
        </div>
      )}

      {mode === "cancel" && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">{es.bookingPage.cancelConfirm}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => void doCancel()}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              {es.bookingPage.cancel}
            </Button>
            <Button variant="ghost" onClick={() => setMode("view")}>{es.common.cancel}</Button>
          </div>
        </div>
      )}

      {mode === "reschedule" && (
        <div className="mt-6 space-y-4">
          <div>
            <Label className="text-mono text-[10px] text-muted-foreground">{es.bookingPage.chooseNewDate}</Label>
            <Input
              type="date" value={dateKey}
              onChange={(e) => {
                setDateKey(e.target.value);
                setSelectedTime(null);
                setSlotsLoading(true);
              }}
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-mono text-[10px] text-muted-foreground">{es.bookingPage.chooseNewTime}</Label>
            {slotsLoading ? (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-4 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {es.common.loading}
              </div>
            ) : slots.length === 0 ? (
              <p className="mt-2 rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                {es.calendar.slotsEmpty}
              </p>
            ) : (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => setSelectedTime(s.time)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-center text-sm font-semibold transition-colors",
                      !s.available && "cursor-not-allowed border-border bg-background text-muted-foreground/40 line-through",
                      s.available && selectedTime === s.time && "border-[#CEFF00]/60 bg-surface text-[#CEFF00]",
                      s.available && selectedTime !== s.time && "border-border bg-background text-foreground hover:border-border-strong"
                    )}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => void doReschedule()}
              disabled={busy || !selectedTime}
              style={busy || !selectedTime ? undefined : { backgroundColor: primaryColor, color: "#0B0D0C", borderColor: primaryColor }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
              {es.bookingPage.reschedule}
            </Button>
            <Button variant="ghost" onClick={() => setMode("view")}>{es.common.cancel}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
