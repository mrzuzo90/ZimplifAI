"use client";

import { useState } from "react";
import { AudioLines, Loader2, Mic, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

interface ParseResult {
  demo: boolean;
  transcript: string;
  entities: Record<string, unknown>;
  action: { type: string; payload: Record<string, unknown>; confidence: number };
  timeline_written: boolean;
}

/** Panel Voice-to-Action: simula transcripción de nota de voz y ejecución de acciones. */
export function VoiceActionPanel({ orgId }: { orgId: string }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);

  const handleParse = async (useSample = false) => {
    if (!useSample) {
      setRecording(true);
      await new Promise((r) => setTimeout(r, 1200));
      setRecording(false);
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/v1/voice/parse-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, demo: true }),
      });
      const json = await res.json();
      setResult(json);
      toast.success("Nota de voz analizada");
    } catch {
      toast.error("No se pudo procesar la nota de voz");
    } finally {
      setProcessing(false);
    }
  };

  const handleRunAction = () => {
    if (!result) return;
    toast.success(`Acción "${result.action.type}" ejecutada en el timeline`);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-[var(--tenant-primary)]" />
            Voice-to-Action
          </CardTitle>
          <CardDescription>
            Graba una nota de voz, se transcribe, se extraen entidades y se propone una acción.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid h-40 place-items-center rounded-lg border border-dashed border-border bg-muted/30">
            {recording ? (
              <div className="flex items-center gap-2 text-rose-500">
                <AudioLines className="h-5 w-5 animate-pulse" />
                Grabando…
              </div>
            ) : processing ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Transcribiendo…
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-center text-muted-foreground">
                <Mic className="h-6 w-6 text-[var(--tenant-primary)]" />
                <p className="text-xs">Suelta un audio aquí o usa el ejemplo</p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" onClick={() => handleParse(false)} disabled={recording || processing}>
              <Mic className="h-4 w-4" />
              {recording ? "Grabando…" : "Grabar nota"}
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleParse(true)} disabled={recording || processing}>
              <Play className="h-4 w-4" />
              Usar ejemplo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--tenant-primary)]" />
            Acción detectada
          </CardTitle>
          <CardDescription>Resultado del parseo y acción sugerida.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!result ? (
            <div className="grid h-40 place-items-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              Graba o usa el ejemplo para ver el resultado JSON.
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">Transcripción</p>
                <p className="rounded-md border border-border bg-muted/30 p-3 text-sm">{result.transcript}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(result.entities).map(([k, v]) => (
                  <Badge key={k} variant="outline" className="gap-1 text-[10px]">
                    <span className="text-muted-foreground">{k}:</span> {String(v)}
                  </Badge>
                ))}
              </div>
              <div className="space-y-1">
                <p className="text-mono text-[10px] uppercase tracking-wider text-muted-foreground">Acción propuesta</p>
                <pre className="max-h-40 overflow-auto rounded-md border border-border bg-pitch p-3 text-mono text-xs text-[var(--tenant-primary)]">
                  {JSON.stringify(result.action, null, 2)}
                </pre>
              </div>
              <Button className="w-full gap-2" onClick={handleRunAction}>
                <Play className="h-4 w-4" />
                Ejecutar acción
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
