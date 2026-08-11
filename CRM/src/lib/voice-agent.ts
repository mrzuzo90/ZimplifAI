import type { VoiceLLMProvider, VoiceTTSProvider } from "@/types/database";
import type { VoiceCaller, VoiceOrgContext } from "@/lib/voice-brain";
import { buildSystemPromptForTenant } from "@/lib/voice-brain";

/**
 * Capa de ejecución real (server-only) del agente de llamadas IA.
 *
 * - `callLlm`           → REST genérico a Gemini o Groq (sin SDKs).
 * - `runVoiceTurnWithLlm` → system prompt con contexto del tenant + turno
 *   del cliente + tool-calling `create_booking` parseado de la respuesta.
 * - `synthesizeSpeech`  → TTS (ElevenLabs o Deepgram) → base64 de audio.
 *
 * El código es 100% genérico: cada organización aporta su propia API key
 * y su voz; aquí solo se ejecuta con lo que la subcuenta configura.
 */

const LLM_MODELS: Record<Exclude<VoiceLLMProvider, "demo">, string> = {
  gemini: "gemini-3-flash",
  groq: "llama-3.3-70b-versatile",
};

/** Llama al LLM del proveedor con el system prompt del tenant y el turno del cliente. */
export async function callLlm(
  provider: Exclude<VoiceLLMProvider, "demo">,
  apiKey: string,
  systemPrompt: string,
  userText: string
): Promise<string> {
  if (!apiKey) throw new Error("Falta la API key del proveedor LLM");

  const model = LLM_MODELS[provider];

  if (provider === "gemini") {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userText }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
        signal: AbortSignal.timeout(25_000),
      }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Gemini ${res.status}: ${detail.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  }

  // Groq (compatible OpenAI).
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
      temperature: 0.7,
      max_tokens: 512,
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${detail.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

/** Extrae el bloque __TOOL__{...json} de la respuesta y lo separa del texto hablado. */
export function parseToolCall(
  reply: string
): { clean: string; tool: { tool: string; payload: Record<string, unknown> } | null } {
  const m = /__TOOL__(\{[\s\S]*\})/.exec(reply);
  if (!m) return { clean: reply.trim(), tool: null };
  try {
    const tool = JSON.parse(m[1]) as { tool: string; payload: Record<string, unknown> };
    const clean = reply.replace(m[0], "").trim();
    return { clean, tool };
  } catch {
    return { clean: reply.replace(m[0], "").trim(), tool: null };
  }
}

/** Turno con LLM real: construye el prompt, llama y parsea el tool-call. */
export async function runVoiceTurnWithLlm(
  provider: Exclude<VoiceLLMProvider, "demo">,
  apiKey: string,
  ctx: VoiceOrgContext,
  caller: VoiceCaller,
  transcript: string
): Promise<{ reply: string; tool: { tool: string; payload: Record<string, unknown> } | null }> {
  const systemPrompt = buildSystemPromptForTenant(ctx, caller);
  const raw = await callLlm(provider, apiKey, systemPrompt, transcript);
  const { clean, tool } = parseToolCall(raw);
  return { reply: clean || "Disculpa, no te he entendido. ¿Puedes repetirlo, por favor?", tool };
}

/* ============================ TTS ============================ */

const DEEPGRAM_VOICES = [
  "aura-asteria-en", "aura-arcas-en", "aura-zeus-en", "aura-orion-en",
  "aura-athena-en", "aura-luna-en", "aura-stella-es", "aura-sunshine-es",
];

/** Sintetiza voz a partir del texto y devuelve base64 de audio (mpeg). */
export async function synthesizeSpeech(
  provider: Exclude<VoiceTTSProvider, "demo">,
  apiKey: string,
  voiceId: string,
  text: string
): Promise<{ audioBase64: string; contentType: string }> {
  if (!apiKey) throw new Error("Falta la API key del proveedor de voz");
  if (!voiceId) throw new Error("Falta el ID de voz");

  if (provider === "elevenlabs") {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    return { audioBase64: buf.toString("base64"), contentType: "audio/mpeg" };
  }

  // Deepgram
  const voice = DEEPGRAM_VOICES.includes(voiceId) ? voiceId : DEEPGRAM_VOICES[DEEPGRAM_VOICES.length - 2];
  const res = await fetch(`https://api.deepgram.com/v1/speak?model=${voice}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Deepgram ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { audioBase64: buf.toString("base64"), contentType: "audio/mpeg" };
}

/** Lista de voces sugeridas por proveedor para el selector de la UI. */
export function voiceOptions(provider: Exclude<VoiceTTSProvider, "demo">): Array<{ id: string; label: string }> {
  if (provider === "deepgram") {
    return [
      { id: "aura-luna-es", label: "Luna (español, femenina)" },
      { id: "aura-sunshine-es", label: "Sunshine (español, femenina)" },
      { id: "aura-asteria-en", label: "Asteria (inglés, femenina)" },
      { id: "aura-arcas-en", label: "Arcas (inglés, masculina)" },
    ];
  }
  // ElevenLabs: el usuario pega el Voice ID que elija.
  return [
    { id: "JBFqnCBsd6RMkjVDRZzb", label: "Rachel (multilingüe, femenina)" },
    { id: "EXAVITQu4vr4xnSDxMaL", label: "Sarah (multilingüe, femenina)" },
    { id: "IKne3meq5aSn9XLyUdCD", label: "Charlie (multilingüe, masculina)" },
    { id: "custom", label: "Mi propio Voice ID" },
  ];
}
