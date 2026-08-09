import { createHash, randomBytes } from "crypto";
import type { AiAgent, VerticalSnapshot } from "@/types/database";

/**
 * Motor de provisión 1-Click (estilo subaccounts GHL).
 * Contiene la lógica pura de provisión; los efectos secundarios
 * (Supabase / mock) viven en data-access y en /api/provision.
 */

export interface ProvisionInput {
  clientName: string;
  slug: string;
  snapshotId: string;
  adminEmail: string;
}

export interface ProvisionOutput {
  organizationId: string;
  slug: string;
  webhookUrl: string;
  adminEmail: string;
  pipelineStages: string[];
  agents: Array<Pick<AiAgent, "name" | "model" | "system_prompt">>;
  enabledModules: string[];
  apiKey: string; // plano, solo se muestra una vez
}

/** API key efímera para webhooks externos + hash sha256 para almacenar. */
export function generateApiKey(): { plain: string; hash: string } {
  const plain = `zx_${randomBytes(18).toString("hex")}`;
  const hash = createHash("sha256").update(plain).digest("hex");
  return { plain, hash };
}

/** Verifica una API key recibida contra el hash almacenado. */
export function verifyApiKey(plain: string | null, storedHash: string | null): boolean {
  if (!plain || !storedHash) return false;
  const hash = createHash("sha256").update(plain).digest("hex");
  return hash === storedHash;
}

/** URL del endpoint de ingestión. Usa el origen de la petición o NEXT_PUBLIC_SITE_URL. */
export function buildWebhookUrl(
  organizationId: string,
  apiKey: string,
  baseUrl?: string | null
): string {
  const origin =
    baseUrl ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.VERCEL_URL ??
    "http://localhost:3000";
  const host = origin.startsWith("http") ? origin : `https://${origin}`;
  const params = new URLSearchParams({ org_id: organizationId, key: apiKey });
  return `${host}/api/v1/webhooks/ingest?${params.toString()}`;
}

/** Nombre legible del webhook endpoint. */
export function webhookDisplayName(slug: string): string {
  return `https://api.zimplifai.app/v1/webhooks/ingest · ${slug}`;
}

/**
 * Clona un snapshot vertical a configuraciones de subcuenta:
 * etapas de pipeline, agentes por defecto y módulos habilitados.
 */
export function applySnapshot(snapshot: VerticalSnapshot) {
  const pipelineStages: string[] = Array.isArray(snapshot.default_pipeline_stages)
    ? snapshot.default_pipeline_stages
    : ["Nuevo", "Contactado por IA", "Cualificado", "Cerrado ganado", "Cerrado perdido"];

  const agents: Array<Pick<AiAgent, "name" | "model" | "system_prompt">> = [
    {
      name: "WhatsApp Qualifier Bot",
      model: "claude-sonnet-5",
      system_prompt:
        snapshot.default_ai_prompt ??
        "Asistente cualificador. En español: recoge necesidad, contacto y urgencia; deriva a humano si lo pide.",
    },
    {
      name: "Lead Scorer (n8n → CRM)",
      model: "gpt-4o-mini",
      system_prompt:
        "Clasifica cada lead entrante con score 0-100, etiquetas y siguiente paso sugerido.",
    },
  ];

  const enabledModules: string[] = Array.isArray(snapshot.enabled_modules)
    ? snapshot.enabled_modules
    : ["pipeline", "automations", "branding"];

  return { pipelineStages, agents, enabledModules };
}
