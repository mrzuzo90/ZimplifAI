"use client";

import { Bot } from "lucide-react";
import { useCollection } from "@/hooks/useCollection";
import { fetchAgents } from "@/lib/data-access";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/States";
import { AgentCard } from "./AgentCard";
import type { AiAgent } from "@/types/database";

export function AgentsGrid({ orgId }: { orgId: string }) {
  const { data, loading, error, refresh } = useCollection<AiAgent>(fetchAgents, orgId);

  if (loading) return <LoadingState label="Cargando agentes" />;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-mono uppercase tracking-wider">
          {data.filter((a) => a.is_active).length}/{data.length} agentes activos
        </span>
      </div>
      {data.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Sin agentes desplegados"
          description="El motor de provisión crea los agentes por defecto de tu vertical."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((agent) => (
            <AgentCard key={agent.id} agent={agent} orgId={orgId} />
          ))}
        </div>
      )}
    </div>
  );
}
