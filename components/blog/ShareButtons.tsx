"use client";

import { useState } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback si clipboard falla
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-mono text-xs uppercase tracking-wider text-muted">
        Compartir:
      </span>

      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en X (Twitter)"
        className="inline-flex h-9 items-center justify-center rounded-full border border-line bg-surface px-3.5 font-mono text-xs text-muted transition-colors hover:border-volt/50 hover:text-ink"
      >
        X (Twitter)
      </a>

      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en LinkedIn"
        className="inline-flex h-9 items-center justify-center rounded-full border border-line bg-surface px-3.5 font-mono text-xs text-muted transition-colors hover:border-volt/50 hover:text-ink"
      >
        LinkedIn
      </a>

      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartir en WhatsApp"
        className="inline-flex h-9 items-center justify-center rounded-full border border-line bg-surface px-3.5 font-mono text-xs text-muted transition-colors hover:border-volt/50 hover:text-ink"
      >
        WhatsApp
      </a>

      <button
        type="button"
        onClick={copyToClipboard}
        aria-label="Copiar enlace del artículo"
        className="inline-flex h-9 items-center justify-center rounded-full border border-line bg-surface px-3.5 font-mono text-xs text-muted transition-colors hover:border-volt/50 hover:text-ink"
      >
        {copied ? "✓ Copiado" : "Copiar enlace"}
      </button>
    </div>
  );
}

export default ShareButtons;
