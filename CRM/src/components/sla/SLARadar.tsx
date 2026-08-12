"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HeartHandshake, Radar, ShieldAlert, TimerReset } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SLAConfigDrawer, type SLAConfig } from "@/components/sla/SLAConfigDrawer";
import { fetchModules, recordTimelineEvent, setModuleSettings } from "@/lib/data-access";
import { useBranding } from "@/hooks/useBranding";
import { toast } from "sonner";

interface SlaLead {
  id: string;
  name: string;
  age_seconds: number;
  threshold_minutes: number;
  status: "warning" | "danger" | "rescued";
  source: string;
}

const SOURCE_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  form: "Formulario",
  instagram: "Instagram",
  google_review: "Google",
  email: "Email",
};

function mmss(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

/** Radar de rescate de SLA: leads en riesgo de respuesta lenta con countdown. */
export function SLARadar({ compact = false }: { compact?: boolean }) {
  const { organization } = useBranding();
  const [leads, setLeads] = useState<SlaLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SLAConfig>({ alert_minutes: 5, auto_rescue_minutes: 10 });
  const [tick, setTick] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const orgId = organization?.id;

  const load = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Get auth token from cookies/localStorage for API call
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sb-"))
        ?.split("=")[1];

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const [res, modules] = await Promise.all([
        fetch("/api/v1/sla/check", { headers }),
        fetchModules(""), // orgId will be taken from JWT on server
      ]);
      const json = await res.json();
      setLeads(json.leads_at_risk ?? []);
      // Los umbrales persistentes viven en los settings del módulo roi_dashboard;
      // si no están guardados aún, se usan los que devuelve la API.
      const roi = modules.find((m) => m.module_key === "roi_dashboard")?.settings ?? {};
      const alert = Number(roi.sla_alert_minutes ?? json.config?.alert_minutes ?? 5);
      const auto = Number(roi.sla_auto_rescue_minutes ?? json.config?.auto_rescue_minutes ?? 10);
      setConfig({
        alert_minutes: alert > 0 ? alert : 5,
        auto_rescue_minutes: auto > alert ? auto : alert + 1,
      });
    } catch {
      /* silencio: el radar simplemente no muestra nada */
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  /** Persiste los umbrales en los settings del módulo y los aplica en caliente. */
  const handleSaveConfig = async (next: SLAConfig) => {
    if (!orgId) return;
    setConfig(next);
    try {
      const modules = await fetchModules(orgId);
      const existing = modules.find((m) => m.module_key === "roi_dashboard")?.settings ?? {};
      await setModuleSettings(orgId, "roi_dashboard", {
        ...existing,
        sla_alert_minutes: next.alert_minutes,
        sla_auto_rescue_minutes: next.auto_rescue_minutes,
      });
      toast.success("Umbrales SLA guardados");
    } catch {
      toast.error("No se pudieron guardar los umbrales");
    }
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load, orgId]);

  // Countdown visual: el reloj avanza cada segundo.
  useEffect(() => {
    timer.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const handleRescue = async (lead: SlaLead) => {
    if (!orgId) return;
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: "rescued" } : l)));
    try {
      await recordTimelineEvent(orgId, {
        lead_id: lead.id,
        event_type: "sla_rescued",
        title: "Lead rescatado manualmente",
        description: `Rescatado a los ${mmss(lead.age_seconds)} por un miembro del equipo.`,
        payload: { channel: lead.source, speed_to_lead_seconds: lead.age_seconds, mode: "manual" },
      });
      toast.success(`Lead ${lead.name} rescatado manualmente`);
    } catch {
      toast.error("No se pudo registrar el rescate");
    }
  };

  const handleAuto = async (lead: SlaLead) => {
    if (!orgId) return;
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: "rescued" } : l)));
    try {
      await recordTimelineEvent(orgId, {
        lead_id: lead.id,
        event_type: "sla_rescued",
        title: "Lead rescatado por IA",
        description: `La IA respondió en ${mmss(lead.age_seconds)} (auto-rescate SLA).`,
        payload: { channel: lead.source, speed_to_lead_seconds: lead.age_seconds, mode: "ai" },
      });
      toast.success(`La IA respondió a ${lead.name} en ${mmss(lead.age_seconds)}`);
    } catch {
      toast.error("No se pudo registrar el rescate");
    }
  };

  const sorted = useMemo(() => {
    return [...leads].sort((a, b) => b.age_seconds - a.age_seconds);
  }, [leads]);

  const atRiskCount = sorted.filter((l) => l.status !== "rescued").length;

  if (loading && !leads.length) {
    return (
      <Card>
        <CardContent className="grid h-40 place-items-center text-sm text-muted-foreground">
          Escaneando respuesta de leads…
        </CardContent>
      </Card>
    );
  }

  const header = (
    <CardHeader className="flex-row items-start justify-between space-y-0">
      <div className="flex items-start gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-amber-500/15 text-amber-500">
          <Radar className="h-4 w-4" />
        </div>
        <div>
          <CardTitle className="flex items-center gap-2">
            SLA Radar
            {atRiskCount > 0 && (
              <Badge className="bg-rose-500/15 text-rose-500">{atRiskCount} en riesgo</Badge>
            )}
          </CardTitle>
          <CardDescription>Leads en riesgo de respuesta lenta</CardDescription>
        </div>
      </div>
      {!compact && <SLAConfigDrawer config={config} onSave={(c) => void handleSaveConfig(c)} />}
    </CardHeader>
  );

  if (!sorted.length) {
    return (
      <Card>
        {header}
        <CardContent className="pb-5 pt-0">
          <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-600">
            <TimerReset className="h-4 w-4 shrink-0" />
            Sin leads en riesgo. Buen trabajo.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {header}
      <CardContent className="space-y-2 pt-0">
        {sorted.slice(0, compact ? 3 : undefined).map((lead) => {
          // El countdown avanza con el tick de 1s: age_seconds es la edad al cargar,
          // y tick suma los segundos transcurridos desde el montaje del radar.
          const liveAge = lead.status === "rescued" ? lead.age_seconds : lead.age_seconds + tick;
          const isDanger = lead.status !== "rescued" && liveAge >= config.auto_rescue_minutes * 60;
          const isWarning = lead.status !== "rescued" && liveAge >= config.alert_minutes * 60;
          return (
            <div
              key={lead.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                lead.status === "rescued"
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : isDanger
                    ? "border-rose-500/30 bg-rose-500/5"
                    : isWarning
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border bg-surface"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-medium">{lead.name}</p>
                  {lead.status === "rescued" && (
                    <Badge className="shrink-0 gap-1 bg-emerald-500/15 text-emerald-500">
                      <HeartHandshake className="h-3 w-3" /> Rescatado
                    </Badge>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {SOURCE_LABEL[lead.source] ?? lead.source} · hace {mmss(liveAge)}
                </p>
              </div>
              {lead.status === "rescued" ? (
                <span className="text-mono text-[11px] text-emerald-500">IA respondió</span>
              ) : (
                <div className="flex shrink-0 items-center gap-1.5">
                  <ShieldAlert className={cn("h-4 w-4", isDanger ? "text-rose-500" : isWarning ? "text-amber-500" : "text-muted-foreground")} />
                  {!compact && (
                    <>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleRescue(lead)}>
                        Rescatar
                      </Button>
                      <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => handleAuto(lead)}>
                        <HeartHandshake className="h-3 w-3" /> IA
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
