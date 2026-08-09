"use client";

import { Camera, Globe, Mail, MessageCircle, type LucideIcon } from "lucide-react";
import type { MessageChannel } from "@/types/database";
import { cn } from "@/lib/utils";

/** Icono + etiqueta de canal compartido por la lista de hilos y la conversación. */

const CHANNEL_ICON: Record<MessageChannel, LucideIcon> = {
  whatsapp: MessageCircle,
  instagram: Camera,
  email: Mail,
  web: Globe,
};

const CHANNEL_COLOR: Record<MessageChannel, string> = {
  whatsapp: "text-success",
  instagram: "text-warning",
  email: "text-info",
  web: "text-muted-foreground",
};

const CHANNEL_TITLE: Record<MessageChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  email: "Email",
  web: "Web",
};

export function ChannelIcon({ channel, className }: { channel: MessageChannel; className?: string }) {
  const Icon = CHANNEL_ICON[channel];
  return <Icon className={cn("h-3.5 w-3.5", className)} />;
}

export function ChannelBadge({ channel, className }: { channel: MessageChannel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-mono text-[10px] font-bold uppercase tracking-wider",
        CHANNEL_COLOR[channel],
        className
      )}
    >
      <ChannelIcon channel={channel} />
      {CHANNEL_TITLE[channel]}
    </span>
  );
}
