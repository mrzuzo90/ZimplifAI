"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

export interface SLAConfig {
  alert_minutes: number;
  auto_rescue_minutes: number;
}

interface SLAConfigDrawerProps {
  config: SLAConfig;
  onSave: (config: SLAConfig) => void;
}

/** Drawer para ajustar los umbrales del SLA Rescue Radar. */
export function SLAConfigDrawer({ config, onSave }: SLAConfigDrawerProps) {
  const [alert, setAlert] = useState(String(config.alert_minutes));
  const [auto, setAuto] = useState(String(config.auto_rescue_minutes));
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    const alertMin = Math.max(1, parseInt(alert, 10) || 5);
    const autoMin = Math.max(alertMin + 1, parseInt(auto, 10) || 10);
    onSave({ alert_minutes: alertMin, auto_rescue_minutes: autoMin });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
          <Settings2 className="h-3.5 w-3.5" />
          Configurar
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Configuración SLA</SheetTitle>
          <SheetDescription>
            Define los umbrales del radar: cuándo se enciende la alerta y cuándo la IA actúa sola.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="sla-alert">Alerta a los (min)</Label>
            <Input
              id="sla-alert"
              type="number"
              min={1}
              value={alert}
              onChange={(e) => setAlert(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Cuando un lead supere este tiempo sin respuesta, el radar pasa a naranja.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sla-auto">Auto-rescate IA (min)</Label>
            <Input
              id="sla-auto"
              type="number"
              min={Number(alert) + 1}
              value={auto}
              onChange={(e) => setAuto(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Pasado este tiempo, el agente IA responde de forma autónoma. Debe ser mayor que la alerta.</p>
          </div>
        </div>
        <SheetFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
