/** Utilidades de color para el motor white-label. */

export function isValidHex(hex: string | null | undefined): hex is string {
  return typeof hex === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

/** Luminancia relativa WCAG 0..1. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Devuelve el color de primer plano legible sobre `hex`
 * (texto oscuro sobre colores claros, claro sobre oscuros).
 */
export function getContrastForeground(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? "#0B0D0C" : "#E8E8E3";
}

/** Texto de estado legible sobre un color, e.g. "Volt" / "Oscuro". */
export function describeColor(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? "Claro" : "Oscuro";
}

/** Construye el valor CSS `rgb(r g b / alpha)` a partir de un hex. */
export function hexToRgba(hex: string, alpha = 1): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r} ${g} ${b} / ${alpha})`;
}

/** Lista de swatches de marca sugeridos (paleta técnica ZimplifAI). */
export const BRAND_SWATCHES = [
  "#CEFF00", // Volt
  "#6AB7FF", // Info
  "#FFB020", // Warning
  "#FF5C5C", // Destructive
  "#3DD68C", // Success
  "#E8E8E3", // Off-white
  "#C084FC", // Violeta
  "#FB7185", // Rosa
  "#22D3EE", // Cian
  "#F97316", // Naranja
];
