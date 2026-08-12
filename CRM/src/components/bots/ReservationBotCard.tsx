"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, ExternalLink, Loader2, MessageSquare, Settings2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/hooks/useBranding";
import { fetchModules } from "@/lib/data-access";
import { toast } from "sonner";

/**
 * Tarjeta de estado del bot de reservas por mensaje (Telegram / WhatsApp)
 * para el workspace del cliente. El cliente VE el bot y lo prueba; la
 * configuración (token de BotFather) se hace desde el panel de agencia.
 */
export function ReservationBotCard() {
  const router = useRouter();
  const { organization, isSuperAdmin, isModuleEnabled } = useBranding();
  const orgId = organization?.id;
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);

  const enabled = isModuleEnabled("reservation_bot");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!orgId) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const mods = await fetchModules(orgId);
        const bot = mods.find((m) => m.module_key === "reservation_bot");
        if (!cancelled) setSettings(bot?.settings ?? null);
      } catch {
        if (!cancelled) setSettings(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--tenant-primary)]" />
          <span className="text-xs">Cargando bot de reservas…</span>
        </CardContent>
      </Card>
    );
  }

  const status = String(settings?.status ?? "disconnected");
  const connected = status === "connected";
  const botUsername = String(settings?.bot_username ?? "").replace(/^@/, "");
  const telegramUrl = connected && botUsername ? `https://t.me/${botUsername}` : null;
  const channel = String(settings?.channel ?? "telegram");

  const copyLink = async () => {
    if (!telegramUrl) return;
    try {
      await navigator.clipboard.writeText(telegramUrl);
      toast.success("Enlace del bot copiado");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div className="flex items-start gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--tenant-primary)]/15 text-[var(--tenant-primary)]">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>Bot de reservas</CardTitle>
            <CardDescription>
              Reservas por {channel === "whatsapp" ? "WhatsApp" : "Telegram"}
            </CardDescription>
          </div>
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
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {!enabled ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            El módulo de reservas por mensaje no está activo en tu cuenta. Pídelo a tu agencia
            para captar reservas por Telegram o WhatsApp.
          </p>
        ) : connected && telegramUrl ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--tenant-primary)" }}
              >
                <ExternalLink className="h-4 w-4" />
                Abrir en Telegram
              </a>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => void copyLink()}>
                <Copy className="h-3.5 w-3.5" />
                Copiar enlace
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Bot activo en <span className="font-medium text-foreground">@{botUsername}</span>. Escribe{" "}
              <span className="font-mono">/start</span> en Telegram para probar una reserva con los
              datos de tu negocio.
            </p>
          </>
        ) : connected ? (
          <p className="text-xs text-muted-foreground">
            Bot activo en {channel === "whatsapp" ? "WhatsApp" : "Telegram"}. Añade tu username en el
            panel de gestión para compartir el enlace directo.
          </p>
        ) : (
          <>
            <p className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
              Tu agencia aún no ha conectado el bot. En cuanto esté activo podrás probar reservas
              desde Telegram aquí mismo.
            </p>
            {isSuperAdmin && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={() => router.push("/admin")}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Configurar en el panel de gestión
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
