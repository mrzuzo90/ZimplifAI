"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUpRight, CalendarCheck, ListTodo, UserRound } from "lucide-react";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { fetchLeads, fetchTasks } from "@/lib/data-access";
import { formatTime } from "@/lib/format";
import type { Lead, Task } from "@/types/database";

/**
 * Widget «Mi Día»: tareas pendientes vencidas / de hoy + leads con
 * seguimiento programado hoy. Aparece arriba del pipeline en el home
 * de verticales de servicios / agencia.
 */
export function MyDay({ orgId }: { orgId: string }) {
  const fetchTs = useCallback((o: string) => fetchTasks(o), []);
  const tasks = useRealtimeCollection(fetchTs, orgId, { table: "tasks", filter: `organization_id=eq.${orgId}` });
  const fetchLs = useCallback((o: string) => fetchLeads(o), []);
  const leads = useRealtimeCollection(fetchLs, orgId, { table: "leads", filter: `organization_id=eq.${orgId}` });

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => format(today, "yyyy-MM-dd"), [today]);

  const dueTasks = useMemo(
    () =>
      tasks.data
        .filter((t) => t.status !== "done" && t.due_date && t.due_date <= todayKey)
        .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? "")),
    [tasks.data, todayKey]
  );

  const followUps = useMemo(
    () =>
      leads.data.filter(
        (l) => l.next_follow_up_at && format(l.next_follow_up_at, "yyyy-MM-dd") === todayKey
      ),
    [leads.data, todayKey]
  );

  const total = dueTasks.length + followUps.length;

  if (total === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-4 w-4 text-[var(--tenant-primary)]" />
          <p className="text-sm font-semibold text-foreground">Mi Día</p>
          <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {format(today, "EEEE, d MMM", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/workspace/sales/tasks"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-[var(--tenant-primary)]"
          >
            Ver tareas <ArrowUpRight className="h-3 w-3" />
          </Link>
          <Link
            href="/workspace"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-[var(--tenant-primary)]"
          >
            Pipeline <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="grid gap-px bg-border md:grid-cols-2">
        {/* Tareas */}
        <div className="space-y-1 bg-surface p-3">
          <p className="flex items-center gap-1.5 px-1 pb-1 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <ListTodo className="h-3 w-3" /> Tareas ({dueTasks.length})
          </p>
          {dueTasks.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground/70">Sin tareas pendientes.</p>
          ) : (
            dueTasks.slice(0, 4).map((t: Task) => (
              <Link
                key={t.id}
                href="/workspace/sales/tasks"
                className="block rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/50"
              >
                <p className="truncate text-xs font-medium text-foreground">{t.title}</p>
                <p className="text-mono text-[10px] text-muted-foreground">
                  {t.due_date && t.due_date < todayKey ? "Vencida" : "Hoy"}
                  {t.lead_id || t.company_id ? " · vinculada" : ""}
                </p>
              </Link>
            ))
          )}
        </div>

        {/* Seguimientos */}
        <div className="space-y-1 bg-surface p-3">
          <p className="flex items-center gap-1.5 px-1 pb-1 text-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <UserRound className="h-3 w-3" /> Seguimientos ({followUps.length})
          </p>
          {followUps.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground/70">Sin seguimientos hoy.</p>
          ) : (
            followUps.slice(0, 4).map((l: Lead) => (
              <Link
                key={l.id}
                href="/workspace"
                className="block rounded-md px-1.5 py-1.5 transition-colors hover:bg-muted/50"
              >
                <p className="truncate text-xs font-medium text-foreground">
                  {[l.first_name, l.last_name].filter(Boolean).join(" ") || l.phone || l.email || "Lead"}
                </p>
                <p className="text-mono text-[10px] text-muted-foreground">
                  {l.next_follow_up_at ? formatTime(l.next_follow_up_at) : ""}
                  {l.status !== "new" ? ` · ${l.status.replace(/_/g, " ")}` : ""}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
