"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Cpu, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { updateAgent } from "@/lib/data-access";
import { truncate } from "@/lib/utils";
import { AgentEditDialog } from "./AgentEditDialog";
import type { AiAgent } from "@/types/database";

export function AgentCard({ agent, orgId }: { agent: AiAgent; orgId: string }) {
  const [busy, setBusy] = useState(false);

  const toggle = async (active: boolean) => {
    setBusy(true);
    try {
      await updateAgent(orgId, agent.id, { is_active: active });
      toast.success(active ? "Agente activado" : "Agente pausado");
    } catch {
      toast.error("No se pudo cambiar el estado");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col p-4 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={
              agent.is_active
                ? "grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-[var(--tenant-primary)]"
                : "grid h-9 w-9 place-items-center rounded-lg bg-muted text-muted-foreground"
            }
          >
            <Cpu className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{agent.name}</p>
            <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">{agent.model}</p>
          </div>
        </div>
        <Switch checked={agent.is_active} onCheckedChange={toggle} disabled={busy} aria-label={`Activar ${agent.name}`} />
      </div>

      <p className="mt-3 flex-1 text-mono text-[11px] leading-relaxed text-muted-foreground">
        {truncate(agent.system_prompt, 130)}
      </p>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <Badge variant={agent.is_active ? "volt" : "muted"} className="gap-1.5">
          {agent.is_active ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-primary glow-volt" />
              Activo
            </>
          ) : (
            <>
              <Pause className="h-3 w-3" />
              Pausado
            </>
          )}
        </Badge>
        <AgentEditDialog agent={agent} orgId={orgId} />
      </div>
    </Card>
  );
}
