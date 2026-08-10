import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getServiceSupabase, isAdminConfigured } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { registerDemoBot, unregisterDemoBot } from "@/lib/bot-resolver";
import {
  telegramGetMe,
  telegramSetWebhook,
  telegramDeleteWebhook,
  encryptCredential,
} from "@/lib/telegram";
import type { MessagingChannel } from "@/types/database";

/**
 * POST /api/v1/telegram/connect
 *
 * Conecta o desconecta el bot de reservas de una organización desde el
 * perfil de agencia. Solo se necesita el token de Telegram: el resto del
 * comportamiento del bot se resuelve después desde la subcuenta.
 *
 * Body: { org_id, channel, action: "connect" | "disconnect", token? }
 *
 * - Modo real (Supabase admin configurado): valida el token con getMe,
 *   registra el webhook con un secret único por bot, guarda la fila en
 *   `messaging_bots` (credential cifrada) y la subcuenta queda activa.
 * - Modo demo (sin Supabase): también valida y registra el webhook real,
 *   pero no persiste; la UI guarda el estado en los settings del módulo.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    org_id?: string;
    channel?: string;
    action?: string;
    token?: string;
    webhook_secret?: string;
  };
  const orgId = body.org_id;
  const channel = body.channel as MessagingChannel;
  const action = body.action;
  const token = body.token?.trim();

  if (!orgId || (channel !== "telegram" && channel !== "whatsapp") || (action !== "connect" && action !== "disconnect")) {
    return NextResponse.json({ error: "Faltan org_id, channel o action" }, { status: 400 });
  }
  if (action === "connect" && !token) {
    return NextResponse.json({ error: "El token del bot es obligatorio para conectar" }, { status: 400 });
  }

  const backend = isAdminConfigured();
  const demo = !backend;

  // Autorización: solo super_admin (agencia) o el propio cliente.
  if (backend) {
    const supabase = await createServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    const meta = auth?.user?.app_metadata as Record<string, unknown> | undefined;
    const role = meta?.role as string | undefined;
    const userOrg = meta?.organization_id as string | undefined;
    if (role !== "super_admin" && userOrg !== orgId) {
      return NextResponse.json({ error: "No autorizado para gestionar este bot" }, { status: 403 });
    }
  }

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const webhookUrl = `${origin}/api/v1/telegram/webhook`;
  const secret = `whs_${randomBytes(20).toString("hex")}`;

  const sb = getServiceSupabase();

  try {
    if (action === "connect") {
      // La validación previa garantiza que el token existe en este punto.
      const connectToken = token as string;

      // 1. Valida el token con la Bot API (llamada real, también en demo).
      const me = await telegramGetMe(connectToken);
      const externalId = `@${me.username || me.first_name}`;

      // 2. Registra el webhook único por bot.
      await telegramSetWebhook(connectToken, webhookUrl, secret);

      // 3. Persiste la fila del bot (solo en modo real).
      if (sb) {
        await sb.from("messaging_bots").upsert(
          {
            organization_id: orgId,
            channel: "telegram",
            external_id: externalId,
            credential_encrypted: encryptCredential(connectToken),
            webhook_secret: secret,
            status: "connected",
            connected_at: new Date().toISOString(),
            last_error: null,
          },
          { onConflict: "organization_id,channel" }
        );
      } else {
        // Demo: registro en memoria para que el webhook pueda responder.
        registerDemoBot(secret, connectToken);
      }

      return NextResponse.json({
        ok: true,
        externalId,
        demo,
        webhook_secret: demo ? secret : undefined,
      });
    }

    // ---- Desconexión ----
    if (sb) {
      const { data: row } = await sb
        .from("messaging_bots")
        .select("credential_encrypted")
        .eq("organization_id", orgId)
        .eq("channel", channel)
        .maybeSingle();
      if (row) {
        // Desregistra el webhook si podemos descifrar la credencial.
        try {
          const { decryptCredential } = await import("@/lib/telegram");
          await telegramDeleteWebhook(decryptCredential(row.credential_encrypted)).catch(() => undefined);
        } catch {
          // Credencial no descifrable (falta BOT_CREDENTIAL_KEY): se elimina la fila igualmente.
        }
        await sb.from("messaging_bots").delete().eq("organization_id", orgId).eq("channel", channel);
      }
    }
    // En demo, el cliente reenvía el token (y el secret) para desregistrar.
    if (token) {
      await telegramDeleteWebhook(token).catch(() => undefined);
    }
    if (body.webhook_secret) {
      unregisterDemoBot(body.webhook_secret);
    }

    return NextResponse.json({ ok: true, demo });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error conectando el bot";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
