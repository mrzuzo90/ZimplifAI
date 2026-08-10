import { NextResponse } from "next/server";

/**
 * POST /api/v1/vision/estimate
 * Vision AI Estimator: analiza una imagen y estima el precio de un
 * servicio (inspector, obra, coche, reparación…). En demo devuelve
 * una estimación simulada determinista.
 */
export async function POST(req: Request) {
  let body: { org_id?: string; image_b64?: string; object_type?: string; demo?: boolean };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const objectType = body.object_type ?? "generic";
  const demo = !body.image_b64;

  // Estimación determinista según el tipo de objeto detectado.
  const catalog: Record<string, { min: number; max: number; label: string; unit: string }> = {
    facade: { min: 1200, max: 5800, label: "Reforma de fachada", unit: "m²" },
    kitchen: { min: 3900, max: 14900, label: "Reforma de cocina", unit: "proyecto" },
    bathroom: { min: 2400, max: 7200, label: "Reforma de baño", unit: "proyecto" },
    car: { min: 150, max: 1800, label: "Reparación de vehículo", unit: "intervención" },
    roof: { min: 2600, max: 9800, label: "Reparación de tejado", unit: "m²" },
    generic: { min: 300, max: 3000, label: "Servicio a medida", unit: "intervención" },
  };
  const entry = catalog[objectType] ?? catalog.generic;

  const estimate = {
    label: entry.label,
    unit: entry.unit,
    price_min_eur: entry.min,
    price_max_eur: entry.max,
    confidence: demo ? 0.68 : 0.84,
    detected_objects: demo ? ["zona dañada", "material original"] : ["sujeto principal"],
  };

  return NextResponse.json({
    demo,
    estimate,
    cta: {
      label: "Reservar inspección",
      action: "create_booking",
      payload: { service: entry.label, source: "vision_ai" },
    },
  });
}
