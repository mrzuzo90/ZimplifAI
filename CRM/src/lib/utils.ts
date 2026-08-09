import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusiona clases condicionalmente con soporte Tailwind (cn). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Genera un slug a partir de un nombre legible. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Id corto legible tipo `ox7f9k2` (sin depender de crypto en cliente). */
export function shortId(prefix = ""): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return prefix ? `${prefix}_${rand}` : rand;
}

/** Trunca texto manteniendo integridad de palabras. */
export function truncate(input: string, max = 80): string {
  if (input.length <= max) return input;
  const cut = input.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

/** Formatea bytes a unidad legible. */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
