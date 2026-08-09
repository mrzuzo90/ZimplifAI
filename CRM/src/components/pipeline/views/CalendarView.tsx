"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  setHours,
  startOfDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead, LeadStatus } from "@/types/database";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

/** Calendario mensual de seguimientos: los leads con next_follow_up_at
 *  aparecen en su día; clic en un día crea un lead con esa fecha. */
export function CalendarView({
  leads,
  onOpenLead,
  onNewOnDay,
}: {
  leads: Lead[];
  onOpenLead: (lead: Lead) => void;
  onNewOnDay: (status: LeadStatus, followUp: string) => void;
}) {
  const [viewDate, setViewDate] = useState(() => startOfToday());
  const today = startOfToday();

  const leadsByDay = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    for (const l of leads) {
      if (!l.next_follow_up_at) continue;
      const day = format(new Date(l.next_follow_up_at), "yyyy-MM-dd");
      (map[day] ??= []).push(l);
    }
    return map;
  }, [leads]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    });
  }, [viewDate]);

  return (
    <div className="rounded-xl border border-border bg-surface">
      {/* Cabecera */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h3 className="font-display text-base font-bold capitalize text-foreground">
          {format(viewDate, "LLLL yyyy", { locale: es })}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewDate((d) => subMonths(d, 1))}
            className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewDate(today)}
            className="h-7 rounded-md border border-border px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Hoy
          </button>
          <button
            onClick={() => setViewDate((d) => addMonths(d, 1))}
            className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 border-t border-border border-b-0">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="border-b border-border px-2 py-1.5 text-center text-mono text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid del mes */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayLeads = leadsByDay[dayKey] ?? [];
          const inMonth = isSameMonth(day, viewDate);
          const isToday = isSameDay(day, today);
          const start9 = setHours(startOfDay(day), 9).toISOString();
          return (
            <div
              key={dayKey}
              onClick={() => inMonth && onNewOnDay("new", start9)}
              className={cn(
                "group relative min-h-20 cursor-pointer border-b border-r border-border p-1.5 transition-colors hover:bg-muted/40",
                !inMonth && "opacity-40",
                isToday && "bg-muted/40"
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-[11px] font-medium",
                  isToday
                    ? "bg-[var(--tenant-primary)] font-bold text-pitch"
                    : "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </span>

              {dayLeads.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {dayLeads.slice(0, 2).map((l) => {
                    const name =
                      [l.first_name, l.last_name].filter(Boolean).join(" ") || l.email || "Lead";
                    return (
                      <button
                        key={l.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenLead(l);
                        }}
                        className="block w-full truncate rounded border border-border-strong bg-muted/50 px-1 py-0.5 text-left text-[10px] text-foreground transition-colors hover:border-[var(--tenant-primary)]/40"
                        title={name}
                      >
                        {name}
                      </button>
                    );
                  })}
                  {dayLeads.length > 2 && (
                    <div className="px-1 text-[10px] text-muted-foreground">
                      +{dayLeads.length - 2} más
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
