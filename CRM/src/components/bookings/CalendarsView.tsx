"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, CalendarPlus, ChevronDown, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import {
  fetchCalendars, saveCalendar, updateCalendar, removeCalendar,
  fetchAvailabilityRules, saveAvailabilityRule, updateAvailabilityRule, removeAvailabilityRule,
} from "@/lib/data-access";
import { CALENDAR_DAY_LABELS } from "@/types/database";
import type { Calendar, AvailabilityRule } from "@/types/database";
import { cn } from "@/lib/utils";
import { es } from "@/lib/i18n/es";

const DAY_OPTIONS = CALENDAR_DAY_LABELS.map((label, day) => ({ day, label }));

/** Gestión de calendarios de citas: servicios + franjas semanales de disponibilidad. */
export function CalendarsView({ orgId }: { orgId: string }) {
  const { data: calendars, loading, error, refresh } = useRealtimeCollection(fetchCalendars, orgId, {
    table: "calendars",
    filter: `organization_id=eq.${orgId}`,
  });

  // Rules fetcher: la lista de reglas se refiltra por calendario en el cliente.
  const rulesFetcher = useCallback((o: string) => fetchAvailabilityRules(o), []);
  const { data: rules } = useRealtimeCollection(rulesFetcher, orgId, {
    table: "availability_rules",
    filter: `organization_id=eq.${orgId}`,
  });

  const rulesByCalendar = useMemo(() => {
    const map = new Map<string, AvailabilityRule[]>();
    for (const r of rules) {
      const list = map.get(r.calendar_id) ?? [];
      list.push(r);
      map.set(r.calendar_id, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));
    return map;
  }, [rules]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Calendar | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/b/${orgSlugHint()}`);
      toast.success(es.calendar.copied);
    } catch {
      toast.error(es.calendar.saveError);
    }
  };

  // En modo demo el slug deriva del id (org_brasa → brasa-carbon).
  const orgSlugHint = () => (orgId.startsWith("org_") ? orgId.replace("org_", "") : orgId);

  if (loading) return <LoadingState label={es.common.loading} />;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;

  return (
    <div className="space-y-4">
      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <CalendarPlus className="h-3.5 w-3.5" />
          {es.calendar.newCalendar}
        </Button>
        <Button size="sm" variant="outline" onClick={() => void copyPublicUrl()}>
          <Copy className="h-3.5 w-3.5" />
          {es.calendar.copyUrl}
        </Button>
        <span className="text-mono text-[11px] text-muted-foreground">
          {es.calendar.publicUrl}: /b/{orgSlugHint()}
        </span>
      </div>

      {calendars.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={es.calendar.emptyCalendars}
          description={es.calendar.emptyCalendarsHint}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {calendars.map((cal) => {
            const calRules = rulesByCalendar.get(cal.id) ?? [];
            const expanded = expandedId === cal.id;
            return (
              <div key={cal.id} className="rounded-xl border border-border bg-surface">
                {/* Cabecera del calendario */}
                <div className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: cal.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-sm font-bold text-foreground">{cal.name}</p>
                      <Badge variant="outline" className="text-mono text-[10px]">{cal.service_duration_min} {es.calendar.minutes}</Badge>
                    </div>
                    {cal.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{cal.description}</p>
                    )}
                  </div>
                  <Switch
                    checked={cal.is_active}
                    onCheckedChange={(v) => {
                      void updateCalendar(orgId, cal.id, { is_active: v }).catch(() =>
                        toast.error(es.calendar.saveError)
                      );
                    }}
                    aria-label={es.calendar.calendarActive}
                  />
                </div>

                {/* Disponibilidad semanal */}
                <div className="border-t border-border px-4 py-3">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setExpandedId(expanded ? null : cal.id)}
                  >
                    <span className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {es.calendar.availability} · {calRules.length}
                    </span>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                  </button>

                  {expanded && (
                    <div className="mt-3 space-y-2">
                      {calRules.length === 0 ? (
                        <p className="py-2 text-center text-xs text-muted-foreground">{es.calendar.emptyCalendarsHint}</p>
                      ) : (
                        calRules.map((r) => (
                          <div key={r.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                            <span className="w-14 text-xs font-semibold text-foreground">{CALENDAR_DAY_LABELS[r.day_of_week]}</span>
                            <span className="text-mono text-xs text-muted-foreground">{r.start_time} → {r.end_time}</span>
                            <span className="ml-auto text-mono text-[10px] text-muted-foreground">
                              {es.calendar.ruleCapacity}: {r.capacity}
                            </span>
                            <Switch
                              checked={r.is_active}
                              onCheckedChange={(v) =>
                                void updateAvailabilityRule(orgId, r.id, { is_active: v }).catch(() =>
                                  toast.error(es.calendar.saveError)
                                )
                              }
                            />
                            <Button
                              size="iconSm" variant="ghost"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                void removeAvailabilityRule(orgId, r.id).catch(() => toast.error(es.calendar.saveError));
                              }}
                              aria-label={es.calendar.removeRule}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))
                      )}

                      <RuleForm orgId={orgId} calendarId={cal.id} />
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditing(cal); setDialogOpen(true); }}>
                    {es.common.edit}
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      void removeCalendar(orgId, cal.id).then(() => {
                        toast.success(es.calendar.saveSuccess);
                        if (expandedId === cal.id) setExpandedId(null);
                      }).catch(() => toast.error(es.calendar.saveError));
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {es.common.delete}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CalendarDialog
        orgId={orgId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSaved={() => setDialogOpen(false)}
      />
    </div>
  );
}

/** Formulario compacto para añadir una franja de disponibilidad a un calendario. */
function RuleForm({ orgId, calendarId }: { orgId: string; calendarId: string }) {
  const [day, setDay] = useState("1");
  const [start, setStart] = useState("12:00");
  const [end, setEnd] = useState("14:00");
  const [capacity, setCapacity] = useState("4");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (start >= end) {
      toast.error(es.calendar.saveError);
      return;
    }
    setSaving(true);
    try {
      await saveAvailabilityRule(orgId, {
        calendar_id: calendarId,
        day_of_week: Number(day),
        start_time: start,
        end_time: end,
        capacity: Math.max(1, Number(capacity) || 1),
        is_active: true,
      });
      toast.success(es.calendar.saveSuccess);
    } catch {
      toast.error(es.calendar.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border p-2.5">
      <div className="space-y-1">
        <Label className="text-mono text-[10px] text-muted-foreground">{es.calendar.ruleDay}</Label>
        <Select value={day} onValueChange={setDay}>
          <SelectTrigger className="h-8 w-24 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAY_OPTIONS.map((d) => (
              <SelectItem key={d.day} value={String(d.day)}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-mono text-[10px] text-muted-foreground">{es.calendar.ruleStart}</Label>
        <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="h-8 w-28 text-xs" />
      </div>
      <div className="space-y-1">
        <Label className="text-mono text-[10px] text-muted-foreground">{es.calendar.ruleEnd}</Label>
        <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="h-8 w-28 text-xs" />
      </div>
      <div className="space-y-1">
        <Label className="text-mono text-[10px] text-muted-foreground">{es.calendar.ruleCapacity}</Label>
        <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="h-8 w-16 text-xs" />
      </div>
      <Button size="sm" className="h-8 text-xs" onClick={() => void save()} disabled={saving}>
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        {es.common.create}
      </Button>
    </div>
  );
}

/** Diálogo de alta/edición de un calendario. */
function CalendarDialog({
  orgId, open, onOpenChange, initial, onSaved,
}: {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Calendar | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(String(initial?.service_duration_min ?? 60));
  const [color, setColor] = useState(initial?.color ?? "#CEFF00");
  const [active, setActive] = useState(initial?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      toast.error(es.calendar.saveError);
      return;
    }
    setSaving(true);
    try {
      if (initial) {
        await updateCalendar(orgId, initial.id, {
          name, description, service_duration_min: Math.max(1, Number(duration) || 60), color, is_active: active,
        });
      } else {
        await saveCalendar(orgId, {
          name, description, service_duration_min: Math.max(1, Number(duration) || 60), color, is_active: active,
          settings: { slot_minutes: 30 },
        });
      }
      toast.success(es.calendar.saveSuccess);
      onSaved();
    } catch {
      toast.error(es.calendar.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-[var(--tenant-primary)]" />
            {initial ? es.common.edit : es.calendar.newCalendar}
          </DialogTitle>
          <DialogDescription>{es.calendar.subtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-mono text-[10px] text-muted-foreground">{es.calendar.calendarName}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={es.calendar.calendarNamePlaceholder} className="h-9 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-mono text-[10px] text-muted-foreground">{es.calendar.calendarDescription}</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="h-9 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-mono text-[10px] text-muted-foreground">{es.calendar.calendarDuration}</Label>
              <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-mono text-[10px] text-muted-foreground">{es.calendar.calendarColor}</Label>
              <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-9 cursor-pointer" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5">
            <span className="text-xs font-medium text-foreground">{es.calendar.calendarActive}</span>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{es.common.cancel}</Button>
          <Button onClick={() => void save()} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {es.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
