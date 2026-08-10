"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, MessageSquare, PlugZap, Unplug, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { connectReservationBot } from "@/lib/data-access";
import type { MessagingChannel } from "@/types/database";

/**
 * Conexión del bot de reservas desde el perfil de agencia.
 * Solo se introduce el token (Telegram) o teléfono (WhatsApp, próximo):
 * el resto de la configuración del bot se lee de la subcuenta del cliente.
 */
export function ReservationBotSetup({
  orgId,
  settings,
  onUpdated,
}: {
  orgId: string;
  settings: Record<string, unknown>;
  onUpdated: (settings: Record<string, unknown>) => void;
}) {
  const [channel, setChannel] = useState<MessagingChannel>("telegram");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);

  const status = String(settings.status ?? "disconnected");
  const botUsername = String(settings.bot_username ?? "");
  const connected = status === "connected";

  const connect = async () => {
    const t = token.trim();
    if (!t) {
      toast.error("Introduce el token del bot de Telegram");
      return;
    }
    setBusy(true);
    try {
      const res = await connectReservationBot(orgId, channel, "connect", t);
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo conectar el bot");
        return;
      }
      // En demo no hay Supabase: el token y el secret se guardan en los settings
      // para poder responder y desconectar después. En producción quedan en la BD.
      onUpdated({
        ...settings,
        channel,
        status: "connected",
        bot_username: res.externalId ?? "",
        last_error: "",
        telegram_token: res.demo ? t : "",
        webhook_secret: res.demo ? (res.webhook_secret ?? "") : "",
      });
      toast.success(res.demo ? "Bot conectado (demo) — estado guardado en settings" : "Bot conectado ✅");
      setToken("");
    } catch {
      toast.error("Error de conexión con Telegram");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      const storedToken = settings.telegram_token as string | undefined;
      const storedSecret = settings.webhook_secret as string | undefined;
      const res = await connectReservationBot(orgId, channel, "disconnect", storedToken, storedSecret);
      if (!res.ok) {
        toast.error(res.error ?? "No se pudo desconectar");
        return;
      }
      onUpdated({
        ...settings,
        channel,
        status: "disconnected",
        bot_username: "",
        last_error: "",
        telegram_token: "",
        webhook_secret: "",
      });
      toast.success("Bot desconectado");
    } catch {
      toast.error("Error al desconectar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-border/80 bg-surface/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[var(--tenant-primary)]" />
          <span className="text-sm font-medium text-foreground">Conexión del bot</span>
        </div>
        {connected ? (
          <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Conectado
          </Badge>
        ) : status === "error" ? (
          <Badge className="gap-1 bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <XCircle className="h-3 w-3" />
            Error
          </Badge>
        ) : (
          <Badge variant="outline">Desconectado</Badge>
        )}
      </div>

      {connected ? (
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Bot activo en <span className="font-medium text-foreground">{botUsername || "Telegram"}</span>.
            Sus respuestas se generan con los datos de la subcuenta (horarios, aforo, franjas, web).
          </p>
          <p className="text-mono text-[11px] text-muted-foreground">
            Prueba: escribe <span className="text-foreground">/start</span> a {botUsername || "tu bot"} en Telegram.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs"
            onClick={disconnect}
            disabled={busy}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />}
            Desconectar
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            {(["telegram", "whatsapp"] as const).map((c) => (
              <Button
                key={c}
                size="sm"
                variant={channel === c ? "default" : "outline"}
                className="gap-1.5 text-xs capitalize"
                onClick={() => setChannel(c)}
              >
                {c}
              </Button>
            ))}
          </div>
          {channel === "telegram" ? (
            <div className="space-y-1.5">
              <Input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Token de @BotFather (123456789:AA…)"
                className="font-mono text-xs"
                spellCheck={false}
                aria-label="Token del bot de Telegram"
              />
              <Button size="sm" className="gap-1.5 text-xs" onClick={connect} disabled={busy}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
                Conectar bot
              </Button>
            </div>
          ) : (
            <p className="text-mono text-[11px] text-muted-foreground">
              WhatsApp llegará pronto: bastará con el número de teléfono del negocio.
            </p>
          )}
          <p className="text-mono text-[10px] text-muted-foreground">
            Requiere el módulo <span className="text-foreground">Calendario de reservas</span> activo con horarios y aforo configurados en la subcuenta.
          </p>
        </div>
      )}
    </div>
  );
}
