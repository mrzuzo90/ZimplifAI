"use client";

import { useRef, useState } from "react";
import { CalendarCheck, ImagePlus, Loader2, ScanEye, Sparkles } from "lucide-react";

interface VisionResult {
  demo: boolean;
  estimate: {
    label: string;
    unit: string;
    price_min_eur: number;
    price_max_eur: number;
    confidence: number;
    detected_objects: string[];
  };
  cta: { label: string; action: string; payload: Record<string, unknown> };
}

/** Estimador por visión para el micrositio: sube foto → rango de precio → CTA. */
export function VisionEstimator({
  orgId,
  brandColor,
}: {
  orgId: string;
  brandColor: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [result, setResult] = useState<VisionResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const estimate = async (objectType = "generic") => {
    setEstimating(true);
    try {
      const res = await fetch("/api/v1/vision/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, object_type: objectType, demo: !preview }),
      });
      const json = await res.json();
      setResult(json);
    } finally {
      setEstimating(false);
    }
  };

  const handleBook = () => {
    alert("Reserva de inspección: en producción este CTA crearía una reserva en el calendario del negocio.");
  };

  return (
    <section style={{ "--brand": brandColor } as React.CSSProperties} className="mx-auto w-full max-w-md rounded-2xl border p-5 shadow-sm" id="vision-estimador">
      <div className="flex items-center gap-2.5">
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
          style={{ backgroundColor: `${brandColor}22`, color: brandColor }}
        >
          <ScanEye className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold">Estimador por visión</h2>
          <p className="text-xs opacity-70">Sube una foto y estima el servicio en segundos.</p>
        </div>
      </div>

      <div className="mt-4 grid h-44 place-items-center overflow-hidden rounded-xl border-2 border-dashed">
        {preview ? (
          <img src={preview} alt="Vista previa" className="h-full w-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm opacity-70 hover:opacity-100"
          >
            <ImagePlus className="h-6 w-6" style={{ color: brandColor }} />
            Toca para subir una imagen
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => estimate()}
          disabled={estimating}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-pitch transition-opacity disabled:opacity-60"
          style={{ backgroundColor: brandColor }}
        >
          {estimating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {estimating ? "Analizando…" : "Estimar"}
        </button>
        {!preview && (
          <button
            type="button"
            onClick={() => estimate("car")}
            disabled={estimating}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Probar ejemplo
          </button>
        )}
      </div>

      {result && (
        <div className="mt-4 rounded-xl border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Rango estimado</p>
          <p className="mt-1 font-display text-2xl font-bold" style={{ color: brandColor }}>
            {result.estimate.price_min_eur.toLocaleString("es-ES")} € – {result.estimate.price_max_eur.toLocaleString("es-ES")} €
          </p>
          <p className="text-xs opacity-70">
            {result.estimate.label} · confianza {Math.round(result.estimate.confidence * 100)}%
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {result.estimate.detected_objects.map((o) => (
              <span key={o} className="rounded-full border px-2 py-0.5 text-[10px]">
                {o}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={handleBook}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:opacity-80"
            style={{ borderColor: brandColor, color: brandColor }}
          >
            <CalendarCheck className="h-4 w-4" />
            Reservar inspección
          </button>
          <p className="mt-2 text-center text-[10px] opacity-60">Estimación orientativa generada por IA.</p>
        </div>
      )}
    </section>
  );
}
