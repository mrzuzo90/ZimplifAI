"use client";

import { Magnetic } from "@/components/motion/Magnetic";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
  className?: string;
  variant?: "primary" | "ghost";
  disabled?: boolean;
}

const base =
  "group inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-semibold tracking-wide transition-colors duration-300";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-volt text-bg hover:bg-[#d2ff55]",
  ghost: "border border-line-strong text-ink hover:border-volt/60 hover:text-volt",
};

/** Botón de marca con efecto magnético y flecha que se desplaza en hover. */
export function Button({
  children,
  onClick,
  href,
  type = "button",
  className,
  variant = "primary",
  disabled,
}: ButtonProps) {
  const cls = cn(base, variants[variant], disabled && "pointer-events-none opacity-50", className);
  const inner = (
    <>
      {children}
      <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </>
  );

  const content = href ? (
    <a href={href} onClick={onClick} className={cls}>
      {inner}
    </a>
  ) : (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );

  return <Magnetic className="inline-block">{content}</Magnetic>;
}
