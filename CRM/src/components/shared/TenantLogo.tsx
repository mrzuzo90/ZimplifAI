"use client";

import { cn } from "@/lib/utils";
import { isValidHex } from "@/lib/branding";
import type { Organization } from "@/types/database";

function initials(name: string): string {
  return name
    .replace(/[·&]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/** Logo del tenant activo: URL si existe, si no iniciales sobre color primario. */
export function TenantLogo({
  organization,
  size = "md",
  className,
}: {
  organization: Organization | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const color = organization?.primary_color && isValidHex(organization.primary_color)
    ? organization.primary_color
    : "#CEFF00";

  const box =
    size === "sm" ? "h-7 w-7 rounded-md text-[11px]" : size === "lg" ? "h-12 w-12 rounded-xl text-lg" : "h-9 w-9 rounded-lg text-sm";

  if (organization?.logo_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={organization.logo_url}
        alt={organization.name}
        className={cn(box, "object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center font-display font-bold text-pitch shadow-sm",
        box,
        className
      )}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initials(organization?.name ?? "ZA")}
    </div>
  );
}
