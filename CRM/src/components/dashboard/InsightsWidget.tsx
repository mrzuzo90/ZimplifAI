"use client";

import { useCallback } from "react";
import { CheckCircle2, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealtimeCollection } from "@/hooks/useRealtimeCollection";
import { fetchInsightsMoments, resolveInsightMomentData } from "@/lib/data-access";
import { formatRelative } from "@/lib/format";
import { toast } from "sonner";
import type { InsightsMoment } from "@/types/database";
import { cn } from "@/lib/utils";
import { useBranding } from "@/hooks/useBranding";

const SEVERITY_TONE: Record<InsightsMoment["severity"], string> = {
  info: "bg-sky-500/15 text-sky-500 border-sky-500/30",
  warning: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  opportunity: "bg-[var(--tenant-primary)]/15 text-[var(--tenant-primary)] border-[var(--tenant-primary)]/30",
  urgent: "bg-rose-500/15 text-rose-500 border-rose-500/30",
};

/** Widget "Momentos IA": últimos insights pendientes del agent runtime. */
export function InsightsWidget() {
  const { organization } = useBranding();
  const orgId = organization?.id;

  const { data, refresh } = useRealtimeCollection<InsightsMoment>(
    useCallback((id) => fetchInsightsMoments(id), []),
    orgId ?? "",
    { table: "insights_moments", filter: orgId ? `organization_id=eq.${orgId}` : undefined }
  );

  const pending = data.filter((m) => !m.is_resolved).slice(0, 4);

  const handleResolve = async (id: string) => {
    if (!orgId) return;
    await resolveInsightMomentData(orgId, id);
    toast.success("Momento resuelto");
    refresh();
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="flex items-start gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--tenant-primary)]/15 text-[var(--tenant-primary)]">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>Momentos IA</CardTitle>
            <CardDescription>Sugerencias del agent runtime</CardDescription>
          </div>
        </div>
        {pending.length > 0 && (
          <Badge className="bg-[var(--tenant-primary)]/15 text-[var(--tenant-primary)]">{pending.length}</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {pending.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            Sin sugerencias pendientes. Todo bajo control.
          </p>
        ) : (
          pending.map((m) => (
            <div key={m.id} className="flex items-start gap-2.5 rounded-lg border border-border bg-surface px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className={cn("px-1.5 py-0 text-[9px] font-semibold uppercase", SEVERITY_TONE[m.severity])}>
                    {m.severity}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{formatRelative(m.created_at)}</span>
                </div>
                <p className="mt-1 truncate text-sm font-medium">{m.title}</p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-emerald-500"
                title="Marcar resuelto"
                onClick={() => handleResolve(m.id)}
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
