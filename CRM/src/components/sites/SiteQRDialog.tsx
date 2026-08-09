"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Copy, Download, Loader2, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getContrastForeground, relativeLuminance } from "@/lib/branding";
import type { TenantSite } from "@/types/database";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  site: TenantSite;
  primary: string;
  logoUrl?: string | null;
}

/** Ruta pública absoluta del micro-sitio (origen del deploy + slug). */
function sitePublicUrl(slug: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base.replace(/\/+$/, "")}/s/${slug}`;
}

/** Carga una imagen externa sin romper por CORS: devuelve null si falla. */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Iniciales de un nombre (1–2 letras) para el recuadro de marca. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase();
}

/**
 * Compone la imagen imprimible del QR:
 * fondo blanco, QR en el color de marca (con contraste garantizado),
 * logo o iniciales, nombre del negocio y URL pública.
 */
async function renderSiteQRImage(site: TenantSite, primary: string, logoUrl: string | null): Promise<string> {
  const W = 800; // resolución alta para imprimir bien en pegatina
  const PAD = 64;
  const QR_SIZE = 560;
  const title = site.title || "Mi negocio";
  const url = sitePublicUrl(site.slug);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas no disponible");

  // Texto del nombre con tamaño autoajustado si es largo.
  let fontSize = 46;
  ctx.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
  while (ctx.measureText(title).width > W - PAD * 2 && fontSize > 22) {
    fontSize -= 2;
    ctx.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
  }
  const nameH = Math.round(fontSize * 1.3);

  const logo = logoUrl ? await loadImage(logoUrl) : null;
  const logoBlock = logo ? 64 : 56;
  const urlH = 36;

  // Altura total: QR + logo/iniciales + nombre + URL + paddings.
  const H = PAD + QR_SIZE + 28 + logoBlock + 18 + nameH + 10 + urlH + PAD;
  canvas.height = H;

  // Fondo blanco (imprimible).
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // El QR necesita alto contraste: si el color de marca es claro, usar el near-black del sistema.
  const qrColor = relativeLuminance(primary) > 0.45 ? "#0B0D0C" : primary;
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, url, {
    width: QR_SIZE,
    margin: 2,
    color: { dark: qrColor, light: "#ffffff" },
  });
  ctx.drawImage(qrCanvas, (W - QR_SIZE) / 2, PAD, QR_SIZE, QR_SIZE);

  let y = PAD + QR_SIZE + 28;

  // Logo del negocio, o iniciales sobre el color de marca (estilo de la web).
  if (logo) {
    const x = (W - logoBlock) / 2;
    ctx.save();
    roundRect(ctx, x, y, logoBlock, logoBlock, 14);
    ctx.clip();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x, y, logoBlock, logoBlock);
    ctx.drawImage(logo, x, y, logoBlock, logoBlock);
    ctx.restore();
  } else {
    const s = logoBlock;
    const x = (W - s) / 2;
    ctx.fillStyle = primary;
    roundRect(ctx, x, y, s, s, 14);
    ctx.fill();
    ctx.fillStyle = getContrastForeground(primary);
    ctx.font = "800 24px Arial, Helvetica, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initialsOf(title), W / 2, y + s / 2 + 2);
  }
  y += logoBlock + 18;

  // Nombre del negocio (la pieza clave para la pegatina).
  ctx.fillStyle = "#141815";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.fillText(title, W / 2, y);
  y += nameH;

  // URL pública, sin protocolo, en gris.
  const urlDisplay = url.replace(/^https?:\/\//, "");
  ctx.fillStyle = "#5C665E";
  ctx.font = "500 22px 'Courier New', monospace";
  ctx.fillText(urlDisplay, W / 2, y);

  return canvas.toDataURL("image/png");
}

/** Diálogo de QR del micro-sitio: preview personalizada + descarga PNG para imprimir. */
export function SiteQRDialog({ open, onOpenChange, site, primary, logoUrl }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(true);
  const [copied, setCopied] = useState(false);

  const url = sitePublicUrl(site.slug);

  // Genera la imagen al abrir o al cambiar el sitio (async IIFE + cancelled — regla ESLint).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const dataUrl = await renderSiteQRImage(site, primary, logoUrl ?? null);
        if (!cancelled) setImage(dataUrl);
      } catch {
        if (!cancelled) toast.error("No se pudo generar el QR");
      } finally {
        if (!cancelled) setGenerating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, site, primary, logoUrl]);

  const download = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `${site.slug || "sitio"}-qr.png`;
    a.click();
    toast.success("QR descargado");
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("No se pudo copiar la URL");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-4 w-4" style={{ color: primary }} />
            QR de {site.title}
          </DialogTitle>
          <DialogDescription>
            Imagen lista para imprimir como pegatina o tarjeta con el estilo de la web.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl border border-border bg-white">
          {generating || !image ? (
            <div className="flex h-72 items-center justify-center bg-[#0b0d0c]">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={`Código QR de ${site.title}`} className="mx-auto max-h-72 w-auto" />
          )}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{url}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => void copyUrl()}>
            {copied ? <Loader2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>

        <div className="flex justify-end">
          <Button onClick={download} disabled={generating || !image} className="gap-2">
            <Download className="h-4 w-4" />
            Descargar PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
