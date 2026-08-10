import { NextResponse } from "next/server";
import {
  telegramSendMessage,
  telegramAnswerCallback,
  inlineKeyboard,
  type TelegramUpdate,
} from "@/lib/telegram";
import {
  resolveBotBySecret,
  loadOrgContext,
  saveBotBooking,
  demoOrgContext,
  demoCreateBooking,
  resolveDemoBot,
  botBackendConfigured,
} from "@/lib/bot-resolver";
import {
  runBotTurn,
  emptySession,
  type BotActions,
  type BookingInput,
  type BotSession,
} from "@/lib/bot-brain";

/**
 * POST /api/v1/telegram/webhook
 *
 * Un único endpoint recibe los updates de Telegram de TODOS los bots de
 * reservas conectados. Cada bot se registró con un secret_token único
 * (cabecera X-Telegram-Bot-Api-Secret-Token) que identifica la
 * organización; el resto de la lógica lee los datos de la subcuenta.
 *
 * En modo demo (sin Supabase) responde con el restaurante de ejemplo para
 * poder probar el wiring del webhook con un bot real antes de conectar la BD.
 */
const sessions = new Map<string, BotSession>();

function sessionKey(botId: string, chatId: number): string {
  return `${botId}:${chatId}`;
}

export async function POST(req: Request) {
  const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (!secret) {
    return NextResponse.json({ error: "Falta el secret token de Telegram" }, { status: 400 });
  }

  const backend = botBackendConfigured();
  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Resuelve el bot → organización. En demo (sin Supabase) el registro vive
  // en memoria (connect → registerDemoBot), así el webhook responde de verdad.
  const resolved = await resolveBotBySecret(secret);
  let token: string | null = resolved?.token ?? null;
  const botId = resolved?.botId ?? "demo";
  if (backend && !resolved) {
    return NextResponse.json({ error: "Secret token desconocido" }, { status: 401 });
  }
  if (!resolved) {
    token = resolveDemoBot(secret);
    if (!token) {
      // Prueba vía curl sin conectar el bot: devuelve la respuesta en el body.
      return NextResponse.json({
        ok: true,
        demo: true,
        hint: "Registra el bot con /api/v1/telegram/connect para que responda en Telegram.",
      });
    }
  }
  if (!token) {
    return NextResponse.json({ ok: true, demo: true, hint: "Bot no registrado" });
  }

  // Contexto y acciones según el modo.
  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const ctx = resolved
    ? await loadOrgContext(resolved.organizationId, origin)
    : await demoOrgContext();
  if (!ctx) {
    return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
  }
  const actions: BotActions = resolved
    ? {
        createBooking: (input: BookingInput) => saveBotBooking(ctx.orgId, input),
      }
    : { createBooking: (input: BookingInput) => demoCreateBooking(input) };

  // Extrae mensaje o callback.
  const msg = update.message;
  const cb = update.callback_query;
  const chatId = msg?.chat.id ?? cb?.message?.chat.id;
  const from = msg?.from ?? cb?.from;
  if (!chatId || !from) {
    return NextResponse.json({ ok: true }); // update no relevante (edición, etc.)
  }

  // Los callbacks hay que "contestar" para quitar el estado de cargando.
  if (cb) {
    await telegramAnswerCallback(token, cb.id).catch(() => undefined);
  }

  const text = cb?.data ?? msg?.text ?? "";
  const key = sessionKey(botId, chatId);
  const session = sessions.get(key) ?? emptySession();

  const result = await runBotTurn(
    ctx,
    { id: from.id, firstName: from.first_name, username: from.username },
    text,
    session,
    actions
  );

  sessions.set(key, result.session);

  await telegramSendMessage(token, chatId, result.reply.text, {
    replyMarkup: result.reply.keyboard ? inlineKeyboard(result.reply.keyboard) : undefined,
  }).catch((e) => {
    // Fallo al enviar: no rompe el webhook; Telegram reintentará.
    console.error("sendMessage falló:", e instanceof Error ? e.message : e);
  });

  return NextResponse.json({ ok: true, demo: !resolved, reply: result.reply.text });
}
