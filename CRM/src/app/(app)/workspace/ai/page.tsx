"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { ProtectedModule } from "@/components/guards/ProtectedModule";
import { LoadingState, EmptyState } from "@/components/shared/States";
import { useBranding } from "@/hooks/useBranding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopilotChat } from "@/components/ai/CopilotChat";
import { ScoringView } from "@/components/ai/ScoringView";
import { CostDashboard } from "@/components/ai/CostDashboard";
import { VoiceActionPanel } from "@/components/voice/VoiceActionPanel";
import { VoiceCallPanel } from "@/components/voice/VoiceCallPanel";

export default function AIPage() {
  const { organization, loading } = useBranding();

  return (
    <ProtectedModule moduleKey="ai_copilot">
      <div className="space-y-6">
        <PageHeader
          index="05"
          label="IA · Copilot"
          title="AI Copilot, Scoring y Costes"
          description="Pregunta a tu copilot, prioriza leads con scoring y controla el coste de la operación en tiempo real."
        />

        {loading ? (
          <LoadingState label="Cargando tenant" />
        ) : organization ? (
          <Tabs defaultValue="copilot" className="w-full">
            <TabsList className="flex-wrap">
              <TabsTrigger value="copilot">Copilot</TabsTrigger>
              <TabsTrigger value="scoring">Scoring</TabsTrigger>
              <TabsTrigger value="costes">Costes</TabsTrigger>
              <TabsTrigger value="voice">Voice-to-Action</TabsTrigger>
              <TabsTrigger value="llamadas">Llamadas IA</TabsTrigger>
            </TabsList>
            <TabsContent value="copilot">
              <CopilotChat orgId={organization.id} />
            </TabsContent>
            <TabsContent value="scoring">
              <ScoringView orgId={organization.id} />
            </TabsContent>
            <TabsContent value="costes">
              <CostDashboard orgId={organization.id} />
            </TabsContent>
            <TabsContent value="voice">
              <VoiceActionPanel orgId={organization.id} />
            </TabsContent>
            <TabsContent value="llamadas">
              <VoiceCallPanel orgId={organization.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyState title="Sin organización activa" description="Inicia sesión o entra en modo demo." />
        )}
      </div>
    </ProtectedModule>
  );
}
