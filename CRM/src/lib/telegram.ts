import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

/**
 * Cliente de la Bot API de Telegram (server-only).
 * Sin dependencias externas: usa fetch de Node + crypto para el cifrado
 * de credenciales. Cada operación recibe el token del bot concreto, de
 * forma que un único deployment sirve a tantos bots como organizaciones
 * conecten (multi-cliente).
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

/* ============================ Tipos Telegram ============================ */

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
  first_name?: string;
  username?: string;
  title?: string;
}

export interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  date: number;
  text?: string;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface BotInfo {
  id: number;
  username: string;
  first_name: string;
}

/* ============================ Cliente HTTP ============================ */

async function telegramCall<T>(
  token: string,
  method: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`${TELEGRAM_API}${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    // Telegram responde rápido; no conviene bloquear el webhook mucho tiempo.
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!res.ok || !data.ok) {
    throw new Error(`Telegram ${method} falló: ${data.description ?? res.status}`);
  }
  return data.result as T;
}

/** Bot info de `getMe`: valida el token y devuelve el @username. */
export async function telegramGetMe(token: string): Promise<BotInfo> {
  return telegramCall<BotInfo>(token, "getMe");
}

/** Registra el webhook de un bot con un secret token único por bot. */
export async function telegramSetWebhook(token: string, url: string, secretToken: string) {
  await telegramCall(token, "setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
}

export async function telegramDeleteWebhook(token: string) {
  await telegramCall(token, "deleteWebhook", { drop_pending_updates: false });
}

/** Envía un mensaje de texto (con teclado inline opcional). */
export async function telegramSendMessage(
  token: string,
  chatId: number | string,
  text: string,
  opts: { replyMarkup?: InlineKeyboardMarkup; parseMode?: "HTML" | "Markdown" } = {}
) {
  const params: Record<string, unknown> = { chat_id: chatId, text };
  if (opts.replyMarkup) params.reply_markup = opts.replyMarkup;
  if (opts.parseMode) params.parse_mode = opts.parseMode;
  return telegramCall<TelegramMessage>(token, "sendMessage", params);
}

/** Responde a un callback_query (quita el "cargando…" y muestra texto). */
export async function telegramAnswerCallback(
  token: string,
  callbackQueryId: string,
  text?: string
) {
  const params: Record<string, unknown> = { callback_query_id: callbackQueryId };
  if (text) params.text = text;
  return telegramCall<boolean>(token, "answerCallbackQuery", params);
}

/** Builder de teclado inline: filas de botones con callback_data. */
export function inlineKeyboard(rows: InlineKeyboardButton[][]): InlineKeyboardMarkup {
  return { inline_keyboard: rows };
}

/* ============================ Credenciales ============================ */

/**
 * Cifra una credencial (token de Telegram) con AES-256-GCM usando
 * `BOT_CREDENTIAL_KEY` (64 hex chars = 32 bytes). Si la clave no está
 * configurada (entornos demo sin secreto), devuelve el valor tal cual
 * con un prefijo para distinguirlo de un valor cifrado.
 */
export function encryptCredential(plain: string): string {
  const key = process.env.BOT_CREDENTIAL_KEY;
  if (!key) return `raw:${plain}`;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

/** Descifra una credencial almacenada (ver encryptCredential). */
export function decryptCredential(stored: string): string {
  if (!stored) return "";
  if (stored.startsWith("raw:")) return stored.slice(4);
  if (!stored.startsWith("enc:")) return stored;
  const key = process.env.BOT_CREDENTIAL_KEY;
  if (!key) throw new Error("BOT_CREDENTIAL_KEY no configurada para descifrar credenciales");
  const [ivB64, tagB64, dataB64] = stored.slice(4).split(".");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(key, "hex"),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return plain.toString("utf8");
}

/** Hash de un secret para comparación constante (evita guardar el secret plano fuera de DB). */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
