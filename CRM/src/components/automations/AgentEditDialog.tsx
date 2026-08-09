"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAgent } from "@/lib/data-access";
import { AGENT_MODELS } from "./config";
import type { AiAgent } from "@/types/database";

export function AgentEditDialog({ agent, orgId }: { agent: AiAgent; orgId: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(agent.name);
  const [model, setModel] = useState(agent.model);
  const [prompt, setPrompt] = useState(agent.system_prompt);
  const [prevAgent, setPrevAgent] = useState(agent);

  // Ajuste de estado durante el render: sincroniza el formulario
  // cuando cambia el agente (patrón recomendado, sin effect).
  if (agent !== prevAgent) {
    setPrevAgent(agent);
    setName(agent.name);
    setModel(agent.model);
    setPrompt(agent.system_prompt);
  }

  const save = async () => {
    setSaving(true);
    try {
      await updateAgent(orgId, agent.id, { name, model, system_prompt: prompt });
      toast.success("Agente actualizado");
      setOpen(false);
    } catch {
      toast.error("No se pudo guardar el agente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Bot className="h-3 w-3" />
          Editar agente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Configurar agente</DialogTitle>
          <DialogDescription>
            Define modelo, prompt de sistema y estado del agente de IA.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="an">Nombre</Label>
            <Input id="an" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENT_MODELS.map((m) => (
                  <SelectItem key={m} value={m}>
                    <span className="text-mono text-xs">{m}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="sp">Prompt de sistema</Label>
              <span className="text-mono text-[10px] text-muted-foreground">{prompt.length} chars</span>
            </div>
            <Textarea
              id="sp"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={8}
              className="text-mono text-xs leading-relaxed"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar agente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
